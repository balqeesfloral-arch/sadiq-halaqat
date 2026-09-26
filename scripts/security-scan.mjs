import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const ROOT = process.cwd();
const SCAN_DIRS = ["src", "public"];
const TEXT_EXTENSIONS = new Set([
  ".js", ".jsx", ".ts", ".tsx", ".json", ".html", ".css", ".md", ".txt",
]);

const forbidden = [
  { name: "Supabase service-role key", pattern: /service[_-]?role\s*[:=]\s*["'`][^"'`]+/gi },
  { name: "Supabase secret key", pattern: /sb_secret_[A-Za-z0-9_-]+/g },
  { name: "Private key", pattern: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/g },
  { name: "OpenAI-style secret key", pattern: /\bsk-[A-Za-z0-9_-]{20,}\b/g },
  { name: "Google API key", pattern: /\bAIza[0-9A-Za-z_-]{30,}\b/g },
];

const dangerousSourceRules = [
  { name: "dangerouslySetInnerHTML", pattern: /\bdangerouslySetInnerHTML\b/g },
  { name: "Direct innerHTML assignment", pattern: /\.innerHTML\s*=/g },
  { name: "eval()", pattern: /\beval\s*\(/g },
  { name: "new Function()", pattern: /\bnew\s+Function\s*\(/g },
];

const forbiddenPublicFile = /(?:^|\/)(?:\.env(?:\..*)?|README[^/]*|[^/]*snippet[^/]*|[^/]+\.(?:sql|log|bak|backup|pem|key|p12|pfx|zip|map))$/i;
const forbiddenSourceArtifact = /(?:^|\/)[^/]+\.(?:zip|bak|backup|old|orig|rej|sql|pem|key|p12|pfx|map)$/i;

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (TEXT_EXTENSIONS.has(path.extname(entry.name).toLowerCase())) out.push(full);
  }
  return out;
}

function walkAll(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walkAll(full, out);
    else out.push(full);
  }
  return out;
}

function scanSecrets(file, findings) {
  const source = fs.readFileSync(file, "utf8");
  for (const rule of forbidden) {
    rule.pattern.lastIndex = 0;
    let match;
    while ((match = rule.pattern.exec(source))) {
      const line = source.slice(0, match.index).split("\n").length;
      findings.push({ rule: rule.name, file: path.relative(ROOT, file), line });
    }
  }
  return source;
}

const findings = [];

for (const relativeDir of SCAN_DIRS) {
  for (const file of walk(path.join(ROOT, relativeDir))) {
    const source = scanSecrets(file, findings);
    if (relativeDir === "src") {
      for (const rule of dangerousSourceRules) {
        rule.pattern.lastIndex = 0;
        let match;
        while ((match = rule.pattern.exec(source))) {
          const line = source.slice(0, match.index).split("\n").length;
          findings.push({ rule: rule.name, file: path.relative(ROOT, file), line });
        }
      }
    }
  }
}

// Local env files may exist during development. Scan them for server secrets,
// but do not reject frontend publishable/anon values merely because the file exists.
for (const entry of fs.readdirSync(ROOT, { withFileTypes: true })) {
  if (entry.isFile() && /^\.env(?:\..*)?$/.test(entry.name) && entry.name !== ".env.example") {
    scanSecrets(path.join(ROOT, entry.name), findings);
  }
}

for (const file of walkAll(path.join(ROOT, "public"))) {
  const relative = path.relative(ROOT, file).replaceAll("\\", "/");
  if (forbiddenPublicFile.test(relative)) {
    findings.push({ rule: "Sensitive/development file published from public/", file: relative, line: 1 });
  }
}

for (const file of walkAll(path.join(ROOT, "src"))) {
  const relative = path.relative(ROOT, file).replaceAll("\\", "/");
  if (forbiddenSourceArtifact.test(relative)) {
    findings.push({ rule: "Backup/archive artifact committed inside src/", file: relative, line: 1 });
  }
}

for (const file of walk(path.join(ROOT, "src"))) {
  const relative = path.relative(ROOT, file).replaceAll("\\", "/");
  if (relative === "src/lib/supabase.js") continue;
  const source = fs.readFileSync(file, "utf8");
  if (/\bcreateClient\s*\(/.test(source)) {
    findings.push({ rule: "Duplicate Supabase client outside src/lib/supabase.js", file: relative, line: 1 });
  }
}

// A local .env is fine, but it must never be tracked by Git.
try {
  const tracked = execFileSync("git", ["ls-files", "--", ".env", ".env.*"], {
    cwd: ROOT,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "ignore"],
  })
    .split(/\r?\n/)
    .map((value) => value.trim())
    .filter((value) => value && value !== ".env.example");

  for (const file of tracked) {
    findings.push({ rule: "Environment file is tracked by Git", file, line: 1 });
  }
} catch {
  // Source archives may intentionally omit .git; skip this check in that case.
}

// Prevent regression to the vulnerable npm-registry SheetJS release.
try {
  const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, "package.json"), "utf8"));
  const xlsx = pkg?.dependencies?.xlsx || pkg?.devDependencies?.xlsx;
  const approved = "https://cdn.sheetjs.com/xlsx-0.20.3/xlsx-0.20.3.tgz";
  if (xlsx && xlsx !== approved) {
    findings.push({
      rule: "Unapproved SheetJS dependency (expected pinned official 0.20.3 tarball)",
      file: "package.json",
      line: 1,
    });
  }
} catch (error) {
  findings.push({ rule: `Unable to validate package.json: ${error.message}`, file: "package.json", line: 1 });
}

if (findings.length) {
  console.error("Security scan failed:\n");
  for (const item of findings) {
    console.error(`- ${item.rule}: ${item.file}:${item.line}`);
  }
  process.exit(1);
}

console.log(`Security scan passed. Checked ${SCAN_DIRS.join(", ")} plus repository hygiene controls.`);

import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const DIST = path.join(ROOT, "dist");

if (!fs.existsSync(DIST)) {
  console.error("Security dist scan failed: dist/ does not exist. Run the production build first.");
  process.exit(1);
}

const forbiddenFiles = /(?:^|\/)(?:\.env(?:\..*)?|[^/]+\.(?:map|sql|log|bak|backup|pem|key|p12|pfx|zip))$/i;
const secretRules = [
  { name: "Supabase secret key", pattern: /sb_secret_[A-Za-z0-9_-]+/g },
  { name: "Supabase service-role identifier", pattern: /SUPABASE_SERVICE_ROLE_KEY|service[_-]?role\s*[:=]/gi },
  { name: "Private key", pattern: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/g },
  { name: "OpenAI-style secret key", pattern: /\bsk-[A-Za-z0-9_-]{20,}\b/g },
  { name: "Google API key", pattern: /\bAIza[0-9A-Za-z_-]{30,}\b/g },
];

const textExtensions = new Set([".js", ".mjs", ".cjs", ".html", ".css", ".json", ".txt"]);
const findings = [];

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    const relative = path.relative(DIST, full).replaceAll("\\", "/");

    if (entry.isDirectory()) {
      walk(full);
      continue;
    }

    if (forbiddenFiles.test(relative)) {
      findings.push(`Forbidden production artifact: dist/${relative}`);
    }

    if (!textExtensions.has(path.extname(entry.name).toLowerCase())) continue;

    const source = fs.readFileSync(full, "utf8");
    for (const rule of secretRules) {
      rule.pattern.lastIndex = 0;
      if (rule.pattern.test(source)) {
        findings.push(`${rule.name} found in dist/${relative}`);
      }
    }
  }
}

walk(DIST);

if (findings.length) {
  console.error("Security dist scan failed:\n");
  for (const finding of findings) console.error(`- ${finding}`);
  process.exit(1);
}

console.log("Security dist scan passed. No source maps, private files, or forbidden secrets were found in dist/.");

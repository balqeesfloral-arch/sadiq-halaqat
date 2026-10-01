import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const OUT_DIR = path.join(ROOT, "security-artifacts");
const REPORT_JSON = path.join(OUT_DIR, "sentinel-report.json");
const REPORT_MD = path.join(OUT_DIR, "sentinel-report.md");

const EXCLUDED_DIRS = new Set([
  ".git",
  "node_modules",
  "dist",
  ".vercel",
  ".security-local",
  "security-artifacts",
]);

const TEXT_EXTENSIONS = new Set([
  ".js", ".jsx", ".ts", ".tsx", ".mjs", ".cjs",
  ".json", ".html", ".css", ".md", ".txt", ".sql",
  ".yml", ".yaml", ".toml",
]);

const severityWeight = {
  critical: 25,
  high: 10,
  medium: 4,
  low: 1,
  info: 0,
};

// Reviewed public RPCs. Keep this allow-list deliberately tiny.
// Each entry must also be documented in the live Supabase audit.
const INTENTIONAL_ANON_RPCS = new Set([
  "get_push_public_key",
]);

const findings = [];

function add(severity, category, title, evidence, fix, file = null, line = null) {
  findings.push({
    severity,
    category,
    title,
    evidence,
    fix,
    file,
    line,
  });
}

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory() && EXCLUDED_DIRS.has(entry.name)) continue;

    const full = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      walk(full, out);
      continue;
    }

    const ext = path.extname(entry.name).toLowerCase();
    if (!TEXT_EXTENSIONS.has(ext)) continue;

    try {
      if (fs.statSync(full).size <= 2_000_000) out.push(full);
    } catch {
      // Ignore transient or inaccessible files.
    }
  }

  return out;
}

function relative(file) {
  return path.relative(ROOT, file).replaceAll("\\", "/");
}

function lineOf(source, index) {
  return source.slice(0, index).split("\n").length;
}

function scanRegex(file, source, rule) {
  rule.pattern.lastIndex = 0;
  let match;
  while ((match = rule.pattern.exec(source))) {
    add(
      rule.severity,
      rule.category,
      rule.title,
      `${rule.evidence}: ${String(match[0]).slice(0, 100)}`,
      rule.fix,
      relative(file),
      lineOf(source, match.index)
    );
  }
}

fs.mkdirSync(OUT_DIR, { recursive: true });

const files = walk(ROOT);

const secretRules = [
  {
    severity: "critical",
    category: "Secrets",
    title: "Private key committed in repository",
    evidence: "Private-key marker",
    fix: "Remove the key from Git history, rotate it immediately, and keep it only in a secret manager.",
    pattern: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/g,
  },
  {
    severity: "critical",
    category: "Secrets",
    title: "Supabase secret key appears in repository",
    evidence: "Supabase secret",
    fix: "Rotate the secret and store it only in Supabase/Vercel/GitHub secret storage.",
    pattern: /\bsb_secret_[A-Za-z0-9_-]{16,}\b/g,
  },
  {
    severity: "critical",
    category: "Secrets",
    title: "Service-role credential may be hard-coded",
    evidence: "Service-role assignment",
    fix: "Never ship service-role credentials to the browser. Move privileged operations to a trusted server/Edge Function.",
    pattern: /(?:SUPABASE_SERVICE_ROLE_KEY|service[_-]?role)\s*[:=]\s*["'`][^"'`\n]{12,}/gi,
  },
];

const runtimeCodeRules = [
  {
    severity: "high",
    category: "Code execution",
    title: "eval() detected in runtime code",
    evidence: "Dynamic code execution",
    fix: "Replace eval() with explicit parsing or a fixed dispatch table.",
    pattern: /\beval\s*\(/g,
  },
  {
    severity: "high",
    category: "Code execution",
    title: "new Function() detected in runtime code",
    evidence: "Dynamic function construction",
    fix: "Replace dynamic code generation with explicit functions.",
    pattern: /\bnew\s+Function\s*\(/g,
  },
];

const frontendRules = [
  {
    severity: "high",
    category: "XSS",
    title: "dangerouslySetInnerHTML detected",
    evidence: "React raw HTML sink",
    fix: "Avoid raw HTML. If unavoidable, sanitize with a well-maintained allow-list sanitizer before rendering.",
    pattern: /\bdangerouslySetInnerHTML\b/g,
  },
  {
    severity: "high",
    category: "XSS",
    title: "Direct innerHTML assignment detected",
    evidence: "DOM raw HTML sink",
    fix: "Use textContent/React rendering or sanitize trusted markup before insertion.",
    pattern: /\.innerHTML\s*=/g,
  },
  {
    severity: "critical",
    category: "Authorization",
    title: "Supabase admin API referenced by frontend",
    evidence: "Admin API in src/",
    fix: "Move admin operations to a trusted backend or Edge Function guarded by server-side authorization.",
    pattern: /supabase\.auth\.admin\b/g,
  },
  {
    severity: "high",
    category: "Transport",
    title: "Plain HTTP external URL in frontend",
    evidence: "Insecure external URL",
    fix: "Use HTTPS for production endpoints.",
    pattern: /http:\/\/(?!localhost\b|127\.0\.0\.1\b|0\.0\.0\.0\b)[A-Za-z0-9.-]+/g,
  },
];

for (const file of files) {
  let source;
  try {
    source = fs.readFileSync(file, "utf8");
  } catch {
    continue;
  }

  for (const rule of secretRules) scanRegex(file, source, rule);

  const rel = relative(file);
  const isRuntimeCode =
    rel.startsWith("src/") ||
    rel.startsWith("public/") ||
    rel.startsWith("supabase/functions/");

  if (isRuntimeCode) {
    for (const rule of runtimeCodeRules) scanRegex(file, source, rule);
  }

  if (rel.startsWith("src/")) {
    for (const rule of frontendRules) scanRegex(file, source, rule);

    if (/target=["']_blank["']/.test(source)) {
      const lines = source.split("\n");
      lines.forEach((text, index) => {
        if (
          /target=["']_blank["']/.test(text) &&
          !/rel=["'][^"']*(?:noopener|noreferrer)/.test(text)
        ) {
          add(
            "medium",
            "Browser isolation",
            "target=_blank without noopener/noreferrer",
            "A new tab can retain an opener reference.",
            "Add rel=\"noopener noreferrer\" to external links opened in a new tab.",
            relative(file),
            index + 1
          );
        }
      });
    }
  }
}

// Vercel / browser hardening.
const vercelPath = path.join(ROOT, "vercel.json");
if (fs.existsSync(vercelPath)) {
  try {
    const vercel = JSON.parse(fs.readFileSync(vercelPath, "utf8"));
    const headers = (vercel.headers || []).flatMap((entry) => entry.headers || []);
    const headerMap = new Map(headers.map((h) => [String(h.key).toLowerCase(), String(h.value)]));

    const requiredHeaders = [
      ["strict-transport-security", "high", "HSTS"],
      ["content-security-policy", "high", "Content-Security-Policy"],
      ["x-content-type-options", "medium", "X-Content-Type-Options"],
      ["referrer-policy", "medium", "Referrer-Policy"],
      ["permissions-policy", "medium", "Permissions-Policy"],
    ];

    for (const [key, severity, label] of requiredHeaders) {
      if (!headerMap.has(key)) {
        add(
          severity,
          "HTTP headers",
          `Missing ${label}`,
          `${label} was not found in vercel.json.`,
          `Add a production-wide ${label} header in vercel.json.`,
          "vercel.json",
          1
        );
      }
    }

    const csp = headerMap.get("content-security-policy") || "";

    if (/script-src[^;]*'unsafe-eval'/.test(csp)) {
      add(
        "high",
        "CSP",
        "CSP allows unsafe-eval",
        "script-src contains 'unsafe-eval'.",
        "Remove 'unsafe-eval' and replace libraries that require runtime code generation.",
        "vercel.json",
        1
      );
    }

    if (/script-src[^;]*'unsafe-inline'/.test(csp)) {
      add(
        "medium",
        "CSP",
        "CSP allows inline scripts",
        "script-src contains 'unsafe-inline'.",
        "Move inline scripts into bundled files, or use CSP nonces/hashes, then remove 'unsafe-inline'.",
        "vercel.json",
        1
      );
    }

    if (/style-src[^;]*'unsafe-inline'/.test(csp)) {
      add(
        "low",
        "CSP",
        "CSP allows inline styles",
        "style-src contains 'unsafe-inline'. This is weaker than nonce/hash-only styling, but it does not permit inline JavaScript.",
        "Prefer CSS classes and bundled styles. Remove style-src 'unsafe-inline' when all runtime inline style attributes can be eliminated safely.",
        "vercel.json",
        1
      );
    }

    for (const directive of ["base-uri", "object-src", "frame-ancestors", "form-action"]) {
      if (!new RegExp(`(?:^|;)\\s*${directive}\\s+`).test(csp)) {
        add(
          "medium",
          "CSP",
          `CSP missing ${directive}`,
          `The Content-Security-Policy has no ${directive} directive.`,
          `Add an explicit ${directive} directive with the narrowest allowed value.`,
          "vercel.json",
          1
        );
      }
    }
  } catch (error) {
    add(
      "high",
      "Configuration",
      "vercel.json could not be parsed",
      String(error.message || error),
      "Fix invalid JSON before deployment.",
      "vercel.json",
      1
    );
  }
} else {
  add(
    "medium",
    "Configuration",
    "vercel.json is missing",
    "No Vercel security-header configuration was found.",
    "Add security headers at the deployment edge.",
    "vercel.json",
    1
  );
}

// Production source maps.
const vitePath = path.join(ROOT, "vite.config.js");
if (fs.existsSync(vitePath)) {
  const source = fs.readFileSync(vitePath, "utf8");
  if (/sourcemap\s*:\s*true/.test(source)) {
    add(
      "medium",
      "Information exposure",
      "Production source maps are enabled",
      "vite.config.js sets sourcemap: true.",
      "Disable public production source maps or upload them only to a private error-monitoring service.",
      "vite.config.js",
      lineOf(source, source.search(/sourcemap\s*:/))
    );
  }
}

// .gitignore hygiene.
const gitignorePath = path.join(ROOT, ".gitignore");
if (fs.existsSync(gitignorePath)) {
  const source = fs.readFileSync(gitignorePath, "utf8");
  for (const expected of [".env", "*.pem", "*.key", "*.keystore", "*.jks"]) {
    if (!source.includes(expected)) {
      add(
        "medium",
        "Repository hygiene",
        `Sensitive pattern not ignored: ${expected}`,
        `${expected} is not present in .gitignore.`,
        "Add the pattern to .gitignore and confirm no matching secret is already tracked.",
        ".gitignore",
        1
      );
    }
  }
}

// Supabase migration static checks.
const migrationFiles = files.filter((file) => relative(file).startsWith("supabase/migrations/"));
for (const file of migrationFiles) {
  const source = fs.readFileSync(file, "utf8");

  const securityDefinerMatches = [...source.matchAll(/security\s+definer/gi)];
  for (const match of securityDefinerMatches) {
    const nearby = source.slice(Math.max(0, match.index - 1000), Math.min(source.length, match.index + 1400));
    if (!/set\s+search_path\s*=|set\s+search_path\s+to/i.test(nearby)) {
      add(
        "high",
        "Supabase / PostgreSQL",
        "SECURITY DEFINER without fixed search_path",
        "A SECURITY DEFINER function may rely on caller-controlled schema resolution.",
        "Set a minimal explicit search_path (typically public, extensions as needed) inside the function and schema-qualify objects.",
        relative(file),
        lineOf(source, match.index)
      );
    }
  }

  const grantMatches = [...source.matchAll(/grant\s+execute\s+on\s+function\s+(?:public\.)?([a-zA-Z0-9_]+)[\s\S]{0,300}?\s+to\s+anon\b/gi)];
  for (const match of grantMatches) {
    const functionName = String(match[1] || "").toLowerCase();
    if (INTENTIONAL_ANON_RPCS.has(functionName)) continue;

    add(
      "medium",
      "Supabase / PostgreSQL",
      "Anonymous RPC exposure requires review",
      `Function ${functionName || "(unknown)"} is explicitly executable by anon.`,
      "Keep anon EXECUTE only for intentionally public RPCs, validate inputs, rate-limit write endpoints, and revoke it everywhere else.",
      relative(file),
      lineOf(source, match.index)
    );
  }
}

// Service worker cache review.
const swPath = path.join(ROOT, "public/sw.js");
if (fs.existsSync(swPath)) {
  const source = fs.readFileSync(swPath, "utf8");
  if (/cache\.put\(request/.test(source) && !/isAssetRequest/.test(source)) {
    add(
      "medium",
      "PWA cache",
      "Service worker may cache arbitrary GET responses",
      "cache.put(request, ...) was found without an obvious static-asset guard.",
      "Cache only public static assets. Never cache authenticated API/data responses unless explicitly designed and encrypted.",
      "public/sw.js",
      1
    );
  }
}

const counts = {
  critical: findings.filter((f) => f.severity === "critical").length,
  high: findings.filter((f) => f.severity === "high").length,
  medium: findings.filter((f) => f.severity === "medium").length,
  low: findings.filter((f) => f.severity === "low").length,
  info: findings.filter((f) => f.severity === "info").length,
};

const deduction = findings.reduce((sum, f) => sum + (severityWeight[f.severity] || 0), 0);
const score = Math.max(0, 100 - deduction);

const report = {
  generated_at: new Date().toISOString(),
  engine: "Sadiq Security Sentinel V∞",
  score,
  counts,
  findings: findings.sort(
    (a, b) => severityWeight[b.severity] - severityWeight[a.severity]
  ),
};

fs.writeFileSync(REPORT_JSON, JSON.stringify(report, null, 2));

const icon = {
  critical: "🔴",
  high: "🟠",
  medium: "🟡",
  low: "🔵",
  info: "⚪",
};

const md = [
  "# Sadiq Security Sentinel V∞",
  "",
  `Generated: ${report.generated_at}`,
  `Security score: **${score}/100**`,
  "",
  `- Critical: **${counts.critical}**`,
  `- High: **${counts.high}**`,
  `- Medium: **${counts.medium}**`,
  `- Low: **${counts.low}**`,
  "",
  "## Findings",
  "",
  ...(report.findings.length
    ? report.findings.flatMap((f, index) => [
        `### ${index + 1}. ${icon[f.severity] || ""} ${f.title}`,
        "",
        `**Severity:** ${f.severity.toUpperCase()}  `,
        `**Category:** ${f.category}  `,
        f.file ? `**Location:** ${f.file}${f.line ? `:${f.line}` : ""}  ` : "",
        "",
        `**Evidence:** ${f.evidence}`,
        "",
        `**Recommended fix:** ${f.fix}`,
        "",
      ])
    : ["No findings from the local sentinel rules.", ""]),
  "## Notes",
  "",
  "- This report is defensive and non-destructive.",
  "- Static analysis cannot prove the absence of vulnerabilities.",
  "- Live Supabase authorization must still be verified against real roles and RLS behavior.",
  "",
].join("\n");

fs.writeFileSync(REPORT_MD, md);

console.log(`Sadiq Security Sentinel V∞ finished: ${score}/100`);
console.log(`Findings: critical=${counts.critical}, high=${counts.high}, medium=${counts.medium}, low=${counts.low}`);
console.log(`Report: ${path.relative(ROOT, REPORT_MD)}`);

if (counts.critical > 0 || counts.high > 0) {
  process.exitCode = 2;
}

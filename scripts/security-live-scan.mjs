import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const ROOT = process.cwd();
const OUT_DIR = path.join(ROOT, "security-artifacts");
const TARGET = (process.env.SECURITY_TARGET_URL || "https://sadiqh.vercel.app").replace(/\/$/, "");

fs.mkdirSync(OUT_DIR, { recursive: true });

const findings = [];

function add(severity, category, title, evidence, fix, url = null) {
  findings.push({ severity, category, title, evidence, fix, url });
}

function hashText(value) {
  return crypto.createHash("sha256").update(value || "").digest("hex");
}

async function fetchText(url, options = {}) {
  const response = await fetch(url, {
    redirect: "follow",
    headers: {
      "User-Agent": "Sadiq-Security-Sentinel/Infinity",
      Accept: "*/*",
      ...(options.headers || {}),
    },
    signal: AbortSignal.timeout(15000),
    ...options,
  });

  const text = await response.text();
  return {
    response,
    text,
    contentType: response.headers.get("content-type") || "",
  };
}

let root;
try {
  root = await fetchText(`${TARGET}/`);
} catch (error) {
  add(
    "high",
    "Availability",
    "Production site could not be reached",
    String(error.message || error),
    "Verify DNS, Vercel deployment status, TLS, and upstream availability.",
    TARGET
  );
}

if (root) {
  const headers = root.response.headers;
  const checks = [
    ["strict-transport-security", "high", "HSTS", "Enable HSTS with a long max-age on HTTPS-only production."],
    ["content-security-policy", "high", "Content-Security-Policy", "Set a restrictive CSP and remove unsafe directives where possible."],
    ["x-content-type-options", "medium", "X-Content-Type-Options", "Set X-Content-Type-Options: nosniff."],
    ["referrer-policy", "medium", "Referrer-Policy", "Set a privacy-preserving Referrer-Policy."],
    ["permissions-policy", "medium", "Permissions-Policy", "Explicitly disable browser capabilities not used by the app."],
  ];

  for (const [name, severity, label, fix] of checks) {
    if (!headers.get(name)) {
      add(
        severity,
        "HTTP headers",
        `Live site missing ${label}`,
        `${name} was absent from the root response.`,
        fix,
        TARGET
      );
    }
  }

  const csp = headers.get("content-security-policy") || "";

  if (/script-src[^;]*'unsafe-eval'/.test(csp)) {
    add(
      "high",
      "CSP",
      "Live CSP allows unsafe-eval",
      "The deployed Content-Security-Policy includes 'unsafe-eval'.",
      "Remove unsafe-eval and replace runtime code-generation dependencies.",
      TARGET
    );
  }

  if (/script-src[^;]*'unsafe-inline'/.test(csp)) {
    add(
      "medium",
      "CSP",
      "Live CSP allows inline scripts",
      "The deployed script-src contains 'unsafe-inline'.",
      "Move inline scripts to bundled files or adopt nonces/hashes, then remove unsafe-inline.",
      TARGET
    );
  }

  if (/style-src[^;]*'unsafe-inline'/.test(csp)) {
    add(
      "low",
      "CSP",
      "Live CSP permits inline CSS styles",
      "The deployed style-src includes the inline-style allowance; script-src remains evaluated separately.",
      "Prefer bundled CSS classes and remove the inline-style allowance after runtime style attributes are eliminated safely.",
      TARGET
    );
  }

  const rootHash = hashText(root.text);
  const sensitivePaths = [
    "/.env",
    "/.env.production",
    "/.git/config",
    "/package.json",
    "/vite.config.js",
    "/src/main.jsx",
    "/src/lib/supabase.js",
    "/supabase/config.toml",
    "/supabase/.branches",
    "/security-artifacts/sentinel-report.json",
  ];

  for (const pathname of sensitivePaths) {
    try {
      const result = await fetchText(`${TARGET}${pathname}`);
      const bodyHash = hashText(result.text);
      const looksLikeSpaFallback =
        result.contentType.includes("text/html") &&
        bodyHash === rootHash;

      if (result.response.ok && !looksLikeSpaFallback) {
        add(
          "high",
          "Information exposure",
          `Sensitive path is publicly reachable: ${pathname}`,
          `HTTP ${result.response.status}, content-type=${result.contentType || "unknown"}.`,
          "Block this path at the deployment layer and remove the file from public output.",
          `${TARGET}${pathname}`
        );
      }
    } catch {
      // A network failure for a probe is not itself a vulnerability.
    }
  }

  // Look for source maps referenced by production JavaScript.
  const scriptMatches = [...root.text.matchAll(/<script[^>]+src=["']([^"']+\.js[^"']*)["']/gi)];
  for (const match of scriptMatches.slice(0, 20)) {
    try {
      const scriptUrl = new URL(match[1], TARGET).href;
      const script = await fetchText(scriptUrl);

      if (/sourceMappingURL\s*=/.test(script.text)) {
        add(
          "medium",
          "Information exposure",
          "Production JavaScript references a source map",
          scriptUrl,
          "Disable public source maps or upload them only to a private monitoring platform.",
          scriptUrl
        );
      }
    } catch {
      // Ignore individual asset failures.
    }
  }
}

// Check high-value auth pages for no-store / noindex headers.
for (const pathname of ["/login", "/admin", "/teacher", "/student", "/system-admin", "/forgot-password", "/reset-password"]) {
  try {
    const result = await fetchText(`${TARGET}${pathname}`);
    const cacheControl = result.response.headers.get("cache-control") || "";
    const robots = result.response.headers.get("x-robots-tag") || "";

    if (!/no-store/i.test(cacheControl)) {
      add(
        "medium",
        "Privacy",
        `${pathname} is not explicitly no-store`,
        `cache-control=${cacheControl || "(missing)"}`,
        "Set Cache-Control: no-store for authenticated or credential-related routes.",
        `${TARGET}${pathname}`
      );
    }

    if (!/noindex/i.test(robots)) {
      add(
        "low",
        "Search exposure",
        `${pathname} is not explicitly noindex`,
        `x-robots-tag=${robots || "(missing)"}`,
        "Add X-Robots-Tag: noindex, nofollow, noarchive on non-public application routes.",
        `${TARGET}${pathname}`
      );
    }
  } catch {
    // Continue other checks.
  }
}

const counts = {
  critical: findings.filter((f) => f.severity === "critical").length,
  high: findings.filter((f) => f.severity === "high").length,
  medium: findings.filter((f) => f.severity === "medium").length,
  low: findings.filter((f) => f.severity === "low").length,
};

const report = {
  generated_at: new Date().toISOString(),
  engine: "Sadiq Security Sentinel V∞ — Live Surface",
  target: TARGET,
  counts,
  findings,
};

fs.writeFileSync(
  path.join(OUT_DIR, "live-scan.json"),
  JSON.stringify(report, null, 2)
);

const md = [
  "# Sadiq Security Sentinel V∞ — Live Surface",
  "",
  `Target: ${TARGET}`,
  `Generated: ${report.generated_at}`,
  "",
  `- Critical: **${counts.critical}**`,
  `- High: **${counts.high}**`,
  `- Medium: **${counts.medium}**`,
  `- Low: **${counts.low}**`,
  "",
  ...(findings.length
    ? findings.flatMap((f, index) => [
        `## ${index + 1}. [${f.severity.toUpperCase()}] ${f.title}`,
        "",
        `**Category:** ${f.category}`,
        "",
        `**Evidence:** ${f.evidence}`,
        "",
        `**Fix:** ${f.fix}`,
        "",
        f.url ? `**URL:** ${f.url}` : "",
        "",
      ])
    : ["No live-surface findings from the current checks.", ""]),
].join("\n");

fs.writeFileSync(path.join(OUT_DIR, "live-scan.md"), md);

console.log(
  `Live security scan complete for ${TARGET}: high=${counts.high}, medium=${counts.medium}, low=${counts.low}`
);

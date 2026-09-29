import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const ROOT = process.cwd();
const vercelPath = path.join(ROOT, "vercel.json");

function fail(message) {
  console.error(`CSP verification failed: ${message}`);
  process.exit(1);
}

if (!fs.existsSync(vercelPath)) fail("vercel.json is missing.");

let vercel;
try {
  vercel = JSON.parse(fs.readFileSync(vercelPath, "utf8"));
} catch (error) {
  fail(`vercel.json is invalid JSON: ${error.message}`);
}

const headerEntries = Array.isArray(vercel.headers) ? vercel.headers : [];
const globalEntry = headerEntries.find((entry) => entry?.source === "/(.*)");
const cspHeader = globalEntry?.headers?.find(
  (header) => String(header?.key || "").toLowerCase() === "content-security-policy"
);
const csp = String(cspHeader?.value || "");

if (!csp) fail("global Content-Security-Policy header is missing.");
if (/script-src[^;]*'unsafe-inline'/i.test(csp)) fail("script-src still contains 'unsafe-inline'.");
if (/script-src[^;]*'unsafe-eval'/i.test(csp)) fail("script-src contains 'unsafe-eval'.");

function inlineScripts(html) {
  const results = [];
  const pattern = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi;
  let match;
  while ((match = pattern.exec(html))) {
    const attrs = match[1] || "";
    const body = match[2] || "";
    if (/\bsrc\s*=/i.test(attrs)) continue;
    results.push({ attrs, body });
  }
  return results;
}

function sha256Csp(body) {
  const base64 = crypto.createHash("sha256").update(body, "utf8").digest("base64");
  return `'sha256-${base64}'`;
}

function verifyHtml(label, filePath) {
  if (!fs.existsSync(filePath)) return { label, checked: false, count: 0 };
  const html = fs.readFileSync(filePath, "utf8");
  const scripts = inlineScripts(html);

  for (const script of scripts) {
    const hash = sha256Csp(script.body);
    if (!csp.includes(hash)) {
      fail(`${label} contains an inline script whose CSP hash is missing: ${hash}`);
    }
  }

  const inlineHandlers = [...html.matchAll(/\son[a-z]+\s*=\s*["']/gi)];
  if (inlineHandlers.length) {
    fail(`${label} contains ${inlineHandlers.length} inline event handler(s), which are blocked by the hardened CSP.`);
  }

  return { label, checked: true, count: scripts.length };
}

const results = [
  verifyHtml("source index.html", path.join(ROOT, "index.html")),
  verifyHtml("built dist/index.html", path.join(ROOT, "dist", "index.html")),
];

for (const result of results) {
  if (!result.checked) continue;
  console.log(`CSP OK: ${result.label} — ${result.count} hashed inline script(s).`);
}

console.log("CSP verification passed: no unsafe-inline/unsafe-eval and all inline scripts are hash-authorized.");

import fs from "node:fs/promises";
import assert from "node:assert/strict";
import React from "react";
import Renderer, { act } from "react-test-renderer";
import { transformWithOxc } from "vite";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const originalConsoleError = console.error;
const validationErrors = [];
console.error = (label, error, ...rest) => {
  if (label === "Login error:") { validationErrors.push(error?.message); return; }
  originalConsoleError(label, error, ...rest);
};
globalThis.securityUi = { React, calls: [], navigation: [], clipboard: "" };
const fixture = { full_name: "طالب الاختبار", user_number: "ST-UI-FIXTURE", access_code: "12345678" };
globalThis.securityUi.supabase = {
  functions: { invoke: async (name, request) => {
    globalThis.securityUi.calls.push({ name, ...request });
    if (name === "student-login") return { data: { ok: true, access_token: "fixture-access", refresh_token: "fixture-refresh", profile: fixture }, error: null };
    return { data: { ok: true, ...fixture }, error: null };
  } }, auth: { setSession: async () => ({ error: null }) },
};
const values = new Map();
globalThis.localStorage = { getItem: key => values.get(key) || null, setItem: (key, value) => values.set(key, value), removeItem: key => values.delete(key) };
globalThis.window = { location: { origin: "https://fixture.invalid", pathname: "/login", search: "", hash: "" },
  history: { state: {}, replaceState: () => { window.location.hash = ""; } }, confirm: () => true };
Object.defineProperty(globalThis, "navigator", { value: { clipboard: { writeText: async value => { globalThis.securityUi.clipboard = value; } } }, configurable: true });
const imports = /^import[\s\S]*?;\n/gm;
async function load(file, prelude) {
  const source = (await fs.readFile(file, "utf8")).replace(imports, "");
  const compiled = await transformWithOxc(prelude + source, file, { jsx: { runtime: "classic" } });
  return (await import("data:text/javascript;base64," + Buffer.from(compiled.code).toString("base64"))).default;
}
const loginSource = await fs.readFile("src/pages/Login.jsx", "utf8");
const icons = loginSource.match(/import\s*\{([^}]+)\}\s*from\s*"lucide-react"/)[1].split(",").map(x => x.trim()).filter(Boolean);
const Login = await load("src/pages/Login.jsx", `const React=globalThis.securityUi.React;const {useState,useEffect}=React;
const supabase=globalThis.securityUi.supabase;const useNavigate=()=>path=>globalThis.securityUi.navigation.push(path);
const useLocation=()=>({state:null});const useToast=()=>({showToast:()=>{}});const OrnamentScene=()=>null;
${icons.map(name => `const ${name}='svg';`).join("\n")}\n`);
const Card = await load("src/components/security/StudentAccessCard.jsx", "const React=globalThis.securityUi.React;const {useState,useEffect,useCallback}=React;const supabase=globalThis.securityUi.supabase;\n");
let tree;
async function mount(Component, props = {}) {
  if (tree) await act(async () => tree.unmount());
  securityUi.calls = []; securityUi.navigation = [];
  await act(async () => { tree = Renderer.create(React.createElement(Component, props)); });
}
async function submit() { await act(async () => { await tree.root.findByType("form").props.onSubmit({ preventDefault() {} }); }); }

window.location.hash = "#" + new URLSearchParams({ student: fixture.user_number, name: fixture.full_name, code: fixture.access_code });
await mount(Login);
assert.equal(window.location.hash, "", "Private fragment is removed immediately");
const fields = tree.root.findAllByType("input").filter(node => node.props.type !== "checkbox");
assert.equal(fields.length, 2, "Student mode has just number and code");
assert.equal(fields.find(node => node.props.type === "password").props.value, fixture.access_code);
await submit();
assert.equal(securityUi.calls[0].body.access_code, fixture.access_code);
assert.equal(securityUi.navigation.at(-1), "/student");
assert(!JSON.stringify([...values.values()]).includes(fixture.access_code), "PIN is never persisted in quick accounts or remembered form data");

await mount(Login);
const numberField = tree.root.findAllByType("input").find(node => node.props.placeholder?.startsWith("مثال"));
await act(async () => numberField.props.onChange({ target: { value: fixture.user_number } }));
await submit();
assert.equal(securityUi.calls.length, 0, "Missing PIN blocks the request before it reaches the server");
assert(validationErrors.at(-1).includes("رمز الدخول"));

await mount(Card, { initialCard: fixture });
await act(async () => { await tree.root.findAllByType("button").find(node => node.children.includes("نسخ رابط الدخول")).props.onClick(); });
const link = new URL(securityUi.clipboard);
assert.equal(link.pathname, "/login"); assert.equal(link.search, "");
assert.equal(new URLSearchParams(link.hash.slice(1)).get("code"), fixture.access_code, "Shared link carries secrets in its fragment only");

await mount(Card, { studentId: 101, autoLoad: true });
assert.equal(securityUi.calls.length, 1, "Opening the supervisor card loads it once");
assert.equal(securityUi.calls[0].body.student_id, 101);
await act(async () => { await tree.root.findAllByType("button").find(node => node.children.includes("تغيير رمز الدخول")).props.onClick(); });
assert.equal(securityUi.calls.at(-1).body.reset, true);
await act(async () => tree.unmount());
console.error = originalConsoleError;
console.log("PASS: secure link login, two-field student form, PIN not persisted, missing PIN blocked, fragment-only sharing and card rotation.");

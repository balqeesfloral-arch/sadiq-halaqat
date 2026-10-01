import { clientAddress, codesEqual, normalizeCode, quota, readBody, RequestError, safeAppPath, studentAccessCode, validPushEndpoint } from "./security.ts";

function assert(value: unknown, message = "Assertion failed") { if (!value) throw new Error(message); }
async function rejects(fn: () => Promise<unknown>, status: number) {
  let caught: unknown;
  try { await fn(); } catch (error) { caught = error; }
  assert(caught instanceof RequestError && caught.status === status, `Expected status ${status}`);
}

Deno.test("student code is deterministic, secret-bound and version-bound", async () => {
  const code = await studentAccessCode(101, "fixture-version", "test-secret-do-not-use-in-production");
  assert(/^\d{8}$/.test(code));
  assert(code === await studentAccessCode(101, "fixture-version", "test-secret-do-not-use-in-production"));
  assert(code !== await studentAccessCode(102, "fixture-version", "test-secret-do-not-use-in-production"));
  assert(code !== await studentAccessCode(101, "changed-version", "test-secret-do-not-use-in-production"));
  assert(code !== await studentAccessCode(101, "fixture-version", "different-secret-do-not-use"));
  assert(codesEqual(code, code)); assert(!codesEqual(code, "")); assert(!codesEqual(code, "1234"));
  assert(normalizeCode("١٢٣٤ ۵۶۷۸") === "12345678");
});

Deno.test("push destinations reject private hosts, spoofed providers and credentials", () => {
  for (const endpoint of ["https://fcm.googleapis.com/fcm/send/fixture", "https://web.push.apple.com/fixture-subscription", "https://updates.push.services.mozilla.com/wpush/v2/fixture"]) {
    assert(validPushEndpoint(endpoint), endpoint);
  }
  for (const endpoint of ["https://127.0.0.1/internal/resource", "https://[::1]/internal/resource", "https://169.254.169.254/latest/meta-data", "http://fcm.googleapis.com/fcm/send/fixture", "https://fcm.googleapis.com.attacker.example/fixture", "https://attacker@fcm.googleapis.com/fixture", "https://fcm.googleapis.com:8443/fixture", "https://fcm.googleapis.com/fixture#fragment"]) {
    assert(!validPushEndpoint(endpoint), endpoint);
  }
});

Deno.test("notification destinations remain inside the application", () => {
  assert(safeAppPath("/student/notifications?tab=unread") === "/student/notifications?tab=unread");
  for (const url of ["https://attacker.example", "//attacker.example", "/\\attacker.example", "javascript:alert(1)", "/\nattacker.example"]) assert(safeAppPath(url) === "/");
});

Deno.test("body size is enforced even when Content-Length is omitted or forged", async () => {
  const request = (body: string) => new Request("https://fixture.invalid", { method: "POST", body });
  assert((await readBody(request('{"valid":true}'))).valid === true);
  await rejects(() => readBody(request("{")), 400);
  await rejects(() => readBody(request("[]")), 400);
  await rejects(() => readBody(request('"scalar"')), 400);
  await rejects(() => readBody(request("x".repeat(100)), 20), 413);
  await rejects(() => readBody(new Request("https://fixture.invalid", { method: "POST", headers: { "content-length": "5000" }, body: "{}" }), 20), 413);
});

Deno.test("quota keys hide identifiers and rejection fails closed", async () => {
  let captured = "";
  // A mock of the trusted RPC; no network or real accounts are touched.
  const admin = { rpc: (_name: string, args: { p_key: string }) => { captured = args.p_key; return Promise.resolve({ data: true, error: null }); } };
  await quota(admin as never, "test-secret", "login", "192.0.2.1", 8, 3600);
  assert(/^login:[a-f0-9]{64}$/.test(captured) && !captured.includes("192.0.2.1"));
  await rejects(() => quota({ rpc: () => Promise.resolve({ data: false, error: null }) } as never, "test-secret", "login", "fixture", 8, 3600), 429);
  await rejects(() => quota({ rpc: () => Promise.resolve({ data: null, error: { message: "offline" } }) } as never, "test-secret", "login", "fixture", 8, 3600), 503);
  assert(clientAddress(new Request("https://fixture.invalid", { headers: { "x-forwarded-for": "203.0.113.7, 192.0.2.8" } })) === "192.0.2.8");
  assert(clientAddress(new Request("https://fixture.invalid", { headers: { "cf-connecting-ip": "192.0.2.9", "x-forwarded-for": "203.0.113.7, 192.0.2.8" } })) === "192.0.2.9");
});

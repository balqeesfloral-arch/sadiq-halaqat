import { studentAccessCode } from "./security.ts";

function assert(value: unknown, label: string) { if (!value) throw new Error(label); }
const secret = "test-only-student-secret-never-a-real-key";
const fixtureId = "00000000-0000-4000-8000-000000000101";
const version = "00000000-0000-4000-8000-000000000202";
const user = { id: fixtureId, email: "fixture@students.sadiq.local", email_confirmed_at: "2026-01-01T00:00:00Z", aud: "authenticated", role: "authenticated", created_at: "2026-01-01T00:00:00Z", app_metadata: {}, user_metadata: {} };
const profile = { id: 101, auth_user_id: fixtureId, role: "student", user_number: "ST-SECURITY-FIXTURE", full_name: "طالب اختبار", status: "active", is_active: true };
type Handler = (req: Request) => Response | Promise<Response>;
const handlers: Record<string, Handler> = {};
const serve = Deno.serve;
for (const [key, value] of Object.entries({ SUPABASE_URL: "https://security-fixture.invalid", SUPABASE_ANON_KEY: "fixture-public-key", SUPABASE_SERVICE_ROLE_KEY: crypto.randomUUID(), STUDENT_AUTH_SECRET: secret })) Deno.env.set(key, value);
for (const name of ["student-login", "register-account", "student-access-card", "public-support"]) {
  Object.defineProperty(Deno, "serve", { value: (handler: Handler) => { handlers[name] = handler; }, configurable: true });
  await import(`../${name}/index.ts`);
}
Object.defineProperty(Deno, "serve", { value: serve, configurable: true });

type Call = { path: string; method: string; body: Record<string, unknown> };
async function withBackend(run: (calls: Call[], state: { limited: boolean; cardDenied: boolean; mailFailure: boolean }) => Promise<void>) {
  const fetch = globalThis.fetch;
  const calls: Call[] = [];
  const state = { limited: false, cardDenied: false, mailFailure: false };
  globalThis.fetch = async (input, init) => {
    const url = new URL(input instanceof Request ? input.url : String(input));
    const method = init?.method || "GET";
    const body = typeof init?.body === "string" ? JSON.parse(init.body) : {};
    calls.push({ path: url.pathname, method, body });
    const json = (value: unknown, status = 200) => new Response(JSON.stringify(value), { status, headers: { "content-type": "application/json" } });
    if (url.pathname.endsWith("/take_security_quota")) return json(!state.limited);
    if (url.pathname.endsWith("/student_login_context")) return json(body.p_user_number === "ST-SECURITY-FIXTURE" ? [{ student_id: profile.id, credential_version: version }] : []);
    if (url.pathname.endsWith("/student_access_card_context")) return state.cardDenied
      ? json({ message: "STUDENT_CARD_ACCESS_DENIED", code: "42501" }, 403)
      : json([{ student_id: profile.id, full_name: profile.full_name, user_number: profile.user_number, credential_version: version }]);
    if (url.pathname.endsWith("/generate_account_number")) return json("ST-SECURITY-FIXTURE");
    if (url.pathname.endsWith("/submit_public_support_request")) return json(101);
    if (url.pathname === "/rest/v1/profiles") return json(method === "GET" ? [profile] : { ...profile, ...body });
    if (url.pathname === "/auth/v1/admin/users" || url.pathname === "/auth/v1/user") return json(user);
    if (url.pathname.startsWith("/auth/v1/admin/users/")) return json(user);
    if (url.pathname === "/auth/v1/resend") return state.mailFailure ? json({ msg: "mailer unavailable", code: "over_email_send_rate_limit" }, 429) : json({});
    if (url.pathname === "/auth/v1/token") {
      const token = [btoa(JSON.stringify({ alg: "HS256", typ: "JWT" })), btoa(JSON.stringify({ sub: fixtureId, exp: Math.floor(Date.now() / 1000) + 3600 })), "fixture-signature"].join(".");
      return json({ access_token: token, refresh_token: "fixture-refresh-token", token_type: "bearer", expires_in: 3600, user });
    }
    throw new Error(`Unexpected mocked request: ${method} ${url.pathname}`);
  };
  try { await run(calls, state); } finally { globalThis.fetch = fetch; }
}
async function call(name: string, body: Record<string, unknown>, authorized = false) {
  return await handlers[name](new Request("https://security-fixture.invalid", { method: "POST",
    headers: { "content-type": "application/json", "x-forwarded-for": "192.0.2.1", ...(authorized ? { authorization: "Bearer fixture-session" } : {}) }, body: JSON.stringify(body) }));
}

Deno.test("student login refuses name/number alone and never calls Auth before the code", async () => {
  await withBackend(async calls => {
    const missing = await call("student-login", { full_name: "طالب", user_number: profile.user_number });
    assert(missing.status === 401, "Legacy passwordless login must be closed");
    const wrong = await call("student-login", { full_name: "طالب", user_number: profile.user_number, access_code: "00000000" });
    assert(wrong.status === 401, "Wrong code rejected");
    assert(!calls.some(c => c.path.startsWith("/auth/")), "Wrong code cannot reach Auth or repair credentials");
  });
});

Deno.test("student login accepts the secure card and checks active status", async () => {
  await withBackend(async () => {
    const code = await studentAccessCode(profile.id, version, secret);
    const response = await call("student-login", { full_name: "طالب", user_number: profile.user_number, access_code: code });
    assert(response.status === 200 && (await response.json()).ok, "Secure card login succeeds");
    profile.is_active = false;
    try {
      assert((await call("student-login", { full_name: "طالب", user_number: profile.user_number, access_code: code })).status === 401, "Disabled student denied");
    } finally { profile.is_active = true; }
  });
});

Deno.test("login and support quotas stop work before credential checks or inserts", async () => {
  await withBackend(async (calls, state) => {
    state.limited = true;
    assert((await call("student-login", { full_name: "طالب", user_number: profile.user_number, access_code: "12345678" })).status === 429, "Login limit");
    assert((await call("public-support", { message: "fixture only" })).status === 429, "Support limit");
    assert(calls.every(c => c.path.endsWith("/take_security_quota")), "No downstream work after limit");
  });
});

Deno.test("registration disallows admin roles and short staff passwords", async () => {
  await withBackend(async calls => {
    assert((await call("register-account", { role: "admin", full_name: "اختبار فقط" })).status === 400, "No public admin signup");
    assert((await call("register-account", { role: "teacher", full_name: "اختبار فقط", email: "fixture@example.invalid", password: "short" })).status === 400, "Weak staff password denied");
    assert(!calls.some(c => c.path.startsWith("/auth/")), "Validation precedes account creation");
  });
});

Deno.test("staff signup requires confirmation and rolls back when mail fails", async () => {
  await withBackend(async (calls, state) => {
    const body = { role: "teacher", full_name: "اختبار فقط", email: "fixture@example.invalid", password: "Long-fixture-password-42" };
    const response = await call("register-account", body);
    assert(response.status === 200 && (await response.json()).confirmation_required === true, "Confirmation required");
    assert(calls.find(c => c.path === "/auth/v1/admin/users")?.body.email_confirm === false, "Staff email never auto-confirmed");
    state.mailFailure = true;
    assert((await call("register-account", body)).status === 503, "Mailer failure reported");
    assert(calls.some(c => c.method === "DELETE" && c.path.startsWith("/auth/v1/admin/users/")), "Created Auth identity cleaned up");
    assert(calls.some(c => c.method === "DELETE" && c.path === "/rest/v1/profiles"), "Created profile cleaned up");
  });
});

Deno.test("cards honor user-scoped authorization and never expose the credential version", async () => {
  await withBackend(async (_calls, state) => {
    const response = await call("student-access-card", { student_id: profile.id }, true);
    const card = await response.json();
    assert(response.status === 200 && /^\d{8}$/.test(card.access_code) && !card.credential_version, "Card response contains only intended credentials");
    state.cardDenied = true;
    assert((await call("student-access-card", { student_id: 999 }, true)).status === 403, "Foreign card denied");
  });
});

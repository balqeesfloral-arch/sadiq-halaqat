import { createClient } from "npm:@supabase/supabase-js@2.112.3";
import { quota, readBody, RequestError, studentAccessCode } from "../_shared/security.ts";

const headers = { "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Cache-Control": "no-store", "Content-Type": "application/json" };
function json(body: unknown, status = 200) { return new Response(JSON.stringify(body), { status, headers }); }

Deno.serve(async req => {
  if (req.method === "OPTIONS") return new Response("ok", { headers });
  if (req.method !== "POST") return json({ ok: false }, 405);
  const url = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const secret = Deno.env.get("STUDENT_AUTH_SECRET");
  if (!url || !serviceKey || !anonKey || !secret) return json({ ok: false }, 503);
  try {
    const authorization = req.headers.get("authorization") || "";
    const token = authorization.replace(/^Bearer\s+/i, "");
    const admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data: { user }, error } = await admin.auth.getUser(token);
    if (error || !user) return json({ ok: false, message: "يجب تسجيل الدخول." }, 401);
    await quota(admin, secret, "student-card", user.id, 100, 600);
    const body = await readBody(req, 2048);
    if (!Number.isSafeInteger(body.student_id) || body.student_id <= 0) throw new RequestError("الطالب غير صالح.");
    const scoped = createClient(url, anonKey, { global: { headers: { Authorization: authorization } },
      auth: { persistSession: false, autoRefreshToken: false } });
    const { data: cards, error: denied } = await scoped.rpc(body.reset === true ? "rotate_student_access_card_context" : "student_access_card_context", { p_student_id: body.student_id });
    if (denied || !cards?.[0]) return json({ ok: false, message: "لا تملك صلاحية لبطاقة هذا الطالب." }, 403);
    const card = cards[0];
    return json({ ok: true, full_name: card.full_name, user_number: card.user_number,
      access_code: await studentAccessCode(card.student_id, card.credential_version, secret) });
  } catch (error) {
    return json({ ok: false, message: error instanceof RequestError ? error.message : "تعذر تحميل بطاقة الدخول." },
      error instanceof RequestError ? error.status : 500);
  }
});

import { createClient } from "npm:@supabase/supabase-js@2.112.3";
import { clientAddress, quota, readBody, RequestError } from "../_shared/security.ts";
const headers = { "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Cache-Control": "no-store", "Content-Type": "application/json" };
function json(body: unknown, status = 200) { return new Response(JSON.stringify(body), { status, headers }); }
Deno.serve(async req => {
  if (req.method === "OPTIONS") return new Response("ok", { headers });
  if (req.method !== "POST") return json({ ok: false }, 405);
  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const secret = Deno.env.get("STUDENT_AUTH_SECRET");
  if (!url || !key || !secret) return json({ ok: false }, 503);
  try {
    const admin = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
    await quota(admin, secret, "support-global", "all", 100, 86400);
    await quota(admin, secret, "support-ip", clientAddress(req), 3, 600);
    const body = await readBody(req, 16384);
    if (body.website) throw new RequestError("الطلب غير صالح.");
    const phone = String(body.whatsapp || "").replace(/[٠-٩۰-۹]/g, c => String(c.charCodeAt(0) % 16)).replace(/\D/g, "");
    await quota(admin, secret, "support-phone", phone, 3, 3600);
    const { error } = await admin.rpc("submit_public_support_request", {
      p_name: String(body.name || "").trim() || null, p_whatsapp: phone,
      p_message: String(body.message || "").trim(), p_page_path: String(body.page_path || "/"),
    });
    if (error) {
      if (error.message.includes("SUPPORT_RATE_LIMIT")) throw new RequestError("وصلتنا رسالتك قبل قليل. حاول لاحقًا.", 429);
      throw new RequestError("تأكد من رقم الواتساب وتفاصيل الرسالة.");
    }
    return json({ ok: true });
  } catch (error) {
    return json({ ok: false, message: error instanceof RequestError ? error.message : "تعذر إرسال الرسالة الآن." },
      error instanceof RequestError ? error.status : 500);
  }
});

import { createClient } from "npm:@supabase/supabase-js@2.112.3";
import { clientAddress, quota, readBody, RequestError, studentAccessCode } from "../_shared/security.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    },
  });
}

function cleanName(value: unknown) {
  return String(value ?? "").trim().replace(/\s+/g, " ");
}

function studentAuthEmail(studentNumber: string) {
  const slug = studentNumber
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

  return `${slug}@students.sadiq.local`;
}

async function deriveStudentPassword(
  studentNumber: string,
  secret: string
) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(studentNumber)
  );

  const hex = Array.from(new Uint8Array(signature))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");

  return `Sd!${hex.slice(0, 32)}`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return json({ ok: false, message: "Method not allowed" }, 405);
  }

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
  const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const STUDENT_AUTH_SECRET = Deno.env.get("STUDENT_AUTH_SECRET");

  if (!SUPABASE_URL || !SERVICE_ROLE_KEY || !STUDENT_AUTH_SECRET) {
    return json(
      { ok: false, message: "Server configuration error" },
      500
    );
  }

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  let createdAuthUserId: string | null = null;
  let createdProfileId: number | null = null;

  try {
    await quota(admin, STUDENT_AUTH_SECRET, "register-global", "all", 100, 86400);
    await quota(admin, STUDENT_AUTH_SECRET, "register-ip", clientAddress(req), 5, 3600);
    const body = await readBody(req, 8192);

    const role = String(body?.role ?? "").trim();
    const fullName = cleanName(body?.full_name);
    const phone = String(body?.phone ?? "").trim() || null;
    const email =
      String(body?.email ?? "").trim().toLowerCase() || null;
    const password = String(body?.password ?? "");
    const inviteCode =
      String(body?.invite_code ?? "").trim().toUpperCase() || null;

    if (!["supervisor", "teacher", "student"].includes(role)) {
      return json(
        { ok: false, message: "نوع الحساب غير مسموح." },
        400
      );
    }

    if (fullName.length < 3 || fullName.length > 120 || (phone && phone.length > 30)) {
      return json(
        { ok: false, message: "الاسم الكامل غير صالح." },
        400
      );
    }

    if (role !== "student") {
      if (!email || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return json(
          { ok: false, message: "البريد الإلكتروني غير صالح." },
          400
        );
      }

      if (password.length < 12 || password.length > 128 || /^(.)(\1)+$/.test(password) || /^(password|123456|qwerty)/i.test(password)) {
        return json(
          {
            ok: false,
            message: "اختر كلمة مرور غير شائعة من 12 حرفًا على الأقل.",
          },
          400
        );
      }
      await quota(admin, STUDENT_AUTH_SECRET, "register-email", email, 3, 86400);
    }

    if (role === "supervisor") {
      if (!inviteCode) {
        return json(
          { ok: false, message: "رمز تفعيل المشرف مطلوب." },
          400
        );
      }

      const { data: invite, error: inviteError } = await admin
        .from("supervisor_invites")
        .select(
          "id, code, mosque_id, allow_create_mosque, is_active, expires_at, used_at"
        )
        .eq("code", inviteCode)
        .maybeSingle();

      if (inviteError) throw inviteError;

      const expired =
        invite?.expires_at &&
        new Date(invite.expires_at).getTime() <= Date.now();

      if (
        !invite ||
        !invite.is_active ||
        invite.used_at ||
        expired
      ) {
        return json(
          {
            ok: false,
            message: "رمز تفعيل المشرف غير صالح أو منتهي.",
          },
          400
        );
      }
    }

    const { data: numberData, error: numberError } = await admin.rpc(
      "generate_account_number",
      { p_role: role }
    );

    if (numberError) throw numberError;

    const userNumber = String(numberData);

    let authEmail = email;
    let authPassword = password;

    if (role === "student") {
      if (!STUDENT_AUTH_SECRET) {
        return json(
          {
            ok: false,
            message: "STUDENT_AUTH_SECRET غير مضبوط على الخادم.",
          },
          500
        );
      }

      authEmail = studentAuthEmail(userNumber);
      authPassword = await deriveStudentPassword(
        userNumber,
        STUDENT_AUTH_SECRET
      );
    }

    const { data: authData, error: authError } =
      await admin.auth.admin.createUser({
        email: authEmail!,
        password: authPassword,
        email_confirm: role === "student",
        user_metadata: {
          full_name: fullName,
          account_type: role,
        },
      });

    if (authError) {
      const message = String(authError.message || "").toLowerCase();

      if (message.includes("already") || message.includes("registered")) {
        return json(
          {
            ok: false,
            message: "يوجد حساب بهذا البريد الإلكتروني بالفعل.",
          },
          409
        );
      }

      throw authError;
    }

    createdAuthUserId = authData.user.id;

    const { data: profile, error: profileError } = await admin
      .from("profiles")
      .insert({
        role,
        user_number: userNumber,
        full_name: fullName,
        phone,
        password_plain: null,
        auth_user_id: createdAuthUserId,
        login_type: role === "student" ? "id" : "email",
        status: "active",
        is_active: true,
      })
      .select("id, role, user_number, full_name")
      .single();

    if (profileError) throw profileError;

    createdProfileId = Number(profile.id);

    let accessCode: string | null = null;
    if (role === "student") {
      const { data, error } = await admin.rpc("student_login_context", { p_user_number: userNumber });
      if (error || !data?.[0]) throw new Error("STUDENT_CREDENTIAL_UNAVAILABLE");
      accessCode = await studentAccessCode(profile.id, data[0].credential_version, STUDENT_AUTH_SECRET);
    } else {
      const { error } = await admin.auth.resend({ type: "signup", email: authEmail!,
        options: { emailRedirectTo: "https://sadiqh.vercel.app/login" } });
      if (error) throw new RequestError("تعذر إرسال رابط تأكيد البريد. حاول بعد قليل.", 503);
    }

    let supervisorInvite = null;

    if (role === "supervisor") {
      const { data, error } = await admin.rpc(
        "consume_supervisor_invite",
        {
          p_code: inviteCode,
          p_profile_id: profile.id,
        }
      );

      if (error) throw error;

      const consumed = Array.isArray(data) ? data[0] : null;

      if (!consumed) {
        throw new Error(
          "تم استخدام رمز المشرف قبل اكتمال التسجيل. استخدم رمزًا آخر."
        );
      }

      supervisorInvite = consumed;
    }

    return json({
      ok: true,
      role: profile.role,
      full_name: profile.full_name,
      user_number: profile.user_number,
      access_code: accessCode,
      confirmation_required: role !== "student",
      supervisor_invite: supervisorInvite,
    });
  } catch (error) {
    console.error("register-account failure:", error);

    if (createdProfileId) {
      await admin.from("profiles").delete().eq("id", createdProfileId);
    }

    if (createdAuthUserId) {
      await admin.auth.admin.deleteUser(createdAuthUserId);
    }

    return json(
      {
        ok: false,
        message:
          error instanceof RequestError
            ? error.message
            : "تعذر إنشاء الحساب.",
      },
      error instanceof RequestError ? error.status : 500
    );
  }
});

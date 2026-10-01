import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2.112.3";
import { clientAddress, codesEqual, normalizeCode, quota, readBody, RequestError, studentAccessCode } from "../_shared/security.ts";

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

async function findAuthUserByEmail(
  admin: SupabaseClient,
  email: string
) {
  const wanted = email.trim().toLowerCase();
  let page = 1;

  while (page <= 100) {
    const { data, error } = await admin.auth.admin.listUsers({
      page,
      perPage: 100,
    });

    if (error) throw error;

    const users = data?.users || [];

    const found = users.find(
      (user) =>
        String(user.email || "")
          .trim()
          .toLowerCase() === wanted
    );

    if (found) return found;

    if (users.length < 100) break;

    page += 1;
  }

  return null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: corsHeaders,
    });
  }

  if (req.method !== "POST") {
    return json(
      {
        ok: false,
        message: "Method not allowed",
      },
      405
    );
  }

  const SUPABASE_URL =
    Deno.env.get("SUPABASE_URL");

  const SUPABASE_ANON_KEY =
    Deno.env.get("SUPABASE_ANON_KEY");

  const SERVICE_ROLE_KEY =
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  const STUDENT_AUTH_SECRET =
    Deno.env.get("STUDENT_AUTH_SECRET");

  if (
    !SUPABASE_URL ||
    !SUPABASE_ANON_KEY ||
    !SERVICE_ROLE_KEY ||
    !STUDENT_AUTH_SECRET
  ) {
    return json(
      {
        ok: false,
        message: "Server configuration error",
      },
      500
    );
  }

  const admin = createClient(
    SUPABASE_URL,
    SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );

  const publicClient = createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );

  try {
    await quota(admin, STUDENT_AUTH_SECRET, "login-ip", clientAddress(req), 120, 600);
    const body = await readBody(req, 4096);

    const userNumber =
      String(body?.user_number ?? "")
        .replace(/[\u061C\u200B-\u200F\u202A-\u202E\u2066-\u2069\uFEFF]/g, "")
        .replace(/\s+/g, "")
        .trim()
        .toUpperCase();

    if (!userNumber || userNumber.length > 80) {
      return json(
        {
          ok: false,
          message:
            "رقم الطالب مطلوب.",
        },
        400
      );
    }

    await quota(admin, STUDENT_AUTH_SECRET, "login-account", userNumber, 8, 3600);
    const { data: contexts, error: contextError } = await admin.rpc("student_login_context", { p_user_number: userNumber });
    if (contextError) throw contextError;
    const context = contexts?.[0];
    const code = context ? await studentAccessCode(context.student_id, context.credential_version, STUDENT_AUTH_SECRET) : "00000000";
    if (!context || !codesEqual(code, normalizeCode(body?.access_code))) {
      return json({ ok: false, message: "بيانات دخول الطالب غير صحيحة. استخدم رمز الدخول الموجود في بطاقة الطالب." }, 401);
    }

    const {
      data: profile,
      error: profileError,
    } = await admin
      .from("profiles")
      .select(
        "id, role, user_number, full_name, status, is_active, auth_user_id"
      )
      .eq("user_number", userNumber)
      .eq("role", "student")
      .maybeSingle();

    if (profileError) throw profileError;

    if (
      !profile ||
      profile.status !== "active" ||
      profile.is_active === false
    ) {
      return json(
        {
          ok: false,
          message:
            "بيانات دخول الطالب غير صحيحة.",
        },
        401
      );
    }

    const email =
      studentAuthEmail(userNumber);

    const password =
      await deriveStudentPassword(
        userNumber,
        STUDENT_AUTH_SECRET
      );

    let authUserId =
      profile.auth_user_id || null;

    let upgraded = false;

    /*
     * =====================================================
     * LEGACY AUTO-UPGRADE
     * =====================================================
     * الطالب القديم الذي لا يملك auth_user_id يتم ترقيته
     * تلقائيًا بعد نجاح التحقق من رمز الدخول السري.
     */
    if (!authUserId) {
      const {
        data: created,
        error: createError,
      } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          role: "student",
          profile_id: profile.id,
          user_number: profile.user_number,
          full_name: profile.full_name,
        },
      });

      if (!createError && created?.user?.id) {
        authUserId = created.user.id;
      } else {
        /*
         * قد يكون مستخدم Auth قد أُنشئ سابقًا لكن
         * profile.auth_user_id لم يُربط به.
         */
        const existingAuthUser =
          await findAuthUserByEmail(
            admin,
            email
          );

        if (!existingAuthUser?.id) {
          console.error(
            "Legacy student create auth error:",
            createError
          );

          return json(
            {
              ok: false,
              message:
                "تعذر ترقية حساب الطالب تلقائيًا. راجع سجل Edge Function.",
            },
            409
          );
        }

        /*
         * حماية من ربط مستخدم Auth تابع لطالب آخر.
         */
        const {
          data: ownerProfile,
          error: ownerError,
        } = await admin
          .from("profiles")
          .select("id")
          .eq(
            "auth_user_id",
            existingAuthUser.id
          )
          .neq("id", profile.id)
          .maybeSingle();

        if (ownerError) throw ownerError;

        if (ownerProfile) {
          return json(
            {
              ok: false,
              message:
                "رقم الطالب مرتبط بحساب دخول آخر. يحتاج مراجعة الإدارة.",
            },
            409
          );
        }

        authUserId = existingAuthUser.id;

        /*
         * نضمن أن كلمة المرور الداخلية متوافقة مع
         * STUDENT_AUTH_SECRET الحالي.
         */
        const {
          error: repairError,
        } = await admin.auth.admin.updateUserById(
          authUserId,
          {
            email,
            password,
            email_confirm: true,
            user_metadata: {
              role: "student",
              profile_id: profile.id,
              user_number: profile.user_number,
              full_name: profile.full_name,
            },
          }
        );

        if (repairError) throw repairError;
      }

      /*
       * اربط حساب Auth بملف الطالب.
       * الشرط is null يمنع استبدال ربط حصل بالتزامن
       * من طلب آخر.
       */
      const {
        data: linkedRows,
        error: linkError,
      } = await admin
        .from("profiles")
        .update({
          auth_user_id: authUserId,
        })
        .eq("id", profile.id)
        .is("auth_user_id", null)
        .select("id, auth_user_id");

      if (linkError) throw linkError;

      if (!linkedRows?.length) {
        /*
         * طلب آخر قد يكون سبقنا في الترقية.
         * نقرأ الربط النهائي ونستخدمه.
         */
        const {
          data: refreshed,
          error: refreshError,
        } = await admin
          .from("profiles")
          .select("auth_user_id")
          .eq("id", profile.id)
          .single();

        if (refreshError) throw refreshError;

        authUserId =
          refreshed.auth_user_id ||
          authUserId;
      }

      upgraded = true;
    }

    /*
     * =====================================================
     * SIGN IN
     * =====================================================
     */
    let {
      data: sessionData,
      error: signInError,
    } =
      await publicClient.auth.signInWithPassword({
        email,
        password,
      });

    /*
     * إصلاح ذاتي عند وجود auth_user_id لكن بيانات Auth
     * القديمة لا تطابق البريد/السر الحالي.
     */
    if (
      (signInError || !sessionData.session) &&
      authUserId
    ) {
      const {
        error: repairError,
      } = await admin.auth.admin.updateUserById(
        authUserId,
        {
          email,
          password,
          email_confirm: true,
          user_metadata: {
            role: "student",
            profile_id: profile.id,
            user_number: profile.user_number,
            full_name: profile.full_name,
          },
        }
      );

      if (repairError) {
        console.error(
          "Student auth repair error:",
          repairError
        );
      } else {
        const retry =
          await publicClient.auth.signInWithPassword({
            email,
            password,
          });

        sessionData = retry.data;
        signInError = retry.error;
      }
    }

    if (
      signInError ||
      !sessionData?.session
    ) {
      console.error(
        "Student sign in error:",
        signInError
      );

      return json(
        {
          ok: false,
          message:
            "تعذر تسجيل دخول الطالب بهذا الحساب.",
        },
        401
      );
    }

    return json({
      ok: true,
      upgraded,
      access_token:
        sessionData.session.access_token,
      refresh_token:
        sessionData.session.refresh_token,
      expires_in:
        sessionData.session.expires_in,
      profile: {
        id: profile.id,
        full_name: profile.full_name,
        user_number: profile.user_number,
        role: profile.role,
      },
    });
  } catch (error) {
    console.error(
      "student-login failure:",
      error
    );

    return json(
      {
        ok: false,
        message:
          error instanceof RequestError
            ? error.message
            : "تعذر تسجيل الدخول.",
      },
      error instanceof RequestError ? error.status : 500
    );
  }
});

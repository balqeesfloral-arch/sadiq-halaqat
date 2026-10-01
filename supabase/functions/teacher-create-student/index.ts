import { createClient } from "npm:@supabase/supabase-js@2.112.3";
import { quota, readBody, RequestError, studentAccessCode } from "../_shared/security.ts";

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

function clean(value: unknown) {
  const text = String(value ?? "").trim();
  return text || null;
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
    const authHeader = req.headers.get("Authorization") || "";
    const token = authHeader.replace(/^Bearer\s+/i, "").trim();

    if (!token) {
      return json({ ok: false, message: "يجب تسجيل الدخول كمعلم." }, 401);
    }

    const {
      data: { user },
      error: userError,
    } = await admin.auth.getUser(token);

    if (userError || !user || !user.email_confirmed_at) {
      return json({ ok: false, message: "جلسة المعلم غير صالحة." }, 401);
    }

    const { data: teacher, error: teacherError } = await admin
      .from("profiles")
      .select("id, role, status, is_active")
      .eq("auth_user_id", user.id)
      .eq("role", "teacher")
      .maybeSingle();

    if (teacherError) throw teacherError;

    if (
      !teacher ||
      teacher.status !== "active" ||
      teacher.is_active === false
    ) {
      return json(
        { ok: false, message: "حساب المعلم غير مفعل." },
        403
      );
    }

    await quota(admin, STUDENT_AUTH_SECRET, "create-student", user.id, 30, 600);
    const body = await readBody(req);

    const fullName = clean(body?.full_name);
    const halaqaId = Number(body?.halaqa_id);

    if (!fullName || fullName.length > 120) {
      return json({ ok: false, message: "اسم الطالب مطلوب." }, 400);
    }

    if (!Number.isFinite(halaqaId) || halaqaId <= 0) {
      return json({ ok: false, message: "الحلقة مطلوبة." }, 400);
    }

    const { data: assignment, error: assignmentError } = await admin
      .from("teacher_halaqat")
      .select("halaqa_id")
      .eq("teacher_id", teacher.id)
      .eq("halaqa_id", halaqaId)
      .maybeSingle();

    if (assignmentError) throw assignmentError;

    if (!assignment) {
      return json(
        { ok: false, message: "لا تملك صلاحية إضافة طالب لهذه الحلقة." },
        403
      );
    }

    const { data: halaqa, error: halaqaError } = await admin
      .from("halaqat")
      .select("id, status, mosque_id")
      .eq("id", halaqaId)
      .maybeSingle();

    if (halaqaError) throw halaqaError;

    if (!halaqa || halaqa.status !== "active") {
      return json(
        { ok: false, message: "الحلقة غير متاحة حاليًا." },
        409
      );
    }

    const { data: mosque, error: mosqueError } = await admin
      .from("mosques")
      .select("id, status")
      .eq("id", halaqa.mosque_id)
      .maybeSingle();

    if (mosqueError) throw mosqueError;

    if (mosque && mosque.status && mosque.status !== "active") {
      return json(
        { ok: false, message: "المسجد غير نشط حاليًا." },
        409
      );
    }

    const { data: generatedNumber, error: numberError } = await admin.rpc(
      "generate_account_number",
      {
        p_role: "student",
      }
    );

    if (numberError) throw numberError;

    const userNumber = String(generatedNumber || "")
      .trim()
      .toUpperCase();

    if (!userNumber) {
      throw new Error("تعذر إنشاء رقم الطالب.");
    }

    const email = studentAuthEmail(userNumber);
    const password = await deriveStudentPassword(
      userNumber,
      STUDENT_AUTH_SECRET
    );

    const {
      data: authData,
      error: authCreateError,
    } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        role: "student",
        full_name: fullName,
        user_number: userNumber,
      },
    });

    if (authCreateError) throw authCreateError;
    if (!authData.user) throw new Error("تعذر إنشاء حساب دخول الطالب.");

    createdAuthUserId = authData.user.id;

    const profilePayload = {
      role: "student",
      user_number: userNumber,
      full_name: fullName,
      phone: clean(body?.phone),
      status: "active",
      auth_user_id: createdAuthUserId,
      login_type: "id",
      birth_date: clean(body?.birth_date),
      age:
        body?.age === null || body?.age === undefined
          ? null
          : Number(body.age),
      education_stage: clean(body?.education_stage),
      education_grade: clean(body?.education_grade),
      guardian_name: clean(body?.guardian_name),
      guardian_phone: clean(body?.guardian_phone),
      guardian_relation: clean(body?.guardian_relation),
      gender: clean(body?.gender),
      learning_goal: clean(body?.learning_goal),
      recitation_mode: clean(body?.recitation_mode),
      recitation_days: Array.isArray(body?.recitation_days)
        ? body.recitation_days
        : [],
      preferred_recitation_time: clean(body?.preferred_recitation_time),
      notes: clean(body?.notes),
      total_points: 0,
      is_active: true,
      nationality: clean(body?.nationality),
      residence_address: clean(body?.residence_address),
    };

    const { data: profile, error: profileError } = await admin
      .from("profiles")
      .insert(profilePayload)
      .select("id, full_name, user_number")
      .single();

    if (profileError) throw profileError;

    createdProfileId = Number(profile.id);

    const { error: linkError } = await admin
      .from("student_halaqat")
      .insert({
        student_id: createdProfileId,
        halaqa_id: halaqaId,
        teacher_id: teacher.id,
        start_date: new Date().toISOString().slice(0, 10),
        is_current: true,
      });

    if (linkError) throw linkError;

    const { data: contexts, error: contextError } = await admin.rpc("student_login_context", { p_user_number: userNumber });
    if (contextError || !contexts?.[0]) throw new Error("STUDENT_CREDENTIAL_UNAVAILABLE");
    const accessCode = await studentAccessCode(profile.id, contexts[0].credential_version, STUDENT_AUTH_SECRET);

    return json({
      ok: true,
      profile: {
        id: profile.id,
        full_name: profile.full_name,
        user_number: profile.user_number,
        access_code: accessCode,
      },
    });
  } catch (error) {
    console.error("teacher-create-student failure:", error);

    if (createdProfileId) {
      await admin
        .from("profiles")
        .delete()
        .eq("id", createdProfileId);
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
            : "تعذر إنشاء الطالب.",
      },
      error instanceof RequestError ? error.status : 500
    );
  }
});

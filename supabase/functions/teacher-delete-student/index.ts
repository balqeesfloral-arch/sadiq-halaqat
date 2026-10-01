import { createClient } from "npm:@supabase/supabase-js@2.112.3";

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

function isMissingResource(error: any) {
  const code = String(error?.code || "");
  const message = String(error?.message || "").toLowerCase();

  return (
    code === "42P01" ||
    code === "42703" ||
    code === "PGRST204" ||
    code === "PGRST205" ||
    message.includes("could not find the table") ||
    message.includes("does not exist") ||
    message.includes("could not find the")
  );
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

  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
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

    const body = await req.json();
    const studentId = Number(body?.student_id);

    if (!Number.isFinite(studentId) || studentId <= 0) {
      return json({ ok: false, message: "رقم الطالب الداخلي غير صالح." }, 400);
    }

    const { data: link, error: linkError } = await admin
      .from("student_halaqat")
      .select("id, halaqa_id")
      .eq("student_id", studentId)
      .eq("is_current", true)
      .maybeSingle();

    if (linkError) throw linkError;

    if (!link) {
      return json(
        { ok: false, message: "الطالب غير مرتبط بحلقة حالية." },
        404
      );
    }

    const { data: teacherLink, error: teacherLinkError } = await admin
      .from("teacher_halaqat")
      .select("id")
      .eq("teacher_id", teacher.id)
      .eq("halaqa_id", link.halaqa_id)
      .maybeSingle();

    if (teacherLinkError) throw teacherLinkError;

    if (!teacherLink) {
      return json(
        { ok: false, message: "لا تملك صلاحية حذف هذا الطالب." },
        403
      );
    }

    const { data: profile, error: profileError } = await admin
      .from("profiles")
      .select("id, role, auth_user_id, full_name, user_number")
      .eq("id", studentId)
      .eq("role", "student")
      .maybeSingle();

    if (profileError) throw profileError;
    if (!profile) {
      return json({ ok: false, message: "الطالب غير موجود." }, 404);
    }

    const cleanupTargets = [
      ["student_guardians", "student_id"],
      ["student_care_actions", "student_id"],
      ["student_communications", "student_id"],
      ["exam_results", "student_id"],
      ["exam_students", "student_id"],
      ["monthly_plans", "student_id"],
      ["monthly_progress", "student_id"],
      ["noorania_recitations", "student_id"],
      ["recitations", "student_id"],
      ["attendance", "student_id"],
      ["points_transactions", "student_id"],
      ["student_rewards", "student_id"],
      ["membership_requests", "requester_id"],
      ["student_halaqat", "student_id"],
    ] as const;

    for (const [table, column] of cleanupTargets) {
      const { error } = await admin
        .from(table)
        .delete()
        .eq(column, studentId);

      if (error && !isMissingResource(error)) {
        console.error(`cleanup ${table}:`, error);
        throw new Error(
          `تعذر حذف بيانات الطالب المرتبطة في ${table}: ${error.message}`
        );
      }
    }

    const { error: finalProfileError } = await admin
      .from("profiles")
      .delete()
      .eq("id", studentId)
      .eq("role", "student");

    if (finalProfileError) {
      throw new Error(
        `تعذر حذف ملف الطالب: ${finalProfileError.message}`
      );
    }

    let authWarning: string | null = null;

    if (profile.auth_user_id) {
      const { error: authDeleteError } =
        await admin.auth.admin.deleteUser(profile.auth_user_id);

      if (authDeleteError) {
        console.error("delete auth student:", authDeleteError);
        authWarning =
          "تم حذف ملف الطالب من النظام، لكن تعذر حذف مستخدم Auth تلقائيًا.";
      }
    }

    return json({
      ok: true,
      deleted: {
        id: profile.id,
        full_name: profile.full_name,
        user_number: profile.user_number,
      },
      warning: authWarning,
    });
  } catch (error) {
    console.error("teacher-delete-student failure:", error);

    return json(
      {
        ok: false,
        message:
          error instanceof Error
            ? error.message
            : "تعذر حذف الطالب.",
      },
      500
    );
  }
});

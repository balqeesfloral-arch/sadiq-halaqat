import { supabase } from "../lib/supabase";

/*
|--------------------------------------------------------------------------
| الطلاب داخل الحلقات
|--------------------------------------------------------------------------
*/

/**
 * جلب كل روابط الطلاب بالحلقات
 */
export async function getStudentHalaqaRelations({
  studentId,
  halaqaId,
  currentOnly = false,
} = {}) {
  let query = supabase
    .from("student_halaqat")
    .select("*")
    .order("start_date", {
      ascending: false,
    });

  if (studentId) {
    query = query.eq(
      "student_id",
      studentId
    );
  }

  if (halaqaId) {
    query = query.eq(
      "halaqa_id",
      halaqaId
    );
  }

  if (currentOnly) {
    query = query.eq(
      "is_current",
      true
    );
  }

  const { data, error } =
    await query;

  if (error) {
    throw new Error(
      `تعذر تحميل روابط الطلاب بالحلقات: ${error.message}`
    );
  }

  return data || [];
}

/**
 * جلب الحلقة الحالية لطالب
 */
export async function getCurrentStudentHalaqa(
  studentId
) {
  const { data, error } =
    await supabase
      .from("student_halaqat")
      .select("*")
      .eq("student_id", studentId)
      .eq("is_current", true)
      .maybeSingle();

  if (error) {
    throw new Error(
      `تعذر معرفة الحلقة الحالية للطالب: ${error.message}`
    );
  }

  return data;
}

/**
 * جلب طلاب الحلقة الحاليين
 */
export async function getCurrentHalaqaStudents(
  halaqaId
) {
  const { data, error } =
    await supabase
      .from("student_halaqat")
      .select("*")
      .eq("halaqa_id", halaqaId)
      .eq("is_current", true)
      .order("start_date", {
        ascending: true,
      });

  if (error) {
    throw new Error(
      `تعذر تحميل طلاب الحلقة: ${error.message}`
    );
  }

  return data || [];
}

/**
 * جلب تاريخ حلقات الطالب
 */
export async function getStudentHalaqaHistory(
  studentId
) {
  const { data, error } =
    await supabase
      .from("student_halaqat")
      .select("*")
      .eq("student_id", studentId)
      .order("start_date", {
        ascending: false,
      });

  if (error) {
    throw new Error(
      `تعذر تحميل تاريخ حلقات الطالب: ${error.message}`
    );
  }

  return data || [];
}

/*
|--------------------------------------------------------------------------
| إضافة / تعديل / إنهاء ارتباط الطالب
|--------------------------------------------------------------------------
*/

/**
 * ربط طالب بحلقة
 *
 * قبل إنشاء الرابط الجديد:
 * ننهي الرابط الحالي إن وجد.
 */
export async function assignStudentToHalaqa({
  studentId,
  halaqaId,
  teacherId = null,
  startDate,
} = {}) {
  if (!studentId || !halaqaId) {
    throw new Error(
      "يجب تحديد الطالب والحلقة"
    );
  }

  /*
   * إنهاء الارتباط الحالي
   */
  const { error: closeError } =
    await supabase
      .from("student_halaqat")
      .update({
        is_current: false,
        end_date:
          startDate ||
          new Date()
            .toISOString()
            .slice(0, 10),
      })
      .eq("student_id", studentId)
      .eq("is_current", true);

  if (closeError) {
    throw new Error(
      `تعذر إنهاء الحلقة السابقة للطالب: ${closeError.message}`
    );
  }

  /*
   * إنشاء الارتباط الجديد
   */
  const { data, error } =
    await supabase
      .from("student_halaqat")
      .insert([
        {
          student_id:
            studentId,

          halaqa_id:
            halaqaId,

          teacher_id:
            teacherId || null,

          start_date:
            startDate ||
            new Date()
              .toISOString()
              .slice(0, 10),

          is_current: true,
        },
      ])
      .select()
      .single();

  if (error) {
    throw new Error(
      `تعذر ربط الطالب بالحلقة: ${error.message}`
    );
  }

  return data;
}

/**
 * إنهاء ارتباط الطالب الحالي
 */
export async function endStudentHalaqa(
  relationId,
  endDate
) {
  const { data, error } =
    await supabase
      .from("student_halaqat")
      .update({
        is_current: false,
        end_date:
          endDate ||
          new Date()
            .toISOString()
            .slice(0, 10),
      })
      .eq("id", relationId)
      .select()
      .single();

  if (error) {
    throw new Error(
      `تعذر إنهاء ارتباط الطالب: ${error.message}`
    );
  }

  return data;
}

/**
 * حذف ارتباط طالب
 */
export async function deleteStudentHalaqaRelation(
  relationId
) {
  const { error } =
    await supabase
      .from("student_halaqat")
      .delete()
      .eq("id", relationId);

  if (error) {
    throw new Error(
      `تعذر حذف ارتباط الطالب بالحَلقة: ${error.message}`
    );
  }

  return true;
}

/*
|--------------------------------------------------------------------------
| المعلمون داخل الحلقات
|--------------------------------------------------------------------------
*/

/**
 * جلب كل روابط المعلمين بالحلقات
 */
export async function getTeacherHalaqaRelations({
  teacherId,
  halaqaId,
  role,
} = {}) {
  let query = supabase
    .from("teacher_halaqat")
    .select("*")
    .order("created_at", {
      ascending: false,
    });

  if (teacherId) {
    query = query.eq(
      "teacher_id",
      teacherId
    );
  }

  if (halaqaId) {
    query = query.eq(
      "halaqa_id",
      halaqaId
    );
  }

  if (role) {
    query = query.eq(
      "role",
      role
    );
  }

  const { data, error } =
    await query;

  if (error) {
    throw new Error(
      `تعذر تحميل روابط المعلمين بالحلقات: ${error.message}`
    );
  }

  return data || [];
}

/**
 * جلب معلمي الحلقة
 */
export async function getHalaqaTeachers(
  halaqaId
) {
  const { data, error } =
    await supabase
      .from("teacher_halaqat")
      .select("*")
      .eq("halaqa_id", halaqaId)
      .order("role");

  if (error) {
    throw new Error(
      `تعذر تحميل معلمي الحلقة: ${error.message}`
    );
  }

  return data || [];
}

/**
 * جلب حلقات المعلم
 */
export async function getTeacherHalaqat(
  teacherId
) {
  const { data, error } =
    await supabase
      .from("teacher_halaqat")
      .select("*")
      .eq("teacher_id", teacherId)
      .order("created_at", {
        ascending: false,
      });

  if (error) {
    throw new Error(
      `تعذر تحميل حلقات المعلم: ${error.message}`
    );
  }

  return data || [];
}

/**
 * ربط معلم بحلقة
 */
export async function assignTeacherToHalaqa({
  teacherId,
  halaqaId,
  role = "main",
} = {}) {
  if (!teacherId || !halaqaId) {
    throw new Error(
      "يجب تحديد المعلم والحلقة"
    );
  }

  const { data, error } =
    await supabase
      .from("teacher_halaqat")
      .insert([
        {
          teacher_id:
            teacherId,

          halaqa_id:
            halaqaId,

          role,
        },
      ])
      .select()
      .single();

  if (error) {
    throw new Error(
      `تعذر ربط المعلم بالحلقة: ${error.message}`
    );
  }

  return data;
}

/**
 * تعديل نوع ارتباط المعلم
 */
export async function updateTeacherHalaqaRole(
  relationId,
  role
) {
  const { data, error } =
    await supabase
      .from("teacher_halaqat")
      .update({
        role,
      })
      .eq("id", relationId)
      .select()
      .single();

  if (error) {
    throw new Error(
      `تعذر تعديل نوع ارتباط المعلم: ${error.message}`
    );
  }

  return data;
}

/**
 * حذف ارتباط المعلم
 */
export async function deleteTeacherHalaqaRelation(
  relationId
) {
  const { error } =
    await supabase
      .from("teacher_halaqat")
      .delete()
      .eq("id", relationId);

  if (error) {
    throw new Error(
      `تعذر حذف ارتباط المعلم: ${error.message}`
    );
  }

  return true;
}

/*
|--------------------------------------------------------------------------
| بيانات مركبة للتقارير
|--------------------------------------------------------------------------
*/

/**
 * جلب العلاقة الحالية لطالب
 * مع بيانات الحلقة والمعلم
 */
export async function getStudentCurrentContext(
  studentId
) {
  const relation =
    await getCurrentStudentHalaqa(
      studentId
    );

  if (!relation) {
    return null;
  }

  const [
    halaqaResult,
    teacherResult,
  ] = await Promise.all([
    supabase
      .from("halaqat")
      .select("*")
      .eq("id", relation.halaqa_id)
      .maybeSingle(),

    relation.teacher_id
      ? supabase
          .from("profiles")
          .select(
            "id, full_name, user_number"
          )
          .eq(
            "id",
            relation.teacher_id
          )
          .eq("role", "teacher")
          .maybeSingle()
      : Promise.resolve({
          data: null,
          error: null,
        }),
  ]);

  if (halaqaResult.error) {
    throw new Error(
      `تعذر تحميل بيانات الحلقة: ${halaqaResult.error.message}`
    );
  }

  if (teacherResult.error) {
    throw new Error(
      `تعذر تحميل بيانات المعلم: ${teacherResult.error.message}`
    );
  }

  return {
    relation,

    halaqa:
      halaqaResult.data,

    teacher:
      teacherResult.data,
  };
}

/**
 * جلب الطلاب والمعلمين المرتبطين بحلقة
 */
export async function getHalaqaContext(
  halaqaId
) {
  const [
    students,
    teachers,
    halaqa,
  ] = await Promise.all([
    getCurrentHalaqaStudents(
      halaqaId
    ),

    getHalaqaTeachers(
      halaqaId
    ),

    supabase
      .from("halaqat")
      .select("*")
      .eq("id", halaqaId)
      .maybeSingle(),
  ]);

  if (halaqa.error) {
    throw new Error(
      `تعذر تحميل بيانات الحلقة: ${halaqa.error.message}`
    );
  }

  return {
    halaqa:
      halaqa.data,

    students,

    teachers,
  };
}
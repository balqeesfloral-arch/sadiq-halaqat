import { supabase } from "../lib/supabase";

/**
 * جلب التسميعات مع الفلاتر
 */
export async function getRecitations({
  fromDate,
  toDate,
  halaqaId,
  studentId,
} = {}) {
  let query = supabase
    .from("recitations")
    .select("*")
    .order("recitation_date", {
      ascending: false,
    });

  if (fromDate) {
    query = query.gte(
      "recitation_date",
      fromDate
    );
  }

  if (toDate) {
    query = query.lte(
      "recitation_date",
      toDate
    );
  }

  if (halaqaId) {
    query = query.eq(
      "halaqa_id",
      halaqaId
    );
  }

  if (studentId) {
    query = query.eq(
      "student_id",
      studentId
    );
  }

  const { data, error } =
    await query;

  if (error) {
    throw new Error(
      `تعذر تحميل التسميعات: ${error.message}`
    );
  }

  return data || [];
}

/**
 * جلب تسميعات طالب
 */
export async function getStudentRecitations(
  studentId,
  options = {}
) {
  return getRecitations({
    ...options,
    studentId,
  });
}

/**
 * جلب تسميعات حلقة
 */
export async function getHalaqaRecitations(
  halaqaId,
  options = {}
) {
  return getRecitations({
    ...options,
    halaqaId,
  });
}

/**
 * جلب تسميع واحد
 */
export async function getRecitationById(
  recitationId
) {
  const { data, error } =
    await supabase
      .from("recitations")
      .select("*")
      .eq("id", recitationId)
      .maybeSingle();

  if (error) {
    throw new Error(
      `تعذر تحميل التسميع: ${error.message}`
    );
  }

  return data;
}

/**
 * إضافة تسميع
 */
export async function createRecitation(
  recitation
) {
  const payload = {
    student_id:
      recitation.student_id,

    halaqa_id:
      recitation.halaqa_id,

    recitation_date:
      recitation.recitation_date,

    from_surah:
      recitation.from_surah ||
      null,

    from_ayah:
      recitation.from_ayah ||
      null,

    to_surah:
      recitation.to_surah ||
      null,

    to_ayah:
      recitation.to_ayah ||
      null,

    notes:
      recitation.notes ||
      null,

    review_surah:
      recitation.review_surah ||
      null,

    review_from_ayah:
      recitation.review_from_ayah ||
      null,

    review_to_ayah:
      recitation.review_to_ayah ||
      null,

    review_to_surah:
      recitation.review_to_surah ||
      null,

    next_surah:
      recitation.next_surah ||
      null,

    next_from_ayah:
      recitation.next_from_ayah ||
      null,

    next_to_ayah:
      recitation.next_to_ayah ||
      null,

    next_to_surah:
      recitation.next_to_surah ||
      null,

    next2_surah:
      recitation.next2_surah ||
      null,

    next2_from_ayah:
      recitation.next2_from_ayah ||
      null,

    next2_to_ayah:
      recitation.next2_to_ayah ||
      null,

    next2_to_surah:
      recitation.next2_to_surah ||
      null,

    review_evaluation:
      recitation.review_evaluation ||
      null,

    lesson_evaluation:
      recitation.lesson_evaluation ||
      null,

    next_evaluation:
      recitation.next_evaluation ||
      null,

    next2_evaluation:
      recitation.next2_evaluation ||
      null,

    points:
      Number(recitation.points || 0),
  };

  const { data, error } =
    await supabase
      .from("recitations")
      .insert([payload])
      .select()
      .single();

  if (error) {
    throw new Error(
      `تعذر تسجيل التسميع: ${error.message}`
    );
  }

  return data;
}

/**
 * تعديل تسميع
 */
export async function updateRecitation(
  recitationId,
  updates
) {
  const { data, error } =
    await supabase
      .from("recitations")
      .update(updates)
      .eq("id", recitationId)
      .select()
      .single();

  if (error) {
    throw new Error(
      `تعذر تعديل التسميع: ${error.message}`
    );
  }

  return data;
}

/**
 * حذف تسميع
 */
export async function deleteRecitation(
  recitationId
) {
  const { error } =
    await supabase
      .from("recitations")
      .delete()
      .eq("id", recitationId);

  if (error) {
    throw new Error(
      `تعذر حذف التسميع: ${error.message}`
    );
  }

  return true;
}

/**
 * حساب ملخص التسميعات
 */
export function calculateRecitationSummary(
  records = []
) {
  const totalPoints =
    records.reduce(
      (sum, record) =>
        sum +
        Number(record.points || 0),
      0
    );

  const dates = records
    .map(
      (record) =>
        record.recitation_date
    )
    .filter(Boolean)
    .sort();

  return {
    count: records.length,
    totalPoints,
    averagePoints:
      records.length > 0
        ? Math.round(
            totalPoints /
              records.length
          )
        : 0,
    firstRecitation:
      dates[0] || null,
    lastRecitation:
      dates[dates.length - 1] ||
      null,
  };
}
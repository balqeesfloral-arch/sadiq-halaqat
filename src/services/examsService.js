import { supabase } from "../lib/supabase";

/**
 * جلب الاختبارات
 */
export async function getExams({
  halaqaId,
  examType,
  fromDate,
  toDate,
} = {}) {
  let query = supabase
    .from("exams")
    .select("*")
    .order("exam_date", {
      ascending: false,
    });

  if (halaqaId) {
    query = query.eq(
      "halaqa_id",
      halaqaId
    );
  }

  if (examType) {
    query = query.eq(
      "exam_type",
      examType
    );
  }

  if (fromDate) {
    query = query.gte(
      "exam_date",
      fromDate
    );
  }

  if (toDate) {
    query = query.lte(
      "exam_date",
      toDate
    );
  }

  const { data, error } =
    await query;

  if (error) {
    throw new Error(
      `تعذر تحميل الاختبارات: ${error.message}`
    );
  }

  return data || [];
}

/**
 * جلب اختبار واحد
 */
export async function getExamById(
  examId
) {
  const { data, error } =
    await supabase
      .from("exams")
      .select("*")
      .eq("id", examId)
      .maybeSingle();

  if (error) {
    throw new Error(
      `تعذر تحميل الاختبار: ${error.message}`
    );
  }

  return data;
}

/**
 * إنشاء اختبار
 */
export async function createExam(
  exam
) {
  const { data, error } =
    await supabase
      .from("exams")
      .insert([
        {
          title: exam.title,
          exam_type:
            exam.exam_type,
          halaqa_id:
            exam.halaqa_id,
          exam_date:
            exam.exam_date,
          notes:
            exam.notes || null,
          created_by:
            exam.created_by || null,
        },
      ])
      .select()
      .single();

  if (error) {
    throw new Error(
      `تعذر إنشاء الاختبار: ${error.message}`
    );
  }

  return data;
}

/**
 * تعديل اختبار
 */
export async function updateExam(
  examId,
  updates
) {
  const { data, error } =
    await supabase
      .from("exams")
      .update(updates)
      .eq("id", examId)
      .select()
      .single();

  if (error) {
    throw new Error(
      `تعذر تعديل الاختبار: ${error.message}`
    );
  }

  return data;
}

/**
 * حذف اختبار
 */
export async function deleteExam(
  examId
) {
  const { error } =
    await supabase
      .from("exams")
      .delete()
      .eq("id", examId);

  if (error) {
    throw new Error(
      `تعذر حذف الاختبار: ${error.message}`
    );
  }

  return true;
}

/**
 * جلب نتائج اختبار
 */
export async function getExamResults(
  examId
) {
  const { data, error } =
    await supabase
      .from("exam_results")
      .select("*")
      .eq("exam_id", examId)
      .order("score", {
        ascending: false,
      });

  if (error) {
    throw new Error(
      `تعذر تحميل نتائج الاختبار: ${error.message}`
    );
  }

  return data || [];
}

/**
 * جلب نتائج طالب
 */
export async function getStudentExamResults(
  studentId
) {
  const { data, error } =
    await supabase
      .from("exam_results")
      .select("*")
      .eq("student_id", studentId)
      .order("created_at", {
        ascending: false,
      });

  if (error) {
    throw new Error(
      `تعذر تحميل نتائج الطالب: ${error.message}`
    );
  }

  return data || [];
}

/**
 * تسجيل نتيجة اختبار
 */
export async function createExamResult(
  result
) {
  const { data, error } =
    await supabase
      .from("exam_results")
      .insert([
        {
          exam_id:
            result.exam_id,
          student_id:
            result.student_id,
          score:
            result.score ?? null,
          notes:
            result.notes || null,
        },
      ])
      .select()
      .single();

  if (error) {
    throw new Error(
      `تعذر تسجيل نتيجة الاختبار: ${error.message}`
    );
  }

  return data;
}

/**
 * تعديل نتيجة
 */
export async function updateExamResult(
  resultId,
  updates
) {
  const { data, error } =
    await supabase
      .from("exam_results")
      .update(updates)
      .eq("id", resultId)
      .select()
      .single();

  if (error) {
    throw new Error(
      `تعذر تعديل نتيجة الاختبار: ${error.message}`
    );
  }

  return data;
}

/**
 * حذف نتيجة
 */
export async function deleteExamResult(
  resultId
) {
  const { error } =
    await supabase
      .from("exam_results")
      .delete()
      .eq("id", resultId);

  if (error) {
    throw new Error(
      `تعذر حذف نتيجة الاختبار: ${error.message}`
    );
  }

  return true;
}

/**
 * ملخص نتائج الاختبار
 */
export function calculateExamSummary(
  results = []
) {
  const scores = results
    .map((item) =>
      Number(item.score)
    )
    .filter(
      (score) =>
        Number.isFinite(score)
    );

  if (!scores.length) {
    return {
      total: results.length,
      average: 0,
      highest: 0,
      lowest: 0,
    };
  }

  const total = scores.reduce(
    (sum, score) =>
      sum + score,
    0
  );

  return {
    total: results.length,
    average: Math.round(
      (total / scores.length) *
        10
    ) / 10,
    highest: Math.max(
      ...scores
    ),
    lowest: Math.min(
      ...scores
    ),
  };
}
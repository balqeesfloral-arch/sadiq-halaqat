import { supabase } from "../lib/supabase";

/**
 * جلب سجلات الحضور
 */
export async function getAttendance({
  fromDate,
  toDate,
  halaqaId,
  studentId,
} = {}) {
  let query = supabase
    .from("attendance")
    .select("*")
    .order("attendance_date", {
      ascending: false,
    });

  if (fromDate) {
    query = query.gte(
      "attendance_date",
      fromDate
    );
  }

  if (toDate) {
    query = query.lte(
      "attendance_date",
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
      `تعذر تحميل سجلات الحضور: ${error.message}`
    );
  }

  return data || [];
}

/**
 * جلب حضور طالب
 */
export async function getStudentAttendance(
  studentId,
  options = {}
) {
  return getAttendance({
    ...options,
    studentId,
  });
}

/**
 * جلب حضور حلقة
 */
export async function getHalaqaAttendance(
  halaqaId,
  options = {}
) {
  return getAttendance({
    ...options,
    halaqaId,
  });
}

/**
 * إضافة سجل حضور
 */
export async function createAttendance(
  attendance
) {
  const { data, error } =
    await supabase
      .from("attendance")
      .insert([
        {
          student_id:
            attendance.student_id,

          halaqa_id:
            attendance.halaqa_id,

          attendance_date:
            attendance.attendance_date,

          status:
            attendance.status,

          notes:
            attendance.notes || null,

          recorded_by:
            attendance.recorded_by || null,
        },
      ])
      .select()
      .single();

  if (error) {
    throw new Error(
      `تعذر تسجيل الحضور: ${error.message}`
    );
  }

  return data;
}

/**
 * تعديل سجل حضور
 */
export async function updateAttendance(
  attendanceId,
  updates
) {
  const { data, error } =
    await supabase
      .from("attendance")
      .update(updates)
      .eq("id", attendanceId)
      .select()
      .single();

  if (error) {
    throw new Error(
      `تعذر تعديل سجل الحضور: ${error.message}`
    );
  }

  return data;
}

/**
 * حذف سجل حضور
 */
export async function deleteAttendance(
  attendanceId
) {
  const { error } =
    await supabase
      .from("attendance")
      .delete()
      .eq("id", attendanceId);

  if (error) {
    throw new Error(
      `تعذر حذف سجل الحضور: ${error.message}`
    );
  }

  return true;
}

/**
 * حساب ملخص حضور طالب
 */
export function calculateAttendanceSummary(
  records = []
) {
  const summary = {
    total: records.length,
    present: 0,
    absent: 0,
    late: 0,
    excused: 0,
  };

  records.forEach((record) => {
    if (
      record.status === "present"
    ) {
      summary.present++;
    } else if (
      record.status === "absent"
    ) {
      summary.absent++;
    } else if (
      record.status === "late"
    ) {
      summary.late++;
    } else if (
      record.status === "excused"
    ) {
      summary.excused++;
    }
  });

  const effectiveTotal =
    summary.total -
    summary.excused;

  summary.attendanceRate =
    effectiveTotal > 0
      ? Math.round(
          ((summary.present +
            summary.late) /
            effectiveTotal) *
            100
        )
      : 0;

  return summary;
}
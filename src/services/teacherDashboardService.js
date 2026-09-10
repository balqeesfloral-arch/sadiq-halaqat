import { supabase } from "../lib/supabase";

export async function getTeacherDashboardData(
  teacherId
) {
  try {
const today = new Date()
  .toISOString()
  .split("T")[0];

    // =====================
    // حلقات المعلم
    // =====================

    const { data: teacherHalaqat } =
      await supabase
        .from("teacher_halaqat")
        .select(`
          halaqa_id,
          halaqat(
            id,
            name,
            status,
            mosque_id
          )
        `)
        .eq("teacher_id", teacherId);

    const halaqaIds =
      teacherHalaqat?.map(
        (h) => h.halaqa_id
      ) || [];

    // =====================
    // الطلاب
    // =====================

    const { data: students } =
      await supabase
        .from("student_halaqat")
        .select(`
          *,
          profiles(
            id,
            full_name,
            total_points,
            memorized_parts,
            current_surah
          )
        `)
        .in("halaqa_id", halaqaIds);

    const studentIds =
      students?.map(
        (s) => s.student_id
      ) || [];

    // =====================
    // حضور اليوم
    // =====================

    const {
      data: todayAttendance,
    } = await supabase
      .from("attendance")
      .select("*")
      .in("halaqa_id", halaqaIds)
      .eq("attendance_date", today);

    // =====================
    // تسميعات اليوم
    // =====================

    const {
      data: todayRecitations,
    } = await supabase
      .from("recitations")
      .select("*")
      .in("halaqa_id", halaqaIds)
      .eq("recitation_date", today);

    // =====================
    // آخر التسميعات
    // =====================



    // =====================
    // الاختبارات
    // =====================

    const { data: exams } =
      await supabase
        .from("exams")
        .select("*")
        .eq("teacher_id", teacherId);

    // =====================
    // الإنجاز الشهري
    // =====================

    const {
      data: monthlyProgress,
    } = await supabase
      .from("monthly_progress")
      .select("*")
      .eq("teacher_id", teacherId);

const { data: latestRecitations } =
  await supabase
    .from("recitations")
    .select(`
      *,
      profiles (
        full_name
      )
    `)
    .in(
      "student_id",
      students.map(
        (s) => s.student_id
      )
    )
    .order(
      "recitation_date",
      {
        ascending: false,
      }
    )
    .limit(20);

return {
  teacherHalaqat,
  students,

  attendance:
    todayAttendance || [],

  recitations:
    todayRecitations || [],

  latestRecitations:
    latestRecitations || [],

  exams:
    exams || [],

  monthlyProgress:
    monthlyProgress || [],
};
  } catch (error) {
    console.error(error);

    return null;
  }
}
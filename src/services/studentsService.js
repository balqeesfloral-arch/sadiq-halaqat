import { supabase } from "../lib/supabase";

/**
 * جلب جميع الطلاب
 */
export async function getStudents() {
  const { data, error } = await supabase
    .from("profiles")
    .select(`
      id,
      full_name,
      user_number,
      phone,
      status,
      birth_date,
      education_stage,
      education_grade,
      guardian_name,
      guardian_phone,
      guardian_relation,
      gender,
      learning_goal,
      program_type,
      quran_level,
      memorized_parts,
      current_surah,
      current_page,
      recitation_mode,
      recitation_days,
      preferred_recitation_time,
      registration_date,
      notes
    `)
    .eq("role", "student")
    .order("full_name");

  if (error) {
    throw new Error(
      `تعذر تحميل الطلاب: ${error.message}`
    );
  }

  return data || [];
}

/**
 * جلب طالب واحد
 */
export async function getStudentById(
  studentId
) {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", studentId)
    .eq("role", "student")
    .maybeSingle();

  if (error) {
    throw new Error(
      `تعذر تحميل بيانات الطالب: ${error.message}`
    );
  }

  return data;
}

/**
 * إضافة طالب
 */
export async function createStudent(
  student
) {
  const { data, error } = await supabase
    .from("profiles")
    .insert([
      {
        ...student,
        role: "student",
      },
    ])
    .select()
    .single();

  if (error) {
    throw new Error(
      `تعذر إضافة الطالب: ${error.message}`
    );
  }

  return data;
}

/**
 * تعديل طالب
 */
export async function updateStudent(
  studentId,
  updates
) {
  const { data, error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", studentId)
    .eq("role", "student")
    .select()
    .single();

  if (error) {
    throw new Error(
      `تعذر تعديل بيانات الطالب: ${error.message}`
    );
  }

  return data;
}

/**
 * تغيير حالة الطالب
 */
export async function updateStudentStatus(
  studentId,
  status
) {
  const { data, error } = await supabase
    .from("profiles")
    .update({
      status,
    })
    .eq("id", studentId)
    .eq("role", "student")
    .select()
    .single();

  if (error) {
    throw new Error(
      `تعذر تغيير حالة الطالب: ${error.message}`
    );
  }

  return data;
}

/**
 * حذف طالب
 */
export async function deleteStudent(
  studentId
) {
  const { error } = await supabase
    .from("profiles")
    .delete()
    .eq("id", studentId)
    .eq("role", "student");

  if (error) {
    throw new Error(
      `تعذر حذف الطالب: ${error.message}`
    );
  }

  return true;
}
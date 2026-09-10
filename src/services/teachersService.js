import { supabase } from "../lib/supabase";

/**
 * جلب جميع المعلمين
 */
export async function getTeachers() {
  const { data, error } = await supabase
    .from("profiles")
    .select(`
      id,
      full_name,
      user_number,
      phone,
      status,
      birth_date,
      gender,
      notes,
      created_at
    `)
    .eq("role", "teacher")
    .order("full_name");

  if (error) {
    throw new Error(
      `تعذر تحميل المعلمين: ${error.message}`
    );
  }

  return data || [];
}

/**
 * جلب معلم واحد
 */
export async function getTeacherById(
  teacherId
) {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", teacherId)
    .eq("role", "teacher")
    .maybeSingle();

  if (error) {
    throw new Error(
      `تعذر تحميل بيانات المعلم: ${error.message}`
    );
  }

  return data;
}

/**
 * إضافة معلم
 */
export async function createTeacher(
  teacher
) {
  const { data, error } = await supabase
    .from("profiles")
    .insert([
      {
        ...teacher,
        role: "teacher",
      },
    ])
    .select()
    .single();

  if (error) {
    throw new Error(
      `تعذر إضافة المعلم: ${error.message}`
    );
  }

  return data;
}

/**
 * تعديل بيانات المعلم
 */
export async function updateTeacher(
  teacherId,
  updates
) {
  const { data, error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", teacherId)
    .eq("role", "teacher")
    .select()
    .single();

  if (error) {
    throw new Error(
      `تعذر تعديل بيانات المعلم: ${error.message}`
    );
  }

  return data;
}

/**
 * تغيير حالة المعلم
 */
export async function updateTeacherStatus(
  teacherId,
  status
) {
  const { data, error } = await supabase
    .from("profiles")
    .update({
      status,
    })
    .eq("id", teacherId)
    .eq("role", "teacher")
    .select()
    .single();

  if (error) {
    throw new Error(
      `تعذر تغيير حالة المعلم: ${error.message}`
    );
  }

  return data;
}

/**
 * حذف معلم
 */
export async function deleteTeacher(
  teacherId
) {
  const { error } = await supabase
    .from("profiles")
    .delete()
    .eq("id", teacherId)
    .eq("role", "teacher");

  if (error) {
    throw new Error(
      `تعذر حذف المعلم: ${error.message}`
    );
  }

  return true;
}
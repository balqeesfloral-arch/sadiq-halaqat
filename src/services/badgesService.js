import { supabase } from "../lib/supabase";

/**
 * جلب جميع الأوسمة
 */
export async function getBadges() {
  const { data, error } =
    await supabase
      .from("badges")
      .select("*")
      .order("name");

  if (error) {
    throw new Error(
      `تعذر تحميل الأوسمة: ${error.message}`
    );
  }

  return data || [];
}

/**
 * إنشاء وسام
 */
export async function createBadge(
  badge
) {
  const { data, error } =
    await supabase
      .from("badges")
      .insert([
        {
          name:
            badge.name,
          description:
            badge.description ||
            null,
          icon:
            badge.icon ||
            null,
        },
      ])
      .select()
      .single();

  if (error) {
    throw new Error(
      `تعذر إنشاء الوسام: ${error.message}`
    );
  }

  return data;
}

/**
 * تعديل وسام
 */
export async function updateBadge(
  badgeId,
  updates
) {
  const { data, error } =
    await supabase
      .from("badges")
      .update(updates)
      .eq("id", badgeId)
      .select()
      .single();

  if (error) {
    throw new Error(
      `تعذر تعديل الوسام: ${error.message}`
    );
  }

  return data;
}

/**
 * حذف وسام
 */
export async function deleteBadge(
  badgeId
) {
  const { error } =
    await supabase
      .from("badges")
      .delete()
      .eq("id", badgeId);

  if (error) {
    throw new Error(
      `تعذر حذف الوسام: ${error.message}`
    );
  }

  return true;
}

/**
 * أوسمة طالب
 */
export async function getStudentBadges(
  studentId
) {
  const { data, error } =
    await supabase
      .from("student_badges")
      .select("*")
      .eq(
        "student_id",
        studentId
      )
      .order("awarded_at", {
        ascending: false,
      });

  if (error) {
    throw new Error(
      `تعذر تحميل أوسمة الطالب: ${error.message}`
    );
  }

  return data || [];
}

/**
 * منح وسام لطالب
 */
export async function awardBadge({
  studentId,
  badgeId,
  awardedBy,
  notes,
} = {}) {
  const { data, error } =
    await supabase
      .from("student_badges")
      .insert([
        {
          student_id:
            studentId,
          badge_id:
            badgeId,
          awarded_by:
            awardedBy || null,
          notes:
            notes || null,
        },
      ])
      .select()
      .single();

  if (error) {
    throw new Error(
      `تعذر منح الوسام: ${error.message}`
    );
  }

  return data;
}

/**
 * إزالة وسام من طالب
 */
export async function removeStudentBadge(
  studentBadgeId
) {
  const { error } =
    await supabase
      .from("student_badges")
      .delete()
      .eq(
        "id",
        studentBadgeId
      );

  if (error) {
    throw new Error(
      `تعذر إزالة الوسام: ${error.message}`
    );
  }

  return true;
}
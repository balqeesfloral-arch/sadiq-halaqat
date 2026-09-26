import { supabase } from "../lib/supabase";

const MESSAGES = {
  HM_AUTH_REQUIRED: "انتهت جلسة الدخول. سجّل الدخول مرة أخرى.",
  HM_FORBIDDEN: "ليس لديك صلاحية إدارة هذه الحلقة.",
  HM_HALAQA_NOT_FOUND: "الحلقة غير موجودة أو غير متاحة لحسابك.",
  HM_INVALID_ROLE: "اختر دور المعلم: رئيسي أو مساعد.",
  HM_TEACHER_UNAVAILABLE: "المعلم غير نشط أو غير متاح ضمن نطاق المسجد.",
  HM_TEACHER_NOT_LINKED: "اختر معلمًا نشطًا مرتبطًا بهذه الحلقة.",
  HM_EDIT_LINKED_TEACHER_ONLY: "يمكن تعديل بيانات المعلم بعد ربطه بالحلقة.",
  HM_INVALID_PROFILE: "أدخل اسمًا صحيحًا للمعلم، وتحقق من رقم الجوال.",
  HM_WRITE_DENIED: "لم تسمح صلاحيات حسابك بإتمام الحفظ. لم تُحفظ أي تغييرات.",
  HM_SELECT_STUDENTS: "حدد طالبًا واحدًا على الأقل.",
  HM_STUDENTS_CHANGED: "تغيّر ربط أحد الطلاب. حدّث الصفحة ثم أعد المحاولة.",
  HM_LINK_CHANGED: "تغيّر ربط المعلم. حدّث الصفحة ثم أعد المحاولة.",
  HM_CHOOSE_REPLACEMENT: "حدد معلمًا بديلًا للطلاب، أو اختر إلغاء إسنادهم صراحةً.",
};

function positiveId(value) {
  const id = Number(value);
  if (!Number.isSafeInteger(id) || id <= 0) throw new Error("معرّف السجل غير صحيح.");
  return id;
}

async function call(name, params) {
  const { data, error } = await supabase.rpc(name, params);
  if (error) {
    const key = Object.keys(MESSAGES).find((item) => String(error.message || "").includes(item));
    if (key) throw new Error(MESSAGES[key]);
    if (error.code === "42501") throw new Error(MESSAGES.HM_WRITE_DENIED);
    if (error.code === "PGRST202" || error.code === "42883") {
      throw new Error("ميزة إدارة الحلقات تحتاج تحديثًا. تواصل مع مدير النظام.");
    }
    if (error.code === "23505") throw new Error("هذا الربط موجود بالفعل. حدّث الصفحة.");
    throw new Error("تعذر إتمام العملية. تحقق من الاتصال ثم أعد المحاولة.");
  }
  return data;
}

export async function loadHalaqaManagement(halaqaId) {
  const data = await call("sadiq_halaqa_workspace", { p_halaqa_id: positiveId(halaqaId) });
  if (!data?.halaqa || !Array.isArray(data.teachers) || !Array.isArray(data.students)) {
    throw new Error("تعذر قراءة بيانات الحلقة.");
  }
  return { ...data, available_teachers: data.available_teachers || [] };
}

export function saveHalaqaTeacher(halaqaId, teacherId, role, profile = null) {
  return call("sadiq_halaqa_save_teacher", {
    p_halaqa_id: positiveId(halaqaId), p_teacher_id: positiveId(teacherId), p_role: role,
    p_full_name: profile ? profile.full_name.trim() : null,
    p_phone: profile ? profile.phone.trim() : null,
  });
}

export function assignHalaqaStudents(halaqaId, relationIds, teacherId) {
  const ids = [...new Set(relationIds.map(positiveId))];
  if (!ids.length) throw new Error(MESSAGES.HM_SELECT_STUDENTS);
  return call("sadiq_halaqa_assign_students", {
    p_halaqa_id: positiveId(halaqaId), p_relation_ids: ids,
    p_teacher_id: teacherId ? positiveId(teacherId) : null,
  });
}

export function removeHalaqaTeacher(halaqaId, teacherId, replacement) {
  return call("sadiq_halaqa_remove_teacher", {
    p_halaqa_id: positiveId(halaqaId), p_teacher_id: positiveId(teacherId),
    p_replacement_teacher_id: replacement && replacement !== "unassigned" ? positiveId(replacement) : null,
    p_clear_assignments: replacement === "unassigned",
  });
}

import { supabase } from "../lib/supabase";

/**
 * جلب جميع الحلقات
 */
export async function getHalaqat() {
  const { data, error } = await supabase
    .from("halaqat")
    .select("*")
    .order("name");

  if (error) {
    throw new Error(
      `تعذر تحميل الحلقات: ${error.message}`
    );
  }

  return data || [];
}

/**
 * جلب حلقة واحدة
 */
export async function getHalaqaById(
  halaqaId
) {
  const { data, error } = await supabase
    .from("halaqat")
    .select("*")
    .eq("id", halaqaId)
    .maybeSingle();

  if (error) {
    throw new Error(
      `تعذر تحميل بيانات الحلقة: ${error.message}`
    );
  }

  return data;
}

/**
 * إضافة حلقة
 */
export async function createHalaqa(
  halaqa
) {
  const { data, error } = await supabase
    .from("halaqat")
    .insert([halaqa])
    .select()
    .single();

  if (error) {
    throw new Error(
      `تعذر إضافة الحلقة: ${error.message}`
    );
  }

  return data;
}

/**
 * تعديل حلقة
 */
export async function updateHalaqa(
  halaqaId,
  updates
) {
  const { data, error } = await supabase
    .from("halaqat")
    .update(updates)
    .eq("id", halaqaId)
    .select()
    .single();

  if (error) {
    throw new Error(
      `تعذر تعديل الحلقة: ${error.message}`
    );
  }

  return data;
}

/**
 * تغيير حالة الحلقة
 */
export async function updateHalaqaStatus(
  halaqaId,
  status
) {
  const { data, error } = await supabase
    .from("halaqat")
    .update({
      status,
    })
    .eq("id", halaqaId)
    .select()
    .single();

  if (error) {
    throw new Error(
      `تعذر تغيير حالة الحلقة: ${error.message}`
    );
  }

  return data;
}

/**
 * حذف حلقة
 */
export async function deleteHalaqa(
  halaqaId
) {
  const { error } = await supabase
    .from("halaqat")
    .delete()
    .eq("id", halaqaId);

  if (error) {
    throw new Error(
      `تعذر حذف الحلقة: ${error.message}`
    );
  }

  return true;
}
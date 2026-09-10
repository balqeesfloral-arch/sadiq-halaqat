import { supabase } from "../lib/supabase";

/**
 * جلب جميع المساجد
 */
export async function getMosques() {
  const { data, error } = await supabase
    .from("mosques")
    .select("*")
    .order("name");

  if (error) {
    throw new Error(
      `تعذر تحميل المساجد: ${error.message}`
    );
  }

  return data || [];
}

/**
 * جلب مسجد واحد
 */
export async function getMosqueById(
  mosqueId
) {
  const { data, error } = await supabase
    .from("mosques")
    .select("*")
    .eq("id", mosqueId)
    .maybeSingle();

  if (error) {
    throw new Error(
      `تعذر تحميل بيانات المسجد: ${error.message}`
    );
  }

  return data;
}

/**
 * إضافة مسجد
 */
export async function createMosque(
  mosque
) {
  const { data, error } = await supabase
    .from("mosques")
    .insert([
      {
        name: mosque.name,
        address: mosque.address || null,
        notes: mosque.notes || null,
      },
    ])
    .select()
    .single();

  if (error) {
    throw new Error(
      `تعذر إضافة المسجد: ${error.message}`
    );
  }

  return data;
}

/**
 * تعديل مسجد
 */
export async function updateMosque(
  mosqueId,
  updates
) {
  const { data, error } = await supabase
    .from("mosques")
    .update(updates)
    .eq("id", mosqueId)
    .select()
    .single();

  if (error) {
    throw new Error(
      `تعذر تعديل المسجد: ${error.message}`
    );
  }

  return data;
}

/**
 * حذف مسجد
 */
export async function deleteMosque(
  mosqueId
) {
  const { error } = await supabase
    .from("mosques")
    .delete()
    .eq("id", mosqueId);

  if (error) {
    throw new Error(
      `تعذر حذف المسجد: ${error.message}`
    );
  }

  return true;
}
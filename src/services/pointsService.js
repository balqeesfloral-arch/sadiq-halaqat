import { supabase } from "../lib/supabase";

/**
 * جلب حركات النقاط
 */
export async function getPointsTransactions({
  fromDate,
  toDate,
  studentId,
} = {}) {
  let query = supabase
    .from("points_transactions")
    .select("*")
    .order("transaction_date", {
      ascending: false,
    });

  if (fromDate) {
    query = query.gte(
      "transaction_date",
      fromDate
    );
  }

  if (toDate) {
    query = query.lte(
      "transaction_date",
      toDate
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
      `تعذر تحميل حركات النقاط: ${error.message}`
    );
  }

  return data || [];
}

/**
 * جلب نقاط طالب
 */
export async function getStudentPoints(
  studentId,
  options = {}
) {
  return getPointsTransactions({
    ...options,
    studentId,
  });
}

/**
 * إضافة حركة نقاط
 */
export async function createPointsTransaction(
  transaction
) {
  const { data, error } =
    await supabase
      .from("points_transactions")
      .insert([
        {
          student_id:
            transaction.student_id,

          points:
            Number(
              transaction.points || 0
            ),

          reason:
            transaction.reason ||
            "عملية نقاط",

          granted_by:
            transaction.granted_by ||
            null,

          transaction_date:
            transaction.transaction_date ||
            undefined,

          notes:
            transaction.notes ||
            null,

          category:
            transaction.category ||
            null,
        },
      ])
      .select()
      .single();

  if (error) {
    throw new Error(
      `تعذر تسجيل النقاط: ${error.message}`
    );
  }

  return data;
}

/**
 * تعديل حركة نقاط
 */
export async function updatePointsTransaction(
  transactionId,
  updates
) {
  const { data, error } =
    await supabase
      .from("points_transactions")
      .update(updates)
      .eq("id", transactionId)
      .select()
      .single();

  if (error) {
    throw new Error(
      `تعذر تعديل حركة النقاط: ${error.message}`
    );
  }

  return data;
}

/**
 * حذف حركة نقاط
 */
export async function deletePointsTransaction(
  transactionId
) {
  const { error } =
    await supabase
      .from("points_transactions")
      .delete()
      .eq("id", transactionId);

  if (error) {
    throw new Error(
      `تعذر حذف حركة النقاط: ${error.message}`
    );
  }

  return true;
}

/**
 * حساب مجموع نقاط الطالب
 */
export function calculateTotalPoints(
  transactions = []
) {
  return transactions.reduce(
    (total, item) =>
      total +
      Number(item.points || 0),
    0
  );
}

/**
 * حساب ملخص النقاط
 */
export function calculatePointsSummary(
  transactions = []
) {
  let earned = 0;
  let deducted = 0;

  transactions.forEach(
    (transaction) => {
      const points = Number(
        transaction.points || 0
      );

      if (points >= 0) {
        earned += points;
      } else {
        deducted += Math.abs(points);
      }
    }
  );

  return {
    total:
      earned - deducted,

    earned,

    deducted,

    transactions:
      transactions.length,
  };
}
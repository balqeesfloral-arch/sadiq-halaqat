import { supabase } from "../lib/supabase";

/**
 * جلب التكليفات
 */
export async function getAssignments({
  halaqaId,
  studentId,
  status,
  fromDate,
  toDate,
} = {}) {
  let query = supabase
    .from("assignments")
    .select("*")
    .order("due_date", {
      ascending: true,
    });

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

  if (status) {
    query = query.eq(
      "status",
      status
    );
  }

  if (fromDate) {
    query = query.gte(
      "due_date",
      fromDate
    );
  }

  if (toDate) {
    query = query.lte(
      "due_date",
      toDate
    );
  }

  const { data, error } =
    await query;

  if (error) {
    throw new Error(
      `تعذر تحميل التكليفات: ${error.message}`
    );
  }

  return data || [];
}

/**
 * جلب تكليف واحد
 */
export async function getAssignmentById(
  assignmentId
) {
  const { data, error } =
    await supabase
      .from("assignments")
      .select("*")
      .eq("id", assignmentId)
      .maybeSingle();

  if (error) {
    throw new Error(
      `تعذر تحميل التكليف: ${error.message}`
    );
  }

  return data;
}

/**
 * إضافة تكليف
 */
export async function createAssignment(
  assignment
) {
  const { data, error } =
    await supabase
      .from("assignments")
      .insert([
        {
          halaqa_id:
            assignment.halaqa_id,

          student_id:
            assignment.student_id,

          side_lesson:
            assignment.side_lesson ||
            null,

          lesson:
            assignment.lesson ||
            null,

          review:
            assignment.review ||
            null,

          due_date:
            assignment.due_date ||
            null,

          status:
            assignment.status ||
            "pending",

          created_by:
            assignment.created_by ||
            null,
        },
      ])
      .select()
      .single();

  if (error) {
    throw new Error(
      `تعذر إضافة التكليف: ${error.message}`
    );
  }

  return data;
}

/**
 * تعديل تكليف
 */
export async function updateAssignment(
  assignmentId,
  updates
) {
  const { data, error } =
    await supabase
      .from("assignments")
      .update(updates)
      .eq("id", assignmentId)
      .select()
      .single();

  if (error) {
    throw new Error(
      `تعذر تعديل التكليف: ${error.message}`
    );
  }

  return data;
}

/**
 * تغيير حالة التكليف
 */
export async function updateAssignmentStatus(
  assignmentId,
  status
) {
  return updateAssignment(
    assignmentId,
    {
      status,
    }
  );
}

/**
 * حذف تكليف
 */
export async function deleteAssignment(
  assignmentId
) {
  const { error } =
    await supabase
      .from("assignments")
      .delete()
      .eq("id", assignmentId);

  if (error) {
    throw new Error(
      `تعذر حذف التكليف: ${error.message}`
    );
  }

  return true;
}

/**
 * حساب ملخص التكليفات
 */
export function calculateAssignmentSummary(
  assignments = []
) {
  const summary = {
    total: assignments.length,
    pending: 0,
    completed: 0,
    late: 0,
    cancelled: 0,
  };

  assignments.forEach(
    (assignment) => {
      switch (assignment.status) {
        case "completed":
          summary.completed++;
          break;

        case "late":
          summary.late++;
          break;

        case "cancelled":
          summary.cancelled++;
          break;

        default:
          summary.pending++;
      }
    }
  );

  summary.completionRate =
    summary.total > 0
      ? Math.round(
          (summary.completed /
            summary.total) *
            100
        )
      : 0;

  return summary;
}
import { supabase } from "../lib/supabase";

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

function applyDateRange(
  query,
  column,
  fromDate,
  toDate
) {
  if (fromDate) {
    query = query.gte(column, fromDate);
  }

  if (toDate) {
    query = query.lte(column, toDate);
  }

  return query;
}

/*
|--------------------------------------------------------------------------
| التقرير العام
|--------------------------------------------------------------------------
*/

export async function getGeneralReport({
  fromDate,
  toDate,
  mosqueId,
  halaqaId,
  teacherId,
  studentId,
} = {}) {
  const [
    students,
    teachers,
    halaqat,
    attendance,
    recitations,
    points,
    assignments,
  ] = await Promise.all([
    getReportStudents(),
    getReportTeachers(),
    getReportHalaqat(),
    getReportAttendance({
      fromDate,
      toDate,
      mosqueId,
      halaqaId,
      studentId,
    }),
    getReportRecitations({
      fromDate,
      toDate,
      mosqueId,
      halaqaId,
      studentId,
    }),
    getReportPoints({
      fromDate,
      toDate,
      studentId,
    }),
    getReportAssignments({
      fromDate,
      toDate,
      halaqaId,
      studentId,
    }),
  ]);

  const filteredStudents =
    filterStudents(
      students,
      {
        mosqueId,
        halaqaId,
        teacherId,
        studentId,
      },
      halaqat
    );

  const filteredTeachers =
    filterTeachers(
      teachers,
      {
        halaqaId,
        teacherId,
      },
      halaqat
    );

  return {
    students:
      filteredStudents,

    teachers:
      filteredTeachers,

    halaqat,

    attendance,

    recitations,

    points,

    assignments,

    summary:
      buildGeneralSummary({
        students:
          filteredStudents,
        attendance,
        recitations,
        points,
        assignments,
      }),
  };
}

/*
|--------------------------------------------------------------------------
| الطلاب
|--------------------------------------------------------------------------
*/

export async function getReportStudents() {
  const { data, error } =
    await supabase
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
        registration_date
      `)
      .eq("role", "student")
      .order("full_name");

  if (error) {
    throw new Error(
      `تعذر تحميل طلاب التقارير: ${error.message}`
    );
  }

  return data || [];
}

/*
|--------------------------------------------------------------------------
| المعلمون
|--------------------------------------------------------------------------
*/

export async function getReportTeachers() {
  const { data, error } =
    await supabase
      .from("profiles")
      .select(`
        id,
        full_name,
        user_number,
        phone,
        status
      `)
      .eq("role", "teacher")
      .order("full_name");

  if (error) {
    throw new Error(
      `تعذر تحميل معلمي التقارير: ${error.message}`
    );
  }

  return data || [];
}

/*
|--------------------------------------------------------------------------
| الحلقات
|--------------------------------------------------------------------------
*/

export async function getReportHalaqat() {
  const { data, error } =
    await supabase
      .from("halaqat")
      .select(`
        id,
        mosque_id,
        name,
        main_teacher_id,
        assistant_teacher_id,
        capacity,
        status,
        academic_year_id
      `)
      .order("name");

  if (error) {
    throw new Error(
      `تعذر تحميل حلقات التقارير: ${error.message}`
    );
  }

  return data || [];
}

/*
|--------------------------------------------------------------------------
| المساجد
|--------------------------------------------------------------------------
*/

export async function getReportMosques() {
  const { data, error } =
    await supabase
      .from("mosques")
      .select(`
        id,
        name,
        address
      `)
      .order("name");

  if (error) {
    throw new Error(
      `تعذر تحميل المساجد للتقارير: ${error.message}`
    );
  }

  return data || [];
}

/*
|--------------------------------------------------------------------------
| الحضور
|--------------------------------------------------------------------------
*/

export async function getReportAttendance({
  fromDate,
  toDate,
  mosqueId,
  halaqaId,
  studentId,
} = {}) {
  let query = supabase
    .from("attendance")
    .select("*")
    .order("attendance_date", {
      ascending: false,
    });

  query = applyDateRange(
    query,
    "attendance_date",
    fromDate,
    toDate
  );

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
      `تعذر تحميل حضور التقارير: ${error.message}`
    );
  }

  /*
   * mosqueId لا يوجد مباشرة داخل attendance.
   * لذلك نفلتره بعد جلب الحلقات.
   */
  if (mosqueId) {
    const halaqat =
      await getReportHalaqat();

    const allowedHalaqaIds =
      new Set(
        halaqat
          .filter(
            (halaqa) =>
              Number(
                halaqa.mosque_id
              ) === Number(mosqueId)
          )
          .map(
            (halaqa) =>
              halaqa.id
          )
      );

    return (data || []).filter(
      (item) =>
        allowedHalaqaIds.has(
          Number(item.halaqa_id)
        )
    );
  }

  return data || [];
}

/*
|--------------------------------------------------------------------------
| التسميع
|--------------------------------------------------------------------------
*/

export async function getReportRecitations({
  fromDate,
  toDate,
  mosqueId,
  halaqaId,
  studentId,
} = {}) {
  let query = supabase
    .from("recitations")
    .select("*")
    .order("recitation_date", {
      ascending: false,
    });

  query = applyDateRange(
    query,
    "recitation_date",
    fromDate,
    toDate
  );

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
      `تعذر تحميل تسميعات التقارير: ${error.message}`
    );
  }

  if (mosqueId) {
    const halaqat =
      await getReportHalaqat();

    const allowedHalaqaIds =
      new Set(
        halaqat
          .filter(
            (halaqa) =>
              Number(
                halaqa.mosque_id
              ) === Number(mosqueId)
          )
          .map(
            (halaqa) =>
              halaqa.id
          )
      );

    return (data || []).filter(
      (item) =>
        allowedHalaqaIds.has(
          Number(item.halaqa_id)
        )
    );
  }

  return data || [];
}

/*
|--------------------------------------------------------------------------
| النقاط
|--------------------------------------------------------------------------
*/

export async function getReportPoints({
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

  query = applyDateRange(
    query,
    "transaction_date",
    fromDate,
    toDate
  );

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
      `تعذر تحميل نقاط التقارير: ${error.message}`
    );
  }

  return data || [];
}

/*
|--------------------------------------------------------------------------
| التكليفات
|--------------------------------------------------------------------------
*/

export async function getReportAssignments({
  fromDate,
  toDate,
  halaqaId,
  studentId,
} = {}) {
  let query = supabase
    .from("assignments")
    .select("*")
    .order("due_date", {
      ascending: true,
    });

  query = applyDateRange(
    query,
    "due_date",
    fromDate,
    toDate
  );

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
      `تعذر تحميل تكليفات التقارير: ${error.message}`
    );
  }

  return data || [];
}

/*
|--------------------------------------------------------------------------
| ملخص الحضور
|--------------------------------------------------------------------------
*/

export function summarizeAttendance(
  records = []
) {
  const result = {
    total: records.length,
    present: 0,
    absent: 0,
    late: 0,
    excused: 0,
    attendanceRate: 0,
  };

  records.forEach(
    (record) => {
      switch (record.status) {
        case "present":
          result.present++;
          break;

        case "absent":
          result.absent++;
          break;

        case "late":
          result.late++;
          break;

        case "excused":
          result.excused++;
          break;

        default:
          break;
      }
    }
  );

  const effectiveDays =
    result.total -
    result.excused;

  result.attendanceRate =
    effectiveDays > 0
      ? Math.round(
          ((result.present +
            result.late) /
            effectiveDays) *
            100
        )
      : 0;

  return result;
}

/*
|--------------------------------------------------------------------------
| ملخص التسميع
|--------------------------------------------------------------------------
*/

export function summarizeRecitations(
  records = []
) {
  const points =
    records.reduce(
      (total, item) =>
        total +
        Number(item.points || 0),
      0
    );

  return {
    count: records.length,
    points,
    averagePoints:
      records.length
        ? Math.round(
            points /
              records.length
          )
        : 0,
  };
}

/*
|--------------------------------------------------------------------------
| ملخص النقاط
|--------------------------------------------------------------------------
*/

export function summarizePoints(
  records = []
) {
  let earned = 0;
  let deducted = 0;

  records.forEach(
    (item) => {
      const points =
        Number(
          item.points || 0
        );

      if (points >= 0) {
        earned += points;
      } else {
        deducted += Math.abs(
          points
        );
      }
    }
  );

  return {
    earned,
    deducted,
    total:
      earned - deducted,
    transactions:
      records.length,
  };
}

/*
|--------------------------------------------------------------------------
| ملخص التكليفات
|--------------------------------------------------------------------------
*/

export function summarizeAssignments(
  records = []
) {
  const result = {
    total: records.length,
    completed: 0,
    pending: 0,
    late: 0,
    cancelled: 0,
    completionRate: 0,
  };

  records.forEach(
    (item) => {
      switch (item.status) {
        case "completed":
          result.completed++;
          break;

        case "late":
          result.late++;
          break;

        case "cancelled":
          result.cancelled++;
          break;

        default:
          result.pending++;
      }
    }
  );

  result.completionRate =
    result.total
      ? Math.round(
          (result.completed /
            result.total) *
            100
        )
      : 0;

  return result;
}

/*
|--------------------------------------------------------------------------
| الملخص العام
|--------------------------------------------------------------------------
*/

export function buildGeneralSummary({
  students = [],
  attendance = [],
  recitations = [],
  points = [],
  assignments = [],
} = {}) {
  return {
    students:
      students.length,

    activeStudents:
      students.filter(
        (student) =>
          student.status ===
          "active"
      ).length,

    attendance:
      summarizeAttendance(
        attendance
      ),

    recitations:
      summarizeRecitations(
        recitations
      ),

    points:
      summarizePoints(points),

    assignments:
      summarizeAssignments(
        assignments
      ),
  };
}

/*
|--------------------------------------------------------------------------
| فلترة الطلاب
|--------------------------------------------------------------------------
*/

function filterStudents(
  students,
  {
    halaqaId,
    studentId,
    teacherId,
  } = {},
  halaqat = []
) {
  let result = students;

  if (studentId) {
    result =
      result.filter(
        (student) =>
          Number(student.id) ===
          Number(studentId)
      );
  }

  /*
   * ربط الطالب بالحلقة/المعلم
   * يتم من خلال student_halaqat.
   *
   * لا نعتمد هنا على بيانات وهمية
   * داخل profiles.
   */
  if (halaqaId || teacherId) {
    /*
     * هذه الفلترة ستتم لاحقًا
     * من خلال service الربط المركزي.
     */
  }

  return result;
}

/*
|--------------------------------------------------------------------------
| فلترة المعلمين
|--------------------------------------------------------------------------
*/

function filterTeachers(
  teachers,
  {
    halaqaId,
    teacherId,
  } = {},
  halaqat = []
) {
  let result = teachers;

  if (teacherId) {
    result =
      result.filter(
        (teacher) =>
          Number(teacher.id) ===
          Number(teacherId)
      );
  }

  if (halaqaId) {
    const halaqa =
      halaqat.find(
        (item) =>
          Number(item.id) ===
          Number(halaqaId)
      );

    if (halaqa) {
      const ids = [
        halaqa.main_teacher_id,
        halaqa.assistant_teacher_id,
      ]
        .filter(Boolean)
        .map(Number);

      result =
        result.filter(
          (teacher) =>
            ids.includes(
              Number(teacher.id)
            )
        );
    }
  }

  return result;
}
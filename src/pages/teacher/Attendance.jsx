// src/pages/teacher/Attendance.jsx

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Check,
  CheckCircle2,
  CircleSlash2,
  ClipboardCheck,
  Clock3,
  FileCheck2,
  Filter,
  Loader2,
  RefreshCw,
  Search,
  Users,
  UserRound,
  X,
  XCircle,
  Building2,
  BookOpen,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import { supabase } from "../../lib/supabase";
import { useToast } from "../../components/Toast";

/* =========================================================
   ثوابت
========================================================= */

const HALAQA_PERIODS = {
  after_fajr: "بعد الفجر",
  after_dhuhr: "بعد الظهر",
  after_asr: "بعد العصر",
  after_maghrib: "بعد المغرب",
  after_isha: "بعد العشاء",
};

const ATTENDANCE_STATUSES = {
  present: {
    label: "حاضر",
    shortLabel: "حاضر",
  },

  absent: {
    label: "غائب",
    shortLabel: "غائب",
  },

  late: {
    label: "متأخر",
    shortLabel: "متأخر",
  },

  excused: {
    label: "معتذر",
    shortLabel: "معتذر",
  },
};

/* =========================================================
   أدوات التاريخ

   مهم:
   نخزن ونرسل إلى Supabase التاريخ الميلادي.
   الهجري للعرض فقط.
========================================================= */

function getLocalDate(
  date = new Date()
) {
  const year =
    date.getFullYear();

  const month =
    String(
      date.getMonth() + 1
    ).padStart(2, "0");

  const day =
    String(
      date.getDate()
    ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function parseLocalDate(
  dateString
) {
  if (!dateString) {
    return new Date();
  }

  return new Date(
    `${dateString}T12:00:00`
  );
}

/* التاريخ الميلادي */

function formatGregorianDate(
  dateString
) {
  try {
    return new Intl.DateTimeFormat(
      "ar-SA-u-ca-gregory",
      {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      }
    ).format(
      parseLocalDate(
        dateString
      )
    );
  } catch {
    return dateString;
  }
}

/* التاريخ الهجري - أم القرى */

function formatHijriDate(
  dateString
) {
  try {
    return new Intl.DateTimeFormat(
      "ar-SA-u-ca-islamic-umalqura",
      {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      }
    ).format(
      parseLocalDate(
        dateString
      )
    );
  } catch {
    return "تعذر عرض التاريخ الهجري";
  }
}

function formatShortDate(
  dateString
) {
  try {
    return new Intl.DateTimeFormat(
      "ar-SA-u-ca-gregory",
      {
        day: "numeric",
        month: "short",
      }
    ).format(
      parseLocalDate(
        dateString
      )
    );
  } catch {
    return dateString;
  }
}

/* =========================================================
   الصفحة
========================================================= */

export default function Attendance() {
  const { showToast } =
    useToast();

  /* =====================================================
     DATA
  ===================================================== */

  const [
    teacher,
    setTeacher,
  ] = useState(null);

  const [
    halaqat,
    setHalaqat,
  ] = useState([]);

  const [
    students,
    setStudents,
  ] = useState([]);

  const [
    attendance,
    setAttendance,
  ] = useState([]);

  /* =====================================================
     FILTERS
  ===================================================== */

  const [
    selectedHalaqa,
    setSelectedHalaqa,
  ] = useState("");

  const [
    selectedDate,
    setSelectedDate,
  ] = useState(
    getLocalDate()
  );

  const [
    search,
    setSearch,
  ] = useState("");

  const [
    showOnlyUnrecorded,
    setShowOnlyUnrecorded,
  ] = useState(false);

  /* =====================================================
     LOADING STATES
  ===================================================== */

  const [
    initialLoading,
    setInitialLoading,
  ] = useState(true);

  const [
    loading,
    setLoading,
  ] = useState(false);

  const [
    savingStudentId,
    setSavingStudentId,
  ] = useState(null);

  const [
    bulkSaving,
    setBulkSaving,
  ] = useState(false);

  /* =====================================================
     INITIAL LOAD
  ===================================================== */

  useEffect(() => {
    loadHalaqat();
  }, []);

  /*
    بعد تحميل حلقات المعلم،
    أو عند تغيير التاريخ،
    نحمل سجل الحضور.
  */

  useEffect(() => {
    if (
      halaqat.length > 0
    ) {
      loadAttendanceData();
    }
  }, [
    selectedDate,
    halaqat,
  ]);

  /* =====================================================
     LOAD TEACHER HALAQAT
  ===================================================== */

  async function loadHalaqat() {
    setInitialLoading(true);

    try {
      /* -----------------------------------------
         Auth
      ----------------------------------------- */

      const {
        data: authData,
        error: authError,
      } =
        await supabase.auth.getUser();

      if (authError) {
        throw authError;
      }

      const user =
        authData?.user;

      if (!user) {
        throw new Error(
          "تعذر التحقق من المستخدم الحالي"
        );
      }

      /* -----------------------------------------
         Teacher profile
      ----------------------------------------- */

      const {
        data: teacherProfile,
        error: profileError,
      } =
        await supabase
          .from("profiles")
          .select(`
            id,
            full_name,
            user_number
          `)
          .eq(
            "auth_user_id",
            user.id
          )
          .eq(
            "role",
            "teacher"
          )
          .single();

      if (profileError) {
        throw profileError;
      }

      setTeacher(
        teacherProfile
      );

      /* -----------------------------------------
         Teacher halaqat فقط
      ----------------------------------------- */

      const {
        data: links,
        error: linksError,
      } =
        await supabase
          .from(
            "teacher_halaqat"
          )
          .select(`
            halaqa_id,
            role,

            halaqat!teacher_halaqat_halaqa_id_fkey(
              id,
              name,
              mosque_id,
              capacity,
              status,
              halaqa_period,

              mosques!halaqat_mosque_id_fkey(
                id,
                name
              )
            )
          `)
          .eq(
            "teacher_id",
            teacherProfile.id
          );

      if (linksError) {
        throw linksError;
      }

      /*
        منع تكرار الحلقة لو حصل
        ربط مكرر بالخطأ.
      */

      const halaqaMap =
        new Map();

      (
        links || []
      ).forEach(
        (link) => {
          if (!link.halaqat) {
            return;
          }

          const id =
            Number(
              link.halaqat.id
            );

          const old =
            halaqaMap.get(id);

          /*
            إذا كان لديه main و assistant
            لنفس الحلقة نفضل main.
          */

          if (
            !old ||
            link.role ===
              "main"
          ) {
            halaqaMap.set(
              id,
              {
                ...link.halaqat,

                teacher_role:
                  link.role,

                mosque_name:
                  link.halaqat
                    .mosques
                    ?.name ||
                  "مسجد غير محدد",
              }
            );
          }
        }
      );

      const halaqatData =
        Array.from(
          halaqaMap.values()
        ).sort(
          (a, b) =>
            String(
              a.name || ""
            ).localeCompare(
              String(
                b.name || ""
              ),
              "ar"
            )
        );

      setHalaqat(
        halaqatData
      );

      if (
        halaqatData.length ===
        0
      ) {
        setSelectedHalaqa(
          ""
        );

        setStudents([]);
        setAttendance([]);

        setInitialLoading(
          false
        );

        return;
      }

      /*
        إذا الحلقة الحالية ليست
        من حلقات المعلم نختار الأولى.
      */

      const currentExists =
        halaqatData.some(
          (item) =>
            Number(
              item.id
            ) ===
            Number(
              selectedHalaqa
            )
        );

      if (
        !currentExists
      ) {
        setSelectedHalaqa(
          String(
            halaqatData[0].id
          )
        );
      }

    } catch (error) {
      console.error(
        "LOAD ATTENDANCE HALAQAT:",
        error
      );

      showToast(
        error.message ||
          "تعذر تحميل حلقات المعلم",
        "error"
      );

      setHalaqat([]);
      setStudents([]);
      setAttendance([]);

      setInitialLoading(
        false
      );
    }
  }

  /* =====================================================
     LOAD STUDENTS + ATTENDANCE
  ===================================================== */

  async function loadAttendanceData() {
    if (
      halaqat.length === 0
    ) {
      setStudents([]);
      setAttendance([]);

      setInitialLoading(
        false
      );

      return;
    }

    setLoading(true);

    try {
      const halaqaIds =
        halaqat.map(
          (halaqa) =>
            Number(
              halaqa.id
            )
        );

      /* -----------------------------------------
         Current students
      ----------------------------------------- */

      const {
        data: assignments,
        error:
          assignmentsError,
      } =
        await supabase
          .from(
            "student_halaqat"
          )
          .select(`
            id,
            student_id,
            halaqa_id,
            teacher_id,
            is_current
          `)
          .in(
            "halaqa_id",
            halaqaIds
          )
          .eq(
            "is_current",
            true
          );

      if (
        assignmentsError
      ) {
        throw assignmentsError;
      }

      if (
        !assignments?.length
      ) {
        setStudents([]);

        /*
          مع ذلك نحمّل الحضور
          حتى تنظف الحالة السابقة.
        */

        setAttendance([]);

        return;
      }

      const studentIds = [
        ...new Set(
          assignments.map(
            (item) =>
              Number(
                item.student_id
              )
          )
        ),
      ];

      /* -----------------------------------------
         Student profiles
      ----------------------------------------- */

      const {
        data: profiles,
        error:
          profilesError,
      } =
        await supabase
          .from("profiles")
          .select(`
            id,
            full_name,
            user_number,
            phone,
            status,
            is_active
          `)
          .in(
            "id",
            studentIds
          )
          .eq(
            "role",
            "student"
          );

      if (profilesError) {
        throw profilesError;
      }

      /* -----------------------------------------
         Attendance for date
      ----------------------------------------- */

      const {
        data: attendanceData,
        error:
          attendanceError,
      } =
        await supabase
          .from("attendance")
          .select(`
            id,
            student_id,
            halaqa_id,
            attendance_date,
            status
          `)
          .in(
            "halaqa_id",
            halaqaIds
          )
          .eq(
            "attendance_date",
            selectedDate
          );

      if (
        attendanceError
      ) {
        throw attendanceError;
      }

      /* -----------------------------------------
         Map students
      ----------------------------------------- */

      const profileMap =
        new Map(
          (
            profiles || []
          ).map(
            (profile) => [
              Number(
                profile.id
              ),
              profile,
            ]
          )
        );

      const studentsData =
        (
          assignments || []
        )
          .map(
            (
              assignment
            ) => {
              const profile =
                profileMap.get(
                  Number(
                    assignment
                      .student_id
                  )
                );

              if (!profile) {
                return null;
              }

              /*
                الطالب غير النشط
                لا يظهر في سجل الحضور.
              */

              if (
                profile.status !==
                  "active" ||
                profile.is_active ===
                  false
              ) {
                return null;
              }

              return {
                ...profile,

                student_id:
                  Number(
                    assignment
                      .student_id
                  ),

                halaqa_id:
                  Number(
                    assignment
                      .halaqa_id
                  ),
              };
            }
          )
          .filter(Boolean)
          .sort(
            (a, b) =>
              String(
                a.full_name ||
                  ""
              ).localeCompare(
                String(
                  b.full_name ||
                    ""
                ),
                "ar"
              )
          );

      setStudents(
        studentsData
      );

      setAttendance(
        attendanceData ||
          []
      );

    } catch (error) {
      console.error(
        "LOAD ATTENDANCE DATA:",
        error
      );

      showToast(
        error.message ||
          "تعذر تحميل بيانات الحضور",
        "error"
      );
    } finally {
      setLoading(false);

      setInitialLoading(
        false
      );
    }
  }

  /* =====================================================
     Halaqa access
  ===================================================== */

  function isTeacherHalaqa(
    halaqaId
  ) {
    return halaqat.some(
      (halaqa) =>
        Number(
          halaqa.id
        ) ===
        Number(halaqaId)
    );
  }

  /* =====================================================
     STUDENTS
  ===================================================== */

  function getStudentsForHalaqa(
    halaqaId
  ) {
    return students.filter(
      (student) =>
        Number(
          student.halaqa_id
        ) ===
        Number(halaqaId)
    );
  }

  /* =====================================================
     ATTENDANCE RECORD
  ===================================================== */

  function getAttendanceRecord(
    studentId,
    halaqaId
  ) {
    return attendance.find(
      (record) =>
        Number(
          record.student_id
        ) ===
          Number(studentId) &&
        Number(
          record.halaqa_id
        ) ===
          Number(halaqaId) &&
        record.attendance_date ===
          selectedDate
    );
  }

  /* =====================================================
     HALAQA STATS
  ===================================================== */

  function getHalaqaStats(
    halaqaId
  ) {
    const halaqaStudents =
      getStudentsForHalaqa(
        halaqaId
      );

    const total =
      halaqaStudents.length;

    let present = 0;
    let absent = 0;
    let late = 0;
    let excused = 0;

    halaqaStudents.forEach(
      (student) => {
        const record =
          getAttendanceRecord(
            student.student_id,
            halaqaId
          );

        if (!record) {
          return;
        }

        switch (
          record.status
        ) {
          case "present":
            present++;
            break;

          case "absent":
            absent++;
            break;

          case "late":
            late++;
            break;

          case "excused":
            excused++;
            break;

          default:
            break;
        }
      }
    );

    const recorded =
      present +
      absent +
      late +
      excused;

    const unrecorded =
      Math.max(
        total - recorded,
        0
      );

    /*
      المتأخر يعتبر حاضرًا
      في نسبة الالتزام بالحضور.
    */

    const attendancePercentage =
      total > 0
        ? Math.round(
            (
              (
                present +
                late
              ) /
              total
            ) *
              100
          )
        : 0;

    const completionPercentage =
      total > 0
        ? Math.round(
            (
              recorded /
              total
            ) *
              100
          )
        : 0;

    return {
      total,
      present,
      absent,
      late,
      excused,
      recorded,
      unrecorded,
      attendancePercentage,
      completionPercentage,
    };
  }

  /* =====================================================
     SELECTED HALAQA
  ===================================================== */

  const selectedHalaqaData =
    useMemo(() => {
      return halaqat.find(
        (halaqa) =>
          Number(
            halaqa.id
          ) ===
          Number(
            selectedHalaqa
          )
      );
    }, [
      halaqat,
      selectedHalaqa,
    ]);

  /* =====================================================
     SELECTED HALAQA STATS
  ===================================================== */

  const selectedStats =
    useMemo(() => {
      if (!selectedHalaqa) {
        return {
          total: 0,
          present: 0,
          absent: 0,
          late: 0,
          excused: 0,
          recorded: 0,
          unrecorded: 0,
          attendancePercentage:
            0,
          completionPercentage:
            0,
        };
      }

      return getHalaqaStats(
        selectedHalaqa
      );
    }, [
      selectedHalaqa,
      students,
      attendance,
      selectedDate,
    ]);

  /* =====================================================
     FILTERED STUDENTS
  ===================================================== */

  const filteredStudents =
    useMemo(() => {
      let result =
        getStudentsForHalaqa(
          selectedHalaqa
        );

      const text =
        search
          .trim()
          .toLowerCase();

      if (text) {
        result =
          result.filter(
            (student) => {
              const name =
                String(
                  student.full_name ||
                    ""
                ).toLowerCase();

              const number =
                String(
                  student.user_number ||
                    ""
                ).toLowerCase();

              const phone =
                String(
                  student.phone ||
                    ""
                ).toLowerCase();

              return (
                name.includes(
                  text
                ) ||
                number.includes(
                  text
                ) ||
                phone.includes(
                  text
                )
              );
            }
          );
      }

      if (
        showOnlyUnrecorded
      ) {
        result =
          result.filter(
            (student) =>
              !getAttendanceRecord(
                student.student_id,
                selectedHalaqa
              )
          );
      }

      return result;
    }, [
      students,
      selectedHalaqa,
      search,
      showOnlyUnrecorded,
      attendance,
      selectedDate,
    ]);

  /* =====================================================
     GLOBAL STATS
  ===================================================== */

  const globalStats =
    useMemo(() => {
      let total = 0;
      let present = 0;
      let absent = 0;
      let late = 0;
      let excused = 0;

      halaqat.forEach(
        (halaqa) => {
          const stats =
            getHalaqaStats(
              halaqa.id
            );

          total += stats.total;

          present +=
            stats.present;

          absent +=
            stats.absent;

          late +=
            stats.late;

          excused +=
            stats.excused;
        }
      );

      const recorded =
        present +
        absent +
        late +
        excused;

      const unrecorded =
        Math.max(
          total - recorded,
          0
        );

      const percentage =
        total > 0
          ? Math.round(
              (
                (
                  present +
                  late
                ) /
                total
              ) *
                100
            )
          : 0;

      const completion =
        total > 0
          ? Math.round(
              (
                recorded /
                total
              ) *
                100
            )
          : 0;

      return {
        total,
        present,
        absent,
        late,
        excused,
        recorded,
        unrecorded,
        percentage,
        completion,
      };
    }, [
      halaqat,
      students,
      attendance,
      selectedDate,
    ]);

  /* =====================================================
     SAVE SINGLE ATTENDANCE
  ===================================================== */

  async function saveAttendance(
    studentId,
    status
  ) {
    if (!selectedHalaqa) {
      showToast(
        "اختر الحلقة أولًا",
        "error"
      );

      return;
    }

    if (
      !isTeacherHalaqa(
        selectedHalaqa
      )
    ) {
      showToast(
        "هذه الحلقة ليست ضمن حلقاتك",
        "error"
      );

      return;
    }

    const studentExists =
      getStudentsForHalaqa(
        selectedHalaqa
      ).some(
        (student) =>
          Number(
            student.student_id
          ) ===
          Number(studentId)
      );

    if (!studentExists) {
      showToast(
        "هذا الطالب غير مرتبط بهذه الحلقة",
        "error"
      );

      return;
    }

    setSavingStudentId(
      studentId
    );

    try {
      /*
        نستخدم limit بدل maybeSingle
        حتى لا تفشل العملية لو كانت
        هناك بيانات مكررة قديمة.
      */

      const {
        data:
          existingRows,
        error: findError,
      } =
        await supabase
          .from("attendance")
          .select("id, status")
          .eq(
            "student_id",
            studentId
          )
          .eq(
            "halaqa_id",
            Number(
              selectedHalaqa
            )
          )
          .eq(
            "attendance_date",
            selectedDate
          )
          .order(
            "id",
            {
              ascending: false,
            }
          )
          .limit(1);

      if (findError) {
        throw findError;
      }

      const existingRecord =
        existingRows?.[0];

      const shouldClear =
        existingRecord?.status === status;

      if (shouldClear) {
        /*
          إذا ضغط المعلم على نفس الحالة مرة ثانية
          نحذف سجل الحضور لهذا الطالب في هذا اليوم،
          فيرجع إلى "لم يسجل".
        */
        const {
          error,
        } =
          await supabase
            .from("attendance")
            .delete()
            .eq(
              "id",
              existingRecord.id
            );

        if (error) {
          throw error;
        }
      } else if (existingRecord) {
        /*
          إذا اختار حالة مختلفة نعدل السجل الحالي.
        */
        const {
          error,
        } =
          await supabase
            .from("attendance")
            .update({
              status,
            })
            .eq(
              "id",
              existingRecord.id
            );

        if (error) {
          throw error;
        }
      } else {
        /*
          إذا لم يوجد سجل من الأساس ننشئه.
        */
        const {
          error,
        } =
          await supabase
            .from("attendance")
            .insert([
              {
                student_id:
                  Number(
                    studentId
                  ),

                halaqa_id:
                  Number(
                    selectedHalaqa
                  ),

                attendance_date:
                  selectedDate,

                status,
              },
            ]);

        if (error) {
          throw error;
        }
      }

      /*
        تحديث محلي مباشر
        بدل تحميل الصفحة كاملة
        في كل ضغطة.
      */

      setAttendance(
        (current) => {
          const matchesRecord = (
            record
          ) =>
            Number(
              record.student_id
            ) ===
              Number(
                studentId
              ) &&
            Number(
              record.halaqa_id
            ) ===
              Number(
                selectedHalaqa
              ) &&
            record.attendance_date ===
              selectedDate;

          const exists =
            current.find(
              matchesRecord
            );

          if (shouldClear) {
            return current.filter(
              (record) =>
                !matchesRecord(
                  record
                )
            );
          }

          if (exists) {
            return current.map(
              (record) =>
                matchesRecord(
                  record
                )
                  ? {
                      ...record,
                      status,
                    }
                  : record
            );
          }

          return [
            ...current,
            {
              student_id:
                Number(
                  studentId
                ),

              halaqa_id:
                Number(
                  selectedHalaqa
                ),

              attendance_date:
                selectedDate,

              status,
            },
          ];
        }
      );

    } catch (error) {
      console.error(
        "SAVE ATTENDANCE:",
        error
      );

      showToast(
        error.message ||
          "تعذر حفظ حالة الطالب",
        "error"
      );
    } finally {
      setSavingStudentId(
        null
      );
    }
  }

  /* =====================================================
     BULK ATTENDANCE
  ===================================================== */

  async function markAll(
    status,
    onlyUnrecorded = false
  ) {
    if (!selectedHalaqa) {
      showToast(
        "اختر الحلقة أولًا",
        "error"
      );

      return;
    }

    if (
      !isTeacherHalaqa(
        selectedHalaqa
      )
    ) {
      showToast(
        "هذه الحلقة ليست ضمن حلقاتك",
        "error"
      );

      return;
    }

    let halaqaStudents =
      getStudentsForHalaqa(
        selectedHalaqa
      );

    /*
      الخيار الآمن:
      تسجيل غير المسجلين فقط
      بدون تعديل حالة الطلاب
      المسجلين مسبقًا.
    */

    if (onlyUnrecorded) {
      halaqaStudents =
        halaqaStudents.filter(
          (student) =>
            !getAttendanceRecord(
              student.student_id,
              selectedHalaqa
            )
        );
    }

    if (
      halaqaStudents.length ===
      0
    ) {
      showToast(
        onlyUnrecorded
          ? "لا يوجد طلاب غير مسجلين"
          : "لا يوجد طلاب في هذه الحلقة",
        "info"
      );

      return;
    }

    const label =
      getStatusLabel(
        status
      );

    const actionText =
      onlyUnrecorded
        ? `تسجيل الطلاب غير المسجلين كـ "${label}"`
        : `تسجيل جميع طلاب الحلقة كـ "${label}"`;

    const confirmed =
      window.confirm(
        `${actionText}\n\nالحلقة: ${
          selectedHalaqaData
            ?.name || ""
        }\nالتاريخ: ${formatGregorianDate(
          selectedDate
        )}\n\nهل تريد المتابعة؟`
      );

    if (!confirmed) {
      return;
    }

    setBulkSaving(true);

    try {
      const existingForHalaqa =
        attendance.filter(
          (record) =>
            Number(
              record.halaqa_id
            ) ===
              Number(
                selectedHalaqa
              ) &&
            record.attendance_date ===
              selectedDate
        );

      const existingIds =
        new Set(
          existingForHalaqa.map(
            (record) =>
              Number(
                record.student_id
              )
          )
        );

      const rows =
        halaqaStudents.map(
          (student) => ({
            student_id:
              Number(
                student.student_id
              ),

            halaqa_id:
              Number(
                selectedHalaqa
              ),

            attendance_date:
              selectedDate,

            status,
          })
        );

      const existingRows =
        rows.filter(
          (row) =>
            existingIds.has(
              Number(
                row.student_id
              )
            )
        );

      const newRows =
        rows.filter(
          (row) =>
            !existingIds.has(
              Number(
                row.student_id
              )
            )
        );

      /*
        تحديث الموجود
      */

      if (
        existingRows.length >
          0 &&
        !onlyUnrecorded
      ) {
        const studentIds =
          existingRows.map(
            (row) =>
              row.student_id
          );

        const {
          error,
        } =
          await supabase
            .from("attendance")
            .update({
              status,
            })
            .eq(
              "halaqa_id",
              Number(
                selectedHalaqa
              )
            )
            .eq(
              "attendance_date",
              selectedDate
            )
            .in(
              "student_id",
              studentIds
            );

        if (error) {
          throw error;
        }
      }

      /*
        إضافة الجديد
      */

      if (
        newRows.length >
        0
      ) {
        const {
          error,
        } =
          await supabase
            .from("attendance")
            .insert(
              newRows
            );

        if (error) {
          throw error;
        }
      }

      showToast(
        onlyUnrecorded
          ? `تم تسجيل ${halaqaStudents.length} طالب غير مسجل`
          : `تم تسجيل ${label} لجميع طلاب الحلقة`,
        "success"
      );

      await loadAttendanceData();

    } catch (error) {
      console.error(
        "BULK ATTENDANCE:",
        error
      );

      showToast(
        error.message ||
          "تعذر تنفيذ التسجيل الجماعي",
        "error"
      );
    } finally {
      setBulkSaving(false);
    }
  }

  /* =====================================================
     DATE NAVIGATION
  ===================================================== */

  function changeDate(
    days
  ) {
    const current =
      parseLocalDate(
        selectedDate
      );

    current.setDate(
      current.getDate() +
        days
    );

    const newDate =
      getLocalDate(
        current
      );

    const today =
      getLocalDate();

    if (
      newDate > today
    ) {
      showToast(
        "لا يمكن تسجيل حضور لتاريخ مستقبلي",
        "info"
      );

      return;
    }

    setSelectedDate(
      newDate
    );
  }

  function goToToday() {
    setSelectedDate(
      getLocalDate()
    );
  }

  /* =====================================================
     REFRESH
  ===================================================== */

  async function refreshData() {
    await loadAttendanceData();

    showToast(
      "تم تحديث سجل الحضور",
      "success"
    );
  }

  /* =====================================================
     RENDER
  ===================================================== */

  if (initialLoading) {
    return (
      <div
        className="attendance-page"
        dir="rtl"
      >
        <PageStyles />

        <LoadingScreen />
      </div>
    );
  }

  return (
    <div
      className="attendance-page"
      dir="rtl"
    >
      <PageStyles />

      {/* =================================================
          HERO
      ================================================= */}

      <section
        className="attendance-hero"
      >
        <div
          className="attendance-hero-content"
        >
          <div
            className="attendance-hero-icon"
          >
            <ClipboardCheck
              size={23}
            />
          </div>

          <div>
            <div
              className="attendance-eyebrow"
            >
              <ShieldCheck
                size={13}
              />

              بوابة المعلم
            </div>

            <h1
              className="attendance-title"
            >
              الحضور والغياب
            </h1>

            <p
              className="attendance-subtitle"
            >
              تسجيل حضور طلاب
              حلقاتك ومتابعة
              الالتزام اليومي
              بسهولة ودقة.
              {teacher?.full_name
                ? ` أهلاً ${teacher.full_name}.`
                : ""}
            </p>
          </div>
        </div>

        <button
          type="button"
          className="attendance-refresh"
          onClick={
            refreshData
          }
          disabled={loading}
        >
          <RefreshCw
            size={17}
            className={
              loading
                ? "spin"
                : ""
            }
          />

          <span
            className="refresh-text"
          >
            تحديث البيانات
          </span>
        </button>
      </section>

      {/* =================================================
          DATE PANEL
      ================================================= */}

      <section
        className="date-panel"
      >
        <div
          className="date-panel-top"
        >
          <button
            type="button"
            className="date-nav-btn"
            onClick={() =>
              changeDate(-1)
            }
          >
            <ArrowRight
              size={16}
            />

            <span>
              اليوم السابق
            </span>
          </button>

          <div
            className="date-display"
          >
            <div
              className="date-icon"
            >
              <CalendarDays
                size={20}
              />
            </div>

            <div>
              <div
                className="date-label"
              >
                تاريخ تسجيل
                الحضور
              </div>

              {/* Gregorian */}

              <div
                className="gregorian-date"
              >
                {formatGregorianDate(
                  selectedDate
                )}
              </div>

              {/* Hijri */}

              <div
                className="hijri-date"
              >
                <Sparkles
                  size={12}
                />

                {formatHijriDate(
                  selectedDate
                )}
              </div>
            </div>
          </div>

          <button
            type="button"
            className="date-nav-btn"
            onClick={() =>
              changeDate(1)
            }
            disabled={
              selectedDate ===
              getLocalDate()
            }
          >
            <span>
              اليوم التالي
            </span>

            <ArrowLeft
              size={16}
            />
          </button>
        </div>

        <div
          className="date-panel-bottom"
        >
          <input
            type="date"
            className="date-input"
            value={
              selectedDate
            }
            max={getLocalDate()}
            onChange={(e) => {
              if (
                e.target.value
              ) {
                setSelectedDate(
                  e.target.value
                );
              }
            }}
          />

          <button
            type="button"
            className={
              selectedDate ===
              getLocalDate()
                ? "today-btn active"
                : "today-btn"
            }
            onClick={
              goToToday
            }
          >
            اليوم
          </button>

          <div
            className="date-status"
          >
            {selectedDate ===
            getLocalDate() ? (
              <>
                <span
                  className="live-dot"
                />

                سجل اليوم
              </>
            ) : (
              <>
                <Clock3
                  size={12}
                />

                سجل سابق
              </>
            )}
          </div>
        </div>
      </section>

      {/* =================================================
          GLOBAL STATS
      ================================================= */}

      <section
        className="attendance-stats"
      >
        <SummaryCard
          icon={Users}
          title="إجمالي الطلاب"
          value={
            globalStats.total
          }
          subtitle="طلاب حلقاتك"
          tone="primary"
        />

        <SummaryCard
          icon={
            CheckCircle2
          }
          title="الحاضرون"
          value={
            globalStats.present
          }
          subtitle="حضور فعلي"
          tone="success"
        />

        <SummaryCard
          icon={XCircle}
          title="الغائبون"
          value={
            globalStats.absent
          }
          subtitle="غياب مسجل"
          tone="danger"
        />

        <SummaryCard
          icon={Clock3}
          title="المتأخرون"
          value={
            globalStats.late
          }
          subtitle="حضور متأخر"
          tone="warning"
        />

        <SummaryCard
          icon={
            CircleSlash2
          }
          title="المعتذرون"
          value={
            globalStats.excused
          }
          subtitle="غياب بعذر"
          tone="neutral"
        />

        <SummaryCard
          icon={
            FileCheck2
          }
          title="بانتظار التسجيل"
          value={
            globalStats.unrecorded
          }
          subtitle={`${globalStats.completion}% مكتمل`}
          tone="pending"
        />
      </section>

      {/* =================================================
          HALAQAT HEADER
      ================================================= */}

      <section>
        <div
          className="section-head"
        >
          <div>
            <h2>
              حلقاتي
            </h2>

            <p>
              اختر الحلقة لعرض
              طلابها وتسجيل
              الحضور.
            </p>
          </div>

          <div
            className="global-rate"
          >
            <div>
              نسبة الحضور
              العامة
            </div>

            <strong>
              {
                globalStats.percentage
              }
              %
            </strong>
          </div>
        </div>

        {/* =================================================
            HALAQAT
        ================================================= */}

        {halaqat.length ===
        0 ? (
          <EmptyHalaqat />
        ) : (
          <div
            className="halaqat-grid"
          >
            {halaqat.map(
              (halaqa) => {
                const stats =
                  getHalaqaStats(
                    halaqa.id
                  );

                const selected =
                  Number(
                    selectedHalaqa
                  ) ===
                  Number(
                    halaqa.id
                  );

                return (
                  <HalaqaCard
                    key={
                      halaqa.id
                    }
                    halaqa={
                      halaqa
                    }
                    stats={
                      stats
                    }
                    selected={
                      selected
                    }
                    onClick={() => {
                      setSelectedHalaqa(
                        String(
                          halaqa.id
                        )
                      );

                      setSearch("");

                      setShowOnlyUnrecorded(
                        false
                      );
                    }}
                  />
                );
              }
            )}
          </div>
        )}
      </section>

      {/* =================================================
          ATTENDANCE PANEL
      ================================================= */}

      {selectedHalaqa &&
        selectedHalaqaData && (
          <section
            className="register-panel"
          >
            {/* HEADER */}

            <div
              className="register-header"
            >
              <div>
                <div
                  className="register-eyebrow"
                >
                  <span
                    className="live-dot"
                  />

                  سجل الحضور
                </div>

                <h2>
                  {
                    selectedHalaqaData.name
                  }
                </h2>

                <div
                  className="halaqa-meta"
                >
                  <span>
                    <Building2
                      size={12}
                    />

                    {
                      selectedHalaqaData.mosque_name
                    }
                  </span>

                  {selectedHalaqaData.halaqa_period && (
                    <span>
                      <Clock3
                        size={12}
                      />

                      {HALAQA_PERIODS[
                        selectedHalaqaData
                          .halaqa_period
                      ] ||
                        "غير محدد"}
                    </span>
                  )}

                  <span>
                    <CalendarDays
                      size={12}
                    />

                    {formatHijriDate(
                      selectedDate
                    )}
                  </span>
                </div>
              </div>

              <div
                className="register-rate"
              >
                <strong>
                  {
                    selectedStats.attendancePercentage
                  }
                  %
                </strong>

                <span>
                  نسبة الحضور
                </span>
              </div>
            </div>

            {/* COMPLETION */}

            <div
              className="completion-block"
            >
              <div
                className="completion-head"
              >
                <span>
                  اكتمال تسجيل
                  الحلقة
                </span>

                <strong>
                  {
                    selectedStats.recorded
                  }
                  {" / "}
                  {
                    selectedStats.total
                  }
                </strong>
              </div>

              <div
                className="completion-track"
              >
                <div
                  className="completion-fill"
                  style={{
                    width:
                      `${selectedStats.completionPercentage}%`,
                  }}
                />
              </div>
            </div>

            {/* QUICK ACTIONS */}

            <div
              className="quick-actions"
            >
              <button
                type="button"
                className="bulk-btn safe"
                disabled={
                  bulkSaving ||
                  selectedStats.unrecorded ===
                    0
                }
                onClick={() =>
                  markAll(
                    "present",
                    true
                  )
                }
              >
                {bulkSaving ? (
                  <Loader2
                    size={15}
                    className="spin"
                  />
                ) : (
                  <Check
                    size={15}
                  />
                )}

                غير المسجلين
                حاضر
              </button>

              <button
                type="button"
                className="bulk-btn present"
                disabled={
                  bulkSaving ||
                  selectedStats.total ===
                    0
                }
                onClick={() =>
                  markAll(
                    "present"
                  )
                }
              >
                <CheckCircle2
                  size={15}
                />

                الجميع حاضر
              </button>

              <button
                type="button"
                className="bulk-btn absent"
                disabled={
                  bulkSaving ||
                  selectedStats.total ===
                    0
                }
                onClick={() =>
                  markAll(
                    "absent"
                  )
                }
              >
                <XCircle
                  size={15}
                />

                الجميع غائب
              </button>

              <button
                type="button"
                className={
                  showOnlyUnrecorded
                    ? "bulk-btn filter active"
                    : "bulk-btn filter"
                }
                onClick={() =>
                  setShowOnlyUnrecorded(
                    (current) =>
                      !current
                  )
                }
              >
                <Filter
                  size={15}
                />

                {showOnlyUnrecorded
                  ? "عرض الجميع"
                  : "غير المسجلين"}
              </button>
            </div>

            {/* SEARCH */}

            <div
              className="students-search-row"
            >
              <div
                className="attendance-search"
              >
                <Search
                  size={16}
                />

                <input
                  value={search}
                  onChange={(e) =>
                    setSearch(
                      e.target.value
                    )
                  }
                  placeholder="ابحث باسم الطالب أو رقمه أو جواله..."
                />

                {search && (
                  <button
                    type="button"
                    onClick={() =>
                      setSearch("")
                    }
                  >
                    <X
                      size={14}
                    />
                  </button>
                )}
              </div>

              <div
                className="results-count"
              >
                <strong>
                  {
                    filteredStudents.length
                  }
                </strong>

                <span>
                  طالب
                </span>
              </div>
            </div>

            {/* TABLE HEADER */}

            <div
              className="students-table-head"
            >
              <span>
                الطالب
              </span>

              <span>
                حالة الحضور
              </span>
            </div>

            {/* STUDENTS */}

            <div
              className="students-list"
            >
              {loading ? (
                <InlineLoading />
              ) : filteredStudents.length ===
                0 ? (
                <EmptyStudents
                  search={
                    search
                  }
                  onlyUnrecorded={
                    showOnlyUnrecorded
                  }
                />
              ) : (
                filteredStudents.map(
                  (
                    student,
                    index
                  ) => {
                    const record =
                      getAttendanceRecord(
                        student.student_id,
                        selectedHalaqa
                      );

                    return (
                      <StudentAttendanceRow
                        key={
                          student.student_id
                        }
                        student={
                          student
                        }
                        record={
                          record
                        }
                        index={
                          index
                        }
                        saving={
                          savingStudentId ===
                          student.student_id
                        }
                        onSave={
                          saveAttendance
                        }
                      />
                    );
                  }
                )
              )}
            </div>
          </section>
        )}
    </div>
  );
}

/* =========================================================
   SUMMARY CARD
========================================================= */

function SummaryCard({
  icon: Icon,
  title,
  value,
  subtitle,
  tone,
}) {
  return (
    <div
      className={`summary-card ${tone}`}
    >
      <div
        className="summary-icon"
      >
        <Icon size={18} />
      </div>

      <div>
        <div
          className="summary-label"
        >
          {title}
        </div>

        <strong
          className="summary-value"
        >
          {value}
        </strong>

        <div
          className="summary-subtitle"
        >
          {subtitle}
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   HALAQA CARD
========================================================= */

function HalaqaCard({
  halaqa,
  stats,
  selected,
  onClick,
}) {
  return (
    <button
      type="button"
      className={
        selected
          ? "halaqa-card selected"
          : "halaqa-card"
      }
      onClick={onClick}
    >
      <div
        className="halaqa-card-top"
      >
        <div
          className="halaqa-card-identity"
        >
          <div
            className="halaqa-icon"
          >
            <BookOpen
              size={17}
            />
          </div>

          <div>
            <h3>
              {halaqa.name}
            </h3>

            <div
              className="halaqa-mosque"
            >
              <Building2
                size={11}
              />

              {
                halaqa.mosque_name
              }
            </div>
          </div>
        </div>

        <AttendanceCircle
          percentage={
            stats.attendancePercentage
          }
        />
      </div>

      <div
        className="halaqa-card-meta"
      >
        <span>
          <Users
            size={11}
          />

          {stats.total} طالب
        </span>

        <span>
          <FileCheck2
            size={11}
          />

          {stats.recorded} مسجل
        </span>

        {halaqa.halaqa_period && (
          <span>
            <Clock3
              size={11}
            />

            {HALAQA_PERIODS[
              halaqa.halaqa_period
            ] ||
              "غير محدد"}
          </span>
        )}
      </div>

      <div
        className="halaqa-mini-stats"
      >
        <MiniStat
          value={
            stats.present
          }
          label="حاضر"
          tone="success"
        />

        <MiniStat
          value={
            stats.absent
          }
          label="غائب"
          tone="danger"
        />

        <MiniStat
          value={
            stats.late
          }
          label="متأخر"
          tone="warning"
        />

        <MiniStat
          value={
            stats.unrecorded
          }
          label="متبقي"
          tone="neutral"
        />
      </div>
    </button>
  );
}

/* =========================================================
   ATTENDANCE CIRCLE
========================================================= */

function AttendanceCircle({
  percentage,
}) {
  return (
    <div
      className="attendance-circle"
      style={{
        background:
          `conic-gradient(
            #0f5132 ${percentage}%,
            #edf1ee ${percentage}% 100%
          )`,
      }}
    >
      <div>
        <strong>
          {percentage}%
        </strong>

        <span>
          حضور
        </span>
      </div>
    </div>
  );
}

/* =========================================================
   MINI STAT
========================================================= */

function MiniStat({
  value,
  label,
  tone,
}) {
  return (
    <div
      className={`halaqa-mini-stat ${tone}`}
    >
      <strong>
        {value}
      </strong>

      <span>
        {label}
      </span>
    </div>
  );
}

/* =========================================================
   STUDENT ATTENDANCE ROW
========================================================= */

function StudentAttendanceRow({
  student,
  record,
  index,
  saving,
  onSave,
}) {
  return (
    <div
      className="attendance-student-row"
      style={{
        animationDelay:
          `${Math.min(
            index * 20,
            200
          )}ms`,
      }}
    >
      {/* Student */}

      <div
        className="attendance-student-info"
      >
        <div
          className="student-avatar"
        >
          <UserRound
            size={18}
          />
        </div>

        <div
          className="student-name-wrap"
        >
          <div
            className="student-name"
          >
            {
              student.full_name
            }
          </div>

          <div
            className="student-number"
          >
            رقم الطالب:{" "}
            {student.user_number ||
              "—"}

            {student.phone && (
              <>
                {" • "}
                {student.phone}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Actions */}

      <div
        className="attendance-status-actions"
      >
        <StatusBadge
          status={
            record?.status
          }
        />

        <AttendanceButton
          label="حاضر"
          icon={Check}
          active={
            record?.status ===
            "present"
          }
          disabled={saving}
          onClick={() =>
            onSave(
              student.student_id,
              "present"
            )
          }
          tone="success"
        />

        <AttendanceButton
          label="غائب"
          icon={X}
          active={
            record?.status ===
            "absent"
          }
          disabled={saving}
          onClick={() =>
            onSave(
              student.student_id,
              "absent"
            )
          }
          tone="danger"
        />

        <AttendanceButton
          label="متأخر"
          icon={Clock3}
          active={
            record?.status ===
            "late"
          }
          disabled={saving}
          onClick={() =>
            onSave(
              student.student_id,
              "late"
            )
          }
          tone="warning"
        />

        <AttendanceButton
          label="معتذر"
          icon={CircleSlash2}
          active={
            record?.status ===
            "excused"
          }
          disabled={saving}
          onClick={() =>
            onSave(
              student.student_id,
              "excused"
            )
          }
          tone="neutral"
        />

        {saving && (
          <Loader2
            size={15}
            className="spin saving-indicator"
          />
        )}
      </div>
    </div>
  );
}

/* =========================================================
   ATTENDANCE BUTTON
========================================================= */

function AttendanceButton({
  label,
  icon: Icon,
  active,
  disabled,
  onClick,
  tone,
}) {
  return (
    <button
      type="button"
      className={
        active
          ? `attendance-status-btn ${tone} active`
          : `attendance-status-btn ${tone}`
      }
      disabled={disabled}
      onClick={onClick}
      title={
        active
          ? `اضغط مرة أخرى لإلغاء "${label}"`
          : `تسجيل الطالب: ${label}`
      }
      aria-pressed={active}
    >
      <Icon size={13} />

      {label}
    </button>
  );
}

/* =========================================================
   STATUS BADGE
========================================================= */

function StatusBadge({
  status,
}) {
  if (!status) {
    return (
      <span
        className="status-badge unrecorded"
      >
        لم يسجل
      </span>
    );
  }

  return (
    <span
      className={`status-badge ${status}`}
    >
      {
        ATTENDANCE_STATUSES[
          status
        ]?.label
      }
    </span>
  );
}

/* =========================================================
   LOADING
========================================================= */

function LoadingScreen() {
  return (
    <div
      className="attendance-loading-screen"
    >
      <div
        className="loading-icon"
      >
        <Loader2
          size={27}
          className="spin"
        />
      </div>

      <h3>
        جارٍ تجهيز سجل
        الحضور
      </h3>

      <p>
        يتم تحميل حلقاتك
        وطلابك وبيانات الحضور...
      </p>
    </div>
  );
}

function InlineLoading() {
  return (
    <div
      className="inline-loading"
    >
      <Loader2
        size={22}
        className="spin"
      />

      جاري تحديث سجل
      الحضور...
    </div>
  );
}

/* =========================================================
   EMPTY
========================================================= */

function EmptyHalaqat() {
  return (
    <div
      className="empty-attendance"
    >
      <div
        className="empty-icon"
      >
        <BookOpen
          size={26}
        />
      </div>

      <h3>
        لا توجد حلقات
        مرتبطة بك
      </h3>

      <p>
        يجب أن تقوم الإدارة
        بربط حساب المعلم بإحدى
        الحلقات أولًا.
      </p>
    </div>
  );
}

function EmptyStudents({
  search,
  onlyUnrecorded,
}) {
  return (
    <div
      className="empty-attendance students-empty"
    >
      <div
        className="empty-icon"
      >
        {onlyUnrecorded ? (
          <CheckCircle2
            size={25}
          />
        ) : (
          <Users
            size={25}
          />
        )}
      </div>

      <h3>
        {search
          ? "لا توجد نتائج"
          : onlyUnrecorded
          ? "اكتمل تسجيل الحضور"
          : "لا يوجد طلاب"}
      </h3>

      <p>
        {search
          ? "لم نجد طالبًا مطابقًا للبحث."
          : onlyUnrecorded
          ? "تم تسجيل حالة جميع طلاب هذه الحلقة."
          : "لا يوجد طلاب نشطون مرتبطون بهذه الحلقة."}
      </p>
    </div>
  );
}

/* =========================================================
   STATUS LABEL
========================================================= */

function getStatusLabel(
  status
) {
  return (
    ATTENDANCE_STATUSES[
      status
    ]?.label || status
  );
}

/* =========================================================
   STYLES
========================================================= */

function PageStyles() {
  return (
    <style>
      {`
        .attendance-page {
          width: 100%;
          max-width: 1600px;
          margin: 0 auto;
          color: #0f172a;
        }

        .attendance-page * {
          box-sizing: border-box;
        }

        .attendance-page button,
        .attendance-page input {
          font-family: inherit;
        }

        /* =============================================
           HERO
        ============================================= */

        .attendance-hero {
          position: relative;
          overflow: hidden;

          display: flex;
          align-items: center;
          justify-content: space-between;

          gap: 18px;

          margin-bottom: 18px;
          padding: 22px 24px;

          border:
            1px solid
            rgba(15,81,50,.1);

          border-radius: 23px;

          background:
            linear-gradient(
              135deg,
              #ffffff 0%,
              #f5faf7 100%
            );

          box-shadow:
            0 12px 35px
            rgba(15,81,50,.05);
        }

        .attendance-hero::after {
          content: "";

          position: absolute;

          width: 240px;
          height: 240px;

          left: -130px;
          top: -140px;

          border-radius: 50%;

          background:
            radial-gradient(
              circle,
              rgba(201,162,39,.13),
              transparent 68%
            );

          pointer-events: none;
        }

        .attendance-hero-content {
          position: relative;
          z-index: 2;

          display: flex;
          align-items: center;

          gap: 12px;

          min-width: 0;
        }

        .attendance-hero-icon {
          width: 48px;
          height: 48px;

          flex: 0 0 48px;

          border-radius: 15px;

          display: flex;
          align-items: center;
          justify-content: center;

          color: #ffffff;

          background:
            linear-gradient(
              135deg,
              #0f5132,
              #0f766e
            );

          box-shadow:
            0 9px 22px
            rgba(15,81,50,.17);
        }

        .attendance-eyebrow {
          display: flex;
          align-items: center;

          gap: 5px;

          margin-bottom: 3px;

          color: #0f766e;

          font-size: 9px;
          font-weight: 900;
        }

        .attendance-title {
          margin: 0;

          color: #173d2b;

          font-size: 25px;
          font-weight: 950;

          line-height: 1.25;
        }

        .attendance-subtitle {
          margin: 5px 0 0;

          color: #7a867f;

          font-size: 11px;
          line-height: 1.7;
        }

        .attendance-refresh {
          position: relative;
          z-index: 2;

          height: 43px;

          padding: 0 14px;

          border:
            1px solid #e0e7e3;

          border-radius: 12px;

          display: inline-flex;
          align-items: center;
          justify-content: center;

          gap: 6px;

          color: #0f5132;
          background: #ffffff;

          font-size: 10px;
          font-weight: 850;

          cursor: pointer;
        }

        .attendance-refresh:hover {
          background: #f4faf6;
        }

        .attendance-refresh:disabled {
          opacity: .6;
          cursor: wait;
        }

        /* =============================================
           DATE
        ============================================= */

        .date-panel {
          overflow: hidden;

          margin-bottom: 18px;

          border:
            1px solid #e2e9e5;

          border-radius: 21px;

          background: #ffffff;

          box-shadow:
            0 7px 25px
            rgba(15,23,42,.035);
        }

        .date-panel-top {
          min-height: 118px;

          display: grid;

          grid-template-columns:
            150px
            minmax(0,1fr)
            150px;

          align-items: center;

          gap: 14px;

          padding: 16px 18px;
        }

        .date-nav-btn {
          min-height: 42px;

          border:
            1px solid #dfe6e2;

          border-radius: 12px;

          display: inline-flex;
          align-items: center;
          justify-content: center;

          gap: 6px;

          color: #59645d;
          background: #ffffff;

          font-size: 9px;
          font-weight: 850;

          cursor: pointer;

          transition:
            background .18s ease,
            transform .18s ease;
        }

        .date-nav-btn:hover:not(:disabled) {
          background: #f5faf7;

          transform:
            translateY(-1px);
        }

        .date-nav-btn:disabled {
          opacity: .3;
          cursor: not-allowed;
        }

        .date-display {
          display: flex;
          align-items: center;
          justify-content: center;

          gap: 11px;

          min-width: 0;
        }

        .date-icon {
          width: 46px;
          height: 46px;

          flex: 0 0 46px;

          border-radius: 14px;

          display: flex;
          align-items: center;
          justify-content: center;

          color: #0f5132;
          background: #edf7f1;
        }

        .date-label {
          margin-bottom: 4px;

          color: #8c9690;

          font-size: 8px;
          font-weight: 750;
        }

        .gregorian-date {
          color: #173d2b;

          font-size: 15px;
          font-weight: 950;
        }

        .hijri-date {
          display: flex;
          align-items: center;

          gap: 5px;

          margin-top: 5px;

          color: #9a741f;

          font-size: 10px;
          font-weight: 850;
        }

        .date-panel-bottom {
          display: flex;
          align-items: center;
          justify-content: center;

          gap: 7px;

          padding: 11px 16px;

          border-top:
            1px solid #edf1ef;

          background: #fbfdfc;
        }

        .date-input {
          height: 36px;

          padding: 0 9px;

          border:
            1px solid #dce4df;

          border-radius: 9px;

          outline: none;

          color: #33443a;
          background: #ffffff;

          font-size: 9px;
        }

        .today-btn {
          height: 36px;

          padding: 0 14px;

          border:
            1px solid #0f5132;

          border-radius: 9px;

          color: #0f5132;
          background: #ffffff;

          font-size: 9px;
          font-weight: 900;

          cursor: pointer;
        }

        .today-btn.active {
          color: #ffffff;
          background: #0f5132;
        }

        .date-status {
          min-height: 30px;

          display: inline-flex;
          align-items: center;

          gap: 5px;

          padding: 0 9px;

          border-radius: 999px;

          color: #647168;
          background: #f1f5f3;

          font-size: 8px;
          font-weight: 800;
        }

        .live-dot {
          width: 6px;
          height: 6px;

          flex: 0 0 6px;

          border-radius: 50%;

          background: #22a06b;

          box-shadow:
            0 0 0 4px
            rgba(34,160,107,.09);
        }

        /* =============================================
           STATS
        ============================================= */

        .attendance-stats {
          display: grid;

          grid-template-columns:
            repeat(
              6,
              minmax(0,1fr)
            );

          gap: 10px;

          margin-bottom: 23px;
        }

        .summary-card {
          min-width: 0;

          display: flex;
          align-items: center;

          gap: 10px;

          padding: 14px;

          border:
            1px solid #e6ebe8;

          border-radius: 17px;

          background: #ffffff;

          box-shadow:
            0 6px 20px
            rgba(15,23,42,.035);
        }

        .summary-icon {
          width: 38px;
          height: 38px;

          flex: 0 0 38px;

          border-radius: 11px;

          display: flex;
          align-items: center;
          justify-content: center;
        }

        .summary-card.primary
        .summary-icon {
          color: #0f5132;
          background: #edf7f1;
        }

        .summary-card.success
        .summary-icon {
          color: #198754;
          background: #eaf7ef;
        }

        .summary-card.danger
        .summary-icon {
          color: #b42318;
          background: #fff0ef;
        }

        .summary-card.warning
        .summary-icon {
          color: #927536;
          background: #fff8e7;
        }

        .summary-card.neutral
        .summary-icon {
          color: #64748b;
          background: #f1f3f2;
        }

        .summary-card.pending
        .summary-icon {
          color: #7c5b16;
          background: #fbf5e7;
        }

        .summary-label {
          color: #808a83;

          font-size: 8px;
          font-weight: 750;
        }

        .summary-value {
          display: block;

          margin-top: 2px;

          color: #173d2b;

          font-size: 20px;
          font-weight: 950;
        }

        .summary-subtitle {
          margin-top: 2px;

          color: #a0a7a2;

          font-size: 7px;
        }

        /* =============================================
           SECTION HEADER
        ============================================= */

        .section-head {
          display: flex;
          align-items: center;
          justify-content: space-between;

          gap: 12px;

          margin-bottom: 11px;
        }

        .section-head h2 {
          margin: 0;

          color: #173d2b;

          font-size: 17px;
          font-weight: 950;
        }

        .section-head p {
          margin: 3px 0 0;

          color: #8a948e;

          font-size: 9px;
        }

        .global-rate {
          display: flex;
          align-items: center;

          gap: 7px;

          color: #89948d;

          font-size: 8px;
        }

        .global-rate strong {
          color: #0f5132;

          font-size: 15px;
          font-weight: 950;
        }

        /* =============================================
           HALAQAT
        ============================================= */

        .halaqat-grid {
          display: grid;

          grid-template-columns:
            repeat(
              auto-fit,
              minmax(
                min(100%,280px),
                1fr
              )
            );

          gap: 12px;

          margin-bottom: 23px;
        }

        .halaqa-card {
          width: 100%;

          overflow: hidden;

          position: relative;

          padding: 15px;

          border:
            1px solid #e2e8e4;

          border-radius: 18px;

          text-align: right;

          background: #ffffff;

          box-shadow:
            0 5px 18px
            rgba(15,23,42,.035);

          cursor: pointer;

          transition:
            transform .2s ease,
            border-color .2s ease,
            box-shadow .2s ease;
        }

        .halaqa-card:hover {
          transform:
            translateY(-2px);

          border-color:
            rgba(15,81,50,.2);

          box-shadow:
            0 12px 28px
            rgba(15,81,50,.075);
        }

        .halaqa-card.selected {
          border:
            1.5px solid #0f5132;

          box-shadow:
            0 12px 30px
            rgba(15,81,50,.1);
        }

        .halaqa-card.selected::before {
          content: "";

          position: absolute;

          top: 0;
          right: 0;
          left: 0;

          height: 3px;

          background:
            linear-gradient(
              90deg,
              #0f5132,
              #c9a227
            );
        }

        .halaqa-card-top {
          display: flex;
          align-items: center;
          justify-content: space-between;

          gap: 10px;
        }

        .halaqa-card-identity {
          min-width: 0;

          display: flex;
          align-items: center;

          gap: 9px;
        }

        .halaqa-icon {
          width: 37px;
          height: 37px;

          flex: 0 0 37px;

          border-radius: 11px;

          display: flex;
          align-items: center;
          justify-content: center;

          color: #0f5132;
          background: #edf7f1;
        }

        .halaqa-card h3 {
          margin: 0;

          max-width: 180px;

          overflow: hidden;

          color: #173d2b;

          font-size: 13px;
          font-weight: 950;

          white-space: nowrap;
          text-overflow: ellipsis;
        }

        .halaqa-mosque {
          display: flex;
          align-items: center;

          gap: 4px;

          margin-top: 3px;

          color: #909993;

          font-size: 8px;
        }

        .attendance-circle {
          width: 58px;
          height: 58px;

          flex: 0 0 58px;

          border-radius: 50%;

          display: flex;
          align-items: center;
          justify-content: center;
        }

        .attendance-circle > div {
          width: 45px;
          height: 45px;

          border-radius: 50%;

          display: flex;
          align-items: center;
          justify-content: center;
          flex-direction: column;

          background: #ffffff;
        }

        .attendance-circle strong {
          color: #0f5132;

          font-size: 11px;
          font-weight: 950;
        }

        .attendance-circle span {
          margin-top: 1px;

          color: #8c958f;

          font-size: 6px;
        }

        .halaqa-card-meta {
          display: flex;
          flex-wrap: wrap;

          gap: 5px 10px;

          margin-top: 11px;

          color: #7d8881;

          font-size: 7px;
        }

        .halaqa-card-meta span {
          display: inline-flex;
          align-items: center;

          gap: 3px;
        }

        .halaqa-mini-stats {
          display: grid;

          grid-template-columns:
            repeat(
              4,
              minmax(0,1fr)
            );

          gap: 5px;

          margin-top: 11px;
        }

        .halaqa-mini-stat {
          padding: 6px 3px;

          border-radius: 8px;

          text-align: center;
        }

        .halaqa-mini-stat.success {
          background: #f0f8f3;
        }

        .halaqa-mini-stat.danger {
          background: #fff3f2;
        }

        .halaqa-mini-stat.warning {
          background: #fff9ea;
        }

        .halaqa-mini-stat.neutral {
          background: #f4f5f4;
        }

        .halaqa-mini-stat strong {
          display: block;

          color: #36443b;

          font-size: 11px;
          font-weight: 950;
        }

        .halaqa-mini-stat span {
          display: block;

          margin-top: 1px;

          color: #8d958f;

          font-size: 6px;
        }

        /* =============================================
           REGISTER PANEL
        ============================================= */

        .register-panel {
          overflow: hidden;

          border:
            1px solid #e2e8e4;

          border-radius: 20px;

          background: #ffffff;

          box-shadow:
            0 9px 30px
            rgba(15,23,42,.045);

          animation:
            attendanceFadeUp
            .25s ease;
        }

        .register-header {
          display: flex;
          align-items: center;
          justify-content: space-between;

          gap: 14px;

          padding: 18px;

          border-bottom:
            1px solid #edf1ef;
        }

        .register-eyebrow {
          display: flex;
          align-items: center;

          gap: 5px;

          margin-bottom: 4px;

          color: #0f766e;

          font-size: 8px;
          font-weight: 900;
        }

        .register-header h2 {
          margin: 0;

          color: #173d2b;

          font-size: 19px;
          font-weight: 950;
        }

        .halaqa-meta {
          display: flex;
          flex-wrap: wrap;

          gap: 5px 12px;

          margin-top: 6px;

          color: #838e87;

          font-size: 8px;
        }

        .halaqa-meta span {
          display: inline-flex;
          align-items: center;

          gap: 4px;
        }

        .register-rate {
          width: 70px;
          height: 70px;

          flex: 0 0 70px;

          border-radius: 50%;

          display: flex;
          align-items: center;
          justify-content: center;
          flex-direction: column;

          color: #0f5132;
          background: #edf7f1;
        }

        .register-rate strong {
          font-size: 17px;
          font-weight: 950;
        }

        .register-rate span {
          margin-top: 1px;

          color: #7e8a82;

          font-size: 6px;
        }

        /* =============================================
           COMPLETION
        ============================================= */

        .completion-block {
          padding: 12px 18px;

          border-bottom:
            1px solid #edf1ef;

          background: #fbfdfc;
        }

        .completion-head {
          display: flex;
          justify-content: space-between;

          gap: 10px;

          margin-bottom: 7px;

          color: #77837b;

          font-size: 8px;
        }

        .completion-head strong {
          color: #0f5132;
        }

        .completion-track {
          width: 100%;
          height: 6px;

          overflow: hidden;

          border-radius: 999px;

          background: #e7eeea;
        }

        .completion-fill {
          height: 100%;

          border-radius: 999px;

          background:
            linear-gradient(
              90deg,
              #0f5132,
              #18a06b
            );

          transition:
            width .3s ease;
        }

        /* =============================================
           QUICK ACTIONS
        ============================================= */

        .quick-actions {
          display: flex;
          flex-wrap: wrap;

          gap: 7px;

          padding: 12px 18px;

          border-bottom:
            1px solid #edf1ef;
        }

        .bulk-btn {
          min-height: 36px;

          padding: 0 11px;

          border-radius: 9px;

          display: inline-flex;
          align-items: center;
          justify-content: center;

          gap: 5px;

          font-size: 8px;
          font-weight: 850;

          cursor: pointer;
        }

        .bulk-btn.safe {
          border:
            1px solid #b9dcc7;

          color: #0f5132;
          background: #eaf7ef;
        }

        .bulk-btn.present {
          border:
            1px solid #cfe5d7;

          color: #166534;
          background: #f1faf4;
        }

        .bulk-btn.absent {
          border:
            1px solid #efcfcc;

          color: #b42318;
          background: #fff4f3;
        }

        .bulk-btn.filter {
          border:
            1px solid #dfe5e1;

          color: #667169;
          background: #ffffff;
        }

        .bulk-btn.filter.active {
          border-color:
            #a9cfba;

          color: #0f5132;
          background: #edf7f1;
        }

        .bulk-btn:disabled {
          opacity: .4;
          cursor: not-allowed;
        }

        /* =============================================
           SEARCH
        ============================================= */

        .students-search-row {
          display: flex;
          align-items: center;

          gap: 11px;

          padding: 13px 18px;

          border-bottom:
            1px solid #edf1ef;

          background: #ffffff;
        }

        .attendance-search {
          position: relative;

          flex: 1;
        }

        .attendance-search > svg {
          position: absolute;

          right: 12px;
          top: 50%;

          transform:
            translateY(-50%);

          color: #8c9690;

          pointer-events: none;
        }

        .attendance-search input {
          width: 100%;
          height: 40px;

          padding:
            0 38px 0 35px;

          border:
            1px solid #dce4df;

          border-radius: 10px;

          outline: none;

          color: #33443a;
          background: #fbfdfc;

          font-size: 9px;
        }

        .attendance-search input:focus {
          border-color:
            rgba(15,81,50,.42);

          box-shadow:
            0 0 0 3px
            rgba(15,81,50,.05);
        }

        .attendance-search button {
          position: absolute;

          left: 6px;
          top: 50%;

          width: 27px;
          height: 27px;

          transform:
            translateY(-50%);

          border: none;
          border-radius: 7px;

          display: flex;
          align-items: center;
          justify-content: center;

          color: #6f7a73;
          background: #edf1ef;

          cursor: pointer;
        }

        .results-count {
          min-width: 60px;

          text-align: center;

          color: #8a958e;

          font-size: 7px;
        }

        .results-count strong {
          display: block;

          color: #173d2b;

          font-size: 15px;
        }

        /* =============================================
           STUDENTS TABLE
        ============================================= */

        .students-table-head {
          display: grid;

          grid-template-columns:
            minmax(220px,1fr)
            minmax(470px,auto);

          gap: 15px;

          padding: 8px 14px;

          color: #9aa39d;
          background: #f8faf9;

          border-bottom:
            1px solid #edf1ef;

          font-size: 7px;
          font-weight: 850;
        }

        .students-table-head span:last-child {
          text-align: left;
        }

        .students-list {
          min-height: 100px;
        }

        .attendance-student-row {
          display: grid;

          grid-template-columns:
            minmax(220px,1fr)
            minmax(470px,auto);

          gap: 15px;

          align-items: center;

          padding: 11px 14px;

          border-bottom:
            1px solid #eef1ef;

          background: #ffffff;

          animation:
            attendanceFadeUp
            .25s ease both;

          transition:
            background .15s ease;
        }

        .attendance-student-row:last-child {
          border-bottom: none;
        }

        .attendance-student-row:hover {
          background: #fbfdfc;
        }

        .attendance-student-info {
          display: flex;
          align-items: center;

          gap: 9px;

          min-width: 0;
        }

        .student-avatar {
          width: 38px;
          height: 38px;

          flex: 0 0 38px;

          border-radius: 11px;

          display: flex;
          align-items: center;
          justify-content: center;

          color: #0f5132;
          background: #edf7f1;
        }

        .student-name-wrap {
          min-width: 0;
        }

        .student-name {
          overflow: hidden;

          color: #26382e;

          font-size: 11px;
          font-weight: 900;

          white-space: nowrap;
          text-overflow: ellipsis;
        }

        .student-number {
          overflow: hidden;

          margin-top: 2px;

          color: #969e99;

          font-size: 7px;

          white-space: nowrap;
          text-overflow: ellipsis;
        }

        .attendance-status-actions {
          display: flex;
          align-items: center;
          justify-content: flex-end;

          gap: 5px;
        }

        .status-badge {
          min-width: 61px;

          padding: 5px 7px;

          border-radius: 999px;

          text-align: center;

          font-size: 7px;
          font-weight: 900;
        }

        .status-badge.present {
          color: #047857;
          background: #e9f8ef;
        }

        .status-badge.absent {
          color: #b42318;
          background: #fff0ef;
        }

        .status-badge.late {
          color: #927536;
          background: #fff8e7;
        }

        .status-badge.excused {
          color: #64748b;
          background: #f1f3f2;
        }

        .status-badge.unrecorded {
          color: #89938c;
          background: #f4f5f4;
        }

        .attendance-status-btn {
          min-width: 65px;
          min-height: 32px;

          padding: 0 7px;

          border:
            1px solid #dfe5e1;

          border-radius: 8px;

          display: inline-flex;
          align-items: center;
          justify-content: center;

          gap: 4px;

          color: #6d7871;
          background: #ffffff;

          font-size: 7px;
          font-weight: 800;

          cursor: pointer;

          transition:
            transform .15s ease,
            background .15s ease;
        }

        .attendance-status-btn:hover:not(:disabled) {
          transform:
            translateY(-1px);
        }

        .attendance-status-btn.success.active {
          border-color: #0f5132;

          color: #0f5132;
          background: #e8f6ed;
        }

        .attendance-status-btn.danger.active {
          border-color: #b42318;

          color: #b42318;
          background: #fff0ef;
        }

        .attendance-status-btn.warning.active {
          border-color: #c79d43;

          color: #927536;
          background: #fff8e6;
        }

        .attendance-status-btn.neutral.active {
          border-color: #78847d;

          color: #59635d;
          background: #eef0ef;
        }

        .attendance-status-btn:disabled {
          opacity: .55;
          cursor: wait;
        }

        .saving-indicator {
          color: #0f5132;
        }

        /* =============================================
           EMPTY / LOADING
        ============================================= */

        .attendance-loading-screen {
          min-height: 60vh;

          display: flex;
          align-items: center;
          justify-content: center;
          flex-direction: column;

          text-align: center;
        }

        .loading-icon {
          width: 60px;
          height: 60px;

          margin-bottom: 12px;

          border-radius: 17px;

          display: flex;
          align-items: center;
          justify-content: center;

          color: #0f5132;
          background: #edf7f1;
        }

        .attendance-loading-screen h3 {
          margin: 0;

          color: #173d2b;

          font-size: 14px;
        }

        .attendance-loading-screen p {
          margin: 5px 0 0;

          color: #8d9690;

          font-size: 9px;
        }

        .inline-loading {
          min-height: 140px;

          display: flex;
          align-items: center;
          justify-content: center;

          gap: 8px;

          color: #738078;

          font-size: 9px;
          font-weight: 800;
        }

        .empty-attendance {
          padding: 45px 20px;

          border:
            1px dashed #cad7cf;

          border-radius: 18px;

          text-align: center;

          background: #ffffff;
        }

        .students-empty {
          border: none;
          border-radius: 0;
        }

        .empty-icon {
          width: 54px;
          height: 54px;

          margin:
            0 auto 11px;

          border-radius: 16px;

          display: flex;
          align-items: center;
          justify-content: center;

          color: #0f5132;
          background: #edf7f1;
        }

        .empty-attendance h3 {
          margin: 0;

          color: #37463d;

          font-size: 13px;
        }

        .empty-attendance p {
          margin: 5px 0 0;

          color: #8b958f;

          font-size: 9px;
        }

        /* =============================================
           ANIMATION
        ============================================= */

        @keyframes attendanceSpin {
          to {
            transform:
              rotate(360deg);
          }
        }

        .spin {
          animation:
            attendanceSpin
            .8s linear infinite;
        }

        @keyframes attendanceFadeUp {
          from {
            opacity: 0;

            transform:
              translateY(5px);
          }

          to {
            opacity: 1;

            transform:
              translateY(0);
          }
        }

        /* =============================================
           TABLET
        ============================================= */

        @media (
          max-width: 1150px
        ) {
          .attendance-stats {
            grid-template-columns:
              repeat(
                3,
                minmax(0,1fr)
              );
          }

          .students-table-head {
            display: none;
          }

          .attendance-student-row {
            grid-template-columns:
              1fr;

            gap: 10px;
          }

          .attendance-status-actions {
            justify-content:
              flex-start;

            flex-wrap: wrap;
          }
        }

        /* =============================================
           MOBILE
        ============================================= */

        @media (
          max-width: 720px
        ) {
          .attendance-hero {
            padding: 17px;

            border-radius: 19px;
          }

          .attendance-hero-icon {
            width: 42px;
            height: 42px;

            flex-basis: 42px;
          }

          .attendance-title {
            font-size: 20px;
          }

          .attendance-subtitle {
            display: none;
          }

          .attendance-refresh {
            width: 42px;

            padding: 0;
          }

          .refresh-text {
            display: none;
          }

          /* DATE */

          .date-panel-top {
            grid-template-columns:
              42px
              minmax(0,1fr)
              42px;

            gap: 6px;

            padding: 13px 10px;
          }

          .date-nav-btn {
            width: 42px;
            min-height: 42px;

            padding: 0;
          }

          .date-nav-btn span {
            display: none;
          }

          .date-display {
            gap: 7px;

            justify-content:
              flex-start;
          }

          .date-icon {
            width: 39px;
            height: 39px;

            flex-basis: 39px;
          }

          .gregorian-date {
            font-size: 11px;
          }

          .hijri-date {
            font-size: 8px;
          }

          .date-panel-bottom {
            flex-wrap: wrap;
          }

          /* STATS */

          .attendance-stats {
            grid-template-columns:
              repeat(
                2,
                minmax(0,1fr)
              );

            gap: 7px;
          }

          .summary-card {
            padding: 11px;

            gap: 8px;
          }

          .summary-icon {
            width: 34px;
            height: 34px;

            flex-basis: 34px;
          }

          .summary-value {
            font-size: 17px;
          }

          /* SECTION */

          .section-head {
            align-items:
              flex-end;
          }

          /* REGISTER */

          .register-header {
            align-items:
              flex-start;

            padding: 15px;
          }

          .register-rate {
            width: 60px;
            height: 60px;

            flex-basis: 60px;
          }

          .register-rate strong {
            font-size: 14px;
          }

          .halaqa-meta {
            flex-direction: column;

            gap: 4px;
          }

          .quick-actions {
            display: grid;

            grid-template-columns:
              1fr 1fr;

            padding:
              11px 14px;
          }

          .bulk-btn {
            width: 100%;
          }

          .students-search-row {
            padding:
              11px 14px;
          }

          .attendance-student-row {
            padding:
              13px 12px;
          }

          .attendance-status-actions {
            display: grid;

            grid-template-columns:
              repeat(
                2,
                minmax(0,1fr)
              );

            gap: 6px;
          }

          .status-badge {
            grid-column:
              1 / -1;

            width: 100%;
          }

          .attendance-status-btn {
            width: 100%;

            min-height: 36px;
          }

          .saving-indicator {
            grid-column:
              1 / -1;

            margin: auto;
          }
        }

        /* =============================================
           SMALL MOBILE
        ============================================= */

        @media (
          max-width: 430px
        ) {
          .attendance-title {
            font-size: 18px;
          }

          .attendance-eyebrow {
            font-size: 8px;
          }

          .date-display {
            min-width: 0;
          }

          .date-icon {
            display: none;
          }

          .date-label {
            font-size: 7px;
          }

          .gregorian-date {
            overflow: hidden;

            font-size: 9px;

            white-space: nowrap;
            text-overflow: ellipsis;
          }

          .hijri-date {
            overflow: hidden;

            font-size: 7px;

            white-space: nowrap;
            text-overflow: ellipsis;
          }

          .attendance-stats {
            grid-template-columns:
              repeat(
                2,
                minmax(0,1fr)
              );
          }

          .global-rate div {
            display: none;
          }

          .halaqa-card {
            padding: 13px;
          }

          .halaqa-mini-stats {
            gap: 4px;
          }
        }
      `}
    </style>
  );
}
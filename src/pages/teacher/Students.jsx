// src/pages/teacher/Students.jsx

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  AlertTriangle,
  BookOpen,
  Building2,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  CircleSlash,
  Clock3,
  Edit3,
  GraduationCap,
  Home,
  Loader2,
  MapPin,
  Phone,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
  ShieldCheck,
  Sparkles,
  Trash2,
  UserCheck,
  UserRound,
  Users,
  UserX,
  VenusAndMars,
  Video,
  X,
} from "lucide-react";

import { supabase } from "../../lib/supabase";
import ConfirmModal from "../../components/ConfirmModal";
import { showToast } from "../../components/Toast";

/* =========================================================
   Constants
========================================================= */

const DAYS = [
  { value: "saturday", label: "السبت" },
  { value: "sunday", label: "الأحد" },
  { value: "monday", label: "الإثنين" },
  { value: "tuesday", label: "الثلاثاء" },
  { value: "wednesday", label: "الأربعاء" },
  { value: "thursday", label: "الخميس" },
  { value: "friday", label: "الجمعة" },
];

const EDUCATION_STAGES = [
  { value: "primary", label: "ابتدائي" },
  { value: "middle", label: "متوسط" },
  { value: "secondary", label: "ثانوي" },
  { value: "university", label: "جامعي" },
  { value: "other", label: "غير ذلك" },
];

const LEARNING_GOALS = [
  { value: "quran", label: "القرآن الكريم" },
  { value: "noorania", label: "القاعدة النورانية" },
  {
    value: "noorania_quran",
    label: "القرآن والقاعدة النورانية",
  },
  { value: "other", label: "غير ذلك" },
];

const RECITATION_MODES = [
  { value: "regular", label: "حضوري" },
  { value: "remote", label: "عن بُعد" },
  { value: "both", label: "حضوري وعن بُعد" },
];

const GENDERS = [
  { value: "male", label: "ذكر" },
  { value: "female", label: "أنثى" },
];

const GUARDIAN_RELATIONS = [
  { value: "الأب", label: "الأب" },
  { value: "الأم", label: "الأم" },
  { value: "الأخ", label: "الأخ" },
  { value: "العم", label: "العم" },
  { value: "الخال", label: "الخال" },
  { value: "الجد", label: "الجد" },
  { value: "ولي آخر", label: "ولي آخر" },
];

const HALAQA_PERIODS = {
  after_fajr: "بعد الفجر",
  after_dhuhr: "بعد الظهر",
  after_asr: "بعد العصر",
  after_maghrib: "بعد المغرب",
  after_isha: "بعد العشاء",
};

const EMPTY_FORM = {
  full_name: "",
  user_number: "",
  phone: "",

  birth_date: "",
  gender: "",
  nationality: "",
  residence_address: "",

  guardian_name: "",
  guardian_phone: "",
  guardian_relation: "",

  education_stage: "",
  education_grade: "",

  learning_goal: "",
  recitation_mode: "",
  recitation_days: [],
  preferred_recitation_time: "",

  halaqa_id: "",
  notes: "",
};

/* =========================================================
   Helpers
========================================================= */

function getToday() {
  const date = new Date();

  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

function normalizeText(value) {
  return String(value ?? "").trim();
}

function getAgeFromBirthDate(value) {
  if (!value) return null;

  const birth = new Date(`${value}T12:00:00`);

  if (Number.isNaN(birth.getTime())) {
    return null;
  }

  const today = new Date();

  let age =
    today.getFullYear() -
    birth.getFullYear();

  const beforeBirthday =
    today.getMonth() <
      birth.getMonth() ||
    (today.getMonth() ===
      birth.getMonth() &&
      today.getDate() <
        birth.getDate());

  if (beforeBirthday) {
    age -= 1;
  }

  return age >= 0 ? age : null;
}

function getDaysAgo(days) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
}

function needsFollowUp(lastRecitation) {
  if (!lastRecitation) {
    return true;
  }

  const last = new Date(lastRecitation);

  if (Number.isNaN(last.getTime())) {
    return false;
  }

  return last < getDaysAgo(7);
}

function formatNumber(value) {
  try {
    return new Intl.NumberFormat(
      "ar-SA"
    ).format(Number(value) || 0);
  } catch {
    return String(Number(value) || 0);
  }
}

function formatGregorianDate(value) {
  if (!value) {
    return "لا يوجد";
  }

  try {
    const text =
      String(value).slice(0, 10);

    const [
      year,
      month,
      day,
    ] = text
      .split("-")
      .map(Number);

    const date =
      new Date(
        year,
        month - 1,
        day,
        12,
        0,
        0
      );

    return new Intl.DateTimeFormat(
      "ar-SA-u-ca-gregory",
      {
        year: "numeric",
        month: "short",
        day: "numeric",
      }
    ).format(date);
  } catch {
    return String(value);
  }
}

function formatHijriDate(value) {
  if (!value) {
    return "";
  }

  try {
    const text =
      String(value).slice(0, 10);

    const [
      year,
      month,
      day,
    ] = text
      .split("-")
      .map(Number);

    const date =
      new Date(
        year,
        month - 1,
        day,
        12,
        0,
        0
      );

    return new Intl.DateTimeFormat(
      "ar-SA-u-ca-islamic-umalqura",
      {
        year: "numeric",
        month: "short",
        day: "numeric",
      }
    ).format(date);
  } catch {
    return "";
  }
}

function getLabel(
  options,
  value,
  fallback = "غير محدد"
) {
  return (
    options.find(
      (item) =>
        item.value === value
    )?.label ||
    fallback
  );
}

function getAttendanceRate(student) {
  const total =
    Number(student.present || 0) +
    Number(student.absent || 0) +
    Number(student.late || 0) +
    Number(student.excused || 0);

  if (!total) {
    return 0;
  }

  return Math.round(
    ((Number(student.present || 0) +
      Number(student.late || 0)) /
      total) *
      100
  );
}

function getInitials(name) {
  const parts =
    normalizeText(name)
      .split(/\s+/)
      .filter(Boolean);

  if (!parts.length) {
    return "ط";
  }

  if (parts.length === 1) {
    return parts[0].slice(0, 1);
  }

  return (
    parts[0].slice(0, 1) +
    parts[
      parts.length - 1
    ].slice(0, 1)
  );
}

/* =========================================================
   Page
========================================================= */

export default function Students() {
  const [
    teacher,
    setTeacher,
  ] =
    useState(null);

  const [
    teacherHalaqaIds,
    setTeacherHalaqaIds,
  ] =
    useState([]);

  const [
    students,
    setStudents,
  ] =
    useState([]);

  const [
    halaqat,
    setHalaqat,
  ] =
    useState([]);

  const [
    initialLoading,
    setInitialLoading,
  ] =
    useState(true);

  const [
    refreshing,
    setRefreshing,
  ] =
    useState(false);

  const [
    saving,
    setSaving,
  ] =
    useState(false);

  const [
    search,
    setSearch,
  ] =
    useState("");

  const [
    statusFilter,
    setStatusFilter,
  ] =
    useState("all");

  const [
    halaqaFilter,
    setHalaqaFilter,
  ] =
    useState("all");

  const [
    stageFilter,
    setStageFilter,
  ] =
    useState("all");

  const [
    modalOpen,
    setModalOpen,
  ] =
    useState(false);

  const [
    editingStudent,
    setEditingStudent,
  ] =
    useState(null);

  const [
    form,
    setForm,
  ] =
    useState(EMPTY_FORM);

  const [
    statusTarget,
    setStatusTarget,
  ] =
    useState(null);

  const [
    deleteTarget,
    setDeleteTarget,
  ] =
    useState(null);

  useEffect(() => {
    loadData();
  }, []);

  /* =====================================================
     Load
  ===================================================== */

  async function loadData(
    silent = false
  ) {
    if (silent) {
      setRefreshing(true);
    } else {
      setInitialLoading(true);
    }

    try {
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
          "تعذر تحديد المستخدم الحالي."
        );
      }

      const {
        data: teacherProfile,
        error: teacherError,
      } =
        await supabase
          .from("profiles")
          .select(
            "id, full_name, display_name, user_number, role"
          )
          .eq(
            "auth_user_id",
            user.id
          )
          .eq(
            "role",
            "teacher"
          )
          .maybeSingle();

      if (teacherError) {
        throw teacherError;
      }

      if (!teacherProfile) {
        throw new Error(
          "تعذر العثور على حساب المعلم."
        );
      }

      setTeacher(
        teacherProfile
      );

      const {
        data: teacherLinks,
        error: linksError,
      } =
        await supabase
          .from(
            "teacher_halaqat"
          )
          .select(
            "halaqa_id, role"
          )
          .eq(
            "teacher_id",
            teacherProfile.id
          );

      if (linksError) {
        throw linksError;
      }

      const uniqueIds =
        [
          ...new Set(
            (
              teacherLinks ||
              []
            )
              .map(
                (item) =>
                  Number(
                    item.halaqa_id
                  )
              )
              .filter(Boolean)
          ),
        ];

      setTeacherHalaqaIds(
        uniqueIds
      );

      if (
        uniqueIds.length ===
        0
      ) {
        setHalaqat([]);
        setStudents([]);
        return;
      }

      const roleMap =
        new Map(
          (
            teacherLinks ||
            []
          ).map(
            (item) => [
              Number(
                item.halaqa_id
              ),
              item.role,
            ]
          )
        );

      const {
        data: halaqatRows,
        error: halaqatError,
      } =
        await supabase
          .from("halaqat")
          .select(
            "id, name, mosque_id, capacity, status, halaqa_period, description"
          )
          .in(
            "id",
            uniqueIds
          )
          .order("name");

      if (halaqatError) {
        throw halaqatError;
      }

      const mosqueIds =
        [
          ...new Set(
            (
              halaqatRows ||
              []
            )
              .map(
                (item) =>
                  Number(
                    item.mosque_id
                  )
              )
              .filter(Boolean)
          ),
        ];

      let mosquesRows = [];

      if (
        mosqueIds.length >
        0
      ) {
        const {
          data,
          error,
        } =
          await supabase
            .from("mosques")
            .select("id, name")
            .in(
              "id",
              mosqueIds
            );

        if (error) {
          throw error;
        }

        mosquesRows =
          data || [];
      }

      const mosqueMap =
        new Map(
          mosquesRows.map(
            (mosque) => [
              Number(
                mosque.id
              ),
              mosque.name,
            ]
          )
        );

      const preparedHalaqat =
        (
          halaqatRows ||
          []
        ).map(
          (halaqa) => ({
            ...halaqa,

            mosque_name:
              mosqueMap.get(
                Number(
                  halaqa.mosque_id
                )
              ) ||
              "مسجد غير محدد",

            teacher_role:
              roleMap.get(
                Number(
                  halaqa.id
                )
              ) ||
              "assistant",
          })
        );

      setHalaqat(
        preparedHalaqat
      );

      const {
        data: assignmentsRows,
        error: assignmentsError,
      } =
        await supabase
          .from(
            "student_halaqat"
          )
          .select(
            "id, student_id, halaqa_id, teacher_id, start_date, end_date, is_current"
          )
          .in(
            "halaqa_id",
            uniqueIds
          )
          .eq(
            "is_current",
            true
          );

      if (assignmentsError) {
        throw assignmentsError;
      }

      const studentIds =
        [
          ...new Set(
            (
              assignmentsRows ||
              []
            )
              .map(
                (item) =>
                  Number(
                    item.student_id
                  )
              )
              .filter(Boolean)
          ),
        ];

      if (
        studentIds.length ===
        0
      ) {
        setStudents([]);
        return;
      }

      const thirtyDaysAgo =
        new Date();

      thirtyDaysAgo.setDate(
        thirtyDaysAgo.getDate() -
          30
      );

      const attendanceStart =
        [
          thirtyDaysAgo.getFullYear(),
          String(
            thirtyDaysAgo.getMonth() +
              1
          ).padStart(2, "0"),
          String(
            thirtyDaysAgo.getDate()
          ).padStart(2, "0"),
        ].join("-");

      const [
        profilesResult,
        attendanceResult,
        recitationsResult,
      ] =
        await Promise.all([
          supabase
            .from(
              "profiles"
            )
            .select("*")
            .in(
              "id",
              studentIds
            )
            .eq(
              "role",
              "student"
            ),

          supabase
            .from(
              "attendance"
            )
            .select(
              "student_id, halaqa_id, status, attendance_date"
            )
            .in(
              "student_id",
              studentIds
            )
            .gte(
              "attendance_date",
              attendanceStart
            ),

          supabase
            .from(
              "recitations"
            )
            .select(
              "id, student_id, halaqa_id, recitation_date"
            )
            .in(
              "student_id",
              studentIds
            ),
        ]);

      if (
        profilesResult.error
      ) {
        throw profilesResult.error;
      }

      if (
        attendanceResult.error
      ) {
        throw attendanceResult.error;
      }

      if (
        recitationsResult.error
      ) {
        throw recitationsResult.error;
      }

      const profiles =
        profilesResult.data ||
        [];

      const attendance =
        attendanceResult.data ||
        [];

      const recitations =
        recitationsResult.data ||
        [];

      const assignmentMap =
        new Map(
          (
            assignmentsRows ||
            []
          ).map(
            (item) => [
              Number(
                item.student_id
              ),
              item,
            ]
          )
        );

      const halaqaMap =
        new Map(
          preparedHalaqat.map(
            (item) => [
              Number(
                item.id
              ),
              item,
            ]
          )
        );

      const preparedStudents =
        profiles.map(
          (student) => {
            const assignment =
              assignmentMap.get(
                Number(
                  student.id
                )
              );

            const halaqa =
              assignment
                ? halaqaMap.get(
                    Number(
                      assignment.halaqa_id
                    )
                  )
                : null;

            const studentAttendance =
              attendance.filter(
                (item) =>
                  Number(
                    item.student_id
                  ) ===
                  Number(
                    student.id
                  )
              );

            const present =
              studentAttendance.filter(
                (item) =>
                  item.status ===
                  "present"
              ).length;

            const absent =
              studentAttendance.filter(
                (item) =>
                  item.status ===
                  "absent"
              ).length;

            const late =
              studentAttendance.filter(
                (item) =>
                  item.status ===
                  "late"
              ).length;

            const excused =
              studentAttendance.filter(
                (item) =>
                  item.status ===
                  "excused"
              ).length;

            const studentRecitations =
              recitations
                .filter(
                  (item) =>
                    Number(
                      item.student_id
                    ) ===
                    Number(
                      student.id
                    )
                )
                .sort(
                  (a, b) =>
                    new Date(
                      b.recitation_date
                    ) -
                    new Date(
                      a.recitation_date
                    )
                );

            const lastRecitation =
              studentRecitations[0]
                ?.recitation_date ||
              null;

            const attendanceRate =
              getAttendanceRate({
                present,
                absent,
                late,
                excused,
              });

            const profileComplete =
              Boolean(
                normalizeText(
                  student.guardian_name
                ) &&
                  normalizeText(
                    student.guardian_phone
                  ) &&
                  normalizeText(
                    student.gender
                  ) &&
                  normalizeText(
                    student.nationality
                  )
              );

            return {
              ...student,

              halaqa_id:
                halaqa?.id ||
                null,

              halaqa_name:
                halaqa?.name ||
                "غير مرتبط",

              mosque_name:
                halaqa
                  ?.mosque_name ||
                "غير محدد",

              halaqa_period:
                halaqa
                  ?.halaqa_period ||
                null,

              teacher_role:
                halaqa
                  ?.teacher_role ||
                null,

              present,
              absent,
              late,
              excused,

              attendance_rate:
                attendanceRate,

              recitations_count:
                studentRecitations.length,

              last_recitation:
                lastRecitation,

              follow_up:
                needsFollowUp(
                  lastRecitation
                ),

              profile_complete:
                profileComplete,
            };
          }
        );

      preparedStudents.sort(
        (a, b) =>
          String(
            a.full_name || ""
          ).localeCompare(
            String(
              b.full_name || ""
            ),
            "ar"
          )
      );

      setStudents(
        preparedStudents
      );

    } catch (error) {
      console.error(
        "LOAD TEACHER STUDENTS:",
        error
      );

      showToast(
        error?.message ||
          "تعذر تحميل بيانات الطلاب.",
        "error"
      );

      setStudents([]);
    } finally {
      setInitialLoading(
        false
      );

      setRefreshing(
        false
      );
    }
  }

  /* =====================================================
     Access Helpers
  ===================================================== */

  function isTeacherHalaqa(
    halaqaId
  ) {
    return teacherHalaqaIds.includes(
      Number(halaqaId)
    );
  }

  async function ensureStudentAccess(
    studentId
  ) {
    if (
      teacherHalaqaIds.length ===
      0
    ) {
      throw new Error(
        "لا توجد حلقات مرتبطة بحسابك."
      );
    }

    const {
      data,
      error,
    } =
      await supabase
        .from(
          "student_halaqat"
        )
        .select(
          "id, halaqa_id"
        )
        .eq(
          "student_id",
          studentId
        )
        .eq(
          "is_current",
          true
        )
        .in(
          "halaqa_id",
          teacherHalaqaIds
        )
        .limit(1);

    if (error) {
      throw error;
    }

    if (!data?.length) {
      throw new Error(
        "ليس لديك صلاحية لإدارة هذا الطالب."
      );
    }

    return data[0];
  }

  /* =====================================================
     Modal
  ===================================================== */

  function openCreateModal() {
    setEditingStudent(
      null
    );

    setForm({
      ...EMPTY_FORM,

      halaqa_id:
        halaqat.length === 1
          ? String(
              halaqat[0].id
            )
          : "",
    });

    setModalOpen(true);
  }

  function openEditModal(
    student
  ) {
    setEditingStudent(
      student
    );

    setForm({
      full_name:
        student.full_name ||
        "",

      user_number:
        student.user_number ||
        "",

      phone:
        student.phone ||
        "",

      birth_date:
        student.birth_date ||
        "",

      gender:
        student.gender ||
        "",

      nationality:
        student.nationality ||
        "",

      residence_address:
        student.residence_address ||
        "",

      guardian_name:
        student.guardian_name ||
        student.parent_name ||
        "",

      guardian_phone:
        student.guardian_phone ||
        student.parent_phone ||
        "",

      guardian_relation:
        student.guardian_relation ||
        "",

      education_stage:
        student.education_stage ||
        student.education_level ||
        "",

      education_grade:
        student.education_grade ||
        "",

      learning_goal:
        student.learning_goal ||
        "",

      recitation_mode:
        student.recitation_mode ||
        "",

      recitation_days:
        Array.isArray(
          student.recitation_days
        )
          ? student.recitation_days
          : [],

      preferred_recitation_time:
        student.preferred_recitation_time ||
        "",

      halaqa_id:
        student.halaqa_id
          ? String(
              student.halaqa_id
            )
          : "",

      notes:
        student.notes ||
        "",
    });

    setModalOpen(true);
  }

  function closeModal() {
    if (saving) {
      return;
    }

    setModalOpen(false);
    setEditingStudent(null);
    setForm(EMPTY_FORM);
  }

  function updateForm(
    field,
    value
  ) {
    setForm(
      (current) => ({
        ...current,
        [field]: value,
      })
    );
  }

  function toggleRecitationDay(
    day
  ) {
    setForm(
      (current) => ({
        ...current,

        recitation_days:
          current.recitation_days.includes(
            day
          )
            ? current.recitation_days.filter(
                (item) =>
                  item !== day
              )
            : [
                ...current.recitation_days,
                day,
              ],
      })
    );
  }

  /* =====================================================
     Save
  ===================================================== */

  async function saveStudent() {
    const fullName =
      normalizeText(
        form.full_name
      );

    const studentNumber =
      normalizeText(
        form.user_number
      );

    if (!fullName) {
      showToast(
        "أدخل اسم الطالب.",
        "error"
      );
      return;
    }

    if (!studentNumber) {
      showToast(
        "أدخل رقم الطالب.",
        "error"
      );
      return;
    }

    if (!form.halaqa_id) {
      showToast(
        "اختر الحلقة.",
        "error"
      );
      return;
    }

    if (
      !isTeacherHalaqa(
        form.halaqa_id
      )
    ) {
      showToast(
        "الحلقة المحددة ليست من حلقاتك.",
        "error"
      );
      return;
    }

    const age =
      getAgeFromBirthDate(
        form.birth_date
      );

    if (
      age !== null &&
      (
        age < 3 ||
        age > 100
      )
    ) {
      showToast(
        "تاريخ الميلاد ينتج عمرًا غير منطقي.",
        "error"
      );
      return;
    }

    setSaving(true);

    try {
      if (!teacher?.id) {
        throw new Error(
          "تعذر تحديد حساب المعلم."
        );
      }

      if (
        editingStudent?.id
      ) {
        await ensureStudentAccess(
          editingStudent.id
        );
      }

      const profilePayload = {
        role: "student",

        user_number:
          studentNumber,

        full_name:
          fullName,

        phone:
          normalizeText(
            form.phone
          ) || null,

        birth_date:
          form.birth_date ||
          null,

        age,

        gender:
          form.gender ||
          null,

        nationality:
          normalizeText(
            form.nationality
          ) || null,

        residence_address:
          normalizeText(
            form.residence_address
          ) || null,

        guardian_name:
          normalizeText(
            form.guardian_name
          ) || null,

        guardian_phone:
          normalizeText(
            form.guardian_phone
          ) || null,

        guardian_relation:
          normalizeText(
            form.guardian_relation
          ) || null,

        education_stage:
          form.education_stage ||
          null,

        // توافق مؤقت مع أجزاء المشروع القديمة
        education_level:
          form.education_stage ||
          null,

        education_grade:
          normalizeText(
            form.education_grade
          ) || null,

        learning_goal:
          form.learning_goal ||
          null,

        recitation_mode:
          form.recitation_mode ||
          null,

        recitation_days:
          Array.isArray(
            form.recitation_days
          )
            ? form.recitation_days
            : [],

        preferred_recitation_time:
          form.preferred_recitation_time ||
          null,

        notes:
          normalizeText(
            form.notes
          ) || null,

        status:
          editingStudent?.status ||
          "active",

        is_active:
          editingStudent
            ? editingStudent.is_active !==
              false
            : true,
      };

      let studentId =
        editingStudent?.id ||
        null;

      if (studentId) {
        const {
          error,
        } =
          await supabase
            .from("profiles")
            .update(
              profilePayload
            )
            .eq(
              "id",
              studentId
            )
            .eq(
              "role",
              "student"
            );

        if (error) {
          throw error;
        }
      } else {
        const {
          data,
          error,
        } =
          await supabase
            .from("profiles")
            .insert(
              profilePayload
            )
            .select("id")
            .single();

        if (error) {
          throw error;
        }

        studentId =
          data?.id;
      }

      if (!studentId) {
        throw new Error(
          "تعذر تحديد الطالب بعد الحفظ."
        );
      }

      const targetHalaqaId =
        Number(
          form.halaqa_id
        );

      if (
        !isTeacherHalaqa(
          targetHalaqaId
        )
      ) {
        throw new Error(
          "الحلقة المحددة ليست ضمن نطاقك."
        );
      }

      const {
        data: currentLinks,
        error: currentLinksError,
      } =
        await supabase
          .from(
            "student_halaqat"
          )
          .select(
            "id, halaqa_id"
          )
          .eq(
            "student_id",
            studentId
          )
          .eq(
            "is_current",
            true
          );

      if (currentLinksError) {
        throw currentLinksError;
      }

      const currentLink =
        (
          currentLinks ||
          []
        )[0];

      if (
        !currentLink ||
        Number(
          currentLink.halaqa_id
        ) !==
          targetHalaqaId
      ) {
        if (
          currentLinks?.length
        ) {
          const {
            error:
              deactivateError,
          } =
            await supabase
              .from(
                "student_halaqat"
              )
              .update({
                is_current:
                  false,

                end_date:
                  getToday(),
              })
              .eq(
                "student_id",
                studentId
              )
              .eq(
                "is_current",
                true
              )
              .in(
                "halaqa_id",
                teacherHalaqaIds
              );

          if (
            deactivateError
          ) {
            throw deactivateError;
          }
        }

        const {
          data:
            oldLink,
          error:
            oldLinkError,
        } =
          await supabase
            .from(
              "student_halaqat"
            )
            .select("id")
            .eq(
              "student_id",
              studentId
            )
            .eq(
              "halaqa_id",
              targetHalaqaId
            )
            .maybeSingle();

        if (
          oldLinkError
        ) {
          throw oldLinkError;
        }

        if (oldLink) {
          const {
            error:
              reactivateError,
          } =
            await supabase
              .from(
                "student_halaqat"
              )
              .update({
                is_current:
                  true,

                start_date:
                  getToday(),

                end_date:
                  null,

                teacher_id:
                  teacher.id,
              })
              .eq(
                "id",
                oldLink.id
              );

          if (
            reactivateError
          ) {
            throw reactivateError;
          }
        } else {
          const {
            error:
              linkError,
          } =
            await supabase
              .from(
                "student_halaqat"
              )
              .insert({
                student_id:
                  studentId,

                halaqa_id:
                  targetHalaqaId,

                teacher_id:
                  teacher.id,

                is_current:
                  true,

                start_date:
                  getToday(),
              });

          if (linkError) {
            throw linkError;
          }
        }
      }

      showToast(
        editingStudent
          ? "تم تحديث بيانات الطالب بنجاح."
          : "تم إنشاء الطالب وربطه بالحلقة بنجاح.",
        "success"
      );

      closeModal();

      await loadData(true);

    } catch (error) {
      console.error(
        "SAVE TEACHER STUDENT:",
        error
      );

      if (
        error?.code ===
        "23505"
      ) {
        showToast(
          "رقم الطالب مستخدم مسبقًا.",
          "error"
        );
      } else {
        showToast(
          error?.message ||
            "تعذر حفظ بيانات الطالب.",
          "error"
        );
      }
    } finally {
      setSaving(false);
    }
  }

  /* =====================================================
     Status
  ===================================================== */

  async function toggleStatus(
    student
  ) {
    try {
      setSaving(true);

      await ensureStudentAccess(
        student.id
      );

      const newStatus =
        student.status ===
        "active"
          ? "inactive"
          : "active";

      const {
        error,
      } =
        await supabase
          .from("profiles")
          .update({
            status:
              newStatus,

            is_active:
              newStatus ===
              "active",
          })
          .eq(
            "id",
            student.id
          )
          .eq(
            "role",
            "student"
          );

      if (error) {
        throw error;
      }

      showToast(
        newStatus ===
          "active"
          ? "تم تفعيل الطالب."
          : "تم إيقاف الطالب.",
        "success"
      );

      setStatusTarget(null);

      await loadData(true);

    } catch (error) {
      console.error(
        "TOGGLE TEACHER STUDENT:",
        error
      );

      showToast(
        error?.message ||
          "تعذر تغيير حالة الطالب.",
        "error"
      );
    } finally {
      setSaving(false);
    }
  }

  /* =====================================================
     Delete
  ===================================================== */

  async function deleteStudent(
    student
  ) {
    if (!student?.id) {
      return;
    }

    try {
      setSaving(true);

      await ensureStudentAccess(
        student.id
      );

      const studentId =
        Number(
          student.id
        );

      const tables = [
        "monthly_progress",
        "monthly_plans",
        "noorania_recitations",
        "recitations",
        "attendance",
        "points_transactions",
        "exam_results",
        "exam_students",
        "student_halaqat",
      ];

      for (
        const table of tables
      ) {
        const {
          error,
        } =
          await supabase
            .from(table)
            .delete()
            .eq(
              "student_id",
              studentId
            );

        if (error) {
          throw new Error(
            `تعذر حذف بيانات الطالب من ${table}: ${error.message}`
          );
        }
      }

      const {
        error: profileError,
      } =
        await supabase
          .from("profiles")
          .delete()
          .eq(
            "id",
            studentId
          )
          .eq(
            "role",
            "student"
          );

      if (profileError) {
        throw profileError;
      }

      showToast(
        "تم حذف الطالب نهائيًا.",
        "success"
      );

      setDeleteTarget(null);

      await loadData(true);

    } catch (error) {
      console.error(
        "DELETE TEACHER STUDENT:",
        error
      );

      showToast(
        error?.message ||
          "تعذر حذف الطالب. قد توجد بيانات مرتبطة أخرى تمنع الحذف.",
        "error"
      );
    } finally {
      setSaving(false);
    }
  }

  /* =====================================================
     Filters
  ===================================================== */

  const filteredStudents =
    useMemo(() => {
      const text =
        search
          .trim()
          .toLowerCase();

      return students.filter(
        (student) => {
          const searchable =
            [
              student.full_name,
              student.user_number,
              student.phone,

              student.guardian_name,
              student.guardian_phone,

              student.nationality,
              student.residence_address,

              student.halaqa_name,
              student.mosque_name,
            ]
              .filter(Boolean)
              .join(" ")
              .toLowerCase();

          const matchesSearch =
            !text ||
            searchable.includes(
              text
            );

          const matchesStatus =
            statusFilter ===
              "all" ||
            student.status ===
              statusFilter;

          const stage =
            student.education_stage ||
            student.education_level ||
            "";

          const matchesStage =
            stageFilter ===
              "all" ||
            stage ===
              stageFilter;

          const matchesHalaqa =
            halaqaFilter ===
              "all" ||
            String(
              student.halaqa_id ||
                ""
            ) ===
              String(
                halaqaFilter
              );

          return (
            matchesSearch &&
            matchesStatus &&
            matchesStage &&
            matchesHalaqa
          );
        }
      );
    }, [
      students,
      search,
      statusFilter,
      stageFilter,
      halaqaFilter,
    ]);

  /* =====================================================
     KPIs
  ===================================================== */

  const stats =
    useMemo(() => {
      const active =
        students.filter(
          (student) =>
            student.status ===
            "active"
        ).length;

      const followUp =
        students.filter(
          (student) =>
            student.follow_up
        ).length;

      const incomplete =
        students.filter(
          (student) =>
            !student.profile_complete
        ).length;

      const averageAttendance =
        students.length ===
        0
          ? 0
          : Math.round(
              students.reduce(
                (
                  sum,
                  student
                ) =>
                  sum +
                  Number(
                    student.attendance_rate ||
                      0
                  ),
                0
              ) /
                students.length
            );

      return {
        total:
          students.length,

        active,

        halaqat:
          halaqat.length,

        averageAttendance,

        followUp,

        incomplete,
      };
    }, [
      students,
      halaqat,
    ]);

  const hasFilters =
    Boolean(
      search ||
        statusFilter !==
          "all" ||
        halaqaFilter !==
          "all" ||
        stageFilter !==
          "all"
    );

  function resetFilters() {
    setSearch("");
    setStatusFilter("all");
    setHalaqaFilter("all");
    setStageFilter("all");
  }

  return (
    <div
      className="teacher-students-pro"
      dir="rtl"
    >
      {/* =========================================
          HERO
      ========================================= */}

      <section className="teacher-students-hero">
        <div className="teacher-students-hero-main">
          <div className="teacher-students-hero-icon">
            <Users
              size={22}
            />
          </div>

          <div>
            <div className="teacher-students-eyebrow">
              <Sparkles
                size={11}
              />
              طلاب حلقاتي
            </div>

            <h1>
              الطلاب
            </h1>

            <p>
              إدارة طلاب حلقاتك ومتابعة بياناتهم التعليمية
              وبيانات ولي الأمر والحضور والتسميع والنقاط.
            </p>
          </div>
        </div>

        <div className="teacher-students-hero-actions">
          <button
            type="button"
            className="teacher-students-refresh"
            onClick={() =>
              loadData(true)
            }
            disabled={
              refreshing
            }
            title="تحديث البيانات"
          >
            <RefreshCw
              size={15}
              className={
                refreshing
                  ? "students-spin"
                  : ""
              }
            />
          </button>

          <button
            type="button"
            className="teacher-students-add"
            onClick={
              openCreateModal
            }
            disabled={
              halaqat.length ===
              0
            }
          >
            <Plus
              size={14}
            />
            إضافة طالب
          </button>
        </div>
      </section>

      {/* =========================================
          SCOPE
      ========================================= */}

      <div className="teacher-students-scope">
        <ShieldCheck
          size={13}
        />

        تعرض الصفحة الطلاب المرتبطين بحلقاتك فقط، كما أن
        إنشاء الطالب أو نقله يقتصر على الحلقات المسندة لك.
      </div>

      {/* =========================================
          STATS
      ========================================= */}

      {!initialLoading && (
        <section className="teacher-students-stats">
          <StudentStat
            label="طلابي"
            value={stats.total}
            icon={Users}
            tone="green"
            sub="ضمن حلقاتك الحالية"
          />

          <StudentStat
            label="النشطون"
            value={stats.active}
            icon={UserCheck}
            tone="blue"
            sub="حسابات فعالة"
          />

          <StudentStat
            label="حلقاتي"
            value={stats.halaqat}
            icon={BookOpen}
            tone="gold"
            sub="الحلقات المسندة لك"
          />

          <StudentStat
            label="متوسط الحضور"
            value={`${stats.averageAttendance}%`}
            icon={CheckCircle2}
            tone={
              stats.averageAttendance >=
              75
                ? "green"
                : stats.averageAttendance >=
                    50
                  ? "gold"
                  : "red"
            }
            sub="آخر 30 يومًا"
          />

          <StudentStat
            label="يحتاجون متابعة"
            value={stats.followUp}
            icon={AlertTriangle}
            tone={
              stats.followUp >
              0
                ? "red"
                : "green"
            }
            sub="لا يوجد تسميع منذ 7 أيام"
          />

          <StudentStat
            label="بيانات ناقصة"
            value={stats.incomplete}
            icon={ShieldCheck}
            tone={
              stats.incomplete >
              0
                ? "red"
                : "green"
            }
            sub="ولي الأمر / الجنس / الجنسية"
          />
        </section>
      )}

      {/* =========================================
          FILTERS
      ========================================= */}

      {!initialLoading && (
        <section className="teacher-students-filters">
          <div className="teacher-students-search">
            <Search
              size={15}
            />

            <input
              value={search}
              onChange={(
                event
              ) =>
                setSearch(
                  event.target
                    .value
                )
              }
              placeholder="ابحث بالاسم أو الرقم أو الجوال أو ولي الأمر..."
            />

            {search && (
              <button
                type="button"
                onClick={() =>
                  setSearch("")
                }
                aria-label="مسح البحث"
              >
                <X
                  size={13}
                />
              </button>
            )}
          </div>

          <FilterSelect
            value={
              halaqaFilter
            }
            onChange={
              setHalaqaFilter
            }
            options={[
              {
                value: "all",
                label:
                  "جميع حلقاتي",
              },
              ...halaqat.map(
                (halaqa) => ({
                  value:
                    String(
                      halaqa.id
                    ),
                  label:
                    halaqa.name,
                })
              ),
            ]}
          />

          <FilterSelect
            value={
              statusFilter
            }
            onChange={
              setStatusFilter
            }
            options={[
              {
                value: "all",
                label:
                  "كل الحالات",
              },
              {
                value:
                  "active",
                label:
                  "نشط",
              },
              {
                value:
                  "inactive",
                label:
                  "غير نشط",
              },
            ]}
          />

          <FilterSelect
            value={
              stageFilter
            }
            onChange={
              setStageFilter
            }
            options={[
              {
                value: "all",
                label:
                  "كل المراحل",
              },
              ...EDUCATION_STAGES,
            ]}
          />

          <button
            type="button"
            className="teacher-students-reset"
            onClick={
              resetFilters
            }
            disabled={
              !hasFilters
            }
          >
            <RotateCcw
              size={13}
            />
            إعادة
          </button>
        </section>
      )}

      {/* =========================================
          RESULT HEADER
      ========================================= */}

      {!initialLoading && (
        <div className="teacher-students-result-head">
          <div>
            <h2>
              قائمة الطلاب
            </h2>

            <p>
              عرض{" "}
              {formatNumber(
                filteredStudents.length
              )}{" "}
              من{" "}
              {formatNumber(
                students.length
              )}{" "}
              طالب
            </p>
          </div>
        </div>
      )}

      {/* =========================================
          CONTENT
      ========================================= */}

      {initialLoading ? (
        <StudentsLoading />
      ) : filteredStudents.length ===
        0 ? (
        <StudentsEmpty
          hasHalaqat={
            halaqat.length >
            0
          }
          filtered={
            hasFilters
          }
          onReset={
            resetFilters
          }
          onCreate={
            openCreateModal
          }
        />
      ) : (
        <section className="teacher-students-grid">
          {filteredStudents.map(
            (student) => (
              <StudentCard
                key={
                  student.id
                }
                student={
                  student
                }
                onEdit={
                  openEditModal
                }
                onToggle={() =>
                  setStatusTarget(
                    student
                  )
                }
                onDelete={() =>
                  setDeleteTarget(
                    student
                  )
                }
              />
            )
          )}
        </section>
      )}

      {/* =========================================
          FORM MODAL
      ========================================= */}

      <StudentFormModal
        open={
          modalOpen
        }
        editingStudent={
          editingStudent
        }
        form={form}
        updateForm={
          updateForm
        }
        toggleDay={
          toggleRecitationDay
        }
        halaqat={halaqat}
        saving={saving}
        onSave={
          saveStudent
        }
        onClose={
          closeModal
        }
      />

      {/* =========================================
          STATUS CONFIRM
      ========================================= */}

      <ConfirmModal
        open={
          Boolean(
            statusTarget
          )
        }
        title={
          statusTarget?.status ===
          "active"
            ? "إيقاف الطالب"
            : "تفعيل الطالب"
        }
        message={
          statusTarget
            ? statusTarget.status ===
              "active"
              ? `سيتم إيقاف الطالب "${statusTarget.full_name}" مع بقاء ملفه محفوظًا في النظام.`
              : `سيتم تفعيل الطالب "${statusTarget.full_name}" من جديد.`
            : ""
        }
        onConfirm={() =>
          statusTarget &&
          toggleStatus(
            statusTarget
          )
        }
        onCancel={() =>
          setStatusTarget(
            null
          )
        }
      />

      {/* =========================================
          DELETE CONFIRM
      ========================================= */}

      <ConfirmModal
        open={
          Boolean(
            deleteTarget
          )
        }
        title="حذف الطالب نهائيًا"
        message={
          deleteTarget
            ? `هل تريد حذف الطالب "${deleteTarget.full_name}" نهائيًا؟\n\nسيتم حذف بياناته من الجداول المرتبطة المعروفة. إذا كانت هناك بيانات إضافية مرتبطة به فقد تمنع قاعدة البيانات الحذف لحماية السجل.`
            : ""
        }
        onConfirm={() =>
          deleteTarget &&
          deleteStudent(
            deleteTarget
          )
        }
        onCancel={() =>
          setDeleteTarget(
            null
          )
        }
      />

      {/* =========================================
          STYLES
      ========================================= */}

      <style>
        {`
          .teacher-students-pro {
            display: grid;
            gap: 14px;

            width: 100%;
            max-width: 1600px;
            margin: 0 auto;

            color: #34463B;
          }

          /* HERO */

          .teacher-students-hero {
            position: relative;
            overflow: hidden;

            display: flex;
            align-items: center;
            justify-content: space-between;

            gap: 14px;

            padding: 15px 17px;

            border: 1px solid #E4EAE6;
            border-radius: 18px;

            background:
              linear-gradient(
                135deg,
                #FFFFFF 0%,
                #F7FBF8 72%,
                #FFFDF7 100%
              );

            box-shadow:
              0 9px 26px rgba(26,54,41,.045);
          }

          .teacher-students-hero::after {
            content: "";

            position: absolute;
            left: -24px;
            top: -40px;

            width: 140px;
            height: 140px;

            border: 1px solid rgba(185,144,55,.12);
            border-radius: 50%;

            box-shadow:
              0 0 0 18px rgba(185,144,55,.025),
              0 0 0 36px rgba(15,118,110,.018);

            pointer-events: none;
          }

          .teacher-students-hero-main {
            position: relative;
            z-index: 2;

            display: flex;
            align-items: center;

            gap: 10px;

            min-width: 0;
          }

          .teacher-students-hero-icon {
            width: 43px;
            height: 43px;

            flex: 0 0 43px;

            border-radius: 13px;

            display: flex;
            align-items: center;
            justify-content: center;

            color: #FFFFFF;

            background:
              linear-gradient(
                145deg,
                #0F5132,
                #0F766E
              );

            box-shadow:
              0 8px 18px rgba(15,81,50,.12);
          }

          .teacher-students-eyebrow {
            display: flex;
            align-items: center;

            gap: 3px;

            color: #98772C;

            font-size: 6px;
            font-weight: 900;
          }

          .teacher-students-hero h1 {
            margin: 1px 0 0;

            color: #35463C;

            font-size: 15px;
            font-weight: 950;
          }

          .teacher-students-hero p {
            margin: 3px 0 0;

            color: #8D9791;

            font-size: 6px;
            line-height: 1.55;
          }

          .teacher-students-hero-actions {
            position: relative;
            z-index: 2;

            display: flex;
            align-items: center;

            gap: 6px;
          }

          .teacher-students-refresh {
            width: 36px;
            height: 36px;

            border: 1px solid #DDE5E0;
            border-radius: 9px;

            display: flex;
            align-items: center;
            justify-content: center;

            color: #0F6848;
            background: #FFFFFF;

            cursor: pointer;
          }

          .teacher-students-add {
            min-height: 36px;

            padding: 0 12px;

            border: none;
            border-radius: 9px;

            display: inline-flex;
            align-items: center;
            justify-content: center;

            gap: 5px;

            color: #FFFFFF;

            background:
              linear-gradient(
                135deg,
                #0F5132,
                #0F766E
              );

            font-size: 6.5px;
            font-weight: 900;

            cursor: pointer;

            box-shadow:
              0 8px 17px rgba(15,81,50,.12);
          }

          .teacher-students-refresh:disabled,
          .teacher-students-add:disabled {
            opacity: .45;
            cursor: not-allowed;
          }

          /* SCOPE */

          .teacher-students-scope {
            display: flex;
            align-items: center;

            gap: 5px;

            padding: 8px 10px;

            border: 1px solid #DCE8E0;
            border-radius: 10px;

            color: #0F6848;
            background: #F3F9F5;

            font-size: 5.8px;
            font-weight: 850;
          }

          /* STATS */

          .teacher-students-stats {
            display: grid;

            grid-template-columns:
              repeat(
                6,
                minmax(0,1fr)
              );

            gap: 8px;
          }

          .teacher-student-stat {
            position: relative;

            overflow: hidden;

            min-width: 0;

            padding: 11px;

            border: 1px solid #E5EBE7;
            border-radius: 13px;

            background: #FFFFFF;

            box-shadow:
              0 8px 22px rgba(25,51,39,.035);
          }

          .teacher-student-stat::before {
            content: "";

            position: absolute;
            top: 0;
            right: 0;
            left: 0;

            height: 2px;

            background: var(--stat-color);
          }

          .teacher-student-stat-head {
            display: flex;
            align-items: center;
            justify-content: space-between;

            gap: 6px;
          }

          .teacher-student-stat-label {
            color: #8E9892;

            font-size: 5.4px;
            font-weight: 800;
          }

          .teacher-student-stat-icon {
            width: 29px;
            height: 29px;

            flex: 0 0 29px;

            border-radius: 8px;

            display: flex;
            align-items: center;
            justify-content: center;

            color: var(--stat-color);
            background: var(--stat-soft);
          }

          .teacher-student-stat strong {
            display: block;

            margin-top: 8px;

            color: var(--stat-color);

            font-size: 18px;
            font-weight: 950;
            line-height: 1;
          }

          .teacher-student-stat small {
            display: block;

            margin-top: 5px;

            overflow: hidden;

            color: #9AA29D;

            font-size: 5px;

            text-overflow: ellipsis;
            white-space: nowrap;
          }

          /* FILTERS */

          .teacher-students-filters {
            display: grid;

            grid-template-columns:
              minmax(230px,1.4fr)
              minmax(140px,.75fr)
              minmax(130px,.7fr)
              minmax(140px,.75fr)
              auto;

            gap: 7px;

            padding: 9px;

            border: 1px solid #E5EBE7;
            border-radius: 13px;

            background: #FFFFFF;

            box-shadow:
              0 7px 20px rgba(25,51,39,.03);
          }

          .teacher-students-search {
            position: relative;
          }

          .teacher-students-search > svg {
            position: absolute;
            right: 10px;
            top: 50%;

            transform: translateY(-50%);

            color: #8D9791;

            pointer-events: none;
          }

          .teacher-students-search input,
          .teacher-students-filter-select select {
            width: 100%;
            height: 38px;

            border: 1px solid #DDE5E0;
            border-radius: 9px;

            outline: none;

            color: #3D4D43;
            background: #FBFDFC;

            font-family: inherit;
            font-size: 6.3px;
          }

          .teacher-students-search input {
            padding: 0 32px 0 31px;
          }

          .teacher-students-search input:focus,
          .teacher-students-filter-select select:focus {
            border-color: #A3C6B0;

            box-shadow:
              0 0 0 3px rgba(15,81,50,.05);

            background: #FFFFFF;
          }

          .teacher-students-search button {
            position: absolute;
            left: 8px;
            top: 50%;

            width: 21px;
            height: 21px;

            transform: translateY(-50%);

            border: none;
            border-radius: 6px;

            display: flex;
            align-items: center;
            justify-content: center;

            color: #76827A;
            background: #EDF2EF;

            cursor: pointer;
          }

          .teacher-students-filter-select {
            position: relative;
          }

          .teacher-students-filter-select select {
            appearance: none;

            padding: 0 10px 0 29px;
          }

          .teacher-students-filter-select svg {
            position: absolute;
            left: 9px;
            top: 50%;

            transform: translateY(-50%);

            color: #89938D;

            pointer-events: none;
          }

          .teacher-students-reset {
            min-height: 38px;

            padding: 0 9px;

            border: 1px solid #DDE5E0;
            border-radius: 9px;

            display: inline-flex;
            align-items: center;
            justify-content: center;

            gap: 4px;

            color: #536159;
            background: #F8FBF9;

            font-size: 5.8px;
            font-weight: 900;

            cursor: pointer;
          }

          .teacher-students-reset:disabled {
            opacity: .4;
            cursor: not-allowed;
          }

          /* RESULT HEADER */

          .teacher-students-result-head {
            display: flex;
            align-items: center;
            justify-content: space-between;

            gap: 10px;

            padding: 2px;
          }

          .teacher-students-result-head h2 {
            margin: 0;

            color: #35463C;

            font-size: 10px;
            font-weight: 950;
          }

          .teacher-students-result-head p {
            margin: 2px 0 0;

            color: #929B95;

            font-size: 5.5px;
          }

          /* GRID */

          .teacher-students-grid {
            display: grid;

            grid-template-columns:
              repeat(
                auto-fill,
                minmax(310px,1fr)
              );

            gap: 10px;
          }

          /* CARD */

          .teacher-student-card {
            position: relative;

            min-width: 0;
            overflow: hidden;

            padding: 12px;

            border: 1px solid #E5EBE7;
            border-radius: 15px;

            background: #FFFFFF;

            box-shadow:
              0 8px 23px rgba(25,51,39,.04);

            transition:
              transform .17s ease,
              box-shadow .17s ease,
              border-color .17s ease;
          }

          .teacher-student-card:hover {
            transform: translateY(-2px);

            border-color: #C9DCD0;

            box-shadow:
              0 12px 26px rgba(25,51,39,.06);
          }

          .teacher-student-card.inactive {
            opacity: .76;
          }

          .teacher-student-card::before {
            content: "";

            position: absolute;
            top: 0;
            right: 0;
            left: 0;

            height: 2px;

            background:
              linear-gradient(
                90deg,
                transparent,
                #0F766E,
                #B99037,
                transparent
              );
          }

          .teacher-student-card-head {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;

            gap: 8px;
          }

          .teacher-student-identity {
            display: flex;
            align-items: center;

            gap: 8px;

            min-width: 0;
          }

          .teacher-student-avatar {
            width: 38px;
            height: 38px;

            flex: 0 0 38px;

            border-radius: 11px;

            display: flex;
            align-items: center;
            justify-content: center;

            color: #FFFFFF;

            background:
              linear-gradient(
                145deg,
                #0F5132,
                #0F766E
              );

            font-size: 9px;
            font-weight: 950;
          }

          .teacher-student-name {
            min-width: 0;
          }

          .teacher-student-name span,
          .teacher-student-name strong,
          .teacher-student-name small {
            display: block;
          }

          .teacher-student-name span {
            color: #9AA29D;
            font-size: 5px;
          }

          .teacher-student-name strong {
            margin-top: 1px;

            overflow: hidden;

            color: #3A4A40;

            font-size: 8.5px;
            font-weight: 950;

            text-overflow: ellipsis;
            white-space: nowrap;
          }

          .teacher-student-name small {
            margin-top: 2px;

            color: #929B95;
            font-size: 5px;
          }

          .teacher-student-status {
            min-height: 23px;

            padding: 0 6px;

            border-radius: 999px;

            display: inline-flex;
            align-items: center;

            gap: 3px;

            font-size: 5.2px;
            font-weight: 900;
          }

          .teacher-student-status.active {
            color: #0F704A;

            border: 1px solid #D9EADD;

            background: #F0F9F3;
          }

          .teacher-student-status.inactive {
            color: #9D463A;

            border: 1px solid #EED8D3;

            background: #FFF4F1;
          }

          .teacher-student-info-grid {
            display: grid;

            grid-template-columns:
              repeat(2,minmax(0,1fr));

            gap: 6px;

            margin-top: 10px;
          }

          .teacher-student-info-box {
            min-width: 0;

            padding: 8px;

            border: 1px solid #E8ECEA;
            border-radius: 9px;

            background: #FBFDFC;
          }

          .teacher-student-info-box span {
            display: flex;
            align-items: center;

            gap: 3px;

            color: #949D97;

            font-size: 5px;
          }

          .teacher-student-info-box strong {
            display: block;

            margin-top: 3px;

            overflow: hidden;

            color: #536159;

            font-size: 6.2px;
            font-weight: 900;

            text-overflow: ellipsis;
            white-space: nowrap;
          }

          .teacher-student-halaqa {
            margin-top: 7px;
            padding: 9px;

            border: 1px solid #DDE9E1;
            border-radius: 10px;

            background:
              linear-gradient(
                135deg,
                #F6FAF7,
                #FFFFFF
              );
          }

          .teacher-student-halaqa strong {
            display: flex;
            align-items: center;

            gap: 4px;

            color: #0F6848;

            font-size: 6.4px;
          }

          .teacher-student-halaqa-meta {
            display: flex;
            flex-wrap: wrap;

            gap: 4px 8px;

            margin-top: 5px;

            color: #89938D;

            font-size: 5px;
          }

          .teacher-student-guardian {
            margin-top: 7px;
            padding: 9px;

            border: 1px solid #E9E5D8;
            border-radius: 10px;

            background:
              linear-gradient(
                135deg,
                #FFFDF8,
                #FFFFFF
              );
          }

          .teacher-student-guardian-head {
            display: flex;
            align-items: center;
            justify-content: space-between;

            gap: 8px;
          }

          .teacher-student-guardian-head > span:first-child {
            display: flex;
            align-items: center;

            gap: 3px;

            color: #947124;

            font-size: 5.4px;
            font-weight: 900;
          }

          .teacher-student-profile-complete {
            color: #0F704A;
            font-size: 5px;
            font-weight: 900;
          }

          .teacher-student-profile-incomplete {
            color: #A44337;
            font-size: 5px;
            font-weight: 900;
          }

          .teacher-student-guardian-grid {
            display: grid;

            grid-template-columns:
              repeat(3,minmax(0,1fr));

            gap: 5px;

            margin-top: 7px;
          }

          .teacher-student-guardian-grid span,
          .teacher-student-guardian-grid strong {
            display: block;
          }

          .teacher-student-guardian-grid span {
            color: #9A9F9B;
            font-size: 4.7px;
          }

          .teacher-student-guardian-grid strong {
            margin-top: 2px;

            overflow: hidden;

            color: #5B5C58;

            font-size: 5.7px;
            font-weight: 850;

            text-overflow: ellipsis;
            white-space: nowrap;
          }

          .teacher-student-followup {
            display: flex;
            align-items: center;

            gap: 5px;

            margin-top: 7px;
            padding: 7px 8px;

            border: 1px solid #F0DFB5;
            border-radius: 9px;

            color: #8A6822;
            background: #FFF9EA;

            font-size: 5.3px;
            font-weight: 850;
          }

          .teacher-student-performance {
            display: grid;

            grid-template-columns:
              1fr 1fr 1fr;

            gap: 6px;

            margin-top: 7px;
          }

          .teacher-student-performance-box {
            padding: 8px;

            border: 1px solid #E7ECE9;
            border-radius: 9px;

            background: #FFFFFF;

            text-align: center;
          }

          .teacher-student-performance-box span,
          .teacher-student-performance-box strong {
            display: block;
          }

          .teacher-student-performance-box span {
            color: #929B95;

            font-size: 4.8px;
          }

          .teacher-student-performance-box strong {
            margin-top: 2px;

            color: #3D4D43;

            font-size: 8px;
            font-weight: 950;
          }

          .teacher-student-attendance-bar {
            height: 5px;

            margin-top: 4px;

            overflow: hidden;

            border-radius: 999px;

            background: #EEF2EF;
          }

          .teacher-student-attendance-bar div {
            height: 100%;

            border-radius: 999px;

            background:
              linear-gradient(
                90deg,
                #0F766E,
                #65A578
              );
          }

          .teacher-student-recitation-line {
            display: flex;
            align-items: center;
            justify-content: space-between;

            gap: 8px;

            margin-top: 7px;
            padding: 7px 8px;

            border-top: 1px solid #EEF2EF;

            color: #8B958F;

            font-size: 5px;
          }

          .teacher-student-recitation-line span {
            display: inline-flex;
            align-items: center;

            gap: 3px;
          }

          .teacher-student-recitation-line strong {
            color: #536159;
            font-size: 5.4px;
          }

          .teacher-student-actions {
            display: grid;

            grid-template-columns:
              1fr 1fr 1fr;

            gap: 5px;

            margin-top: 9px;
          }

          .teacher-student-action {
            min-height: 32px;

            border: none;
            border-radius: 8px;

            display: inline-flex;
            align-items: center;
            justify-content: center;

            gap: 3px;

            font-size: 5.5px;
            font-weight: 900;

            cursor: pointer;
          }

          .teacher-student-action.edit {
            color: #3D6655;
            background: #EDF6F1;
          }

          .teacher-student-action.status {
            color: #8A6822;
            background: #FFF8E8;
          }

          .teacher-student-action.delete {
            color: #A34236;
            background: #FFF0ED;
          }

          /* STATES */

          .teacher-students-state {
            min-height: 220px;

            display: flex;
            align-items: center;
            justify-content: center;
            flex-direction: column;

            gap: 5px;

            padding: 20px;

            border: 1px dashed #DDE5E0;
            border-radius: 14px;

            color: #929C96;
            background: #FBFDFC;

            text-align: center;
          }

          .teacher-students-state-icon {
            width: 42px;
            height: 42px;

            border-radius: 12px;

            display: flex;
            align-items: center;
            justify-content: center;

            color: #0F6B49;
            background: #EDF7F1;
          }

          .teacher-students-state strong {
            color: #57645C;
            font-size: 8px;
          }

          .teacher-students-state p {
            max-width: 360px;

            margin: 0;

            color: #929B95;

            font-size: 5.7px;
            line-height: 1.5;
          }

          .teacher-students-state-actions {
            display: flex;
            align-items: center;

            gap: 5px;

            margin-top: 5px;
          }

          .teacher-students-state-actions button {
            min-height: 30px;

            padding: 0 9px;

            border: none;
            border-radius: 8px;

            display: inline-flex;
            align-items: center;

            gap: 4px;

            color: #FFFFFF;
            background: #0F6848;

            font-size: 5.7px;
            font-weight: 900;

            cursor: pointer;
          }

          /* MODAL */

          .teacher-student-form-overlay {
            position: fixed;
            inset: 0;
            z-index: 10000;

            display: flex;
            align-items: center;
            justify-content: center;

            padding: 16px;

            background:
              rgba(10,29,24,.58);

            backdrop-filter: blur(7px);
          }

          .teacher-student-form-modal {
            width: min(900px,100%);
            max-height: calc(100vh - 32px);

            overflow: auto;

            border: 1px solid rgba(255,255,255,.5);
            border-radius: 22px;

            background: #FFFFFF;

            box-shadow:
              0 30px 90px rgba(0,0,0,.25);
          }

          .teacher-student-form-header {
            position: sticky;
            top: 0;
            z-index: 20;

            display: flex;
            align-items: flex-start;
            justify-content: space-between;

            gap: 12px;

            padding: 14px 17px;

            border-bottom: 1px solid #E8EEE9;

            background:
              rgba(255,255,255,.97);

            backdrop-filter: blur(10px);
          }

          .teacher-student-form-heading {
            display: flex;
            align-items: center;

            gap: 9px;
          }

          .teacher-student-form-heading-icon {
            width: 39px;
            height: 39px;

            flex: 0 0 39px;

            border-radius: 11px;

            display: flex;
            align-items: center;
            justify-content: center;

            color: #FFFFFF;

            background:
              linear-gradient(
                145deg,
                #0F5132,
                #0F766E
              );
          }

          .teacher-student-form-heading span {
            display: block;

            color: #98772C;

            font-size: 5.4px;
            font-weight: 900;
          }

          .teacher-student-form-heading h2 {
            margin: 1px 0 0;

            color: #35463C;

            font-size: 12px;
            font-weight: 950;
          }

          .teacher-student-form-heading p {
            margin: 2px 0 0;

            color: #8D9791;

            font-size: 5.5px;
          }

          .teacher-student-form-close {
            width: 32px;
            height: 32px;

            border: 1px solid #E0E7E2;
            border-radius: 9px;

            display: flex;
            align-items: center;
            justify-content: center;

            color: #657169;
            background: #FFFFFF;

            cursor: pointer;
          }

          .teacher-student-form-body {
            display: grid;
            gap: 9px;

            padding: 12px 16px 16px;
          }

          .teacher-student-form-section {
            padding: 11px;

            border: 1px solid #E7ECE9;
            border-radius: 13px;

            background: #FFFFFF;
          }

          .teacher-student-form-section-title {
            display: flex;
            align-items: center;

            gap: 5px;

            margin-bottom: 9px;

            color: #405046;

            font-size: 7px;
            font-weight: 950;
          }

          .teacher-student-form-grid {
            display: grid;

            grid-template-columns:
              repeat(3,minmax(0,1fr));

            gap: 8px;
          }

          .teacher-student-form-field.full {
            grid-column: 1 / -1;
          }

          .teacher-student-form-field.double {
            grid-column: span 2;
          }

          .teacher-student-form-field label {
            display: block;

            margin-bottom: 5px;

            color: #58665D;

            font-size: 5.7px;
            font-weight: 900;
          }

          .teacher-student-form-field label b {
            color: #B42318;
          }

          .teacher-student-form-field input,
          .teacher-student-form-field select,
          .teacher-student-form-field textarea {
            width: 100%;

            border: 1px solid #DDE5E0;
            border-radius: 8px;

            outline: none;

            box-sizing: border-box;

            color: #3D4D43;
            background: #FBFDFC;

            font-family: inherit;
            font-size: 6.3px;
          }

          .teacher-student-form-field input,
          .teacher-student-form-field select {
            height: 38px;

            padding: 0 9px;
          }

          .teacher-student-form-field textarea {
            min-height: 75px;

            padding: 8px 9px;

            resize: vertical;

            line-height: 1.6;
          }

          .teacher-student-form-field input:focus,
          .teacher-student-form-field select:focus,
          .teacher-student-form-field textarea:focus {
            border-color: #A3C6B0;

            box-shadow:
              0 0 0 3px rgba(15,81,50,.05);

            background: #FFFFFF;
          }

          .teacher-student-form-days {
            display: grid;

            grid-template-columns:
              repeat(7,minmax(0,1fr));

            gap: 5px;

            margin-top: 7px;
          }

          .teacher-student-form-day {
            min-height: 31px;

            border: 1px solid #DDE5E0;
            border-radius: 8px;

            color: #66736B;
            background: #FFFFFF;

            font-size: 5.5px;
            font-weight: 850;

            cursor: pointer;
          }

          .teacher-student-form-day.active {
            border-color: #BFD5C7;

            color: #0F6848;
            background: #EDF7F1;
          }

          .teacher-student-form-footer {
            position: sticky;
            bottom: 0;
            z-index: 20;

            display: flex;
            align-items: center;
            justify-content: flex-end;

            gap: 6px;

            padding: 10px 16px;

            border-top: 1px solid #E9EEEB;

            background:
              rgba(251,253,252,.97);

            backdrop-filter: blur(10px);
          }

          .teacher-student-form-footer button {
            min-height: 36px;

            padding: 0 11px;

            border-radius: 9px;

            display: inline-flex;
            align-items: center;
            justify-content: center;

            gap: 4px;

            font-size: 6px;
            font-weight: 900;

            cursor: pointer;
          }

          .teacher-student-form-cancel {
            border: 1px solid #DCE4DF;

            color: #647169;
            background: #FFFFFF;
          }

          .teacher-student-form-save {
            border: none;

            color: #FFFFFF;

            background:
              linear-gradient(
                135deg,
                #0F5132,
                #0F766E
              );
          }

          .teacher-student-form-save:disabled,
          .teacher-student-form-cancel:disabled {
            opacity: .45;
            cursor: not-allowed;
          }

          .students-spin {
            animation:
              teacherStudentsSpin
              .8s linear infinite;
          }

          @keyframes teacherStudentsSpin {
            to {
              transform: rotate(360deg);
            }
          }

          /* RESPONSIVE */

          @media (max-width: 1200px) {
            .teacher-students-stats {
              grid-template-columns:
                repeat(3,minmax(0,1fr));
            }

            .teacher-students-filters {
              grid-template-columns:
                repeat(2,minmax(0,1fr));
            }

            .teacher-students-reset {
              grid-column: 1 / -1;
            }
          }

          @media (max-width: 760px) {
            .teacher-students-hero {
              align-items: flex-start;
              flex-direction: column;
            }

            .teacher-students-hero-actions {
              width: 100%;
            }

            .teacher-students-add {
              flex: 1;
            }

            .teacher-students-stats {
              grid-template-columns:
                repeat(2,minmax(0,1fr));
            }

            .teacher-students-filters {
              grid-template-columns: 1fr;
            }

            .teacher-students-reset {
              grid-column: auto;
            }

            .teacher-students-grid {
              grid-template-columns: 1fr;
            }

            .teacher-student-form-overlay {
              align-items: flex-end;

              padding: 6px;
            }

            .teacher-student-form-modal {
              max-height: calc(100vh - 12px);

              border-radius:
                20px 20px 8px 8px;
            }

            .teacher-student-form-grid {
              grid-template-columns:
                repeat(2,minmax(0,1fr));
            }

            .teacher-student-form-days {
              grid-template-columns:
                repeat(4,minmax(0,1fr));
            }
          }

          @media (max-width: 470px) {
            .teacher-students-stats {
              grid-template-columns: 1fr;
            }

            .teacher-student-info-grid,
            .teacher-student-performance,
            .teacher-student-guardian-grid,
            .teacher-student-actions,
            .teacher-student-form-grid {
              grid-template-columns: 1fr;
            }

            .teacher-student-form-field.double,
            .teacher-student-form-field.full {
              grid-column: auto;
            }

            .teacher-student-form-days {
              grid-template-columns:
                repeat(2,minmax(0,1fr));
            }
          }
        `}
      </style>
    </div>
  );
}

/* =========================================================
   Student Card
========================================================= */

function StudentCard({
  student,
  onEdit,
  onToggle,
  onDelete,
}) {
  const active =
    student.status ===
    "active";

  const stage =
    student.education_stage ||
    student.education_level ||
    "";

  const guardianName =
    student.guardian_name ||
    student.parent_name ||
    "غير مسجل";

  const guardianPhone =
    student.guardian_phone ||
    student.parent_phone ||
    "غير مسجل";

  const guardianRelation =
    student.guardian_relation ||
    "غير محددة";

  return (
    <article
      className={`teacher-student-card ${
        active
          ? ""
          : "inactive"
      }`}
    >
      <div className="teacher-student-card-head">
        <div className="teacher-student-identity">
          <div className="teacher-student-avatar">
            {getInitials(
              student.full_name
            )}
          </div>

          <div className="teacher-student-name">
            <span>
              الطالب
            </span>

            <strong>
              {student.full_name ||
                "بدون اسم"}
            </strong>

            <small>
              رقم الطالب:{" "}
              {student.user_number ||
                "—"}
            </small>
          </div>
        </div>

        <span
          className={`teacher-student-status ${
            active
              ? "active"
              : "inactive"
          }`}
        >
          {active ? (
            <CheckCircle2
              size={11}
            />
          ) : (
            <CircleSlash
              size={11}
            />
          )}

          {active
            ? "نشط"
            : "غير نشط"}
        </span>
      </div>

      <div className="teacher-student-info-grid">
        <StudentInfoBox
          icon={GraduationCap}
          label="المرحلة"
          value={getLabel(
            EDUCATION_STAGES,
            stage
          )}
        />

        <StudentInfoBox
          icon={VenusAndMars}
          label="الجنس"
          value={getLabel(
            GENDERS,
            student.gender
          )}
        />

        <StudentInfoBox
          icon={MapPin}
          label="الجنسية"
          value={
            student.nationality ||
            "غير محددة"
          }
        />

        <StudentInfoBox
          icon={Phone}
          label="جوال الطالب"
          value={
            student.phone ||
            "غير مسجل"
          }
        />

        <StudentInfoBox
          icon={Home}
          label="السكن"
          value={
            student.residence_address ||
            "غير مسجل"
          }
        />

        <StudentInfoBox
          icon={Video}
          label="التسميع"
          value={getLabel(
            RECITATION_MODES,
            student.recitation_mode
          )}
        />
      </div>

      <div className="teacher-student-halaqa">
        <strong>
          <BookOpen
            size={11}
          />

          {
            student.halaqa_name
          }
        </strong>

        <div className="teacher-student-halaqa-meta">
          <span>
            <Building2
              size={10}
            />{" "}
            {
              student.mosque_name
            }
          </span>

          {student.halaqa_period && (
            <span>
              <Clock3
                size={10}
              />{" "}
              {HALAQA_PERIODS[
                student.halaqa_period
              ] ||
                "غير محدد"}
            </span>
          )}
        </div>
      </div>

      <div className="teacher-student-guardian">
        <div className="teacher-student-guardian-head">
          <span>
            <ShieldCheck
              size={11}
            />
            ولي الأمر
          </span>

          <span
            className={
              student.profile_complete
                ? "teacher-student-profile-complete"
                : "teacher-student-profile-incomplete"
            }
          >
            {student.profile_complete
              ? "مكتمل"
              : "يحتاج استكمال"}
          </span>
        </div>

        <div className="teacher-student-guardian-grid">
          <div>
            <span>
              الاسم
            </span>

            <strong>
              {guardianName}
            </strong>
          </div>

          <div>
            <span>
              صلة القرابة
            </span>

            <strong>
              {guardianRelation}
            </strong>
          </div>

          <div>
            <span>
              التواصل
            </span>

            <strong>
              {guardianPhone}
            </strong>
          </div>
        </div>
      </div>

      {student.follow_up && (
        <div className="teacher-student-followup">
          <AlertTriangle
            size={12}
          />

          يحتاج متابعة: لا يوجد تسميع خلال آخر 7 أيام.
        </div>
      )}

      <div className="teacher-student-performance">
        <div className="teacher-student-performance-box">
          <span>
            الحضور - 30 يوم
          </span>

          <strong>
            {
              student.attendance_rate
            }
            %
          </strong>

          <div className="teacher-student-attendance-bar">
            <div
              style={{
                width: `${student.attendance_rate}%`,
              }}
            />
          </div>
        </div>

        <div className="teacher-student-performance-box">
          <span>
            التسميعات
          </span>

          <strong>
            {formatNumber(
              student.recitations_count
            )}
          </strong>
        </div>

        <div className="teacher-student-performance-box">
          <span>
            النقاط
          </span>

          <strong>
            {formatNumber(
              student.total_points
            )}
          </strong>
        </div>
      </div>

      <div className="teacher-student-recitation-line">
        <span>
          <CalendarDays
            size={11}
          />
          آخر تسميع
        </span>

        <strong>
          {student.last_recitation
            ? `${formatGregorianDate(
                student.last_recitation
              )} • ${formatHijriDate(
                student.last_recitation
              )}`
            : "لا يوجد"}
        </strong>
      </div>

      <div className="teacher-student-actions">
        <button
          type="button"
          className="teacher-student-action edit"
          onClick={() =>
            onEdit(student)
          }
        >
          <Edit3
            size={13}
          />
          تعديل
        </button>

        <button
          type="button"
          className="teacher-student-action status"
          onClick={
            onToggle
          }
        >
          {active ? (
            <UserX
              size={13}
            />
          ) : (
            <UserCheck
              size={13}
            />
          )}

          {active
            ? "إيقاف"
            : "تفعيل"}
        </button>

        <button
          type="button"
          className="teacher-student-action delete"
          onClick={
            onDelete
          }
        >
          <Trash2
            size={13}
          />
          حذف
        </button>
      </div>
    </article>
  );
}

/* =========================================================
   Form Modal
========================================================= */

function StudentFormModal({
  open,
  editingStudent,
  form,
  updateForm,
  toggleDay,
  halaqat,
  saving,
  onSave,
  onClose,
}) {
  useEffect(() => {
    if (!open) {
      return;
    }

    const previousOverflow =
      document.body.style.overflow;

    document.body.style.overflow =
      "hidden";

    function handleKeyDown(
      event
    ) {
      if (
        event.key ===
          "Escape" &&
        !saving
      ) {
        onClose();
      }
    }

    window.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () => {
      document.body.style.overflow =
        previousOverflow;

      window.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  }, [
    open,
    saving,
    onClose,
  ]);

  if (!open) {
    return null;
  }

  return (
    <div
      className="teacher-student-form-overlay"
      onMouseDown={(
        event
      ) => {
        if (
          event.target ===
            event.currentTarget &&
          !saving
        ) {
          onClose();
        }
      }}
    >
      <div
        className="teacher-student-form-modal"
        role="dialog"
        aria-modal="true"
      >
        <div className="teacher-student-form-header">
          <div className="teacher-student-form-heading">
            <div className="teacher-student-form-heading-icon">
              {editingStudent ? (
                <Edit3
                  size={18}
                />
              ) : (
                <Plus
                  size={18}
                />
              )}
            </div>

            <div>
              <span>
                ملف الطالب
              </span>

              <h2>
                {editingStudent
                  ? "تعديل بيانات الطالب"
                  : "إضافة طالب جديد"}
              </h2>

              <p>
                بيانات الطالب وولي الأمر والتعليم والتسميع.
              </p>
            </div>
          </div>

          <button
            type="button"
            className="teacher-student-form-close"
            onClick={
              onClose
            }
            disabled={
              saving
            }
          >
            <X
              size={16}
            />
          </button>
        </div>

        <div className="teacher-student-form-body">
          <FormSection
            icon={UserRound}
            title="البيانات الأساسية"
          >
            <div className="teacher-student-form-grid">
              <Field
                label="اسم الطالب"
                required
                value={
                  form.full_name
                }
                onChange={(
                  value
                ) =>
                  updateForm(
                    "full_name",
                    value
                  )
                }
                placeholder="الاسم الرباعي"
                className="double"
              />

              <Field
                label="رقم الطالب"
                required
                value={
                  form.user_number
                }
                onChange={(
                  value
                ) =>
                  updateForm(
                    "user_number",
                    value
                  )
                }
                placeholder="مثال: S001"
              />

              <Field
                label="جوال الطالب"
                value={
                  form.phone
                }
                onChange={(
                  value
                ) =>
                  updateForm(
                    "phone",
                    value
                  )
                }
                placeholder="05xxxxxxxx"
                type="tel"
              />

              <Field
                label="تاريخ الميلاد"
                value={
                  form.birth_date
                }
                onChange={(
                  value
                ) =>
                  updateForm(
                    "birth_date",
                    value
                  )
                }
                type="date"
              />

              <SelectField
                label="الجنس"
                value={
                  form.gender
                }
                onChange={(
                  value
                ) =>
                  updateForm(
                    "gender",
                    value
                  )
                }
                options={[
                  {
                    value: "",
                    label:
                      "غير محدد",
                  },
                  ...GENDERS,
                ]}
              />

              <Field
                label="الجنسية"
                value={
                  form.nationality
                }
                onChange={(
                  value
                ) =>
                  updateForm(
                    "nationality",
                    value
                  )
                }
                placeholder="مثال: سعودي"
              />

              <Field
                label="عنوان السكن"
                value={
                  form.residence_address
                }
                onChange={(
                  value
                ) =>
                  updateForm(
                    "residence_address",
                    value
                  )
                }
                placeholder="الحي / المدينة / وصف مختصر"
                className="double"
              />
            </div>
          </FormSection>

          <FormSection
            icon={ShieldCheck}
            title="بيانات ولي الأمر"
          >
            <div className="teacher-student-form-grid">
              <Field
                label="اسم ولي الأمر"
                value={
                  form.guardian_name
                }
                onChange={(
                  value
                ) =>
                  updateForm(
                    "guardian_name",
                    value
                  )
                }
                placeholder="اسم ولي الأمر"
              />

              <Field
                label="جوال ولي الأمر"
                value={
                  form.guardian_phone
                }
                onChange={(
                  value
                ) =>
                  updateForm(
                    "guardian_phone",
                    value
                  )
                }
                placeholder="05xxxxxxxx"
                type="tel"
              />

              <SelectField
                label="صلة القرابة"
                value={
                  form.guardian_relation
                }
                onChange={(
                  value
                ) =>
                  updateForm(
                    "guardian_relation",
                    value
                  )
                }
                options={[
                  {
                    value: "",
                    label:
                      "اختر صلة القرابة",
                  },
                  ...GUARDIAN_RELATIONS,
                ]}
              />
            </div>
          </FormSection>

          <FormSection
            icon={GraduationCap}
            title="التعليم والحلقة"
          >
            <div className="teacher-student-form-grid">
              <SelectField
                label="المرحلة الدراسية"
                value={
                  form.education_stage
                }
                onChange={(
                  value
                ) =>
                  updateForm(
                    "education_stage",
                    value
                  )
                }
                options={[
                  {
                    value: "",
                    label:
                      "اختر المرحلة",
                  },
                  ...EDUCATION_STAGES,
                ]}
              />

              <Field
                label="الصف الدراسي"
                value={
                  form.education_grade
                }
                onChange={(
                  value
                ) =>
                  updateForm(
                    "education_grade",
                    value
                  )
                }
                placeholder="مثال: الصف السادس"
              />

              <SelectField
                label="الهدف التعليمي"
                value={
                  form.learning_goal
                }
                onChange={(
                  value
                ) =>
                  updateForm(
                    "learning_goal",
                    value
                  )
                }
                options={[
                  {
                    value: "",
                    label:
                      "اختر الهدف",
                  },
                  ...LEARNING_GOALS,
                ]}
              />

              <SelectField
                label="الحلقة"
                value={
                  form.halaqa_id
                }
                onChange={(
                  value
                ) =>
                  updateForm(
                    "halaqa_id",
                    value
                  )
                }
                options={[
                  {
                    value: "",
                    label:
                      "اختر من حلقاتك",
                  },
                  ...halaqat.map(
                    (halaqa) => ({
                      value:
                        String(
                          halaqa.id
                        ),

                      label:
                        `${halaqa.name} — ${halaqa.mosque_name}${
                          halaqa.halaqa_period
                            ? ` — ${
                                HALAQA_PERIODS[
                                  halaqa
                                    .halaqa_period
                                ] ||
                                ""
                              }`
                            : ""
                        }`,
                    })
                  ),
                ]}
              />
            </div>
          </FormSection>

          <FormSection
            icon={BookOpen}
            title="إعدادات التسميع"
          >
            <div className="teacher-student-form-grid">
              <SelectField
                label="طريقة التسميع"
                value={
                  form.recitation_mode
                }
                onChange={(
                  value
                ) =>
                  updateForm(
                    "recitation_mode",
                    value
                  )
                }
                options={[
                  {
                    value: "",
                    label:
                      "غير محدد",
                  },
                  ...RECITATION_MODES,
                ]}
              />

              <Field
                label="وقت التسميع المفضل"
                value={
                  form.preferred_recitation_time
                }
                onChange={(
                  value
                ) =>
                  updateForm(
                    "preferred_recitation_time",
                    value
                  )
                }
                type="time"
              />
            </div>

            <div className="teacher-student-form-days">
              {DAYS.map(
                (day) => {
                  const active =
                    form.recitation_days.includes(
                      day.value
                    );

                  return (
                    <button
                      key={
                        day.value
                      }
                      type="button"
                      className={`teacher-student-form-day ${
                        active
                          ? "active"
                          : ""
                      }`}
                      onClick={() =>
                        toggleDay(
                          day.value
                        )
                      }
                    >
                      {day.label}
                    </button>
                  );
                }
              )}
            </div>
          </FormSection>

          <FormSection
            icon={BookOpen}
            title="ملاحظات"
          >
            <div className="teacher-student-form-grid">
              <Field
                label="ملاحظات إضافية"
                value={
                  form.notes
                }
                onChange={(
                  value
                ) =>
                  updateForm(
                    "notes",
                    value
                  )
                }
                placeholder="أي معلومات تربوية أو تشغيلية مهمة..."
                textarea
                className="full"
              />
            </div>
          </FormSection>
        </div>

        <div className="teacher-student-form-footer">
          <button
            type="button"
            className="teacher-student-form-cancel"
            onClick={
              onClose
            }
            disabled={
              saving
            }
          >
            إلغاء
          </button>

          <button
            type="button"
            className="teacher-student-form-save"
            onClick={
              onSave
            }
            disabled={
              saving
            }
          >
            {saving ? (
              <Loader2
                size={14}
                className="students-spin"
              />
            ) : editingStudent ? (
              <Edit3
                size={14}
              />
            ) : (
              <Plus
                size={14}
              />
            )}

            {saving
              ? "جارٍ الحفظ..."
              : editingStudent
                ? "حفظ التعديلات"
                : "إضافة الطالب"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   Small Components
========================================================= */

function StudentStat({
  label,
  value,
  icon: Icon,
  tone,
  sub,
}) {
  const tones = {
    green: {
      color: "#0F704A",
      soft: "#EAF7EE",
    },
    blue: {
      color: "#356D9E",
      soft: "#EDF5FB",
    },
    gold: {
      color: "#927021",
      soft: "#FFF8E8",
    },
    red: {
      color: "#A44337",
      soft: "#FFF0ED",
    },
  };

  const selected =
    tones[tone] ||
    tones.green;

  return (
    <div
      className="teacher-student-stat"
      style={{
        "--stat-color":
          selected.color,

        "--stat-soft":
          selected.soft,
      }}
    >
      <div className="teacher-student-stat-head">
        <span className="teacher-student-stat-label">
          {label}
        </span>

        <div className="teacher-student-stat-icon">
          <Icon
            size={15}
          />
        </div>
      </div>

      <strong>
        {value}
      </strong>

      <small>
        {sub}
      </small>
    </div>
  );
}

function StudentInfoBox({
  icon: Icon,
  label,
  value,
}) {
  return (
    <div className="teacher-student-info-box">
      <span>
        <Icon
          size={11}
        />
        {label}
      </span>

      <strong
        title={value}
      >
        {value ||
          "غير محدد"}
      </strong>
    </div>
  );
}

function FilterSelect({
  value,
  onChange,
  options,
}) {
  return (
    <div className="teacher-students-filter-select">
      <select
        value={value}
        onChange={(
          event
        ) =>
          onChange(
            event.target
              .value
          )
        }
      >
        {options.map(
          (option) => (
            <option
              key={
                option.value
              }
              value={
                option.value
              }
            >
              {option.label}
            </option>
          )
        )}
      </select>

      <ChevronDown
        size={13}
      />
    </div>
  );
}

function FormSection({
  icon: Icon,
  title,
  children,
}) {
  return (
    <section className="teacher-student-form-section">
      <div className="teacher-student-form-section-title">
        <Icon
          size={14}
        />
        {title}
      </div>

      {children}
    </section>
  );
}

function Field({
  label,
  required,
  value,
  onChange,
  placeholder,
  type = "text",
  textarea = false,
  className = "",
}) {
  return (
    <div
      className={`teacher-student-form-field ${className}`}
    >
      <label>
        {label}
        {required && (
          <b> *</b>
        )}
      </label>

      {textarea ? (
        <textarea
          value={value}
          onChange={(
            event
          ) =>
            onChange(
              event.target
                .value
            )
          }
          placeholder={
            placeholder
          }
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={(
            event
          ) =>
            onChange(
              event.target
                .value
            )
          }
          placeholder={
            placeholder
          }
        />
      )}
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}) {
  return (
    <div className="teacher-student-form-field">
      <label>
        {label}
      </label>

      <select
        value={value}
        onChange={(
          event
        ) =>
          onChange(
            event.target
              .value
          )
        }
      >
        {options.map(
          (option) => (
            <option
              key={
                option.value
              }
              value={
                option.value
              }
            >
              {option.label}
            </option>
          )
        )}
      </select>
    </div>
  );
}

function StudentsLoading() {
  return (
    <div className="teacher-students-state">
      <div className="teacher-students-state-icon">
        <Loader2
          size={22}
          className="students-spin"
        />
      </div>

      <strong>
        جارٍ تحميل طلابك...
      </strong>

      <p>
        يتم تجهيز بيانات الطلاب والحلقات والحضور والتسميع.
      </p>
    </div>
  );
}

function StudentsEmpty({
  hasHalaqat,
  filtered,
  onReset,
  onCreate,
}) {
  return (
    <div className="teacher-students-state">
      <div className="teacher-students-state-icon">
        {hasHalaqat ? (
          <Users
            size={22}
          />
        ) : (
          <BookOpen
            size={22}
          />
        )}
      </div>

      <strong>
        {!hasHalaqat
          ? "لا توجد حلقات مرتبطة بك"
          : filtered
            ? "لا توجد نتائج مطابقة"
            : "لا يوجد طلاب في حلقاتك"}
      </strong>

      <p>
        {!hasHalaqat
          ? "يجب أن تقوم الإدارة بربطك بحلقة أولًا."
          : filtered
            ? "غيّر البحث أو الفلاتر الحالية."
            : "يمكنك إضافة أول طالب من زر إضافة طالب."}
      </p>

      <div className="teacher-students-state-actions">
        {filtered && (
          <button
            type="button"
            onClick={
              onReset
            }
          >
            <RotateCcw
              size={12}
            />
            مسح الفلاتر
          </button>
        )}

        {!filtered &&
          hasHalaqat && (
            <button
              type="button"
              onClick={
                onCreate
              }
            >
              <Plus
                size={12}
              />
              إضافة طالب
            </button>
          )}
      </div>
    </div>
  );
}

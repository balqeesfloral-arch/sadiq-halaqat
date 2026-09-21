// src/pages/teacher/Recitations.jsx

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Edit3,
  FileText,
  GraduationCap,
  Layers3,
  Loader2,
  MessageSquareText,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  Target,
  Trash2,
  Trophy,
  UserRound,
  X,
  BookMarked,
  Hash,
  Save,
  LibraryBig,
  History,
  ShieldCheck,
  Building2,
} from "lucide-react";

import {
  supabase,
} from "../../lib/supabase";

import {
  surahs,
  evaluations,
} from "../../data/surahList";

import {
  useToast,
} from "../../components/Toast";
import {
  useTeacherPreferences,
} from "../../context/TeacherPreferencesContext";

/* =========================================================
   ثوابت
========================================================= */

const LESSON_AMOUNTS = [
  {
    value: "three_lines",
    label: "3 أسطر",
    faces: 0.2,
    hint: "3 من 15 سطر",
  },
  {
    value: "half_page",
    label: "نصف صفحة",
    faces: 0.5,
    hint: "0.50 وجه",
  },
  {
    value: "one_page",
    label: "صفحة",
    faces: 1,
    hint: "1.00 وجه",
  },
  {
    value: "two_pages",
    label: "صفحتان",
    faces: 2,
    hint: "2.00 وجه",
  },
];

const HALAQA_PERIODS = {
  after_fajr: "بعد الفجر",
  after_dhuhr: "بعد الظهر",
  after_asr: "بعد العصر",
  after_maghrib: "بعد المغرب",
  after_isha: "بعد العشاء",
};

/* =========================================================
   Initial Forms
========================================================= */

function createCommonForm() {
  return {
    halaqa_id: "",
    student_id: "",
    recitation_date:
      getLocalDate(),
    notes: "",
  };
}

function createQuranForm(defaultAmountType = "") {
  const defaultAmount =
    legacyLessonAmount(defaultAmountType);

  return {
    from_surah: "",
    from_ayah: "",
    to_surah: "",
    to_ayah: "",

    lesson_evaluation: "",
    lesson_amount_type: defaultAmountType || "",
    lesson_amount_value: defaultAmount.amount,
    lesson_amount_unit: defaultAmount.unit,

    next_surah: "",
    next_from_ayah: "",
    next_to_surah: "",
    next_to_ayah: "",
    next_evaluation: "",

    next2_surah: "",
    next2_from_ayah: "",
    next2_to_surah: "",
    next2_to_ayah: "",
    next2_evaluation: "",

    review_surah: "",
    review_from_ayah: "",
    review_to_surah: "",
    review_to_ayah: "",
    review_evaluation: "",
    review_faces: "",
  };
}

function createNooraniaForm() {
  return {
    lesson: "",
    lesson_evaluation: "",
    lesson_faces: "",

    side_lesson: "",
    side_lesson_evaluation: "",

    revision: "",
    revision_evaluation: "",
    revision_faces: "",
  };
}

/* =========================================================
   الصفحة
========================================================= */

export default function Recitations() {
  const {
    showToast,
  } = useToast();

  const {
    teacherPreferences = {},
  } = useTeacherPreferences();

  /* =====================================================
     بيانات المستخدم
  ===================================================== */

  const [
    teacher,
    setTeacher,
  ] = useState(null);

  const [
    halaqat,
    setHalaqat,
  ] = useState([]);

  /*
    الطلاب الحاليون فقط
    لاستخدامهم عند إنشاء تسميع جديد.
  */

  const [
    students,
    setStudents,
  ] = useState([]);

  /*
    جميع ملفات الطلاب المرتبطين
    بالسجلات القديمة أو الحالية.

    الهدف:
    إظهار اسم الطالب حتى لو
    انتقل لاحقًا من الحلقة.
  */

  const [
    profiles,
    setProfiles,
  ] = useState([]);

  /* =====================================================
     السجلات
  ===================================================== */

  const [
    quranRecords,
    setQuranRecords,
  ] = useState([]);

  const [
    nooraniaRecords,
    setNooraniaRecords,
  ] = useState([]);

  /* =====================================================
     حالات الصفحة
  ===================================================== */

  const [
    initialLoading,
    setInitialLoading,
  ] = useState(true);

  const [
    refreshing,
    setRefreshing,
  ] = useState(false);

  const [
    saving,
    setSaving,
  ] = useState(false);

  const [
    deletingKey,
    setDeletingKey,
  ] = useState("");

  /* =====================================================
     Modal
  ===================================================== */

  const [
    formOpen,
    setFormOpen,
  ] = useState(false);

  /*
    quran
    noorania
  */

  const [
    formType,
    setFormType,
  ] = useState("quran");

  /*
    {
      type: "quran" | "noorania",
      id: number
    }
  */

  const [
    editing,
    setEditing,
  ] = useState(null);

  const [
    commonForm,
    setCommonForm,
  ] = useState(
    createCommonForm
  );

  const [
    quranForm,
    setQuranForm,
  ] = useState(
    createQuranForm
  );

  const [
    nooraniaForm,
    setNooraniaForm,
  ] = useState(
    createNooraniaForm
  );


  const [
    planSuggestion,
    setPlanSuggestion,
  ] = useState(null);

  /* =====================================================
     سجل العمليات - Filters
  ===================================================== */

  const [
    recordsSearch,
    setRecordsSearch,
  ] = useState("");

  const [
    recordTypeFilter,
    setRecordTypeFilter,
  ] = useState("all");

  const [
    halaqaFilter,
    setHalaqaFilter,
  ] = useState("all");

  const [
    dateFilter,
    setDateFilter,
  ] = useState("today");

  /* =====================================================
     التحميل
  ===================================================== */

  useEffect(() => {
    loadData();
  }, []);

  /* =====================================================
     منع Scroll خلف Modal
  ===================================================== */

  useEffect(() => {
    if (!formOpen) {
      document.body.style.overflow =
        "";

      return;
    }

    document.body.style.overflow =
      "hidden";

    return () => {
      document.body.style.overflow =
        "";
    };
  }, [formOpen]);

  /* =====================================================
     تحميل البيانات
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
        data:
          teacherProfile,
        error:
          teacherError,
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

      if (teacherError) {
        throw teacherError;
      }

      setTeacher(
        teacherProfile
      );

      /* -----------------------------------------
         Teacher Halaqat
      ----------------------------------------- */

      const {
        data: teacherLinks,
        error: linksError,
      } =
        await supabase
          .from(
            "teacher_halaqat"
          )
          .select(`
            halaqa_id,
            role
          `)
          .eq(
            "teacher_id",
            teacherProfile.id
          );

      if (linksError) {
        throw linksError;
      }

      const teacherHalaqaIds = [
        ...new Set(
          (
            teacherLinks ||
            []
          ).map(
            (item) =>
              Number(
                item.halaqa_id
              )
          )
        ),
      ];

      if (
        teacherHalaqaIds.length ===
        0
      ) {
        setHalaqat([]);
        setStudents([]);
        setProfiles([]);
        setQuranRecords([]);
        setNooraniaRecords([]);

        return;
      }

      const roleMap =
        new Map();

      (
        teacherLinks || []
      ).forEach(
        (item) => {
          const id =
            Number(
              item.halaqa_id
            );

          /*
            إذا وجد main و assistant
            نفضل main.
          */

          if (
            !roleMap.has(id) ||
            item.role === "main"
          ) {
            roleMap.set(
              id,
              item.role
            );
          }
        }
      );

      /* -----------------------------------------
         Halaqat
      ----------------------------------------- */

      const {
        data: halaqatRows,
        error:
          halaqatError,
      } =
        await supabase
          .from("halaqat")
          .select(`
            id,
            name,
            mosque_id,
            halaqa_period,
            capacity,
            status
          `)
          .in(
            "id",
            teacherHalaqaIds
          )
          .order(
            "name",
            {
              ascending:
                true,
            }
          );

      if (halaqatError) {
        throw halaqatError;
      }

      /* -----------------------------------------
         Mosques
      ----------------------------------------- */

      const mosqueIds = [
        ...new Set(
          (
            halaqatRows ||
            []
          )
            .map(
              (item) =>
                item.mosque_id
            )
            .filter(Boolean)
            .map(Number)
        ),
      ];

      let mosqueRows = [];

      if (
        mosqueIds.length > 0
      ) {
        const {
          data,
          error,
        } =
          await supabase
            .from("mosques")
            .select(`
              id,
              name
            `)
            .in(
              "id",
              mosqueIds
            );

        if (error) {
          throw error;
        }

        mosqueRows =
          data || [];
      }

      const mosqueMap =
        new Map(
          mosqueRows.map(
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

      /* -----------------------------------------
         Current student assignments
      ----------------------------------------- */

      const {
        data:
          assignments,
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
            is_current
          `)
          .in(
            "halaqa_id",
            teacherHalaqaIds
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

      /* -----------------------------------------
         Quran Records

         مهم:
         نجيب بالسحلقة وليس teacher_id
         حتى تظهر السجلات القديمة التي
         teacher_id فيها null.
      ----------------------------------------- */

      const {
        data:
          quranRows,
        error:
          quranError,
      } =
        await supabase
          .from("recitations")
          .select("*")
          .in(
            "halaqa_id",
            teacherHalaqaIds
          )
          .order(
            "recitation_date",
            {
              ascending:
                false,
            }
          )
          .order(
            "id",
            {
              ascending:
                false,
            }
          );

      if (quranError) {
        throw quranError;
      }

      /* -----------------------------------------
         Noorania Records
      ----------------------------------------- */

      const {
        data:
          nooraniaRows,
        error:
          nooraniaError,
      } =
        await supabase
          .from(
            "noorania_recitations"
          )
          .select("*")
          .in(
            "halaqa_id",
            teacherHalaqaIds
          )
          .order(
            "recitation_date",
            {
              ascending:
                false,
            }
          )
          .order(
            "id",
            {
              ascending:
                false,
            }
          );

      if (
        nooraniaError
      ) {
        throw nooraniaError;
      }

      setQuranRecords(
        quranRows || []
      );

      setNooraniaRecords(
        nooraniaRows || []
      );

      /* -----------------------------------------
         Profile IDs

         الحاليون + أصحاب السجلات القديمة.
      ----------------------------------------- */

      const studentIds = [
        ...new Set([
          ...(
            assignments || []
          ).map(
            (item) =>
              Number(
                item.student_id
              )
          ),

          ...(
            quranRows || []
          ).map(
            (item) =>
              Number(
                item.student_id
              )
          ),

          ...(
            nooraniaRows || []
          ).map(
            (item) =>
              Number(
                item.student_id
              )
          ),
        ]),
      ].filter(Boolean);

      let profileRows = [];

      if (
        studentIds.length > 0
      ) {
        const {
          data,
          error,
        } =
          await supabase
            .from("profiles")
            .select(`
              id,
              full_name,
              user_number,
              phone,
              status,
              learning_goal,
              recitation_mode,
              recitation_days
            `)
            .in(
              "id",
              studentIds
            );

        if (error) {
          throw error;
        }

        profileRows =
          data || [];
      }

      setProfiles(
        profileRows
      );

      const profileMap =
        new Map(
          profileRows.map(
            (profile) => [
              Number(
                profile.id
              ),
              profile,
            ]
          )
        );

      /*
        الطلاب النشطون والحاليون
        فقط عند إضافة سجل جديد.
      */

      const currentStudents =
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

              if (
                profile.status !==
                "active"
              ) {
                return null;
              }

              return {
                ...profile,

                student_id:
                  Number(
                    profile.id
                  ),

                halaqa_id:
                  Number(
                    assignment
                      .halaqa_id
                  ),
              };
            }
          )
          .filter(Boolean);

      setStudents(
        currentStudents
      );

    } catch (error) {
      console.error(
        "LOAD RECITATIONS:",
        error
      );

      showToast(
        error.message ||
          "تعذر تحميل بيانات التسميع",
        "error"
      );
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
     أسماء
  ===================================================== */

  function studentName(
    id
  ) {
    return (
      profiles.find(
        (profile) =>
          Number(
            profile.id
          ) ===
          Number(id)
      )?.full_name ||
      "طالب غير معروف"
    );
  }

  function halaqaName(
    id
  ) {
    return (
      halaqat.find(
        (halaqa) =>
          Number(
            halaqa.id
          ) ===
          Number(id)
      )?.name ||
      "حلقة غير معروفة"
    );
  }

  /* =====================================================
     Combined Records
  ===================================================== */

  const allRecords =
    useMemo(() => {
      const merged = [
        ...quranRecords.map(
          (record) => ({
            ...record,
            record_type:
              "quran",
          })
        ),

        ...nooraniaRecords.map(
          (record) => ({
            ...record,
            record_type:
              "noorania",
          })
        ),
      ];

      return merged.sort(
        (a, b) => {
          const dateCompare =
            String(
              b.recitation_date ||
                ""
            ).localeCompare(
              String(
                a.recitation_date ||
                  ""
              )
            );

          if (
            dateCompare !== 0
          ) {
            return dateCompare;
          }

          return (
            Number(b.id) -
            Number(a.id)
          );
        }
      );
    }, [
      quranRecords,
      nooraniaRecords,
    ]);

  /* =====================================================
     Record filters
  ===================================================== */

  const filteredRecords =
    useMemo(() => {
      const text =
        recordsSearch
          .trim()
          .toLowerCase();

      const todayDate =
        getLocalDate();

      const monthPrefix =
        todayDate.slice(
          0,
          7
        );

      return allRecords.filter(
        (record) => {
          const name =
            studentName(
              record.student_id
            ).toLowerCase();

          const hName =
            halaqaName(
              record.halaqa_id
            ).toLowerCase();

          const matchesSearch =
            !text ||
            name.includes(
              text
            ) ||
            hName.includes(
              text
            );

          const matchesType =
            recordTypeFilter ===
              "all" ||
            record.record_type ===
              recordTypeFilter;

          const matchesHalaqa =
            halaqaFilter ===
              "all" ||
            Number(
              record.halaqa_id
            ) ===
              Number(
                halaqaFilter
              );

          const matchesDate =
            dateFilter ===
              "all" ||
            (
              dateFilter ===
                "today" &&
              String(
                record.recitation_date ||
                  ""
              ) === todayDate
            ) ||
            (
              dateFilter ===
                "month" &&
              String(
                record.recitation_date ||
                  ""
              ).startsWith(
                monthPrefix
              )
            );

          return (
            matchesSearch &&
            matchesType &&
            matchesHalaqa &&
            matchesDate
          );
        }
      );
    }, [
      allRecords,
      recordsSearch,
      recordTypeFilter,
      halaqaFilter,
      dateFilter,
      profiles,
      halaqat,
    ]);

  /* =====================================================
     إحصائيات الشهر الحالي
  ===================================================== */

  const stats =
    useMemo(() => {
      const month =
        getLocalDate().slice(
          0,
          7
        );

      const monthQuran =
        quranRecords.filter(
          (record) =>
            String(
              record.recitation_date ||
                ""
            ).startsWith(
              month
            )
        );

      const monthNoorania =
        nooraniaRecords.filter(
          (record) =>
            String(
              record.recitation_date ||
                ""
            ).startsWith(
              month
            )
        );

      const lessonFaces =
        monthQuran.reduce(
          (sum, record) =>
            sum +
            Number(
              record.lesson_faces ||
                0
            ),
          0
        );

      const reviewFaces =
        monthQuran.reduce(
          (sum, record) =>
            sum +
            Number(
              record.review_faces ||
                0
            ),
          0
        );

      return {
        total:
          allRecords.length,

        quran:
          monthQuran.length,

        noorania:
          monthNoorania.length,

        lessonFaces,

        reviewFaces,
      };
    }, [
      allRecords,
      quranRecords,
      nooraniaRecords,
    ]);

  /* =====================================================
     Students for form
  ===================================================== */

  const studentsForForm =
    useMemo(() => {
      if (
        !commonForm.halaqa_id
      ) {
        return [];
      }

      let result =
        students.filter(
          (student) =>
            Number(
              student.halaqa_id
            ) ===
            Number(
              commonForm.halaqa_id
            )
        );

      /*
        أثناء تعديل سجل قديم،
        ربما الطالب انتقل إلى
        حلقة أخرى لاحقًا.

        نضيفه للقائمة حتى يظهر
        اسمه بشكل صحيح.
      */

      if (
        editing &&
        commonForm.student_id &&
        !result.some(
          (student) =>
            Number(
              student.id
            ) ===
            Number(
              commonForm.student_id
            )
        )
      ) {
        const oldStudent =
          profiles.find(
            (profile) =>
              Number(
                profile.id
              ) ===
              Number(
                commonForm.student_id
              )
          );

        if (oldStudent) {
          result = [
            {
              ...oldStudent,

              student_id:
                oldStudent.id,

              halaqa_id:
                Number(
                  commonForm.halaqa_id
                ),
            },

            ...result,
          ];
        }
      }

      return result;
    }, [
      students,
      profiles,
      commonForm.halaqa_id,
      commonForm.student_id,
      editing,
    ]);

  /* =====================================================
     الخطة الشهرية → افتراضيات التسميع
  ===================================================== */

  useEffect(() => {
    if (
      editing ||
      !formOpen ||
      !commonForm.student_id ||
      !commonForm.halaqa_id ||
      !commonForm.recitation_date
    ) {
      if (editing) {
        setPlanSuggestion(null);
      }
      return;
    }

    let active = true;

    async function loadPlanSuggestion() {
      try {
        const hijri = getHijriPartsForDate(
          commonForm.recitation_date
        );

        const { data: plan, error } = await supabase
          .from("monthly_plans")
          .select(`
            id,
            status,
            hijri_year,
            hijri_month,
            memorization_daily_amount,
            memorization_daily_unit,
            revision_daily_amount,
            revision_daily_unit,
            memorization_target_faces,
            revision_target_faces,
            planned_sessions,
            recitation_days_snapshot,
            noorania_lesson_daily_amount,
            noorania_lesson_daily_unit,
            noorania_revision_daily_amount,
            noorania_revision_daily_unit
          `)
          .eq("student_id", Number(commonForm.student_id))
          .eq("halaqa_id", Number(commonForm.halaqa_id))
          .eq("hijri_year", Number(hijri.year))
          .eq("hijri_month", Number(hijri.month))
          .maybeSingle();

        if (error) throw error;
        if (!active) return;

        if (!plan) {
          setPlanSuggestion(null);
          return;
        }

        const student = profiles.find(
          (item) => Number(item.id) === Number(commonForm.student_id)
        );

        const days = Array.isArray(plan.recitation_days_snapshot) &&
          plan.recitation_days_snapshot.length
          ? plan.recitation_days_snapshot
          : Array.isArray(student?.recitation_days)
            ? student.recitation_days
            : [];

        const scheduledToday = isScheduledRecitationDate(
          commonForm.recitation_date,
          days
        );

        const plannedSessions = Number(plan.planned_sessions || 0);

        const memFallback = inferDailyFromTarget(
          plan.memorization_target_faces,
          plannedSessions
        );

        const revFallback = inferDailyFromTarget(
          plan.revision_target_faces,
          plannedSessions
        );

        const memorizationAmount =
          plan.memorization_daily_amount ?? memFallback.amount;

        const memorizationUnit =
          plan.memorization_daily_unit || memFallback.unit || "lines";

        const revisionAmount =
          plan.revision_daily_amount ?? revFallback.amount;

        const revisionUnit =
          plan.revision_daily_unit || revFallback.unit || "faces";

        setPlanSuggestion({
          ...plan,
          scheduledToday,
          days,
          memorizationAmount,
          memorizationUnit,
          revisionAmount,
          revisionUnit,
        });

        if (formType === "quran") {
          setQuranForm((current) => {
            const next = { ...current };

            if (
              (current.lesson_amount_value === "" || current.lesson_amount_value === null) &&
              Number(memorizationAmount || 0) > 0
            ) {
              next.lesson_amount_value = Number(memorizationAmount);
              next.lesson_amount_unit = memorizationUnit;
            }

            if (
              (current.review_faces === "" || current.review_faces === null) &&
              Number(revisionAmount || 0) > 0
            ) {
              next.review_faces = amountToFaces(
                revisionAmount,
                revisionUnit
              );
            }

            return next;
          });
        }

        if (formType === "noorania") {
          setNooraniaForm((current) => {
            const next = { ...current };

            const lessonAmount = Number(
              plan.noorania_lesson_daily_amount || 0
            );

            const lessonUnit =
              plan.noorania_lesson_daily_unit || "lesson";

            const revisionNooraniaAmount = Number(
              plan.noorania_revision_daily_amount || 0
            );

            const revisionNooraniaUnit =
              plan.noorania_revision_daily_unit || "faces";

            if (lessonAmount > 0) {
              if (lessonUnit === "lesson" && !current.lesson) {
                next.lesson = `${lessonAmount} ${lessonAmount === 1 ? "درس" : "دروس"}`;
              } else if (!current.lesson_faces) {
                next.lesson_faces = amountToFaces(
                  lessonAmount,
                  lessonUnit
                );
              }
            }

            if (
              revisionNooraniaAmount > 0 &&
              !current.revision_faces
            ) {
              next.revision_faces = amountToFaces(
                revisionNooraniaAmount,
                revisionNooraniaUnit
              );
            }

            return next;
          });
        }
      } catch (error) {
        console.error("LOAD RECITATION PLAN SUGGESTION:", error);
        if (active) {
          setPlanSuggestion(null);
        }
      }
    }

    loadPlanSuggestion();

    return () => {
      active = false;
    };
  }, [
    editing,
    formOpen,
    formType,
    commonForm.student_id,
    commonForm.halaqa_id,
    commonForm.recitation_date,
    profiles,
  ]);

  /* =====================================================
     مقدار الدرس الحالي
  ===================================================== */

  const lessonFaces =
    useMemo(() => {
      const manualValue = Number(
        quranForm.lesson_amount_value || 0
      );

      if (manualValue > 0) {
        return quranForm.lesson_amount_unit === "lines"
          ? roundFaces(manualValue / 15)
          : roundFaces(manualValue);
      }

      return (
        LESSON_AMOUNTS.find(
          (item) =>
            item.value === quranForm.lesson_amount_type
        )?.faces || 0
      );
    }, [
      quranForm.lesson_amount_value,
      quranForm.lesson_amount_unit,
      quranForm.lesson_amount_type,
    ]);

  /* =====================================================
     النقاط
  ===================================================== */

  const quranPoints =
    useMemo(() => {
      return (
        calculatePoints(
          quranForm
            .lesson_evaluation
        ) +
        calculatePoints(
          quranForm
            .next_evaluation
        ) +
        calculatePoints(
          quranForm
            .next2_evaluation
        ) +
        calculatePoints(
          quranForm
            .review_evaluation
        )
      );
    }, [quranForm]);

  const nooraniaPoints =
    useMemo(() => {
      return (
        calculatePoints(
          nooraniaForm
            .lesson_evaluation
        ) +
        calculatePoints(
          nooraniaForm
            .side_lesson_evaluation
        ) +
        calculatePoints(
          nooraniaForm
            .revision_evaluation
        )
      );
    }, [nooraniaForm]);

  /* =====================================================
     تحديث Form
  ===================================================== */

  function setCommon(
    key,
    value
  ) {
    if (!editing && key === "halaqa_id") {
      setCommonForm((current) => ({
        ...current,
        halaqa_id: value,
        student_id: "",
      }));

      if (
        teacher?.id &&
        value &&
        teacherPreferences.remember_last_halaqa
      ) {
        try {
          localStorage.setItem(
            `sadiq_teacher_last_halaqa_${teacher.id}`,
            String(value)
          );
        } catch {
          // التذكر المحلي تحسين تجربة فقط.
        }
      }

      setQuranForm(
        createQuranForm(
          teacherPreferences.recitation_default_amount_type
        )
      );
      setNooraniaForm(createNooraniaForm());
      setPlanSuggestion(null);
      return;
    }

    if (!editing && key === "student_id") {
      setCommonForm((current) => ({
        ...current,
        student_id: value,
      }));

      // لا نسمح أن تنتقل مقادير الطالب السابق إلى الطالب الجديد.
      setQuranForm(
        createQuranForm(
          teacherPreferences.recitation_default_amount_type
        )
      );
      setNooraniaForm(createNooraniaForm());
      setPlanSuggestion(null);
      return;
    }

    setCommonForm(
      (current) => ({
        ...current,
        [key]: value,
      })
    );
  }

  function setQuran(
    key,
    value
  ) {
    setQuranForm(
      (current) => ({
        ...current,
        [key]: value,
      })
    );
  }

  function setNoorania(
    key,
    value
  ) {
    setNooraniaForm(
      (current) => ({
        ...current,
        [key]: value,
      })
    );
  }

  /* =====================================================
     Reset
  ===================================================== */

  function resetForms(
    close = true
  ) {
    setEditing(null);

    setCommonForm(
      createCommonForm()
    );

    setQuranForm(
      createQuranForm(
        teacherPreferences.recitation_default_amount_type
      )
    );

    setNooraniaForm(
      createNooraniaForm()
    );

    setPlanSuggestion(null);

    if (close) {
      setFormOpen(false);
    }
  }

  /* =====================================================
     إنشاء جديد
  ===================================================== */

  function openCreate(
    type
  ) {
    setEditing(null);

    setFormType(type);

    let rememberedHalaqa = "";

    if (
      teacher?.id &&
      teacherPreferences.remember_last_halaqa
    ) {
      try {
        rememberedHalaqa =
          localStorage.getItem(
            `sadiq_teacher_last_halaqa_${teacher.id}`
          ) || "";
      } catch {
        rememberedHalaqa = "";
      }
    }

    const rememberedExists =
      rememberedHalaqa &&
      halaqat.some(
        (item) => String(item.id) === String(rememberedHalaqa)
      );

    const preferredHalaqa =
      rememberedExists
        ? String(rememberedHalaqa)
        : teacherPreferences.default_halaqa_id &&
            halaqat.some(
              (item) =>
                Number(item.id) ===
                Number(teacherPreferences.default_halaqa_id)
            )
          ? String(teacherPreferences.default_halaqa_id)
          : "";

    const defaultHalaqa =
      preferredHalaqa ||
      (halaqat.length === 1
        ? String(
            halaqat[0].id
          )
        : "");

    setCommonForm({
      ...createCommonForm(),

      halaqa_id:
        defaultHalaqa,
    });

    setQuranForm(
      createQuranForm(
        teacherPreferences.recitation_default_amount_type
      )
    );

    setNooraniaForm(
      createNooraniaForm()
    );

    setPlanSuggestion(null);

    setFormOpen(true);
  }

  /* =====================================================
     تعديل سجل قرآن قديم أو جديد
  ===================================================== */

  function editQuranRecord(
    record
  ) {
    setFormType(
      "quran"
    );

    setEditing({
      type: "quran",
      id: record.id,
    });

    setCommonForm({
      halaqa_id:
        String(
          record.halaqa_id
        ),

      student_id:
        String(
          record.student_id
        ),

      recitation_date:
        record.recitation_date ||
        getLocalDate(),

      notes:
        record.notes || "",
    });

    setQuranForm({
      from_surah:
        record.from_surah ||
        "",

      from_ayah:
        valueToString(
          record.from_ayah
        ),

      to_surah:
        record.to_surah ||
        "",

      to_ayah:
        valueToString(
          record.to_ayah
        ),

      lesson_evaluation:
        record.lesson_evaluation ||
        "",

      lesson_amount_type:
        record.lesson_amount_type ||
        "",

      lesson_amount_value:
        record.lesson_amount_value ??
        legacyLessonAmount(
          record.lesson_amount_type
        ).amount,

      lesson_amount_unit:
        record.lesson_amount_unit ||
        legacyLessonAmount(
          record.lesson_amount_type
        ).unit,

      next_surah:
        record.next_surah ||
        "",

      next_from_ayah:
        valueToString(
          record.next_from_ayah
        ),

      next_to_surah:
        record.next_to_surah ||
        "",

      next_to_ayah:
        valueToString(
          record.next_to_ayah
        ),

      next_evaluation:
        record.next_evaluation ||
        "",

      next2_surah:
        record.next2_surah ||
        "",

      next2_from_ayah:
        valueToString(
          record.next2_from_ayah
        ),

      next2_to_surah:
        record.next2_to_surah ||
        "",

      next2_to_ayah:
        valueToString(
          record.next2_to_ayah
        ),

      next2_evaluation:
        record.next2_evaluation ||
        "",

      review_surah:
        record.review_surah ||
        "",

      review_from_ayah:
        valueToString(
          record.review_from_ayah
        ),

      review_to_surah:
        record.review_to_surah ||
        "",

      review_to_ayah:
        valueToString(
          record.review_to_ayah
        ),

      review_evaluation:
        record.review_evaluation ||
        "",

      review_faces:
        valueToString(
          record.review_faces
        ),
    });

    setPlanSuggestion(null);

    setFormOpen(true);
  }

  /* =====================================================
     تعديل سجل نورانية
  ===================================================== */

  function editNooraniaRecord(
    record
  ) {
    setFormType(
      "noorania"
    );

    setEditing({
      type:
        "noorania",

      id:
        record.id,
    });

    setCommonForm({
      halaqa_id:
        String(
          record.halaqa_id
        ),

      student_id:
        String(
          record.student_id
        ),

      recitation_date:
        record.recitation_date ||
        getLocalDate(),

      notes:
        record.notes || "",
    });

    setNooraniaForm({
      lesson:
        record.lesson || "",

      lesson_evaluation:
        record.lesson_evaluation ||
        "",

      lesson_faces:
        valueToString(
          record.lesson_faces
        ),

      side_lesson:
        record.side_lesson ||
        "",

      side_lesson_evaluation:
        record.side_lesson_evaluation ||
        "",

      revision:
        record.revision ||
        "",

      revision_evaluation:
        record.revision_evaluation ||
        "",

      revision_faces:
        valueToString(
          record.revision_faces
        ),
    });

    setPlanSuggestion(null);

    setFormOpen(true);
  }

  /* =====================================================
     Validation Common
  ===================================================== */

  function validateCommon() {
    if (!teacher?.id) {
      showToast(
        "تعذر تحديد حساب المعلم",
        "error"
      );

      return false;
    }

    if (
      !commonForm.halaqa_id
    ) {
      showToast(
        "اختر الحلقة",
        "error"
      );

      return false;
    }

    const allowed =
      halaqat.some(
        (halaqa) =>
          Number(
            halaqa.id
          ) ===
          Number(
            commonForm.halaqa_id
          )
      );

    if (!allowed) {
      showToast(
        "الحلقة ليست ضمن حلقاتك",
        "error"
      );

      return false;
    }

    if (
      !commonForm.student_id
    ) {
      showToast(
        "اختر الطالب",
        "error"
      );

      return false;
    }

    if (
      !commonForm.recitation_date
    ) {
      showToast(
        "حدد تاريخ التسميع",
        "error"
      );

      return false;
    }

    if (
      commonForm.recitation_date >
      getLocalDate()
    ) {
      showToast(
        "لا يمكن تسجيل تسميع بتاريخ مستقبلي",
        "error"
      );

      return false;
    }

    return true;
  }

  /* =====================================================
     SAVE
  ===================================================== */

  async function saveRecord() {
    if (
      !validateCommon()
    ) {
      return;
    }

    if (
      formType === "quran"
    ) {
      await saveQuran();
    } else {
      await saveNoorania();
    }
  }

  /* =====================================================
     SAVE QURAN
  ===================================================== */

  async function saveQuran() {
    /*
      واجهة القرآن الجديدة لا تطلب نطاق سورة/آية.
      الحقول القديمة تبقى داخل quranForm فقط حتى لا نمسح
      بيانات السجلات القديمة عند تعديلها.
    */

    const hasLegacyLesson =
      Boolean(
        quranForm.from_surah ||
        quranForm.to_surah
      );

    const hasLesson =
      Boolean(
        Number(quranForm.lesson_amount_value || 0) > 0 ||
        quranForm.lesson_amount_type ||
        quranForm.lesson_evaluation ||
        hasLegacyLesson
      );

    const hasFirstSide =
      Boolean(
        String(
          quranForm.next_surah || ""
        ).trim() ||
        quranForm.next_evaluation ||
        quranForm.next_to_surah
      );

    const hasSecondSide =
      Boolean(
        String(
          quranForm.next2_surah || ""
        ).trim() ||
        quranForm.next2_evaluation ||
        quranForm.next2_to_surah
      );

    const hasLegacyReview =
      Boolean(
        quranForm.review_surah ||
        quranForm.review_to_surah
      );

    const hasReview =
      Boolean(
        quranForm.review_faces !== "" ||
        quranForm.review_evaluation ||
        hasLegacyReview
      );

    if (
      !hasLesson &&
      !hasFirstSide &&
      !hasSecondSide &&
      !hasReview
    ) {
      showToast(
        "سجل الدرس أو جنب الدرس أو المراجعة أولًا",
        "error"
      );

      return;
    }

    /*
      الدرس اليومي:
      في السجل الجديد نحتاج فقط مقدار + تقييم.
      السجل القديم قد لا يملك lesson_amount_type، لذلك لا نجبره.
    */

    if (
      !editing &&
      hasLesson &&
      Number(quranForm.lesson_amount_value || 0) <= 0
    ) {
      showToast(
        "حدد مقدار الدرس",
        "error"
      );

      return;
    }

    if (
      hasLesson &&
      !quranForm.lesson_evaluation &&
      !hasLegacyLesson
    ) {
      showToast(
        "حدد تقييم الدرس",
        "error"
      );

      return;
    }

    /*
      جنب الدرس:
      نستخدم next_surah / next2_surah كنص مختصر
      دون إضافة أعمدة جديدة أو تغيير هيكل قاعدة البيانات.
    */

    if (
      String(
        quranForm.next_surah || ""
      ).trim() &&
      !quranForm.next_evaluation
    ) {
      showToast(
        "حدد تقييم جنب الدرس الأول",
        "error"
      );

      return;
    }

    if (
      quranForm.next_evaluation &&
      !String(
        quranForm.next_surah || ""
      ).trim() &&
      !quranForm.next_to_surah
    ) {
      showToast(
        "اكتب جنب الدرس الأول أو أزل تقييمه",
        "error"
      );

      return;
    }

    if (
      String(
        quranForm.next2_surah || ""
      ).trim() &&
      !quranForm.next2_evaluation
    ) {
      showToast(
        "حدد تقييم جنب الدرس الثاني",
        "error"
      );

      return;
    }

    if (
      quranForm.next2_evaluation &&
      !String(
        quranForm.next2_surah || ""
      ).trim() &&
      !quranForm.next2_to_surah
    ) {
      showToast(
        "اكتب جنب الدرس الثاني أو أزل تقييمه",
        "error"
      );

      return;
    }

    /*
      المراجعة:
      لا نطلب سورة أو آية؛ فقط مقدار المراجعة + التقييم.
    */

    if (
      hasReview &&
      !hasLegacyReview &&
      (
        quranForm.review_faces === "" ||
        Number(
          quranForm.review_faces
        ) <= 0
      )
    ) {
      showToast(
        "أدخل مقدار المراجعة",
        "error"
      );

      return;
    }

    if (
      hasReview &&
      !quranForm.review_evaluation &&
      !hasLegacyReview
    ) {
      showToast(
        "حدد تقييم المراجعة",
        "error"
      );

      return;
    }

    setSaving(true);

    try {
      const payload = {
        student_id:
          Number(
            commonForm.student_id
          ),

        halaqa_id:
          Number(
            commonForm.halaqa_id
          ),

        teacher_id:
          teacher.id,

        recitation_date:
          commonForm.recitation_date,

        /*
          لا تظهر هذه الحقول في الواجهة الجديدة.
          عند إنشاء سجل جديد ستكون null.
          وعند تعديل سجل قديم نحافظ على قيمه القديمة.
        */

        from_surah:
          textOrNull(
            quranForm.from_surah
          ),

        from_ayah:
          numberOrNull(
            quranForm.from_ayah
          ),

        to_surah:
          textOrNull(
            quranForm.to_surah
          ),

        to_ayah:
          numberOrNull(
            quranForm.to_ayah
          ),

        lesson_evaluation:
          textOrNull(
            quranForm.lesson_evaluation
          ),

        lesson_amount_type:
          textOrNull(
            legacyTypeForFreeAmount(
              quranForm.lesson_amount_value,
              quranForm.lesson_amount_unit
            ) || quranForm.lesson_amount_type
          ),

        lesson_amount_value:
          numberOrNull(
            quranForm.lesson_amount_value
          ),

        lesson_amount_unit:
          textOrNull(
            quranForm.lesson_amount_unit
          ),

        lesson_faces_manual:
          Number(quranForm.lesson_amount_value || 0) > 0
            ? (
                quranForm.lesson_amount_unit === "lines"
                  ? Number(quranForm.lesson_amount_value) / 15
                  : Number(quranForm.lesson_amount_value)
              )
            : null,

        /*
          lesson_faces القديم Generated Column لا نعدله.
          السجلات الجديدة تستخدم lesson_faces_manual حتى ندعم أي مقدار حر.
          PostgreSQL يحسبه تلقائيًا كما في النظام الحالي.
        */

        next_surah:
          textOrNull(
            quranForm.next_surah
          ),

        next_from_ayah:
          numberOrNull(
            quranForm.next_from_ayah
          ),

        next_to_surah:
          textOrNull(
            quranForm.next_to_surah
          ),

        next_to_ayah:
          numberOrNull(
            quranForm.next_to_ayah
          ),

        next_evaluation:
          textOrNull(
            quranForm.next_evaluation
          ),

        next2_surah:
          textOrNull(
            quranForm.next2_surah
          ),

        next2_from_ayah:
          numberOrNull(
            quranForm.next2_from_ayah
          ),

        next2_to_surah:
          textOrNull(
            quranForm.next2_to_surah
          ),

        next2_to_ayah:
          numberOrNull(
            quranForm.next2_to_ayah
          ),

        next2_evaluation:
          textOrNull(
            quranForm.next2_evaluation
          ),

        review_surah:
          textOrNull(
            quranForm.review_surah
          ),

        review_from_ayah:
          numberOrNull(
            quranForm.review_from_ayah
          ),

        review_to_surah:
          textOrNull(
            quranForm.review_to_surah
          ),

        review_to_ayah:
          numberOrNull(
            quranForm.review_to_ayah
          ),

        review_evaluation:
          textOrNull(
            quranForm.review_evaluation
          ),

        review_faces:
          numberOrNull(
            quranForm.review_faces
          ),

        notes:
          textOrNull(
            commonForm.notes
          ),

        points:
          quranPoints,
      };

      await saveToTable({
        table:
          "recitations",

        type:
          "quran",

        payload,

        points:
          quranPoints,

        reason:
          "تسميع القرآن الكريم",
      });

    } finally {
      setSaving(false);
    }
  }

  /* =====================================================
     SAVE NOORANIA
  ===================================================== */

  async function saveNoorania() {
    if (
      !nooraniaForm
        .lesson
        .trim()
    ) {
      showToast(
        "اكتب درس القاعدة النورانية",
        "error"
      );

      return;
    }

    if (
      !nooraniaForm
        .lesson_evaluation
    ) {
      showToast(
        "حدد تقييم الدرس",
        "error"
      );

      return;
    }

    if (
      nooraniaForm
        .lesson_faces ===
        "" ||
      Number(
        nooraniaForm
          .lesson_faces
      ) < 0
    ) {
      showToast(
        "أدخل عدد أوجه تسميع الدرس",
        "error"
      );

      return;
    }

    if (
      nooraniaForm
        .side_lesson
        .trim() &&
      !nooraniaForm
        .side_lesson_evaluation
    ) {
      showToast(
        "حدد تقييم جنب الدرس",
        "error"
      );

      return;
    }

    if (
      nooraniaForm
        .revision
        .trim()
    ) {
      if (
        !nooraniaForm
          .revision_evaluation
      ) {
        showToast(
          "حدد تقييم المراجعة",
          "error"
        );

        return;
      }

      if (
        nooraniaForm
          .revision_faces ===
          "" ||
        Number(
          nooraniaForm
            .revision_faces
        ) < 0
      ) {
        showToast(
          "أدخل عدد أوجه المراجعة",
          "error"
        );

        return;
      }
    }

    setSaving(true);

    try {
      const payload = {
        student_id:
          Number(
            commonForm.student_id
          ),

        halaqa_id:
          Number(
            commonForm.halaqa_id
          ),

        teacher_id:
          teacher.id,

        recitation_date:
          commonForm.recitation_date,

        lesson:
          nooraniaForm
            .lesson
            .trim(),

        lesson_evaluation:
          textOrNull(
            nooraniaForm
              .lesson_evaluation
          ),

        lesson_faces:
          numberOrNull(
            nooraniaForm
              .lesson_faces
          ),

        side_lesson:
          textOrNull(
            nooraniaForm
              .side_lesson
          ),

        side_lesson_evaluation:
          textOrNull(
            nooraniaForm
              .side_lesson_evaluation
          ),

        revision:
          textOrNull(
            nooraniaForm
              .revision
          ),

        revision_evaluation:
          textOrNull(
            nooraniaForm
              .revision_evaluation
          ),

        revision_faces:
          numberOrNull(
            nooraniaForm
              .revision_faces
          ),

        notes:
          textOrNull(
            commonForm.notes
          ),

        points:
          nooraniaPoints,
      };

      await saveToTable({
        table:
          "noorania_recitations",

        type:
          "noorania",

        payload,

        points:
          nooraniaPoints,

        reason:
          "تسميع القاعدة النورانية",
      });

    } finally {
      setSaving(false);
    }
  }

  /* =====================================================
     INSERT / UPDATE المشترك
  ===================================================== */

  async function saveToTable({
    table,
    type,
    payload,
    points,
    reason,
  }) {
    /*
      ============================================
      UPDATE
      ============================================
    */

    if (
      editing &&
      editing.type ===
        type
    ) {
      const source =
        type === "quran"
          ? quranRecords
          : nooraniaRecords;

      const oldRecord =
        source.find(
          (record) =>
            Number(
              record.id
            ) ===
            Number(
              editing.id
            )
        );

      if (!oldRecord) {
        throw new Error(
          "تعذر العثور على السجل القديم"
        );
      }

      const {
        error,
      } =
        await supabase
          .from(table)
          .update(payload)
          .eq(
            "id",
            editing.id
          )
          .eq(
            "halaqa_id",
            oldRecord.halaqa_id
          );

      if (error) {
        throw error;
      }

      const oldPoints =
        Number(
          oldRecord.points ||
            0
        );

      const difference =
        Number(points) -
        oldPoints;

      if (
        difference !== 0
      ) {
        await addPointsTransaction({
          studentId:
            payload.student_id,

          points:
            difference,

          date:
            payload.recitation_date,

          reason:
            `تعديل ${reason}`,
        });
      }

      showToast(
        "تم تعديل السجل بنجاح",
        "success"
      );
    }

    /*
      ============================================
      INSERT

      لا يوجد منع لتكرار اليوم.
      الطالب يمكن أن يكون لديه أكثر
      من جلسة في اليوم نفسه.
      ============================================
    */

    else {
      const {
        error,
      } =
        await supabase
          .from(table)
          .insert([
            payload,
          ]);

      if (error) {
        throw error;
      }

      if (
        Number(points) !== 0
      ) {
        await addPointsTransaction({
          studentId:
            payload.student_id,

          points,

          date:
            payload.recitation_date,

          reason,
        });
      }

      showToast(
        type === "quran"
          ? "تم حفظ تسميع القرآن بنجاح"
          : "تم حفظ تسميع القاعدة النورانية بنجاح",
        "success"
      );
    }

    const shouldAdvance =
      !editing &&
      teacherPreferences.recitation_advance_next_student !== false &&
      commonForm.halaqa_id &&
      commonForm.student_id;

    if (shouldAdvance) {
      const currentIndex = studentsForForm.findIndex(
        (student) =>
          String(student.id) === String(commonForm.student_id)
      );

      const nextStudent =
        currentIndex >= 0
          ? studentsForForm[currentIndex + 1]
          : null;

      if (nextStudent) {
        const currentHalaqa = commonForm.halaqa_id;
        const currentDate = commonForm.recitation_date || getLocalDate();

        setEditing(null);
        setCommonForm({
          ...createCommonForm(),
          halaqa_id: String(currentHalaqa),
          student_id: String(nextStudent.id),
          recitation_date: currentDate,
        });

        setQuranForm(
          createQuranForm(
            teacherPreferences.recitation_default_amount_type
          )
        );
        setNooraniaForm(createNooraniaForm());
        setPlanSuggestion(null);
        setFormOpen(true);

        showToast(
          `تم الانتقال إلى الطالب التالي: ${nextStudent.full_name || "الطالب"}`,
          "info"
        );
      } else {
        resetForms();
      }
    } else {
      resetForms();
    }

    await loadData(true);
  }

  /* =====================================================
     POINTS
  ===================================================== */

  async function addPointsTransaction({
    studentId,
    points,
    date,
    reason,
  }) {
    if (
      Number(points) === 0
    ) {
      return;
    }

    const {
      error,
    } =
      await supabase
        .from(
          "points_transactions"
        )
        .insert([
          {
            student_id:
              Number(
                studentId
              ),

            points:
              Number(
                points
              ),

            reason,

            /*
              نحافظ على category
              المستخدمة سابقًا
              حتى لا نصطدم بقيود DB.
            */

            category:
              "recitation",

            transaction_date:
              date,
          },
        ]);

    if (error) {
      console.error(
        "POINTS TRANSACTION:",
        error
      );

      showToast(
        "تم حفظ التسميع، لكن تعذر تحديث سجل النقاط",
        "error"
      );
    }
  }

  /* =====================================================
     DELETE
  ===================================================== */

  async function deleteRecord(
    record
  ) {
    const type =
      record.record_type;

    const table =
      type === "quran"
        ? "recitations"
        : "noorania_recitations";

    const typeName =
      type === "quran"
        ? "تسميع القرآن"
        : "تسميع القاعدة النورانية";

    const confirmed =
      window.confirm(
        `هل تريد حذف ${typeName} للطالب "${studentName(
          record.student_id
        )}"؟\n\nالتاريخ: ${formatHijriDate(
          record.recitation_date
        )}\n${formatGregorianDate(
          record.recitation_date
        )}\n\nلا يمكن التراجع عن الحذف.`
      );

    if (!confirmed) {
      return;
    }

    const key =
      `${type}-${record.id}`;

    setDeletingKey(key);

    try {
      const {
        error,
      } =
        await supabase
          .from(table)
          .delete()
          .eq(
            "id",
            record.id
          )
          .eq(
            "halaqa_id",
            record.halaqa_id
          );

      if (error) {
        throw error;
      }

      const oldPoints =
        Number(
          record.points ||
            0
        );

      if (
        oldPoints !== 0
      ) {
        await addPointsTransaction({
          studentId:
            record.student_id,

          points:
            -oldPoints,

          date:
            getLocalDate(),

          reason:
            `إلغاء ${typeName}`,
        });
      }

      if (
        editing &&
        editing.type ===
          type &&
        Number(
          editing.id
        ) ===
          Number(
            record.id
          )
      ) {
        resetForms();
      }

      showToast(
        "تم حذف السجل",
        "success"
      );

      await loadData(true);

    } catch (error) {
      console.error(
        "DELETE RECITATION:",
        error
      );

      showToast(
        error.message ||
          "تعذر حذف السجل",
        "error"
      );
    } finally {
      setDeletingKey("");
    }
  }

  /* =====================================================
     فتح Edit
  ===================================================== */

  function editRecord(
    record
  ) {
    if (
      record.record_type ===
      "quran"
    ) {
      editQuranRecord(
        record
      );
    } else {
      editNooraniaRecord(
        record
      );
    }
  }

  /* =====================================================
     Render
  ===================================================== */

  if (initialLoading) {
    return (
      <div
        className="recitations-page"
        dir="rtl"
      >
        <PageStyles />

        <LoadingState />
      </div>
    );
  }

  return (
    <div
      className="recitations-page"
      dir="rtl"
    >
      <PageStyles />

      {/* =================================================
          HERO
      ================================================= */}

      <section
        className="recitations-hero"
      >
        <div
          className="hero-main"
        >
          <div
            className="hero-icon"
          >
            <BookOpen
              size={24}
            />
          </div>

          <div>
            <div
              className="hero-eyebrow"
            >
              <ShieldCheck
                size={13}
              />

              بوابة المعلم
            </div>

            <h1>
              التسميع
            </h1>

            <p>
              تسجيل سريع وواضح للقرآن والقاعدة النورانية،
              بدون إدخال «من سورة / من آية / إلى سورة / إلى آية» في الجلسة اليومية.
            </p>
          </div>
        </div>

        <div
          className="hero-actions"
        >
          <button
            type="button"
            className="refresh-button"
            onClick={() =>
              loadData(true)
            }
            disabled={
              refreshing
            }
          >
            <RefreshCw
              size={16}
              className={
                refreshing
                  ? "spin"
                  : ""
              }
            />

            <span>
              تحديث
            </span>
          </button>

          <button
            type="button"
            className="create-button quran"
            onClick={() =>
              openCreate(
                "quran"
              )
            }
            disabled={
              halaqat.length ===
              0
            }
          >
            <BookOpen
              size={16}
            />

            <span>
              إضافة تسميع قرآن
            </span>
          </button>

          <button
            type="button"
            className="create-button noorania"
            onClick={() =>
              openCreate(
                "noorania"
              )
            }
            disabled={
              halaqat.length ===
              0
            }
          >
            <LibraryBig
              size={16}
            />

            <span>
              إضافة تسميع نورانية
            </span>
          </button>
        </div>
      </section>

      {/* =================================================
          INFO
      ================================================= */}

      <div
        className="recitation-scope"
      >
        <Sparkles
          size={14}
        />

        التسميع اليومي الآن أخف: اختر الطالب، المقدار، التقييم والمراجعة فقط.
        جنب الدرس باقٍ كما هو، والسجلات القديمة محفوظة في قاعدة البيانات.
      </div>

      {/* =================================================
          STATS
      ================================================= */}

      <section
        className="recitation-stats"
      >
        <StatCard
          icon={History}
          title="إجمالي السجلات"
          value={
            stats.total
          }
          subtitle="قرآن + نورانية"
        />

        <StatCard
          icon={BookOpen}
          title="تسميعات القرآن"
          value={
            stats.quran
          }
          subtitle="هذا الشهر"
        />

        <StatCard
          icon={LibraryBig}
          title="تسميعات النورانية"
          value={
            stats.noorania
          }
          subtitle="هذا الشهر"
        />

        <StatCard
          icon={Target}
          title="أوجه الدرس"
          value={formatFaces(
            stats.lessonFaces
          )}
          subtitle="قرآن هذا الشهر"
        />

        <StatCard
          icon={RefreshCw}
          title="أوجه المراجعة"
          value={formatFaces(
            stats.reviewFaces
          )}
          subtitle="قرآن هذا الشهر"
        />
      </section>

      {/* =================================================
          FILTERS
      ================================================= */}

      <section
        className="records-toolbar"
      >
        <div
          className="records-search"
        >
          <Search
            size={16}
          />

          <input
            value={
              recordsSearch
            }
            onChange={(e) =>
              setRecordsSearch(
                e.target.value
              )
            }
            placeholder="ابحث باسم الطالب أو الحلقة..."
          />

          {recordsSearch && (
            <button
              type="button"
              onClick={() =>
                setRecordsSearch("")
              }
            >
              <X
                size={13}
              />
            </button>
          )}
        </div>

        <select
          value={
            recordTypeFilter
          }
          onChange={(e) =>
            setRecordTypeFilter(
              e.target.value
            )
          }
        >
          <option value="all">
            جميع أنواع التسميع
          </option>

          <option value="quran">
            القرآن الكريم
          </option>

          <option value="noorania">
            القاعدة النورانية
          </option>
        </select>

        <select
          value={
            halaqaFilter
          }
          onChange={(e) =>
            setHalaqaFilter(
              e.target.value
            )
          }
        >
          <option value="all">
            جميع حلقاتي
          </option>

          {halaqat.map(
            (halaqa) => (
              <option
                key={
                  halaqa.id
                }
                value={
                  halaqa.id
                }
              >
                {halaqa.name}
              </option>
            )
          )}
        </select>

        <select
          value={
            dateFilter
          }
          onChange={(e) =>
            setDateFilter(
              e.target.value
            )
          }
        >
          <option value="today">
            هذا اليوم
          </option>

          <option value="all">
            كل التواريخ
          </option>

          <option value="month">
            هذا الشهر
          </option>
        </select>
      </section>

      {/* =================================================
          RECORDS HEADER
      ================================================= */}

      <div
        className="records-title-row"
      >
        <div>
          <h2>
            سجل التسميع
          </h2>

          <p>
            عرض{" "}
            {
              filteredRecords.length
            }{" "}
            من{" "}
            {allRecords.length}
            {" "}
            سجل
          </p>
        </div>
      </div>

      {/* =================================================
          RECORDS
      ================================================= */}

      {halaqat.length ===
      0 ? (
        <EmptyState
          icon={Layers3}
          title="لا توجد حلقات مرتبطة بك"
          description="يجب أن تقوم الإدارة بربط المعلم بحلقة أولًا."
        />
      ) : filteredRecords.length ===
        0 ? (
        <EmptyState
          icon={FileText}
          title="لا توجد سجلات"
          description="لم يتم العثور على سجلات مطابقة للفلاتر الحالية."
        />
      ) : (
        <section
          className="records-grid"
        >
          {filteredRecords.map(
            (record) => (
              <RecordCard
                key={`${record.record_type}-${record.id}`}
                record={
                  record
                }
                studentName={
                  studentName(
                    record.student_id
                  )
                }
                halaqa={
                  halaqat.find(
                    (item) =>
                      Number(
                        item.id
                      ) ===
                      Number(
                        record.halaqa_id
                      )
                  )
                }
                deleting={
                  deletingKey ===
                  `${record.record_type}-${record.id}`
                }
                onEdit={() =>
                  editRecord(
                    record
                  )
                }
                onDelete={() =>
                  deleteRecord(
                    record
                  )
                }
              />
            )
          )}
        </section>
      )}

      {/* =================================================
          FORM MODAL
      ================================================= */}

      {formOpen && (
        <div
          className="recitation-modal-overlay"
          onMouseDown={(
            event
          ) => {
            if (
              event.target ===
                event.currentTarget &&
              !saving
            ) {
              resetForms();
            }
          }}
        >
          <div
            className="recitation-modal"
          >
            {/* ===========================================
                MODAL HEADER
            =========================================== */}

            <div
              className="modal-header"
            >
              <div
                className="modal-heading"
              >
                <div
                  className={
                    formType ===
                    "quran"
                      ? "modal-icon quran"
                      : "modal-icon noorania"
                  }
                >
                  {formType ===
                  "quran" ? (
                    <BookOpen
                      size={18}
                    />
                  ) : (
                    <LibraryBig
                      size={18}
                    />
                  )}
                </div>

                <div>
                  <div
                    className="modal-eyebrow"
                  >
                    {editing
                      ? "تعديل سجل"
                      : "جلسة جديدة"}
                  </div>

                  <h2>
                    {formType ===
                    "quran"
                      ? "تسميع القرآن الكريم"
                      : "تسميع القاعدة النورانية"}
                  </h2>
                </div>
              </div>

              <button
                type="button"
                className="modal-close"
                onClick={() =>
                  resetForms()
                }
                disabled={
                  saving
                }
              >
                <X
                  size={18}
                />
              </button>
            </div>

            {/* ===========================================
                EDIT NOTICE
            =========================================== */}

            {editing && (
              <div
                className="edit-notice"
              >
                <Edit3
                  size={14}
                />

                أنت تعدّل سجلًا
                موجودًا. يمكنك تعديل
                التاريخ والتسميع
                والتقييم والمقادير ثم
                حفظ التغييرات.
              </div>
            )}

            {/* ===========================================
                COMMON
            =========================================== */}

            <div
              className="modal-body"
            >
              <FormSection
                icon={
                  <GraduationCap
                    size={16}
                  />
                }
                title="بيانات الجلسة"
                subtitle="الحلقة، الطالب والتاريخ"
              >
                <div
                  className="form-grid three"
                >
                  <SelectField
                    label="الحلقة"
                    required
                    value={
                      commonForm
                        .halaqa_id
                    }
                    disabled={
                      Boolean(
                        editing
                      )
                    }
                    onChange={(
                      value
                    ) => {
                      setCommonForm(
                        (current) => ({
                          ...current,
                          halaqa_id:
                            value,
                          student_id:
                            "",
                        })
                      );
                    }}
                    options={[
                      {
                        value: "",
                        label:
                          "اختر الحلقة",
                      },

                      ...halaqat.map(
                        (halaqa) => ({
                          value:
                            String(
                              halaqa.id
                            ),

                          label:
                            `${halaqa.name} — ${halaqa.mosque_name}`,
                        })
                      ),
                    ]}
                  />

                  <SelectField
                    label="الطالب"
                    required
                    value={
                      commonForm
                        .student_id
                    }
                    disabled={
                      Boolean(
                        editing
                      ) ||
                      !commonForm
                        .halaqa_id
                    }
                    onChange={(
                      value
                    ) =>
                      setCommon(
                        "student_id",
                        value
                      )
                    }
                    options={[
                      {
                        value: "",
                        label:
                          commonForm
                            .halaqa_id
                            ? "اختر الطالب"
                            : "اختر الحلقة أولًا",
                      },

                      ...studentsForForm.map(
                        (
                          student
                        ) => ({
                          value:
                            String(
                              student.id
                            ),

                          label:
                            `${student.full_name}${
                              student.user_number
                                ? ` — ${student.user_number}`
                                : ""
                            }`,
                        })
                      ),
                    ]}
                  />

                  <DateField
                    value={
                      commonForm
                        .recitation_date
                    }
                    onChange={(
                      value
                    ) =>
                      setCommon(
                        "recitation_date",
                        value
                      )
                    }
                  />
                </div>

                {commonForm
                  .recitation_date && (
                  <div
                    className="dual-date"
                  >
                    {teacherPreferences.calendar_mode !== "gregorian" && (
                      <div>
                        <span>
                          هجري — أم القرى
                        </span>

                        <strong>
                          {formatHijriDate(
                            commonForm
                              .recitation_date
                          )}
                        </strong>
                      </div>
                    )}

                    {teacherPreferences.calendar_mode !== "hijri" && (
                      <div>
                        <span>
                          ميلادي
                        </span>

                        <strong>
                          {formatGregorianDate(
                            commonForm
                              .recitation_date
                          )}
                        </strong>
                      </div>
                    )}
                  </div>
                )}
              </FormSection>

              {/* =========================================
                  QURAN
              ========================================= */}

              {formType ===
                "quran" && (
                <>
                  <div className="quick-entry-banner">
                    <div className="quick-entry-icon">
                      <Sparkles size={18} />
                    </div>

                    <div>
                      <strong>تسميع سريع</strong>
                      <span>
                        لا تحتاج الآن إلى تحديد سورة أو رقم آية.
                        سجّل المقدار والتقييم فقط، وأضف جنب الدرس أو المراجعة عند الحاجة.
                      </span>
                    </div>
                  </div>

                  {planSuggestion &&
                    teacherPreferences.recitation_show_monthly_plan !== false && (
                    <div className={`plan-suggestion-card ${planSuggestion.scheduledToday ? "scheduled" : "extra-day"}`}>
                      <div className="plan-suggestion-icon">
                        <Target size={18} />
                      </div>

                      <div className="plan-suggestion-copy">
                        <span>الخطة الشهرية قرأت تلقائيًا</span>
                        <strong>
                          {Number(planSuggestion.memorizationAmount || 0) > 0
                            ? `${planSuggestion.memorizationAmount} ${planSuggestion.memorizationUnit === "lines" ? "سطر حفظ" : "صفحة حفظ"}`
                            : "بدون حفظ"}
                          {Number(planSuggestion.revisionAmount || 0) > 0
                            ? ` • ${formatFaces(amountToFaces(planSuggestion.revisionAmount, planSuggestion.revisionUnit))} صفحة مراجعة`
                            : ""}
                        </strong>
                        <small>
                          {planSuggestion.scheduledToday
                            ? "اليوم من أيام تسميع الطالب — يمكنك التعديل على المقادير لهذه الجلسة فقط."
                            : "اليوم ليس من أيام التسميع المجدولة، لكن يمكنك تسجيل جلسة إضافية دون تغيير الخطة."}
                        </small>
                      </div>
                    </div>
                  )}

                  {/* LESSON */}

                  <FormSection
                    icon={
                      <BookOpen
                        size={17}
                      />
                    }
                    title="الدرس"
                    subtitle="المقدار الجديد الذي سمعه الطالب"
                  >
                    <div className="quick-section-grid">
                      <div className="quick-amount-column">
                        <LessonAmountField
                          value={quranForm.lesson_amount_value}
                          unit={quranForm.lesson_amount_unit}
                          onValueChange={(value) =>
                            setQuran("lesson_amount_value", value)
                          }
                          onUnitChange={(value) =>
                            setQuran("lesson_amount_unit", value)
                          }
                        />

                        <div className="faces-preview quick-faces-preview">
                          <Target size={15} />

                          {Number(quranForm.lesson_amount_value || 0) > 0 ? (
                            <>
                              يدخل في الإنجاز:
                              <strong>
                                {formatFaces(lessonFaces)} وجه
                              </strong>
                            </>
                          ) : editing && quranForm.lesson_amount_type ? (
                            <>
                              السجل القديم:
                              <strong>{getLessonAmountLabel(quranForm.lesson_amount_type)}</strong>
                            </>
                          ) : (
                            "اكتب المقدار واختر أسطر أو صفحات."
                          )}
                        </div>
                      </div>

                      <div className="quick-evaluation-column">
                        <EvaluationSelector
                          label="تقييم الدرس"
                          value={
                            quranForm.lesson_evaluation
                          }
                          onChange={(value) =>
                            setQuran(
                              "lesson_evaluation",
                              value
                            )
                          }
                        />
                      </div>
                    </div>
                  </FormSection>

                  {/* NEXT */}

                  <FormSection
                    icon={
                      <Target
                        size={17}
                      />
                    }
                    title="جنب الدرس الأول"
                    subtitle="يبقى مستقلاً عن الخطة الشهرية"
                  >
                    <div className="form-grid two quick-side-grid">
                      <TextField
                        label="جنب الدرس"
                        value={
                          quranForm.next_surah
                        }
                        onChange={(value) =>
                          setQuran(
                            "next_surah",
                            value
                          )
                        }
                        placeholder="مثال: سطران إضافيان / وجه سابق / تمرين مرافق"
                      />

                      <EvaluationSelector
                        label="تقييم جنب الدرس"
                        value={
                          quranForm.next_evaluation
                        }
                        onChange={(value) =>
                          setQuran(
                            "next_evaluation",
                            value
                          )
                        }
                      />
                    </div>
                  </FormSection>

                  {/* NEXT 2 */}

                  <FormSection
                    icon={
                      <Plus
                        size={17}
                      />
                    }
                    title="جنب الدرس الثاني"
                    subtitle="اختياري — اتركه فارغًا إذا لم يوجد"
                  >
                    <div className="form-grid two quick-side-grid">
                      <TextField
                        label="جنب الدرس الثاني"
                        value={
                          quranForm.next2_surah
                        }
                        onChange={(value) =>
                          setQuran(
                            "next2_surah",
                            value
                          )
                        }
                        placeholder="مقدار إضافي اختياري"
                      />

                      <EvaluationSelector
                        label="تقييم جنب الدرس الثاني"
                        value={
                          quranForm.next2_evaluation
                        }
                        onChange={(value) =>
                          setQuran(
                            "next2_evaluation",
                            value
                          )
                        }
                      />
                    </div>
                  </FormSection>

                  {/* REVIEW */}

                  <FormSection
                    icon={
                      <RefreshCw
                        size={17}
                      />
                    }
                    title="المراجعة"
                    subtitle="أدخل المقدار والتقييم فقط"
                  >
                    <div className="form-grid two evaluation-faces-grid">
                      <NumberField
                        label="مقدار المراجعة"
                        value={
                          quranForm.review_faces
                        }
                        onChange={(value) =>
                          setQuran(
                            "review_faces",
                            value
                          )
                        }
                        min="0"
                        step="0.01"
                        placeholder="مثال: 5"
                        suffix="صفحة"
                      />

                      <EvaluationSelector
                        label="تقييم المراجعة"
                        value={
                          quranForm.review_evaluation
                        }
                        onChange={(value) =>
                          setQuran(
                            "review_evaluation",
                            value
                          )
                        }
                      />
                    </div>
                  </FormSection>
                </>
              )}

              {/* =========================================
                  NOORANIA
              ========================================= */}

              {formType ===
                "noorania" && (
                <>
                  {/* LESSON */}

                  <FormSection
                    icon={
                      <LibraryBig
                        size={16}
                      />
                    }
                    title="الدرس"
                    subtitle="الدرس الأساسي في القاعدة النورانية"
                  >
                    <div
                      className="form-grid two"
                    >
                      <TextField
                        label="الدرس"
                        required
                        value={
                          nooraniaForm
                            .lesson
                        }
                        onChange={(
                          value
                        ) =>
                          setNoorania(
                            "lesson",
                            value
                          )
                        }
                        placeholder="مثال: الدرس العاشر"
                      />

                      <NumberField
                        label="عدد أوجه التسميع"
                        required
                        value={
                          nooraniaForm
                            .lesson_faces
                        }
                        onChange={(
                          value
                        ) =>
                          setNoorania(
                            "lesson_faces",
                            value
                          )
                        }
                        min="0"
                        step="0.5"
                        placeholder="مثال: 2"
                        suffix="وجه"
                      />
                    </div>

                    <EvaluationSelector
                      label="تقييم الدرس"
                      value={
                        nooraniaForm
                          .lesson_evaluation
                      }
                      onChange={(
                        value
                      ) =>
                        setNoorania(
                          "lesson_evaluation",
                          value
                        )
                      }
                    />
                  </FormSection>

                  {/* SIDE LESSON */}

                  <FormSection
                    icon={
                      <Target
                        size={16}
                      />
                    }
                    title="جنب الدرس"
                    subtitle="لا يتم احتساب أوجه لهذا الجزء"
                  >
                    <TextField
                      label="جنب الدرس"
                      value={
                        nooraniaForm
                          .side_lesson
                      }
                      onChange={(
                        value
                      ) =>
                        setNoorania(
                          "side_lesson",
                          value
                        )
                      }
                      placeholder="مثال: الدرس التاسع"
                    />

                    <EvaluationSelector
                      label="تقييم جنب الدرس"
                      value={
                        nooraniaForm
                          .side_lesson_evaluation
                      }
                      onChange={(
                        value
                      ) =>
                        setNoorania(
                          "side_lesson_evaluation",
                          value
                        )
                      }
                    />
                  </FormSection>

                  {/* REVISION */}

                  <FormSection
                    icon={
                      <RefreshCw
                        size={16}
                      />
                    }
                    title="المراجعة"
                    subtitle="المادة السابقة التي تمت مراجعتها"
                  >
                    <div
                      className="form-grid two"
                    >
                      <TextField
                        label="المراجعة"
                        value={
                          nooraniaForm
                            .revision
                        }
                        onChange={(
                          value
                        ) =>
                          setNoorania(
                            "revision",
                            value
                          )
                        }
                        placeholder="مثال: من الدرس الأول إلى الخامس"
                      />

                      <NumberField
                        label="عدد أوجه المراجعة"
                        value={
                          nooraniaForm
                            .revision_faces
                        }
                        onChange={(
                          value
                        ) =>
                          setNoorania(
                            "revision_faces",
                            value
                          )
                        }
                        min="0"
                        step="0.5"
                        placeholder="مثال: 6"
                        suffix="وجه"
                      />
                    </div>

                    <EvaluationSelector
                      label="تقييم المراجعة"
                      value={
                        nooraniaForm
                          .revision_evaluation
                      }
                      onChange={(
                        value
                      ) =>
                        setNoorania(
                          "revision_evaluation",
                          value
                        )
                      }
                    />
                  </FormSection>
                </>
              )}

              {/* =========================================
                  POINTS + NOTES
              ========================================= */}

              <div
                className="bottom-form-grid"
              >
                <div
                  className="points-preview"
                >
                  <div
                    className="points-icon"
                  >
                    <Trophy
                      size={21}
                    />
                  </div>

                  <span>
                    نقاط الجلسة
                  </span>

                  <strong>
                    {(formType ===
                    "quran"
                      ? quranPoints
                      : nooraniaPoints) >
                    0
                      ? `+${
                          formType ===
                          "quran"
                            ? quranPoints
                            : nooraniaPoints
                        }`
                      : formType ===
                        "quran"
                      ? quranPoints
                      : nooraniaPoints}
                  </strong>

                  <small>
                    تحسب تلقائيًا من
                    التقييمات
                  </small>
                </div>

                <div
                  className="notes-box"
                >
                  <label
                    className="field-label"
                  >
                    <MessageSquareText
                      size={14}
                    />

                    ملاحظات المعلم
                  </label>

                  <textarea
                    value={
                      commonForm.notes
                    }
                    onChange={(e) =>
                      setCommon(
                        "notes",
                        e.target.value
                      )
                    }
                    placeholder="أي ملاحظات مهمة عن جلسة الطالب..."
                    rows={5}
                  />
                </div>
              </div>
            </div>

            {/* ===========================================
                FOOTER
            =========================================== */}

            <div
              className="modal-footer"
            >
              <button
                type="button"
                className="modal-cancel"
                onClick={() =>
                  resetForms()
                }
                disabled={
                  saving
                }
              >
                <X
                  size={15}
                />

                إلغاء
              </button>

              <button
                type="button"
                className="modal-save"
                onClick={
                  saveRecord
                }
                disabled={
                  saving
                }
              >
                {saving ? (
                  <>
                    <Loader2
                      size={16}
                      className="spin"
                    />

                    جارٍ الحفظ...
                  </>
                ) : (
                  <>
                    <Save
                      size={16}
                    />

                    {editing
                      ? "حفظ التعديلات"
                      : "حفظ التسميع"}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* =========================================================
   Record Card
========================================================= */

function RecordCard({
  record,
  studentName,
  halaqa,
  deleting,
  onEdit,
  onDelete,
}) {
  const quran =
    record.record_type ===
    "quran";

  return (
    <article
      className="record-card"
    >
      <div
        className={
          quran
            ? "record-accent quran"
            : "record-accent noorania"
        }
      />

      {/* HEADER */}

      <div
        className="record-card-header"
      >
        <div
          className="record-student"
        >
          <div
            className={
              quran
                ? "record-avatar quran"
                : "record-avatar noorania"
            }
          >
            {quran ? (
              <BookOpen
                size={18}
              />
            ) : (
              <LibraryBig
                size={18}
              />
            )}
          </div>

          <div
            style={{
              minWidth: 0,
            }}
          >
            <h3>
              {studentName}
            </h3>

            <div
              className="record-type-label"
            >
              {quran
                ? "القرآن الكريم"
                : "القاعدة النورانية"}
            </div>
          </div>
        </div>

        <div
          className="record-badges"
        >
          {!record.teacher_id && (
            <span
              className="legacy-badge"
            >
              سجل قديم
            </span>
          )}

          <span
            className={
              quran
                ? "type-badge quran"
                : "type-badge noorania"
            }
          >
            {quran
              ? "قرآن"
              : "نورانية"}
          </span>
        </div>
      </div>

      {/* DATE */}

      <div
        className="record-date"
      >
        <CalendarDays
          size={14}
        />

        <div>
          <strong>
            {formatHijriDate(
              record.recitation_date
            )}
          </strong>

          <span>
            {formatGregorianDate(
              record.recitation_date
            )}
          </span>
        </div>
      </div>

      {/* HALAQA */}

      <div
        className="record-halaqa"
      >
        <div>
          <GraduationCap
            size={13}
          />

          {halaqa?.name ||
            "حلقة غير معروفة"}
        </div>

        {halaqa?.mosque_name && (
          <div>
            <Building2
              size={13}
            />

            {
              halaqa.mosque_name
            }
          </div>
        )}

        {halaqa?.halaqa_period && (
          <div>
            <Clock3
              size={13}
            />

            {HALAQA_PERIODS[
              halaqa.halaqa_period
            ] ||
              "غير محدد"}
          </div>
        )}
      </div>

      {/* QURAN */}

      {quran ? (
        <>
          <RecordSection
            title="الدرس"
            icon={
              <BookOpen
                size={14}
              />
            }
          >
            <div className="record-values quick-record-values">
              <FaceBadge
                label={
                  formatStoredLessonAmount(record) ||
                  getLessonAmountLabel(
                    record.lesson_amount_type
                  ) || "مقدار الدرس"
                }
                value={
                  record.lesson_faces_manual ??
                  record.lesson_faces
                }
              />

              <EvaluationBadge
                value={
                  record.lesson_evaluation
                }
              />
            </div>
          </RecordSection>

          {(record.next_surah ||
            record.next2_surah) && (
            <RecordSection
              title="جنب الدرس"
              icon={
                <Target
                  size={14}
                />
              }
            >
              {record.next_surah && (
                <div className="sub-record-line quick-side-record">
                  <strong className="text-record-value">
                    {record.next_surah}
                  </strong>

                  <EvaluationBadge
                    value={
                      record.next_evaluation
                    }
                  />
                </div>
              )}

              {record.next2_surah && (
                <div className="sub-record-line quick-side-record">
                  <strong className="text-record-value">
                    {record.next2_surah}
                  </strong>

                  <EvaluationBadge
                    value={
                      record.next2_evaluation
                    }
                  />
                </div>
              )}
            </RecordSection>
          )}

          {(record.review_faces ||
            record.review_evaluation) && (
            <RecordSection
              title="المراجعة"
              icon={
                <RefreshCw
                  size={14}
                />
              }
            >
              <div className="record-values quick-record-values">
                <FaceBadge
                  label="أوجه المراجعة"
                  value={
                    record.review_faces
                  }
                />

                <EvaluationBadge
                  value={
                    record.review_evaluation
                  }
                />
              </div>
            </RecordSection>
          )}
        </>      ) : (
        <>
          <RecordSection
            title="الدرس"
            icon={
              <LibraryBig
                size={13}
              />
            }
          >
            <strong
              className="text-record-value"
            >
              {record.lesson ||
                "—"}
            </strong>

            <div
              className="record-values"
            >
              <EvaluationBadge
                value={
                  record.lesson_evaluation
                }
              />

              <FaceBadge
                label="أوجه التسميع"
                value={
                  record.lesson_faces
                }
              />
            </div>
          </RecordSection>

          {record.side_lesson && (
            <RecordSection
              title="جنب الدرس"
              icon={
                <Target
                  size={13}
                />
              }
            >
              <strong
                className="text-record-value"
              >
                {
                  record.side_lesson
                }
              </strong>

              <EvaluationBadge
                value={
                  record.side_lesson_evaluation
                }
              />
            </RecordSection>
          )}

          {record.revision && (
            <RecordSection
              title="المراجعة"
              icon={
                <RefreshCw
                  size={13}
                />
              }
            >
              <strong
                className="text-record-value"
              >
                {record.revision}
              </strong>

              <div
                className="record-values"
              >
                <EvaluationBadge
                  value={
                    record.revision_evaluation
                  }
                />

                <FaceBadge
                  label="أوجه المراجعة"
                  value={
                    record.revision_faces
                  }
                />
              </div>
            </RecordSection>
          )}
        </>
      )}

      {/* NOTES */}

      {record.notes && (
        <div
          className="record-notes"
        >
          <MessageSquareText
            size={12}
          />

          {record.notes}
        </div>
      )}

      {/* FOOTER */}

      <div
        className="record-footer"
      >
        <div
          className="record-points"
        >
          <Trophy
            size={14}
          />

          {Number(
            record.points ||
              0
          ) > 0
            ? `+${record.points}`
            : record.points || 0}

          <span>
            نقطة
          </span>
        </div>

        <div
          className="record-actions"
        >
          <button
            type="button"
            className="record-edit"
            onClick={onEdit}
            disabled={
              deleting
            }
          >
            <Edit3
              size={13}
            />

            تعديل
          </button>

          <button
            type="button"
            className="record-delete"
            onClick={
              onDelete
            }
            disabled={
              deleting
            }
          >
            {deleting ? (
              <Loader2
                size={13}
                className="spin"
              />
            ) : (
              <Trash2
                size={13}
              />
            )}

            حذف
          </button>
        </div>
      </div>
    </article>
  );
}

/* =========================================================
   Record section
========================================================= */

function RecordSection({
  title,
  icon,
  children,
}) {
  return (
    <div
      className="record-section"
    >
      <div
        className="record-section-title"
      >
        {icon}

        {title}
      </div>

      <div
        className="record-section-content"
      >
        {children}
      </div>
    </div>
  );
}

/* =========================================================
   Stat
========================================================= */

function StatCard({
  icon: Icon,
  title,
  value,
  subtitle,
}) {
  return (
    <div
      className="recitation-stat"
    >
      <div
        className="recitation-stat-icon"
      >
        <Icon
          size={17}
        />
      </div>

      <div>
        <span>
          {title}
        </span>

        <strong>
          {value}
        </strong>

        <small>
          {subtitle}
        </small>
      </div>
    </div>
  );
}

/* =========================================================
   Form Section
========================================================= */

function FormSection({
  icon,
  title,
  subtitle,
  children,
}) {
  return (
    <section
      className="form-section"
    >
      <div
        className="form-section-header"
      >
        <div
          className="form-section-icon"
        >
          {icon}
        </div>

        <div>
          <h3>
            {title}
          </h3>

          <p>
            {subtitle}
          </p>
        </div>
      </div>

      {children}
    </section>
  );
}

/* =========================================================
   Select
========================================================= */

function SelectField({
  label,
  value,
  onChange,
  options,
  required = false,
  disabled = false,
}) {
  return (
    <div
      className="field"
    >
      <label
        className="field-label"
      >
        {label}

        {required && (
          <span
            className="required"
          >
            *
          </span>
        )}
      </label>

      <div
        className="select-wrap"
      >
        <select
          value={value}
          disabled={
            disabled
          }
          onChange={(e) =>
            onChange(
              e.target.value
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
          size={15}
        />
      </div>
    </div>
  );
}

/* =========================================================
   Text
========================================================= */

function TextField({
  label,
  value,
  onChange,
  placeholder,
  required = false,
}) {
  return (
    <div
      className="field"
    >
      <label
        className="field-label"
      >
        {label}

        {required && (
          <span
            className="required"
          >
            *
          </span>
        )}
      </label>

      <input
        value={value}
        onChange={(e) =>
          onChange(
            e.target.value
          )
        }
        placeholder={
          placeholder
        }
      />
    </div>
  );
}

/* =========================================================
   Number
========================================================= */

function NumberField({
  label,
  value,
  onChange,
  placeholder,
  min,
  step,
  suffix,
  required = false,
}) {
  return (
    <div
      className="field"
    >
      <label
        className="field-label"
      >
        {label}

        {required && (
          <span
            className="required"
          >
            *
          </span>
        )}
      </label>

      <div
        className="number-wrap"
      >
        <input
          type="number"
          value={value}
          min={min}
          step={step}
          onChange={(e) =>
            onChange(
              e.target.value
            )
          }
          placeholder={
            placeholder
          }
        />

        {suffix && (
          <span>
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}

/* =========================================================
   Lesson Amount — free input
========================================================= */

function LessonAmountField({
  value,
  unit,
  onValueChange,
  onUnitChange,
}) {
  return (
    <div className="lesson-free-field">
      <label className="field-label">
        مقدار الدرس
      </label>

      <div className="lesson-free-control">
        <input
          type="number"
          min="0"
          step={unit === "lines" ? "1" : "0.25"}
          value={value}
          onChange={(event) =>
            onValueChange(event.target.value)
          }
          placeholder={unit === "lines" ? "مثال: 3" : "مثال: 1.5"}
        />

        <div className="lesson-unit-switch">
          <button
            type="button"
            className={unit === "lines" ? "active" : ""}
            onClick={() => onUnitChange("lines")}
          >
            أسطر
          </button>

          <button
            type="button"
            className={unit === "faces" ? "active" : ""}
            onClick={() => onUnitChange("faces")}
          >
            صفحات
          </button>
        </div>
      </div>

      <small className="lesson-free-hint">
        اكتب أي مقدار بحرية — مثال: 4 أسطر أو 1.5 صفحة.
      </small>
    </div>
  );
}

/* =========================================================
   Date
========================================================= */

function DateField({
  value,
  onChange,
}) {
  return (
    <div
      className="field"
    >
      <label
        className="field-label"
      >
        التاريخ
        <span
          className="required"
        >
          *
        </span>
      </label>

      <div
        className="date-input-wrap"
      >
        <CalendarDays
          size={15}
        />

        <input
          type="date"
          value={value}
          max={getLocalDate()}
          onChange={(e) =>
            onChange(
              e.target.value
            )
          }
        />
      </div>
    </div>
  );
}

/* =========================================================
   Quran Range
========================================================= */

function QuranRange({
  prefix,
  form,
  setValue,
}) {
  const fromSurahKey =
    prefix
      ? `${prefix}_surah`
      : "from_surah";

  const fromAyahKey =
    prefix
      ? `${prefix}_from_ayah`
      : "from_ayah";

  const toSurahKey =
    prefix
      ? `${prefix}_to_surah`
      : "to_surah";

  const toAyahKey =
    prefix
      ? `${prefix}_to_ayah`
      : "to_ayah";

  return (
    <div
      className="quran-range"
    >
      <QuranSelect
        label="من سورة"
        value={
          form[
            fromSurahKey
          ]
        }
        onChange={(
          value
        ) =>
          setValue(
            fromSurahKey,
            value
          )
        }
      />

      <NumberField
        label="من آية"
        value={
          form[
            fromAyahKey
          ]
        }
        onChange={(
          value
        ) =>
          setValue(
            fromAyahKey,
            value
          )
        }
        min="1"
        step="1"
        placeholder="رقم الآية"
      />

      <div
        className="range-divider"
      >
        ←
      </div>

      <QuranSelect
        label="إلى سورة"
        value={
          form[
            toSurahKey
          ]
        }
        onChange={(
          value
        ) =>
          setValue(
            toSurahKey,
            value
          )
        }
      />

      <NumberField
        label="إلى آية"
        value={
          form[
            toAyahKey
          ]
        }
        onChange={(
          value
        ) =>
          setValue(
            toAyahKey,
            value
          )
        }
        min="1"
        step="1"
        placeholder="رقم الآية"
      />
    </div>
  );
}

/* =========================================================
   Quran Select
========================================================= */

function QuranSelect({
  label,
  value,
  onChange,
}) {
  return (
    <div
      className="field"
    >
      <label
        className="field-label"
      >
        {label}
      </label>

      <div
        className="select-wrap"
      >
        <select
          value={value}
          onChange={(e) =>
            onChange(
              e.target.value
            )
          }
        >
          <option value="">
            اختر السورة
          </option>

          {surahs.map(
            (surah) => (
              <option
                key={surah}
                value={surah}
              >
                {surah}
              </option>
            )
          )}
        </select>

        <ChevronDown
          size={15}
        />
      </div>
    </div>
  );
}

/* =========================================================
   Evaluation
========================================================= */

function EvaluationSelector({
  label,
  value,
  onChange,
}) {
  return (
    <div
      className="evaluation-area"
    >
      <label
        className="field-label"
      >
        {label}
      </label>

      <div
        className="evaluation-grid"
      >
        {evaluations.map(
          (
            evaluation
          ) => {
            const active =
              value ===
              evaluation;

            const points =
              calculatePoints(
                evaluation
              );

            return (
              <button
                key={
                  evaluation
                }
                type="button"
                className={
                  `evaluation-option ${getEvaluationClass(
                    evaluation
                  )} ${
                    active
                      ? "active"
                      : ""
                  }`
                }
                onClick={() =>
                  onChange(
                    active
                      ? ""
                      : evaluation
                  )
                }
              >
                <span>
                  {
                    evaluation
                  }
                </span>

                <small>
                  {points > 0
                    ? `+${points}`
                    : points}
                </small>
              </button>
            );
          }
        )}
      </div>
    </div>
  );
}

/* =========================================================
   Quran Text
========================================================= */

function QuranText({
  from,
  fromAyah,
  to,
  toAyah,
}) {
  if (!from && !to) {
    return (
      <span
        className="muted"
      >
        غير مسجل
      </span>
    );
  }

  return (
    <span
      className="quran-text"
    >
      {from || "—"}

      {fromAyah
        ? ` (${fromAyah})`
        : ""}

      <span
        className="quran-arrow"
      >
        ←
      </span>

      {to || "—"}

      {toAyah
        ? ` (${toAyah})`
        : ""}
    </span>
  );
}

/* =========================================================
   Badges
========================================================= */

function EvaluationBadge({
  value,
}) {
  if (!value) {
    return (
      <span
        className="evaluation-badge neutral"
      >
        بدون تقييم
      </span>
    );
  }

  return (
    <span
      className={
        `evaluation-badge ${getEvaluationClass(
          value
        )}`
      }
    >
      {value}
    </span>
  );
}

function FaceBadge({
  label,
  value,
}) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return (
      <span
        className="face-badge legacy"
      >
        {label || "المقدار"}:
        {" "}
        غير محدد
      </span>
    );
  }

  return (
    <span
      className="face-badge"
    >
      <Hash
        size={11}
      />

      {label && (
        <>
          {label}
          {" • "}
        </>
      )}

      {formatFaces(
        value
      )}{" "}
      وجه
    </span>
  );
}

/* =========================================================
   Empty
========================================================= */

function EmptyState({
  icon: Icon,
  title,
  description,
}) {
  return (
    <div
      className="records-empty"
    >
      <div
        className="empty-icon"
      >
        <Icon
          size={25}
        />
      </div>

      <h3>
        {title}
      </h3>

      <p>
        {description}
      </p>
    </div>
  );
}

/* =========================================================
   Loading
========================================================= */

function LoadingState() {
  return (
    <div
      className="recitations-loading"
    >
      <PageStyles />

      <div
        className="loading-icon"
      >
        <Loader2
          size={27}
          className="spin"
        />
      </div>

      <h3>
        جارٍ تجهيز نظام
        التسميع
      </h3>

      <p>
        يتم تحميل حلقات المعلم،
        الطلاب والسجلات...
      </p>
    </div>
  );
}

/* =========================================================
   Helpers
========================================================= */

function getLocalDate(
  date = new Date()
) {
  const year =
    date.getFullYear();

  const month =
    String(
      date.getMonth() + 1
    ).padStart(
      2,
      "0"
    );

  const day =
    String(
      date.getDate()
    ).padStart(
      2,
      "0"
    );

  return `${year}-${month}-${day}`;
}

function parseDate(
  dateString
) {
  return new Date(
    `${dateString}T12:00:00`
  );
}

/*
  تقويم أم القرى
*/

function formatHijriDate(
  dateString
) {
  if (!dateString) {
    return "—";
  }

  try {
    return new Intl.DateTimeFormat(
      "ar-SA-u-ca-islamic-umalqura",
      {
        weekday:
          "long",

        year:
          "numeric",

        month:
          "long",

        day:
          "numeric",
      }
    ).format(
      parseDate(
        dateString
      )
    );
  } catch {
    return dateString;
  }
}

function formatGregorianDate(
  dateString
) {
  if (!dateString) {
    return "—";
  }

  try {
    return new Intl.DateTimeFormat(
      "ar-SA-u-ca-gregory",
      {
        year:
          "numeric",

        month:
          "long",

        day:
          "numeric",
      }
    ).format(
      parseDate(
        dateString
      )
    );
  } catch {
    return dateString;
  }
}

function roundFaces(value) {
  return Math.round((Number(value || 0) + Number.EPSILON) * 10000) / 10000;
}

function amountToFaces(amount, unit) {
  const number = Number(amount || 0);

  if (!Number.isFinite(number) || number <= 0) {
    return 0;
  }

  return unit === "lines"
    ? roundFaces(number / 15)
    : roundFaces(number);
}

function legacyTypeForFreeAmount(amount, unit) {
  const value = Number(amount || 0);

  if (unit === "lines" && value === 3) {
    return "three_lines";
  }

  if (unit === "faces") {
    if (value === 0.5) return "half_page";
    if (value === 1) return "one_page";
    if (value === 2) return "two_pages";
  }

  return "";
}

function legacyLessonAmount(type) {
  const item = LESSON_AMOUNTS.find((entry) => entry.value === type);

  if (!item) {
    return { amount: "", unit: "lines" };
  }

  if (type === "three_lines") {
    return { amount: 3, unit: "lines" };
  }

  return { amount: item.faces, unit: "faces" };
}

function inferDailyFromTarget(targetFaces, sessions) {
  const total = Number(targetFaces || 0);
  const count = Number(sessions || 0);

  if (total <= 0 || count <= 0) {
    return { amount: "", unit: "lines" };
  }

  const dailyFaces = total / count;
  const lines = dailyFaces * 15;
  const roundedLines = Math.round(lines);

  if (
    dailyFaces < 1 &&
    Math.abs(lines - roundedLines) < 0.02
  ) {
    return { amount: roundedLines, unit: "lines" };
  }

  return { amount: roundFaces(dailyFaces), unit: "faces" };
}

function getHijriPartsForDate(dateString) {
  const parts = new Intl.DateTimeFormat(
    "en-US-u-ca-islamic-umalqura",
    {
      year: "numeric",
      month: "numeric",
      day: "numeric",
    }
  ).formatToParts(parseDate(dateString));

  const result = {};

  parts.forEach((part) => {
    if (["year", "month", "day"].includes(part.type)) {
      result[part.type] = Number(part.value);
    }
  });

  return result;
}

const RECITATION_DAY_TO_JS = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
};

function isScheduledRecitationDate(dateString, days) {
  if (!Array.isArray(days) || days.length === 0) {
    return false;
  }

  const dayNumber = parseDate(dateString).getDay();

  return days.some(
    (day) => RECITATION_DAY_TO_JS[day] === dayNumber
  );
}

function formatStoredLessonAmount(record) {
  const amount = Number(record?.lesson_amount_value || 0);
  const unit = record?.lesson_amount_unit;

  if (amount <= 0 || !unit) {
    return "";
  }

  if (unit === "lines") {
    return `${amount} ${amount === 1 ? "سطر" : amount === 2 ? "سطران" : "أسطر"}`;
  }

  return `${formatFaces(amount)} ${amount === 1 ? "صفحة" : "صفحات"}`;
}

function calculatePoints(
  value
) {
  switch (value) {
    case "ممتاز":
      return 2;

    case "جيد جداً":
      return 1;

    case "جيد":
      return 0;

    case "إعادة":
      return -1;

    default:
      return 0;
  }
}

function getEvaluationClass(
  value
) {
  if (
    value === "ممتاز"
  ) {
    return "excellent";
  }

  if (
    value === "جيد جداً"
  ) {
    return "very-good";
  }

  if (
    value === "جيد"
  ) {
    return "good";
  }

  if (
    value === "إعادة"
  ) {
    return "bad";
  }

  return "neutral";
}

function getLessonAmountLabel(
  value
) {
  return (
    LESSON_AMOUNTS.find(
      (item) =>
        item.value ===
        value
    )?.label ||
    "مقدار الدرس"
  );
}

function formatFaces(
  value
) {
  const number =
    Number(
      value || 0
    );

  if (
    Number.isInteger(
      number
    )
  ) {
    return String(
      number
    );
  }

  return Number(
    number.toFixed(2)
  ).toString();
}

function textOrNull(
  value
) {
  if (
    value === null ||
    value === undefined
  ) {
    return null;
  }

  const text =
    String(
      value
    ).trim();

  return text ||
    null;
}

function numberOrNull(
  value
) {
  if (
    value === "" ||
    value === null ||
    value === undefined
  ) {
    return null;
  }

  const number =
    Number(value);

  return Number.isFinite(
    number
  )
    ? number
    : null;
}

function valueToString(
  value
) {
  if (
    value === null ||
    value === undefined
  ) {
    return "";
  }

  return String(
    value
  );
}

/* =========================================================
   CSS
========================================================= */

function PageStyles() {
  return (
    <style>
      {`
        .recitations-page {
          width: 100%;
          max-width: 1600px;
          margin: 0 auto;
          color: #0f172a;
        }

        .recitations-page * {
          box-sizing: border-box;
        }

        .recitations-page button,
        .recitations-page input,
        .recitations-page select,
        .recitations-page textarea {
          font-family: inherit;
        }

        /* =============================================
           HERO
        ============================================= */

        .recitations-hero {
          position: relative;
          overflow: hidden;

          display: flex;
          align-items: center;
          justify-content: space-between;

          gap: calc(18px * var(--app-density,1));

          padding: calc(22px * var(--app-density,1)) calc(24px * var(--app-density,1));
          margin-bottom: 16px;

          border:
            1px solid
            color-mix(in srgb,var(--app-color-0f5132,#0f5132) 10%,transparent);

          border-radius: calc(23px * var(--app-radius-scale,1));

          background:
            linear-gradient(
              135deg,
              #ffffff,
              var(--app-color-f5faf7,#f5faf7)
            );

          box-shadow:
            0 12px 34px
            color-mix(in srgb,var(--app-color-0f5132,#0f5132) 5%,transparent);
        }

        .recitations-hero::after {
          content: "";

          position: absolute;

          width: 260px;
          height: 260px;

          left: -130px;
          top: -150px;

          border-radius: 50%;

          background:
            radial-gradient(
              circle,
              rgba(201,162,39,.14),
              transparent 68%
            );

          pointer-events: none;
        }

        .hero-main {
          position: relative;
          z-index: 2;

          display: flex;
          align-items: center;

          gap: calc(12px * var(--app-density,1));

          min-width: 0;
        }

        .hero-icon {
          width: 49px;
          height: 49px;

          flex: 0 0 49px;

          border-radius: calc(15px * var(--app-radius-scale,1));

          display: flex;
          align-items: center;
          justify-content: center;

          color: #fff;

          background:
            linear-gradient(
              135deg,
              var(--app-color-0f5132,#0f5132),
              var(--app-color-0f766e,#0f766e)
            );

          box-shadow:
            0 10px 23px
            color-mix(in srgb,var(--app-color-0f5132,#0f5132) 17%,transparent);
        }

        .hero-eyebrow {
          display: flex;
          align-items: center;
          gap: calc(5px * var(--app-density,1));

          margin-bottom: 3px;

          color: var(--app-color-0f766e,#0f766e);

          font-size: calc(9px * var(--app-font-scale,1));
          font-weight: 900;
        }

        .hero-main h1 {
          margin: 0;

          color: var(--app-color-173d2b,#173d2b);

          font-size: calc(25px * var(--app-font-scale,1));
          font-weight: 950;
        }

        .hero-main p {
          margin: 5px 0 0;

          color: #78857e;

          font-size: calc(11px * var(--app-font-scale,1));
          line-height: 1.7;
        }

        .hero-actions {
          position: relative;
          z-index: 2;

          display: flex;
          align-items: center;

          gap: calc(7px * var(--app-density,1));
        }

        .refresh-button,
        .create-button {
          min-height: 42px;

          padding: 0 calc(13px * var(--app-density,1));

          border-radius: calc(12px * var(--app-radius-scale,1));

          display: inline-flex;
          align-items: center;
          justify-content: center;

          gap: calc(6px * var(--app-density,1));

          font-size: calc(9px * var(--app-font-scale,1));
          font-weight: 900;

          cursor: pointer;
        }

        .refresh-button {
          border:
            1px solid #dfe7e2;

          color: var(--app-color-0f5132,#0f5132);
          background: #fff;
        }

        .create-button {
          border: none;

          color: #fff;
        }

        .create-button.quran {
          background:
            linear-gradient(
              135deg,
              var(--app-color-0f5132,#0f5132),
              var(--app-color-0f766e,#0f766e)
            );
        }

        .create-button.noorania {
          background:
            linear-gradient(
              135deg,
              #9a741f,
              #b18a31
            );
        }

        .refresh-button:disabled,
        .create-button:disabled {
          opacity: .45;
          cursor: not-allowed;
        }

        /* =============================================
           SCOPE
        ============================================= */

        .recitation-scope {
          display: flex;
          align-items: center;

          gap: calc(7px * var(--app-density,1));

          margin-bottom: 16px;
          padding: calc(10px * var(--app-density,1)) calc(13px * var(--app-density,1));

          border:
            1px solid #dcebe3;

          border-radius: calc(13px * var(--app-radius-scale,1));

          color: #37624c;
          background: #f4faf6;

          font-size: calc(9px * var(--app-font-scale,1));
          line-height: 1.7;
        }

        /* =============================================
           STATS
        ============================================= */

        .recitation-stats {
          display: grid;

          grid-template-columns:
            repeat(
              5,
              minmax(0,1fr)
            );

          gap: calc(9px * var(--app-density,1));

          margin-bottom: 18px;
        }

        .recitation-stat {
          min-width: 0;

          display: flex;
          align-items: center;

          gap: calc(9px * var(--app-density,1));

          padding: calc(13px * var(--app-density,1));

          border:
            1px solid #e6ece8;

          border-radius: calc(16px * var(--app-radius-scale,1));

          background: #fff;

          box-shadow:
            0 6px 20px
            rgba(15,23,42,.03);
        }

        .recitation-stat-icon {
          width: 36px;
          height: 36px;

          flex: 0 0 36px;

          border-radius: calc(11px * var(--app-radius-scale,1));

          display: flex;
          align-items: center;
          justify-content: center;

          color: var(--app-color-0f5132,#0f5132);
          background: var(--app-color-edf7f1,#edf7f1);
        }

        .recitation-stat span {
          display: block;

          color: #7f8b83;

          font-size: calc(8px * var(--app-font-scale,1));
          font-weight: 750;
        }

        .recitation-stat strong {
          display: block;

          margin-top: 1px;

          color: var(--app-color-173d2b,#173d2b);

          font-size: calc(18px * var(--app-font-scale,1));
          font-weight: 950;
        }

        .recitation-stat small {
          display: block;

          margin-top: 1px;

          color: #9ba39e;

          font-size: calc(7px * var(--app-font-scale,1));
        }

        /* =============================================
           FILTERS
        ============================================= */

        .records-toolbar {
          display: grid;

          grid-template-columns:
            minmax(230px,1fr)
            175px
            175px
            150px;

          gap: calc(8px * var(--app-density,1));

          padding: calc(12px * var(--app-density,1));
          margin-bottom: 18px;

          border:
            1px solid #e5ebe7;

          border-radius: calc(17px * var(--app-radius-scale,1));

          background: #fff;

          box-shadow:
            0 6px 20px
            rgba(15,23,42,.025);
        }

        .records-toolbar select,
        .records-search input {
          width: 100%;
          height: 41px;

          border:
            1px solid #dce4df;

          border-radius: calc(10px * var(--app-radius-scale,1));

          outline: none;

          color: #33443a;
          background: #fbfdfc;

          font-size: calc(9px * var(--app-font-scale,1));
          font-weight: 700;
        }

        .records-toolbar select {
          padding: 0 calc(9px * var(--app-density,1));
        }

        .records-search {
          position: relative;
        }

        .records-search > svg {
          position: absolute;

          right: 12px;
          top: 50%;

          transform:
            translateY(-50%);

          color: #8c9690;

          pointer-events: none;
        }

        .records-search input {
          padding:
            0 calc(37px * var(--app-density,1)) 0 calc(34px * var(--app-density,1));
        }

        .records-search button {
          position: absolute;

          left: 6px;
          top: 50%;

          width: 26px;
          height: 26px;

          transform:
            translateY(-50%);

          border: none;
          border-radius: calc(7px * var(--app-radius-scale,1));

          display: flex;
          align-items: center;
          justify-content: center;

          color: #667169;
          background: #edf1ef;

          cursor: pointer;
        }

        /* =============================================
           RECORDS HEADER
        ============================================= */

        .records-title-row {
          margin-bottom: 11px;
        }

        .records-title-row h2 {
          margin: 0;

          color: var(--app-color-173d2b,#173d2b);

          font-size: calc(17px * var(--app-font-scale,1));
          font-weight: 950;
        }

        .records-title-row p {
          margin: 3px 0 0;

          color: #909993;

          font-size: calc(8px * var(--app-font-scale,1));
        }

        /* =============================================
           RECORD GRID
        ============================================= */

        .records-grid {
          display: grid;

          grid-template-columns:
            repeat(
              auto-fit,
              minmax(
                min(100%,340px),
                1fr
              )
            );

          gap: calc(13px * var(--app-density,1));
        }

        .record-card {
          position: relative;
          overflow: hidden;

          min-width: 0;

          border:
            1px solid #e4eae6;

          border-radius: calc(19px * var(--app-radius-scale,1));

          background: #fff;

          box-shadow:
            0 7px 24px
            rgba(15,23,42,.035);

          transition:
            transform .2s ease,
            box-shadow .2s ease;
        }

        .record-card:hover {
          transform:
            translateY(-2px);

          box-shadow:
            0 13px 32px
            color-mix(in srgb,var(--app-color-0f5132,#0f5132) 7.000000000000001%,transparent);
        }

        .record-accent {
          height: 3px;
        }

        .record-accent.quran {
          background:
            linear-gradient(
              90deg,
              var(--app-color-0f5132,#0f5132),
              var(--app-color-0f766e,#0f766e)
            );
        }

        .record-accent.noorania {
          background:
            linear-gradient(
              90deg,
              #9a741f,
              #d1ab4d
            );
        }

        .record-card-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;

          gap: calc(8px * var(--app-density,1));

          padding: calc(14px * var(--app-density,1)) calc(14px * var(--app-density,1)) calc(10px * var(--app-density,1));
        }

        .record-student {
          display: flex;
          align-items: center;

          gap: calc(8px * var(--app-density,1));

          min-width: 0;
        }

        .record-avatar {
          width: 38px;
          height: 38px;

          flex: 0 0 38px;

          border-radius: calc(11px * var(--app-radius-scale,1));

          display: flex;
          align-items: center;
          justify-content: center;
        }

        .record-avatar.quran {
          color: var(--app-color-0f5132,#0f5132);
          background: var(--app-color-edf7f1,#edf7f1);
        }

        .record-avatar.noorania {
          color: #927536;
          background: #fff8e7;
        }

        .record-student h3 {
          margin: 0;

          overflow: hidden;

          color: #26382e;

          font-size: calc(12px * var(--app-font-scale,1));
          font-weight: 950;

          white-space: nowrap;
          text-overflow: ellipsis;
        }

        .record-type-label {
          margin-top: 2px;

          color: #929b95;

          font-size: calc(7px * var(--app-font-scale,1));
        }

        .record-badges {
          display: flex;
          flex-wrap: wrap;
          justify-content: flex-end;

          gap: calc(4px * var(--app-density,1));
        }

        .type-badge,
        .legacy-badge {
          padding: calc(4px * var(--app-density,1)) calc(7px * var(--app-density,1));

          border-radius: 999px;

          font-size: calc(7px * var(--app-font-scale,1));
          font-weight: 900;
        }

        .type-badge.quran {
          color: #047857;
          background: #ecfdf5;
        }

        .type-badge.noorania {
          color: #8a681e;
          background: #fff8e7;
        }

        .legacy-badge {
          color: #64748b;
          background: #f1f5f9;
        }

        /* DATE */

        .record-date {
          display: flex;
          align-items: flex-start;

          gap: calc(6px * var(--app-density,1));

          margin: 0 14px 9px;
          padding: calc(8px * var(--app-density,1)) calc(9px * var(--app-density,1));

          border-radius: calc(10px * var(--app-radius-scale,1));

          color: var(--app-color-0f5132,#0f5132);
          background: var(--app-color-f5faf7,#f5faf7);
        }

        .record-date strong {
          display: block;

          font-size: calc(8px * var(--app-font-scale,1));
          font-weight: 900;
        }

        .record-date span {
          display: block;

          margin-top: 2px;

          color: #87928b;

          font-size: calc(7px * var(--app-font-scale,1));
        }

        /* HALAQA */

        .record-halaqa {
          display: flex;
          flex-wrap: wrap;

          gap: calc(4px * var(--app-density,1)) calc(10px * var(--app-density,1));

          margin:
            0 14px 10px;

          color: #78857d;

          font-size: calc(7px * var(--app-font-scale,1));
        }

        .record-halaqa div {
          display: inline-flex;
          align-items: center;

          gap: calc(3px * var(--app-density,1));
        }

        /* SECTION */

        .record-section {
          margin:
            0 14px 8px;
          padding: calc(9px * var(--app-density,1));

          border:
            1px solid #edf1ef;

          border-radius: calc(11px * var(--app-radius-scale,1));

          background: #fbfdfc;
        }

        .record-section-title {
          display: flex;
          align-items: center;

          gap: calc(4px * var(--app-density,1));

          margin-bottom: 6px;

          color: #78847c;

          font-size: calc(7px * var(--app-font-scale,1));
          font-weight: 850;
        }

        .record-section-content {
          color: #33443a;

          font-size: calc(9px * var(--app-font-scale,1));
        }

        .quran-text {
          display: inline-flex;
          align-items: center;

          gap: calc(4px * var(--app-density,1));

          color: #33443a;

          font-size: calc(9px * var(--app-font-scale,1));
          font-weight: 800;
        }

        .quran-arrow {
          color: #a0aaa3;
        }

        .muted {
          color: #a0a7a2;
        }

        .record-values {
          display: flex;
          flex-wrap: wrap;

          gap: calc(5px * var(--app-density,1));

          margin-top: 7px;
        }

        .evaluation-badge,
        .face-badge {
          display: inline-flex;
          align-items: center;

          gap: calc(3px * var(--app-density,1));

          padding: calc(4px * var(--app-density,1)) calc(7px * var(--app-density,1));

          border-radius: 999px;

          font-size: calc(7px * var(--app-font-scale,1));
          font-weight: 850;
        }

        .evaluation-badge.excellent {
          color: #047857;
          background: #e9f9ef;
        }

        .evaluation-badge.very-good {
          color: #0f766e;
          background: #edf8f7;
        }

        .evaluation-badge.good {
          color: #927536;
          background: #fff8e7;
        }

        .evaluation-badge.bad {
          color: #b42318;
          background: #fff0ef;
        }

        .evaluation-badge.neutral {
          color: #64748b;
          background: #f1f3f2;
        }

        .face-badge {
          color: #0f5132;
          background: #edf7f1;
        }

        .face-badge.legacy {
          color: #64748b;
          background: #f1f5f9;
        }

        .sub-record-line {
          display: flex;
          align-items: center;
          justify-content: space-between;

          gap: calc(7px * var(--app-density,1));

          padding: calc(4px * var(--app-density,1)) 0;
        }

        .text-record-value {
          color: #33443a;

          font-size: calc(9px * var(--app-font-scale,1));
        }

        /* NOTES */

        .record-notes {
          display: flex;
          align-items: flex-start;

          gap: calc(5px * var(--app-density,1));

          margin:
            0 14px 10px;
          padding: calc(8px * var(--app-density,1)) calc(9px * var(--app-density,1));

          border-radius: calc(10px * var(--app-radius-scale,1));

          color: #756843;
          background: #fffaf0;

          font-size: calc(7px * var(--app-font-scale,1));
          line-height: 1.6;
        }

        /* FOOTER */

        .record-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;

          gap: calc(8px * var(--app-density,1));

          padding:
            calc(10px * var(--app-density,1)) calc(14px * var(--app-density,1)) calc(13px * var(--app-density,1));

          border-top:
            1px solid #edf1ef;
        }

        .record-points {
          display: flex;
          align-items: center;

          gap: calc(4px * var(--app-density,1));

          color: #927536;

          font-size: calc(10px * var(--app-font-scale,1));
          font-weight: 950;
        }

        .record-points span {
          color: #9aa39d;

          font-size: calc(6px * var(--app-font-scale,1));
          font-weight: 700;
        }

        .record-actions {
          display: flex;

          gap: calc(5px * var(--app-density,1));
        }

        .record-edit,
        .record-delete {
          min-height: 31px;

          padding: 0 calc(9px * var(--app-density,1));

          border-radius: calc(8px * var(--app-radius-scale,1));

          display: inline-flex;
          align-items: center;
          justify-content: center;

          gap: calc(4px * var(--app-density,1));

          font-size: calc(7px * var(--app-font-scale,1));
          font-weight: 850;

          cursor: pointer;
        }

        .record-edit {
          border:
            1px solid #b9d6c5;

          color: var(--app-color-0f5132,#0f5132);
          background: var(--app-color-f5faf7,#f5faf7);
        }

        .record-delete {
          border:
            1px solid #f1d1ce;

          color: #b42318;
          background: #fff5f4;
        }

        /* =============================================
           MODAL
        ============================================= */

        .recitation-modal-overlay {
          position: fixed;
          inset: 0;

          z-index: 5000;

          display: flex;
          align-items: center;
          justify-content: center;

          padding: calc(16px * var(--app-density,1));

          background:
            rgba(15,23,42,.58);

          backdrop-filter:
            blur(5px);
        }

        .recitation-modal {
          width:
            min(
              980px,
              100%
            );

          max-height:
            calc(
              100dvh - 32px
            );

          overflow-y: auto;

          border-radius: calc(24px * var(--app-radius-scale,1));

          background: #f8faf9;

          box-shadow:
            0 32px 90px
            rgba(15,23,42,.3);
        }

        .modal-header {
          position: sticky;
          top: 0;

          z-index: 20;

          display: flex;
          align-items: center;
          justify-content: space-between;

          gap: calc(10px * var(--app-density,1));

          padding: calc(15px * var(--app-density,1)) calc(17px * var(--app-density,1));

          border-bottom:
            1px solid #e8eeea;

          background:
            rgba(255,255,255,.97);

          backdrop-filter:
            blur(14px);
        }

        .modal-heading {
          display: flex;
          align-items: center;

          gap: calc(9px * var(--app-density,1));
        }

        .modal-icon {
          width: 39px;
          height: 39px;

          flex: 0 0 39px;

          border-radius: calc(12px * var(--app-radius-scale,1));

          display: flex;
          align-items: center;
          justify-content: center;
        }

        .modal-icon.quran {
          color: var(--app-color-0f5132,#0f5132);
          background: var(--app-color-edf7f1,#edf7f1);
        }

        .modal-icon.noorania {
          color: #927536;
          background: #fff8e7;
        }

        .modal-eyebrow {
          color: #909993;

          font-size: calc(7px * var(--app-font-scale,1));
          font-weight: 800;
        }

        .modal-heading h2 {
          margin: 1px 0 0;

          color: var(--app-color-173d2b,#173d2b);

          font-size: calc(15px * var(--app-font-scale,1));
          font-weight: 950;
        }

        .modal-close {
          width: 37px;
          height: 37px;

          border: none;
          border-radius: calc(10px * var(--app-radius-scale,1));

          display: flex;
          align-items: center;
          justify-content: center;

          color: #64748b;
          background: #f1f5f3;

          cursor: pointer;
        }

        .edit-notice {
          display: flex;
          align-items: center;

          gap: calc(6px * var(--app-density,1));

          padding: calc(9px * var(--app-density,1)) calc(16px * var(--app-density,1));

          border-bottom:
            1px solid #f0dfb7;

          color: #84651e;
          background: #fff8e7;

          font-size: calc(8px * var(--app-font-scale,1));
          line-height: 1.6;
        }

        .modal-body {
          padding: calc(15px * var(--app-density,1));
        }

        /* =============================================
           FORM SECTION
        ============================================= */

        .form-section {
          padding: calc(15px * var(--app-density,1));
          margin-bottom: 12px;

          border:
            1px solid #e5ebe7;

          border-radius: calc(17px * var(--app-radius-scale,1));

          background: #fff;

          box-shadow:
            0 4px 14px
            rgba(15,23,42,.02);
        }

        .form-section-header {
          display: flex;
          align-items: center;

          gap: calc(8px * var(--app-density,1));

          margin-bottom: 13px;
        }

        .form-section-icon {
          width: 34px;
          height: 34px;

          flex: 0 0 34px;

          border-radius: calc(10px * var(--app-radius-scale,1));

          display: flex;
          align-items: center;
          justify-content: center;

          color: var(--app-color-0f5132,#0f5132);
          background: var(--app-color-edf7f1,#edf7f1);
        }

        .form-section-header h3 {
          margin: 0;

          color: #26382e;

          font-size: calc(11px * var(--app-font-scale,1));
          font-weight: 950;
        }

        .form-section-header p {
          margin: 2px 0 0;

          color: #939c96;

          font-size: calc(7px * var(--app-font-scale,1));
        }

        /* =============================================
           INPUTS
        ============================================= */

        .form-grid {
          display: grid;

          gap: calc(10px * var(--app-density,1));
        }

        .form-grid.three {
          grid-template-columns:
            repeat(
              3,
              minmax(0,1fr)
            );
        }

        .form-grid.two {
          grid-template-columns:
            repeat(
              2,
              minmax(0,1fr)
            );
        }

        .field {
          min-width: 0;
        }

        .field-label {
          display: flex;
          align-items: center;

          gap: calc(4px * var(--app-density,1));

          margin-bottom: 5px;

          color: #566259;

          font-size: calc(8px * var(--app-font-scale,1));
          font-weight: 850;
        }

        .required {
          color: #b42318;

          margin-right: 2px;
        }

        .field input,
        .field select,
        .notes-box textarea {
          width: 100%;

          box-sizing: border-box;

          border:
            1px solid #dce4df;

          border-radius: calc(10px * var(--app-radius-scale,1));

          outline: none;

          color: #33443a;
          background: #fbfdfc;

          font-size: calc(9px * var(--app-font-scale,1));
          font-weight: 650;
        }

        .field input,
        .field select {
          height: 40px;

          padding: 0 calc(9px * var(--app-density,1));
        }

        .field input:focus,
        .field select:focus,
        .notes-box textarea:focus {
          border-color:
            color-mix(in srgb,var(--app-color-0f5132,#0f5132) 45%,transparent);

          box-shadow:
            0 0 0 3px
            color-mix(in srgb,var(--app-color-0f5132,#0f5132) 5%,transparent);
        }

        .field select:disabled {
          color: #7f8b83;
          background: #f3f5f4;

          cursor: not-allowed;
        }

        .select-wrap,
        .number-wrap,
        .date-input-wrap {
          position: relative;
        }

        .select-wrap select {
          appearance: none;

          padding-left: calc(30px * var(--app-density,1));
        }

        .select-wrap > svg {
          position: absolute;

          left: 10px;
          top: 50%;

          transform:
            translateY(-50%);

          color: #859089;

          pointer-events: none;
        }

        .number-wrap input {
          padding-left: calc(45px * var(--app-density,1));
        }

        .number-wrap > span {
          position: absolute;

          left: 9px;
          top: 50%;

          transform:
            translateY(-50%);

          color: #89938c;

          font-size: calc(7px * var(--app-font-scale,1));

          pointer-events: none;
        }

        .date-input-wrap > svg {
          position: absolute;

          right: 10px;
          top: 50%;

          transform:
            translateY(-50%);

          color: var(--app-color-0f5132,#0f5132);

          pointer-events: none;
        }

        .date-input-wrap input {
          padding-right: calc(33px * var(--app-density,1));
        }

        /* =============================================
           DUAL DATE
        ============================================= */

        .dual-date {
          display: grid;

          grid-template-columns:
            1fr 1fr;

          gap: calc(7px * var(--app-density,1));

          margin-top: 10px;
        }

        .dual-date > div {
          padding: calc(8px * var(--app-density,1)) calc(10px * var(--app-density,1));

          border-radius: calc(10px * var(--app-radius-scale,1));

          background: var(--app-color-f5faf7,#f5faf7);
        }

        .dual-date span {
          display: block;

          color: #8c9690;

          font-size: calc(6px * var(--app-font-scale,1));
        }

        .dual-date strong {
          display: block;

          margin-top: 2px;

          color: var(--app-color-0f5132,#0f5132);

          font-size: calc(8px * var(--app-font-scale,1));
        }

        /* =============================================
           QURAN RANGE
        ============================================= */

        .quran-range {
          display: grid;

          grid-template-columns:
            minmax(140px,1fr)
            minmax(90px,.55fr)
            25px
            minmax(140px,1fr)
            minmax(90px,.55fr);

          gap: calc(7px * var(--app-density,1));

          align-items: end;
        }

        .range-divider {
          height: 40px;

          display: flex;
          align-items: center;
          justify-content: center;

          color: #98a29c;

          font-size: calc(14px * var(--app-font-scale,1));
        }

        /* =============================================
           EVALUATIONS
        ============================================= */

        .evaluation-area {
          margin-top: 13px;
        }

        .evaluation-grid {
          display: grid;

          grid-template-columns:
            repeat(
              4,
              minmax(0,1fr)
            );

          gap: calc(6px * var(--app-density,1));
        }

        .evaluation-option {
          min-height: 40px;

          border:
            1px solid #dfe5e1;

          border-radius: calc(10px * var(--app-radius-scale,1));

          display: flex;
          align-items: center;
          justify-content: space-between;

          gap: calc(4px * var(--app-density,1));

          padding: 0 calc(9px * var(--app-density,1));

          color: #606c64;
          background: #fff;

          font-size: calc(8px * var(--app-font-scale,1));
          font-weight: 850;

          cursor: pointer;
        }

        .evaluation-option small {
          opacity: .7;
          font-size: calc(6px * var(--app-font-scale,1));
        }

        .evaluation-option.excellent.active {
          border-color: var(--app-color-0f5132,#0f5132);

          color: var(--app-color-0f5132,#0f5132);
          background: #e8f6ed;
        }

        .evaluation-option.very-good.active {
          border-color: var(--app-color-0f766e,#0f766e);

          color: var(--app-color-0f766e,#0f766e);
          background: var(--app-color-edf8f7,#edf8f7);
        }

        .evaluation-option.good.active {
          border-color: #c79d43;

          color: #927536;
          background: #fff8e7;
        }

        .evaluation-option.bad.active {
          border-color: #b42318;

          color: #b42318;
          background: #fff0ef;
        }

        /* =============================================
           LESSON AMOUNT
        ============================================= */

        .lesson-amount-block {
          margin-top: 13px;
        }

        .lesson-amount-grid {
          display: grid;

          grid-template-columns:
            repeat(
              4,
              minmax(0,1fr)
            );

          gap: calc(6px * var(--app-density,1));
        }

        .amount-option {
          min-height: 52px;

          border:
            1px solid #dfe5e1;

          border-radius: calc(11px * var(--app-radius-scale,1));

          display: flex;
          align-items: center;
          justify-content: center;
          flex-direction: column;

          gap: calc(2px * var(--app-density,1));

          color: #59665e;
          background: #fff;

          cursor: pointer;
        }

        .amount-option strong {
          font-size: calc(9px * var(--app-font-scale,1));
        }

        .amount-option span {
          color: #97a09a;

          font-size: calc(6px * var(--app-font-scale,1));
        }

        .amount-option.active {
          border-color: var(--app-color-0f5132,#0f5132);

          color: var(--app-color-0f5132,#0f5132);
          background: var(--app-color-edf7f1,#edf7f1);

          box-shadow:
            inset 0 0 0 1px
            color-mix(in srgb,var(--app-color-0f5132,#0f5132) 8%,transparent);
        }

        .faces-preview {
          display: flex;
          align-items: center;

          gap: calc(5px * var(--app-density,1));

          margin-top: 7px;
          padding: calc(7px * var(--app-density,1)) calc(9px * var(--app-density,1));

          border-radius: calc(9px * var(--app-radius-scale,1));

          color: #66736a;
          background: #f5f8f6;

          font-size: calc(7px * var(--app-font-scale,1));
        }

        .faces-preview strong {
          color: var(--app-color-0f5132,#0f5132);
        }

        .evaluation-faces-grid {
          margin-top: 0;
        }

        /* =============================================
           BOTTOM FORM
        ============================================= */

        .bottom-form-grid {
          display: grid;

          grid-template-columns:
            190px
            minmax(0,1fr);

          gap: calc(10px * var(--app-density,1));
        }

        .points-preview {
          min-height: 135px;

          display: flex;
          align-items: center;
          justify-content: center;
          flex-direction: column;

          border:
            1px solid #f0e2c2;

          border-radius: calc(16px * var(--app-radius-scale,1));

          background:
            linear-gradient(
              145deg,
              #fffaf0,
              #fffdf8
            );
        }

        .points-icon {
          width: 37px;
          height: 37px;

          margin-bottom: 5px;

          border-radius: calc(11px * var(--app-radius-scale,1));

          display: flex;
          align-items: center;
          justify-content: center;

          color: #927536;
          background: #fff2cf;
        }

        .points-preview > span {
          color: #9b844f;

          font-size: calc(7px * var(--app-font-scale,1));
        }

        .points-preview > strong {
          margin-top: 2px;

          color: #8c6919;

          font-size: calc(23px * var(--app-font-scale,1));
          font-weight: 950;
        }

        .points-preview > small {
          margin-top: 2px;

          color: #a99c7c;

          font-size: calc(6px * var(--app-font-scale,1));
        }

        .notes-box {
          padding: calc(13px * var(--app-density,1));

          border:
            1px solid #e5ebe7;

          border-radius: calc(16px * var(--app-radius-scale,1));

          background: #fff;
        }

        .notes-box textarea {
          min-height: 91px;

          padding: calc(9px * var(--app-density,1));

          resize: vertical;

          line-height: 1.7;
        }

        /* =============================================
           MODAL FOOTER
        ============================================= */

        .modal-footer {
          position: sticky;
          bottom: 0;

          z-index: 20;

          display: flex;
          justify-content: flex-end;

          gap: calc(7px * var(--app-density,1));

          padding: calc(12px * var(--app-density,1)) calc(16px * var(--app-density,1));

          border-top:
            1px solid #e7ede9;

          background:
            rgba(255,255,255,.97);

          backdrop-filter:
            blur(14px);
        }

        .modal-save,
        .modal-cancel {
          min-height: 40px;

          padding: 0 calc(15px * var(--app-density,1));

          border-radius: calc(10px * var(--app-radius-scale,1));

          display: inline-flex;
          align-items: center;
          justify-content: center;

          gap: calc(5px * var(--app-density,1));

          font-size: calc(8px * var(--app-font-scale,1));
          font-weight: 900;

          cursor: pointer;
        }

        .modal-save {
          min-width: 135px;

          border: none;

          color: #fff;

          background:
            linear-gradient(
              135deg,
              var(--app-color-0f5132,#0f5132),
              var(--app-color-0f766e,#0f766e)
            );
        }

        .modal-cancel {
          border:
            1px solid #dce3df;

          color: #637068;
          background: #fff;
        }

        .modal-save:disabled,
        .modal-cancel:disabled {
          opacity: .55;
          cursor: wait;
        }

        /* =============================================
           EMPTY
        ============================================= */

        .records-empty {
          padding: calc(48px * var(--app-density,1)) calc(20px * var(--app-density,1));

          border:
            1px dashed #ccd8d1;

          border-radius: calc(19px * var(--app-radius-scale,1));

          text-align: center;

          background: #fff;
        }

        .empty-icon,
        .loading-icon {
          width: 54px;
          height: 54px;

          margin:
            0 auto 10px;

          border-radius: calc(16px * var(--app-radius-scale,1));

          display: flex;
          align-items: center;
          justify-content: center;

          color: var(--app-color-0f5132,#0f5132);
          background: var(--app-color-edf7f1,#edf7f1);
        }

        .records-empty h3,
        .recitations-loading h3 {
          margin: 0;

          color: #35453b;

          font-size: calc(13px * var(--app-font-scale,1));
        }

        .records-empty p,
        .recitations-loading p {
          margin: 4px 0 0;

          color: #8d9790;

          font-size: calc(8px * var(--app-font-scale,1));
        }

        .recitations-loading {
          min-height: 55vh;

          display: flex;
          align-items: center;
          justify-content: center;
          flex-direction: column;

          text-align: center;
        }

        /* =============================================
           ANIMATION
        ============================================= */

        @keyframes recitationSpin {
          to {
            transform:
              rotate(360deg);
          }
        }

        .spin {
          animation:
            recitationSpin
            .8s linear infinite;
        }

        /* =============================================
           TABLET
        ============================================= */

        @media (
          max-width: 1100px
        ) {
          .recitation-stats {
            grid-template-columns:
              repeat(
                3,
                minmax(0,1fr)
              );
          }

          .records-toolbar {
            grid-template-columns:
              1fr 1fr;
          }

          .records-search {
            grid-column:
              1 / -1;
          }

          .quran-range {
            grid-template-columns:
              1fr 1fr;

            gap: calc(9px * var(--app-density,1));
          }

          .range-divider {
            display: none;
          }
        }

        /* =============================================
           MOBILE
        ============================================= */

        @media (
          max-width: 720px
        ) {
          .recitations-hero {
            align-items:
              flex-start;

            padding: calc(17px * var(--app-density,1));

            border-radius: calc(19px * var(--app-radius-scale,1));
          }

          .hero-icon {
            width: 42px;
            height: 42px;

            flex-basis: 42px;
          }

          .hero-main h1 {
            font-size: calc(20px * var(--app-font-scale,1));
          }

          .hero-main p {
            display: none;
          }

          .hero-actions {
            gap: calc(5px * var(--app-density,1));
          }

          .refresh-button,
          .create-button {
            width: 40px;
            min-height: 40px;

            padding: 0;
          }

          .refresh-button span,
          .create-button span {
            display: none;
          }

          .recitation-stats {
            grid-template-columns:
              repeat(
                2,
                minmax(0,1fr)
              );

            gap: calc(7px * var(--app-density,1));
          }

          .recitation-stat {
            padding: calc(10px * var(--app-density,1));
          }

          .recitation-stat-icon {
            width: 32px;
            height: 32px;

            flex-basis: 32px;
          }

          .recitation-stat strong {
            font-size: calc(16px * var(--app-font-scale,1));
          }

          .records-toolbar {
            grid-template-columns:
              1fr;
          }

          .records-search {
            grid-column: auto;
          }

          /* MODAL */

          .recitation-modal-overlay {
            padding: calc(7px * var(--app-density,1));

            align-items:
              flex-end;
          }

          .recitation-modal {
            max-height: 95dvh;

            border-radius:
              calc(22px * var(--app-radius-scale,1)) calc(22px * var(--app-radius-scale,1))
              calc(10px * var(--app-radius-scale,1)) calc(10px * var(--app-radius-scale,1));
          }

          .modal-body {
            padding: calc(11px * var(--app-density,1));
          }

          .form-grid.three,
          .form-grid.two {
            grid-template-columns:
              1fr;
          }

          .dual-date {
            grid-template-columns:
              1fr;
          }

          .quran-range {
            grid-template-columns:
              1fr 1fr;
          }

          .evaluation-grid {
            grid-template-columns:
              1fr 1fr;
          }

          .lesson-amount-grid {
            grid-template-columns:
              1fr 1fr;
          }

          .bottom-form-grid {
            grid-template-columns:
              1fr;
          }

          .points-preview {
            min-height: 100px;
          }

          .modal-footer {
            padding: calc(10px * var(--app-density,1)) calc(12px * var(--app-density,1));
          }

          .modal-save,
          .modal-cancel {
            flex: 1;
          }

          .record-card:hover {
            transform: none;
          }
        }

        /* =============================================
           SMALL MOBILE
        ============================================= */

        @media (
          max-width: 430px
        ) {
          .recitations-hero {
            padding: calc(14px * var(--app-density,1));
          }

          .hero-main {
            gap: calc(8px * var(--app-density,1));
          }

          .hero-main h1 {
            font-size: calc(18px * var(--app-font-scale,1));
          }

          .hero-eyebrow {
            font-size: calc(7px * var(--app-font-scale,1));
          }

          .hero-icon {
            width: 38px;
            height: 38px;

            flex-basis: 38px;
          }

          .refresh-button,
          .create-button {
            width: 36px;
            min-height: 36px;
          }

          .recitation-scope {
            font-size: calc(7px * var(--app-font-scale,1));
          }

          .quran-range {
            grid-template-columns:
              1fr;
          }

          .evaluation-grid {
            grid-template-columns:
              1fr 1fr;
          }

          .record-card-header {
            align-items:
              flex-start;
          }

          .record-footer {
            flex-direction:
              column;

            align-items:
              stretch;
          }

          .record-actions {
            display: grid;

            grid-template-columns:
              1fr 1fr;
          }

          .record-edit,
          .record-delete {
            width: 100%;
          }
        }

        /* =============================================
           QUICK PRO v1 — وضوح وسرعة
        ============================================= */

        .recitations-page {
          --quick-green: var(--app-color-0f4c45,#0f4c45);
          --quick-deep: var(--app-color-082f2a,#082f2a);
          --quick-gold: #d1b34c;
          --quick-ink: #173a33;
          --quick-muted: #6f827b;
          --quick-border: #dce6e2;
          color: var(--quick-ink);
        }

        .hero-eyebrow,
        .recitation-scope,
        .stat-card span,
        .stat-card small,
        .records-title-row p,
        .modal-eyebrow,
        .form-section-header p,
        .field-label,
        .field label,
        .dual-date span,
        .record-type-badge,
        .record-halaqa,
        .record-footer,
        .face-badge span,
        .evaluation-badge,
        .empty-state span {
          font-size: calc(12px * var(--app-font-scale,1));
          line-height: 1.55;
        }

        .hero-main h1 {
          font-size: calc(28px * var(--app-font-scale,1));
          line-height: 1.2;
        }

        .hero-main p {
          max-width: 700px;
          margin-top: 7px;
          font-size: calc(14px * var(--app-font-scale,1));
          line-height: 1.8;
          color: #667b73;
        }

        .recitation-scope {
          min-height: 48px;
          padding: calc(11px * var(--app-density,1)) calc(14px * var(--app-density,1));
          border-radius: calc(13px * var(--app-radius-scale,1));
        }

        .stat-card strong {
          font-size: calc(24px * var(--app-font-scale,1));
        }

        .records-toolbar input,
        .records-toolbar select,
        .field input,
        .field select,
        .field textarea,
        .select-field select,
        .text-field input,
        .number-field input,
        .date-field input {
          font-size: calc(14px * var(--app-font-scale,1));
        }

        .records-title-row h2,
        .form-section-header h3 {
          font-size: calc(17px * var(--app-font-scale,1));
        }

        .modal-header h2 {
          font-size: calc(22px * var(--app-font-scale,1));
          line-height: 1.3;
        }

        .recitation-modal {
          width: min(980px, 96vw);
          border-radius: calc(24px * var(--app-radius-scale,1));
        }

        .modal-body {
          padding: calc(18px * var(--app-density,1)) calc(20px * var(--app-density,1)) calc(24px * var(--app-density,1));
        }

        .form-section {
          border-radius: calc(17px * var(--app-radius-scale,1));
          padding: calc(16px * var(--app-density,1));
        }

        .quick-entry-banner {
          display: grid;
          grid-template-columns: 44px 1fr;
          gap: calc(11px * var(--app-density,1));
          align-items: center;
          margin-bottom: 13px;
          padding: calc(13px * var(--app-density,1)) calc(14px * var(--app-density,1));
          border: 1px solid rgba(209,179,76,.28);
          border-radius: calc(15px * var(--app-radius-scale,1));
          background:
            linear-gradient(
              135deg,
              #fffaf0,
              #fffdf8
            );
        }

        .quick-entry-icon {
          width: 42px;
          height: 42px;
          display: grid;
          place-items: center;
          border-radius: calc(12px * var(--app-radius-scale,1));
          background: #f6e9b6;
          color: #8d6f16;
        }

        .quick-entry-banner strong {
          display: block;
          color: #6b5314;
          font-size: calc(14px * var(--app-font-scale,1));
          font-weight: 950;
        }

        .quick-entry-banner span {
          display: block;
          margin-top: 4px;
          color: #887642;
          font-size: calc(12px * var(--app-font-scale,1));
          line-height: 1.7;
          font-weight: 700;
        }

        .quick-section-grid {
          display: grid;
          grid-template-columns: minmax(0, 1.25fr) minmax(260px, .75fr);
          gap: calc(15px * var(--app-density,1));
          align-items: start;
        }

        .quick-amount-column,
        .quick-evaluation-column {
          min-width: 0;
        }

        .lesson-amount-grid {
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: calc(8px * var(--app-density,1));
        }

        .amount-option {
          min-height: 72px;
          border-radius: calc(13px * var(--app-radius-scale,1));
        }

        .amount-option strong {
          font-size: calc(14px * var(--app-font-scale,1));
        }

        .amount-option span {
          margin-top: 5px;
          font-size: calc(11px * var(--app-font-scale,1));
        }

        .quick-faces-preview {
          min-height: 42px;
          margin-top: 9px;
          font-size: calc(12px * var(--app-font-scale,1));
        }

        .evaluation-grid {
          gap: calc(8px * var(--app-density,1));
        }

        .evaluation-option {
          min-height: 50px;
          border-radius: calc(12px * var(--app-radius-scale,1));
          font-size: calc(13px * var(--app-font-scale,1));
          font-weight: 900;
        }

        .quick-side-grid {
          align-items: end;
        }

        .quick-side-grid .text-field input {
          min-height: 46px;
        }

        .quick-record-values {
          justify-content: flex-start;
          gap: calc(8px * var(--app-density,1));
        }

        .quick-side-record {
          align-items: center;
          gap: calc(9px * var(--app-density,1));
        }

        .text-record-value {
          font-size: calc(13px * var(--app-font-scale,1));
          line-height: 1.55;
        }

        .record-card {
          border-radius: calc(18px * var(--app-radius-scale,1));
        }

        .record-student strong {
          font-size: calc(14px * var(--app-font-scale,1));
        }

        .record-student span,
        .record-date strong,
        .record-date span {
          font-size: calc(11px * var(--app-font-scale,1));
        }

        .record-section h4 {
          font-size: calc(12px * var(--app-font-scale,1));
        }

        .modal-save,
        .modal-cancel,
        .refresh-button,
        .create-button {
          font-size: calc(12px * var(--app-font-scale,1));
          font-weight: 900;
        }

        @media (max-width: 820px) {
          .quick-section-grid {
            grid-template-columns: 1fr;
          }

          .lesson-amount-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .recitation-modal {
            width: min(100%, 720px);
          }
        }

        @media (max-width: 520px) {
          .hero-main h1 {
            font-size: calc(23px * var(--app-font-scale,1));
          }

          .hero-main p {
            font-size: calc(13px * var(--app-font-scale,1));
          }

          .hero-eyebrow,
          .recitation-scope,
          .stat-card span,
          .stat-card small,
          .records-title-row p,
          .modal-eyebrow,
          .form-section-header p,
          .field-label,
          .field label,
          .dual-date span,
          .record-halaqa,
          .record-footer {
            font-size: calc(11px * var(--app-font-scale,1));
          }

          .lesson-amount-grid,
          .evaluation-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .quick-entry-banner {
            grid-template-columns: 38px 1fr;
            padding: calc(11px * var(--app-density,1));
          }

          .quick-entry-icon {
            width: 37px;
            height: 37px;
          }

          .modal-body {
            padding: calc(13px * var(--app-density,1));
          }

          .form-section {
            padding: calc(13px * var(--app-density,1));
          }
        }


        /* =============================================
           SMART PLAN DEFAULT + FREE LESSON AMOUNT
        ============================================= */

        .plan-suggestion-card {
          display: grid;
          grid-template-columns: 43px 1fr;
          gap: calc(10px * var(--app-density,1));
          align-items: center;
          margin-bottom: 13px;
          padding: calc(12px * var(--app-density,1)) calc(13px * var(--app-density,1));
          border: 1px solid #cfe3dc;
          border-radius: calc(14px * var(--app-radius-scale,1));
          background: linear-gradient(135deg, #eef8f4, #fbfdfc);
        }

        .plan-suggestion-card.extra-day {
          border-color: #eadca7;
          background: linear-gradient(135deg, #fffaf0, #fffdf8);
        }

        .plan-suggestion-icon {
          width: 41px;
          height: 41px;
          display: grid;
          place-items: center;
          border-radius: calc(12px * var(--app-radius-scale,1));
          background: #dff1ea;
          color: var(--app-color-147a5e,#147a5e);
        }

        .plan-suggestion-card.extra-day .plan-suggestion-icon {
          background: #f8ebbd;
          color: #8d6f16;
        }

        .plan-suggestion-copy span,
        .plan-suggestion-copy strong,
        .plan-suggestion-copy small {
          display: block;
        }

        .plan-suggestion-copy span {
          color: #71857d;
          font-size: calc(10px * var(--app-font-scale,1));
          font-weight: 850;
        }

        .plan-suggestion-copy strong {
          margin-top: 3px;
          color: #173f37;
          font-size: calc(13px * var(--app-font-scale,1));
          line-height: 1.45;
          font-weight: 950;
        }

        .plan-suggestion-copy small {
          margin-top: 4px;
          color: #70827b;
          font-size: calc(10px * var(--app-font-scale,1));
          line-height: 1.55;
          font-weight: 700;
        }

        .lesson-free-field {
          min-width: 0;
        }

        .lesson-free-control {
          display: grid;
          grid-template-columns: minmax(100px,1fr) auto;
          gap: calc(8px * var(--app-density,1));
        }

        .lesson-free-control > input {
          width: 100%;
          height: 48px;
          border: 1px solid #d9e3df;
          border-radius: calc(12px * var(--app-radius-scale,1));
          outline: none;
          padding: 0 calc(12px * var(--app-density,1));
          background: #fff;
          color: #23433b;
          font-family: inherit;
          font-size: calc(14px * var(--app-font-scale,1));
          font-weight: 850;
        }

        .lesson-free-control > input:focus {
          border-color: #9fc8bc;
          box-shadow: 0 0 0 4px color-mix(in srgb,var(--app-color-0f4c45,#0f4c45) 6%,transparent);
        }

        .lesson-unit-switch {
          min-width: 145px;
          display: grid;
          grid-template-columns: repeat(2,1fr);
          overflow: hidden;
          border: 1px solid #d9e3df;
          border-radius: calc(12px * var(--app-radius-scale,1));
          background: #fff;
        }

        .lesson-unit-switch button {
          border: 0;
          background: transparent;
          color: #72857e;
          font-family: inherit;
          font-size: calc(11px * var(--app-font-scale,1));
          font-weight: 900;
          cursor: pointer;
        }

        .lesson-unit-switch button + button {
          border-right: 1px solid #e1e9e6;
        }

        .lesson-unit-switch button.active {
          background: #eaf7f1;
          color: var(--app-color-147a5e,#147a5e);
        }

        .lesson-free-hint {
          display: block;
          margin-top: 7px;
          color: #82938d;
          font-size: calc(10px * var(--app-font-scale,1));
          line-height: 1.5;
        }

        @media (max-width: 560px) {
          .lesson-free-control {
            grid-template-columns: 1fr;
          }

          .lesson-unit-switch {
            min-width: 0;
            min-height: 42px;
          }

          .plan-suggestion-card {
            grid-template-columns: 37px 1fr;
          }

          .plan-suggestion-icon {
            width: 36px;
            height: 36px;
          }
        }
      `}
    </style>
  );
}
// src/pages/teacher/MonthlyPlan.jsx

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  BadgeCheck,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  Copy,
  History,
  Layers3,
  Loader2,
  MessageSquareText,
  RefreshCw,
  Save,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  Target,
  Undo2,
  UserRound,
  Users,
  X,
} from "lucide-react";

import {
  supabase,
} from "../../lib/supabase";

import {
  showToast,
} from "../../components/Toast";

import {
  surahs,
} from "../../data/surahList";

/* =========================================================
   HIJRI MONTHS
========================================================= */

const HIJRI_MONTHS = [
  "محرم",
  "صفر",
  "ربيع الأول",
  "ربيع الآخر",
  "جمادى الأولى",
  "جمادى الآخرة",
  "رجب",
  "شعبان",
  "رمضان",
  "شوال",
  "ذو القعدة",
  "ذو الحجة",
];

/* =========================================================
   HALAQA PERIODS
========================================================= */

const HALAQA_PERIODS = {
  after_fajr:
    "بعد الفجر",

  after_dhuhr:
    "بعد الظهر",

  after_asr:
    "بعد العصر",

  after_maghrib:
    "بعد المغرب",

  after_isha:
    "بعد العشاء",
};

/* =========================================================
   HIJRI / GREGORIAN
========================================================= */

const ummAlQuraFormatter =
  new Intl.DateTimeFormat(
    "en-US-u-ca-islamic-umalqura",
    {
      year: "numeric",
      month: "numeric",
      day: "numeric",
    }
  );

const dateCache =
  new Map();

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

function parseLocalDate(
  value
) {
  return new Date(
    `${value}T12:00:00`
  );
}

function pad2(value) {
  return String(value)
    .padStart(
      2,
      "0"
    );
}

function getHijriParts(
  date = new Date()
) {
  const parts =
    ummAlQuraFormatter
      .formatToParts(date);

  const result = {};

  parts.forEach(
    (part) => {
      if (
        part.type === "year" ||
        part.type === "month" ||
        part.type === "day"
      ) {
        result[
          part.type
        ] = Number(
          part.value
        );
      }
    }
  );

  return {
    year:
      result.year,

    month:
      result.month,

    day:
      result.day,
  };
}

function findGregorianForHijri(
  hijriYear,
  hijriMonth,
  hijriDay = 1
) {
  const key =
    `${hijriYear}-${hijriMonth}-${hijriDay}`;

  if (
    dateCache.has(key)
  ) {
    return dateCache.get(
      key
    );
  }

  const approxYear =
    Math.floor(
      Number(
        hijriYear
      ) *
        0.970224 +
        621.5774
    );

  const cursor =
    new Date(
      approxYear - 1,
      0,
      1,
      12
    );

  const end =
    new Date(
      approxYear + 1,
      11,
      31,
      12
    );

  while (
    cursor <= end
  ) {
    const hijri =
      getHijriParts(
        cursor
      );

    if (
      hijri.year ===
        Number(
          hijriYear
        ) &&
      hijri.month ===
        Number(
          hijriMonth
        ) &&
      hijri.day ===
        Number(
          hijriDay
        )
    ) {
      const result =
        getLocalDate(
          cursor
        );

      dateCache.set(
        key,
        result
      );

      return result;
    }

    cursor.setDate(
      cursor.getDate() + 1
    );
  }

  throw new Error(
    "تعذر تحويل التاريخ الهجري إلى الميلادي"
  );
}

function getHijriMonthRange(
  year,
  month
) {
  const key =
    `range-${year}-${month}`;

  if (
    dateCache.has(key)
  ) {
    return dateCache.get(
      key
    );
  }

  const start =
    findGregorianForHijri(
      year,
      month,
      1
    );

  let nextYear =
    Number(year);

  let nextMonth =
    Number(month) + 1;

  if (
    nextMonth > 12
  ) {
    nextMonth = 1;
    nextYear += 1;
  }

  const nextStart =
    findGregorianForHijri(
      nextYear,
      nextMonth,
      1
    );

  const endDate =
    parseLocalDate(
      nextStart
    );

  endDate.setDate(
    endDate.getDate() - 1
  );

  const result = {
    start,

    end:
      getLocalDate(
        endDate
      ),
  };

  dateCache.set(
    key,
    result
  );

  return result;
}

function formatGregorianDate(
  value
) {
  if (!value) {
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
      parseLocalDate(value)
    );
  } catch {
    return value;
  }
}

function formatHijriDate(
  value
) {
  if (!value) {
    return "—";
  }

  try {
    return new Intl.DateTimeFormat(
      "ar-SA-u-ca-islamic-umalqura",
      {
        year:
          "numeric",

        month:
          "long",

        day:
          "numeric",
      }
    ).format(
      parseLocalDate(value)
    );
  } catch {
    return value;
  }
}

function roundFaces(
  value
) {
  return (
    Math.round(
      (
        Number(
          value || 0
        ) +
        Number.EPSILON
      ) *
        100
    ) / 100
  );
}

function formatFaces(
  value
) {
  const number =
    roundFaces(
      value
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

  return number
    .toFixed(2)
    .replace(
      /\.?0+$/,
      ""
    );
}

function textOrNull(
  value
) {
  const result =
    String(
      value ?? ""
    ).trim();

  return result || null;
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

/* =========================================================
   CURRENT HIJRI
========================================================= */

const CURRENT_HIJRI =
  getHijriParts(
    new Date()
  );

/* =========================================================
   MONTH HELPERS
========================================================= */

function getPreviousHijriMonth(
  year,
  month
) {
  let previousYear =
    Number(year);

  let previousMonth =
    Number(month) - 1;

  if (
    previousMonth < 1
  ) {
    previousMonth = 12;
    previousYear -= 1;
  }

  return {
    year:
      previousYear,

    month:
      previousMonth,
  };
}

/* =========================================================
   OLD/NEW MONTHLY PROGRESS
========================================================= */

function selectExistingProgress({
  progressRows,
  studentId,
  period,
  hijriYear,
  hijriMonth,
}) {
  const rows =
    (
      progressRows || []
    )
      .filter(
        (row) =>
          Number(
            row.student_id
          ) ===
          Number(
            studentId
          )
      )
      .sort(
        (a, b) =>
          Number(
            b.id || 0
          ) -
          Number(
            a.id || 0
          )
      );

  if (
    rows.length === 0
  ) {
    return null;
  }

  const exact =
    rows.find(
      (row) =>
        row.progress_month ===
        period.start
    );

  if (exact) {
    return exact;
  }

  const hijri =
    rows.find(
      (row) =>
        Number(
          row.hijri_year
        ) ===
          Number(
            hijriYear
          ) &&
        Number(
          row.hijri_month
        ) ===
          Number(
            hijriMonth
          )
    );

  if (hijri) {
    return hijri;
  }

  const legacyDate =
    `${hijriYear}-${pad2(
      hijriMonth
    )}-01`;

  return (
    rows.find(
      (row) =>
        row.progress_month ===
        legacyDate
    ) ||
    null
  );
}

/* =========================================================
   STATUS
========================================================= */

function getStatusInfo(
  status
) {
  switch (status) {
    case "submitted":
      return {
        label:
          "مرسلة للمشرف",

        className:
          "submitted",
      };

    case "approved":
      return {
        label:
          "معتمدة",

        className:
          "approved",
      };

    case "needs_revision":
      return {
        label:
          "تحتاج تعديل",

        className:
          "needs-revision",
      };

    default:
      return {
        label:
          "مسودة",

        className:
          "draft",
      };
  }
}

function getSourceInfo(
  source
) {
  switch (source) {
    case "copied_previous":
      return {
        label:
          "من الشهر السابق",

        className:
          "copied",
      };

    case "halaqa_template":
      return {
        label:
          "خطة الحلقة",

        className:
          "template",
      };

    default:
      return {
        label:
          "خطة فردية",

        className:
          "individual",
      };
  }
}

function isLockedPlan(
  row
) {
  return (
    row.status ===
      "submitted" ||
    row.status ===
      "approved"
  );
}

/* =========================================================
   PROGRESS / PACE
========================================================= */

function calculatePercent(
  achieved,
  target
) {
  const goal =
    Number(
      target || 0
    );

  if (
    goal <= 0
  ) {
    return 0;
  }

  return Math.round(
    (
      Number(
        achieved || 0
      ) /
      goal
    ) *
      100
  );
}

function getElapsedPercent(
  period
) {
  if (!period) {
    return 0;
  }

  const today =
    parseLocalDate(
      getLocalDate()
    );

  const start =
    parseLocalDate(
      period.start
    );

  const end =
    parseLocalDate(
      period.end
    );

  if (
    today < start
  ) {
    return 0;
  }

  if (
    today > end
  ) {
    return 100;
  }

  const dayMs =
    24 *
    60 *
    60 *
    1000;

  const totalDays =
    Math.floor(
      (
        end - start
      ) /
        dayMs
    ) + 1;

  const elapsedDays =
    Math.floor(
      (
        today - start
      ) /
        dayMs
    ) + 1;

  return Math.min(
    100,
    Math.max(
      0,
      Math.round(
        (
          elapsedDays /
          totalDays
        ) *
          100
      )
    )
  );
}

function getPaceInfo({
  achieved,
  target,
  period,
}) {
  const goal =
    Number(
      target || 0
    );

  if (
    goal <= 0
  ) {
    return {
      label:
        "لم تحدد خطة",

      className:
        "no-plan",

      percentage:
        0,

      expected:
        getElapsedPercent(
          period
        ),
    };
  }

  const percentage =
    calculatePercent(
      achieved,
      target
    );

  const expected =
    getElapsedPercent(
      period
    );

  if (
    percentage >= 100
  ) {
    return {
      label:
        percentage > 100
          ? "تجاوز الخطة"
          : "حقق الخطة",

      className:
        "completed",

      percentage,

      expected,
    };
  }

  /*
    للشهور السابقة:
    المتوقع = 100%
  */

  const today =
    getLocalDate();

  if (
    period &&
    today >
      period.end
  ) {
    if (
      percentage >= 85
    ) {
      return {
        label:
          "قريب من الهدف",

        className:
          "near",

        percentage,

        expected:
          100,
      };
    }

    if (
      percentage >= 60
    ) {
      return {
        label:
          "يحتاج متابعة",

        className:
          "watch",

        percentage,

        expected:
          100,
      };
    }

    return {
      label:
        "متعثر",

      className:
        "behind",

      percentage,

      expected:
        100,
    };
  }

  /*
    الشهر الحالي:
    نقارن الإنجاز بما يفترض
    الوصول إليه حسب مرور الشهر.
  */

  if (
    percentage >=
      expected + 10
  ) {
    return {
      label:
        "متقدم على المسار",

      className:
        "ahead",

      percentage,

      expected,
    };
  }

  if (
    percentage >=
      expected - 10
  ) {
    return {
      label:
        "على المسار",

      className:
        "on-track",

      percentage,

      expected,
    };
  }

  if (
    percentage >=
      expected - 25
  ) {
    return {
      label:
        "يحتاج متابعة",

      className:
        "watch",

      percentage,

      expected,
    };
  }

  return {
    label:
      "أقل من المسار",

    className:
      "behind",

    percentage,

    expected,
  };
}

/* =========================================================
   EMPTY PLAN
========================================================= */

function createEmptyPlanData() {
  return {
    memorization_from_surah:
      "",

    memorization_from_ayah:
      "",

    memorization_to_surah:
      "",

    memorization_to_ayah:
      "",

    memorization_target_faces:
      0,

    revision_from_surah:
      "",

    revision_from_ayah:
      "",

    revision_to_surah:
      "",

    revision_to_ayah:
      "",

    revision_target_faces:
      0,

    notes:
      "",

    customization_reason:
      "",

    plan_source:
      "individual",
  };
}

/* =========================================================
   PAGE
========================================================= */

export default function MonthlyPlan() {
  /* =====================================================
     Scope
  ===================================================== */

  const [
    teacher,
    setTeacher,
  ] = useState(null);

  const [
    halaqat,
    setHalaqat,
  ] = useState([]);

  /* =====================================================
     Rows
  ===================================================== */

  const [
    rows,
    setRows,
  ] = useState([]);

  /* =====================================================
     Filters
  ===================================================== */

  const [
    selectedHalaqa,
    setSelectedHalaqa,
  ] = useState("");

  const [
    hijriYear,
    setHijriYear,
  ] = useState(
    CURRENT_HIJRI.year
  );

  const [
    hijriMonth,
    setHijriMonth,
  ] = useState(
    CURRENT_HIJRI.month
  );

  const [
    search,
    setSearch,
  ] = useState("");

  /* =====================================================
     UI
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
    saving,
    setSaving,
  ] = useState(false);

  const [
    submitting,
    setSubmitting,
  ] = useState(false);

  const [
    withdrawing,
    setWithdrawing,
  ] = useState(false);

  const [
    copying,
    setCopying,
  ] = useState(false);

  const [
    templateOpen,
    setTemplateOpen,
  ] = useState(false);

  const [
    template,
    setTemplate,
  ] = useState(
    createEmptyPlanData()
  );

  /* =====================================================
     Period
  ===================================================== */

  const period =
    useMemo(() => {
      try {
        return getHijriMonthRange(
          hijriYear,
          hijriMonth
        );
      } catch (
        error
      ) {
        console.error(
          error
        );

        return null;
      }
    }, [
      hijriYear,
      hijriMonth,
    ]);

  /* =====================================================
     Current Halaqa
  ===================================================== */

  const selectedHalaqaData =
    useMemo(
      () =>
        halaqat.find(
          (halaqa) =>
            Number(
              halaqa.id
            ) ===
            Number(
              selectedHalaqa
            )
        ),
      [
        halaqat,
        selectedHalaqa,
      ]
    );

  /* =====================================================
     Dirty
  ===================================================== */

  const hasUnsavedChanges =
    useMemo(
      () =>
        rows.some(
          (row) =>
            row.dirty
        ),
      [rows]
    );

  useEffect(() => {
    if (
      !hasUnsavedChanges
    ) {
      return;
    }

    const handler =
      (event) => {
        event.preventDefault();

        event.returnValue =
          "";
      };

    window.addEventListener(
      "beforeunload",
      handler
    );

    return () => {
      window.removeEventListener(
        "beforeunload",
        handler
      );
    };
  }, [
    hasUnsavedChanges,
  ]);

  function confirmDiscard() {
    if (
      !hasUnsavedChanges
    ) {
      return true;
    }

    return window.confirm(
      "لديك تعديلات غير محفوظة في الخطة.\n\nهل تريد المتابعة بدون حفظها؟"
    );
  }

  /* =====================================================
     Initial
  ===================================================== */

  useEffect(() => {
    loadTeacherScope();
  }, []);

  useEffect(() => {
    if (
      selectedHalaqa &&
      period
    ) {
      loadMonthlyPlan();
    }
  }, [
    selectedHalaqa,
    hijriYear,
    hijriMonth,
  ]);

  /* =====================================================
     LOAD TEACHER
  ===================================================== */

  async function loadTeacherScope() {
    setInitialLoading(
      true
    );

    try {
      const {
        data: authData,
        error: authError,
      } =
        await supabase.auth.getUser();

      if (
        authError
      ) {
        throw authError;
      }

      const user =
        authData?.user;

      if (!user) {
        throw new Error(
          "تعذر التحقق من المستخدم الحالي"
        );
      }

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

      if (
        teacherError
      ) {
        throw teacherError;
      }

      setTeacher(
        teacherProfile
      );

      /* Links */

      const {
        data:
          links,
        error:
          linksError,
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

      if (
        linksError
      ) {
        throw linksError;
      }

      const halaqaIds = [
        ...new Set(
          (
            links || []
          ).map(
            (item) =>
              Number(
                item.halaqa_id
              )
          )
        ),
      ];

      if (
        halaqaIds.length ===
        0
      ) {
        setHalaqat([]);

        return;
      }

      const {
        data:
          halaqatRows,
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
            status
          `)
          .in(
            "id",
            halaqaIds
          )
          .order(
            "name",
            {
              ascending:
                true,
            }
          );

      if (
        halaqatError
      ) {
        throw halaqatError;
      }

      const mosqueIds = [
        ...new Set(
          (
            halaqatRows ||
            []
          )
            .map(
              (halaqa) =>
                halaqa.mosque_id
            )
            .filter(Boolean)
            .map(Number)
        ),
      ];

      let mosques = [];

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

        mosques =
          data || [];
      }

      const mosqueMap =
        new Map(
          mosques.map(
            (mosque) => [
              Number(
                mosque.id
              ),
              mosque.name,
            ]
          )
        );

      const prepared =
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
          })
        );

      setHalaqat(
        prepared
      );

      if (
        prepared.length > 0
      ) {
        setSelectedHalaqa(
          String(
            prepared[0].id
          )
        );
      }

    } catch (error) {
      console.error(
        "LOAD MONTHLY PLAN SCOPE:",
        error
      );

      showToast(
        error.message ||
          "تعذر تحميل حلقات المعلم",
        "error"
      );
    } finally {
      setInitialLoading(
        false
      );
    }
  }

  /* =====================================================
     LOAD MONTHLY PLAN
  ===================================================== */

  async function loadMonthlyPlan() {
    if (
      !selectedHalaqa ||
      !period
    ) {
      return;
    }

    setLoading(true);

    try {
      /* ===========================================
         الطلاب الذين كانوا في الحلقة خلال الشهر
      =========================================== */

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
            start_date,
            end_date,
            is_current
          `)
          .eq(
            "halaqa_id",
            Number(
              selectedHalaqa
            )
          )
          .lte(
            "start_date",
            period.end
          )
          .or(
            `end_date.is.null,end_date.gte.${period.start}`
          );

      if (
        assignmentsError
      ) {
        throw assignmentsError;
      }

      const studentIds = [
        ...new Set(
          (
            assignments ||
            []
          ).map(
            (item) =>
              Number(
                item.student_id
              )
          )
        ),
      ];

      if (
        studentIds.length ===
        0
      ) {
        setRows([]);

        return;
      }

      /* Profiles */

      const {
        data:
          profiles,
        error:
          profilesError,
      } =
        await supabase
          .from("profiles")
          .select(`
            id,
            full_name,
            user_number,
            status,
            learning_goal
          `)
          .in(
            "id",
            studentIds
          )
          .eq(
            "role",
            "student"
          );

      if (
        profilesError
      ) {
        throw profilesError;
      }

      /* ===========================================
         خطط هذا الشهر
      =========================================== */

      const {
        data:
          plans,
        error:
          plansError,
      } =
        await supabase
          .from(
            "monthly_plans"
          )
          .select("*")
          .eq(
            "halaqa_id",
            Number(
              selectedHalaqa
            )
          )
          .eq(
            "plan_month",
            period.start
          )
          .in(
            "student_id",
            studentIds
          );

      if (
        plansError
      ) {
        throw plansError;
      }

      const planMap =
        new Map(
          (
            plans || []
          ).map(
            (plan) => [
              Number(
                plan.student_id
              ),
              plan,
            ]
          )
        );

      /* ===========================================
         التسميع الفعلي
      =========================================== */

      const {
        data:
          recitations,
        error:
          recitationsError,
      } =
        await supabase
          .from("recitations")
          .select(`
            id,
            student_id,
            recitation_date,
            lesson_faces,
            review_faces
          `)
          .eq(
            "halaqa_id",
            Number(
              selectedHalaqa
            )
          )
          .in(
            "student_id",
            studentIds
          )
          .gte(
            "recitation_date",
            period.start
          )
          .lte(
            "recitation_date",
            period.end
          );

      if (
        recitationsError
      ) {
        throw recitationsError;
      }

      const recitationMap =
        new Map();

      (
        recitations || []
      ).forEach(
        (record) => {
          const id =
            Number(
              record.student_id
            );

          const old =
            recitationMap.get(
              id
            ) || {
              memorization: 0,
              revision: 0,
              sessions: 0,
              lastDate: null,
            };

          old.memorization +=
            Number(
              record.lesson_faces ||
                0
            );

          old.revision +=
            Number(
              record.review_faces ||
                0
            );

          old.sessions += 1;

          if (
            !old.lastDate ||
            record.recitation_date >
              old.lastDate
          ) {
            old.lastDate =
              record.recitation_date;
          }

          recitationMap.set(
            id,
            old
          );
        }
      );

      /* ===========================================
         الإنجاز الشهري
         للحصول على الإضافات اليدوية
      =========================================== */

      const {
        data:
          progressRows,
        error:
          progressError,
      } =
        await supabase
          .from(
            "monthly_progress"
          )
          .select(`
            id,
            student_id,
            progress_month,
            hijri_year,
            hijri_month,
            manual_memorization_faces,
            manual_revision_faces,
            final_memorization_faces,
            final_revision_faces
          `)
          .eq(
            "halaqa_id",
            Number(
              selectedHalaqa
            )
          )
          .in(
            "student_id",
            studentIds
          );

      if (
        progressError
      ) {
        throw progressError;
      }

      /* ===========================================
         Build
      =========================================== */

      const result =
        (
          profiles || []
        )
          .map(
            (profile) => {
              const studentId =
                Number(
                  profile.id
                );

              const plan =
                planMap.get(
                  studentId
                );

              const live =
                recitationMap.get(
                  studentId
                ) || {
                  memorization: 0,
                  revision: 0,
                  sessions: 0,
                  lastDate: null,
                };

              const progress =
                selectExistingProgress({
                  progressRows,

                  studentId,

                  period,

                  hijriYear,

                  hijriMonth,
                });

              const manualMem =
                Number(
                  progress
                    ?.manual_memorization_faces ||
                    0
                );

              const manualRev =
                Number(
                  progress
                    ?.manual_revision_faces ||
                    0
                );

              /*
                الإنجاز الحي:
                التسميع التلقائي
                +
                أي إضافة يدوية
                سجلت في الإنجاز الشهري.
              */

              const achievedMem =
                roundFaces(
                  Number(
                    live.memorization
                  ) +
                    manualMem
                );

              const achievedRev =
                roundFaces(
                  Number(
                    live.revision
                  ) +
                    manualRev
                );

              return {
                id:
                  studentId,

                student_id:
                  studentId,

                student_name:
                  profile.full_name ||
                  "طالب",

                user_number:
                  profile.user_number ||
                  "",

                learning_goal:
                  profile.learning_goal ||
                  "",

                plan_id:
                  plan?.id ||
                  null,

                memorization_from_surah:
                  plan?.memorization_from_surah ||
                  "",

                memorization_from_ayah:
                  plan?.memorization_from_ayah ??
                  "",

                memorization_to_surah:
                  plan?.memorization_to_surah ||
                  "",

                memorization_to_ayah:
                  plan?.memorization_to_ayah ??
                  "",

                memorization_target_faces:
                  Number(
                    plan?.memorization_target_faces ||
                      0
                  ),

                revision_from_surah:
                  plan?.revision_from_surah ||
                  "",

                revision_from_ayah:
                  plan?.revision_from_ayah ??
                  "",

                revision_to_surah:
                  plan?.revision_to_surah ||
                  "",

                revision_to_ayah:
                  plan?.revision_to_ayah ??
                  "",

                revision_target_faces:
                  Number(
                    plan?.revision_target_faces ||
                      0
                  ),

                notes:
                  plan?.notes ||
                  "",

                customization_reason:
                  plan?.customization_reason ||
                  "",

                plan_source:
                  plan?.plan_source ||
                  "individual",

                status:
                  plan?.status ||
                  "draft",

                submitted_at:
                  plan?.submitted_at ||
                  null,

                approved_at:
                  plan?.approved_at ||
                  null,

                approved_by:
                  plan?.approved_by ||
                  null,

                supervisor_note:
                  plan?.supervisor_note ||
                  "",

                /*
                  Live achievement
                */

                auto_memorization_faces:
                  roundFaces(
                    live.memorization
                  ),

                manual_memorization_faces:
                  roundFaces(
                    manualMem
                  ),

                achieved_memorization_faces:
                  achievedMem,

                auto_revision_faces:
                  roundFaces(
                    live.revision
                  ),

                manual_revision_faces:
                  roundFaces(
                    manualRev
                  ),

                achieved_revision_faces:
                  achievedRev,

                recitation_sessions:
                  live.sessions,

                last_recitation_date:
                  live.lastDate,

                dirty:
                  false,
              };
            }
          )
          .sort(
            (a, b) =>
              String(
                a.student_name
              ).localeCompare(
                String(
                  b.student_name
                ),
                "ar"
              )
          );

      setRows(
        result
      );

    } catch (error) {
      console.error(
        "LOAD MONTHLY PLAN:",
        error
      );

      showToast(
        error.message ||
          "تعذر تحميل الخطة الشهرية",
        "error"
      );
    } finally {
      setLoading(false);
    }
  }

  /* =====================================================
     UPDATE ROW
  ===================================================== */

  function updateRow(
    studentId,
    field,
    value
  ) {
    setRows(
      (current) =>
        current.map(
          (row) => {
            if (
              Number(
                row.student_id
              ) !==
              Number(
                studentId
              )
            ) {
              return row;
            }

            if (
              isLockedPlan(
                row
              )
            ) {
              showToast(
                "الخطة مقفلة حاليًا ولا يمكن تعديلها",
                "info"
              );

              return row;
            }

            return {
              ...row,

              [field]:
                value,

              /*
                أي تعديل مباشر
                يجعل مصدر الخطة
                فرديًا، إلا إذا
                كان مجرد ملاحظات.
              */

              plan_source:
                [
                  "notes",
                  "customization_reason",
                ].includes(
                  field
                )
                  ? row.plan_source
                  : "individual",

              dirty:
                true,
            };
          }
        )
    );
  }

  /* =====================================================
     PLAN CONTENT
  ===================================================== */

  function hasPlanContent(
    row
  ) {
    return Boolean(
      Number(
        row.memorization_target_faces ||
          0
      ) >
        0 ||
      Number(
        row.revision_target_faces ||
          0
      ) >
        0 ||
      row.memorization_from_surah ||
      row.revision_from_surah ||
      String(
        row.notes || ""
      ).trim() ||
      row.plan_id
    );
  }

  /* =====================================================
     VALIDATION - SAVE
  ===================================================== */

  function validateNumbers() {
    for (
      const row of rows
    ) {
      if (
        Number(
          row.memorization_target_faces ||
            0
        ) < 0 ||
        Number(
          row.revision_target_faces ||
            0
        ) < 0
      ) {
        showToast(
          `لا يمكن إدخال هدف سالب للطالب ${row.student_name}`,
          "error"
        );

        return false;
      }
    }

    return true;
  }

  /* =====================================================
     VALIDATION - SUBMIT
  ===================================================== */

  function validateForSubmit() {
    if (
      !validateNumbers()
    ) {
      return false;
    }

    for (
      const row of rows
    ) {
      const memTarget =
        Number(
          row.memorization_target_faces ||
            0
        );

      const revTarget =
        Number(
          row.revision_target_faces ||
            0
        );

      if (
        memTarget <= 0 &&
        revTarget <= 0
      ) {
        showToast(
          `لم يتم تحديد هدف للطالب ${row.student_name}`,
          "error"
        );

        return false;
      }

      if (
        memTarget > 0
      ) {
        if (
          !row.memorization_from_surah ||
          !row.memorization_from_ayah ||
          !row.memorization_to_surah ||
          !row.memorization_to_ayah
        ) {
          showToast(
            `أكمل نطاق الحفظ للطالب ${row.student_name}`,
            "error"
          );

          return false;
        }
      }

      if (
        revTarget > 0
      ) {
        if (
          !row.revision_from_surah ||
          !row.revision_from_ayah ||
          !row.revision_to_surah ||
          !row.revision_to_ayah
        ) {
          showToast(
            `أكمل نطاق المراجعة للطالب ${row.student_name}`,
            "error"
          );

          return false;
        }
      }
    }

    return true;
  }

  /* =====================================================
     PAYLOAD
  ===================================================== */

  function buildPayload(
    row
  ) {
    return {
      student_id:
        Number(
          row.student_id
        ),

      halaqa_id:
        Number(
          selectedHalaqa
        ),

      teacher_id:
        teacher?.id ||
        null,

      mosque_id:
        selectedHalaqaData
          ?.mosque_id ||
        null,

      /*
        ميلادي حقيقي
        لبداية الشهر الهجري.
      */

      plan_month:
        period.start,

      hijri_year:
        Number(
          hijriYear
        ),

      hijri_month:
        Number(
          hijriMonth
        ),

      memorization_from_surah:
        textOrNull(
          row.memorization_from_surah
        ),

      memorization_from_ayah:
        numberOrNull(
          row.memorization_from_ayah
        ),

      memorization_to_surah:
        textOrNull(
          row.memorization_to_surah
        ),

      memorization_to_ayah:
        numberOrNull(
          row.memorization_to_ayah
        ),

      memorization_target_faces:
        roundFaces(
          row.memorization_target_faces
        ),

      revision_from_surah:
        textOrNull(
          row.revision_from_surah
        ),

      revision_from_ayah:
        numberOrNull(
          row.revision_from_ayah
        ),

      revision_to_surah:
        textOrNull(
          row.revision_to_surah
        ),

      revision_to_ayah:
        numberOrNull(
          row.revision_to_ayah
        ),

      revision_target_faces:
        roundFaces(
          row.revision_target_faces
        ),

      notes:
        textOrNull(
          row.notes
        ),

      customization_reason:
        textOrNull(
          row.customization_reason
        ),

      plan_source:
        row.plan_source ||
        "individual",

      status:
        row.status ||
        "draft",
    };
  }

  /* =====================================================
     SAVE
  ===================================================== */

  async function saveAll({
    silent = false,
    reload = true,
    controlLoading = true,
  } = {}) {
    if (
      rows.length === 0
    ) {
      if (!silent) {
        showToast(
          "لا توجد بيانات للحفظ",
          "error"
        );
      }

      return false;
    }

    if (
      !period ||
      !teacher?.id ||
      !selectedHalaqa
    ) {
      showToast(
        "بيانات الحلقة أو الشهر غير مكتملة",
        "error"
      );

      return false;
    }

    if (
      !validateNumbers()
    ) {
      return false;
    }

    const saveRows =
      rows.filter(
        (row) =>
          hasPlanContent(
            row
          ) &&
          !isLockedPlan(
            row
          )
      );

    if (
      saveRows.length === 0
    ) {
      if (!silent) {
        showToast(
          "لا توجد تعديلات قابلة للحفظ",
          "info"
        );
      }

      return true;
    }

    if (
      controlLoading
    ) {
      setSaving(true);
    }

    try {
      await Promise.all(
        saveRows.map(
          async (row) => {
            const payload =
              buildPayload(
                row
              );

            if (
              row.plan_id
            ) {
              const {
                error,
              } =
                await supabase
                  .from(
                    "monthly_plans"
                  )
                  .update(
                    payload
                  )
                  .eq(
                    "id",
                    row.plan_id
                  );

              if (error) {
                throw error;
              }

              return;
            }

            const {
              error,
            } =
              await supabase
                .from(
                  "monthly_plans"
                )
                .upsert(
                  payload,
                  {
                    onConflict:
                      "student_id,halaqa_id,plan_month",
                  }
                );

            if (error) {
              throw error;
            }
          }
        )
      );

      if (!silent) {
        showToast(
          "تم حفظ الخطة الشهرية",
          "success"
        );
      }

      if (reload) {
        await loadMonthlyPlan();
      } else {
        setRows(
          (current) =>
            current.map(
              (row) => ({
                ...row,
                dirty:
                  false,
              })
            )
        );
      }

      return true;

    } catch (error) {
      console.error(
        "SAVE MONTHLY PLAN:",
        error
      );

      showToast(
        error.message ||
          "تعذر حفظ الخطة الشهرية",
        "error"
      );

      return false;
    } finally {
      if (
        controlLoading
      ) {
        setSaving(false);
      }
    }
  }

  /* =====================================================
     SUBMIT TO SUPERVISOR
  ===================================================== */

  async function submitToSupervisor() {
    if (
      rows.length === 0
    ) {
      showToast(
        "لا توجد خطط للإرسال",
        "error"
      );

      return;
    }

    if (
      !validateForSubmit()
    ) {
      return;
    }

    const confirmed =
      window.confirm(
        `إرسال خطط شهر ${
          HIJRI_MONTHS[
            hijriMonth - 1
          ]
        } ${hijriYear} هـ للمشرف؟\n\nبعد الإرسال ستقفل الخطط مؤقتًا حتى اعتمادها أو إعادتها للتعديل.`
      );

    if (!confirmed) {
      return;
    }

    setSubmitting(true);

    try {
      const saved =
        await saveAll({
          silent: true,
          reload: false,
          controlLoading:
            false,
        });

      if (!saved) {
        return;
      }

      const ids =
        rows.map(
          (row) =>
            Number(
              row.student_id
            )
        );

      const {
        error,
      } =
        await supabase
          .from(
            "monthly_plans"
          )
          .update({
            status:
              "submitted",

            submitted_at:
              new Date()
                .toISOString(),

            approved_at:
              null,

            approved_by:
              null,

            supervisor_note:
              null,
          })
          .eq(
            "halaqa_id",
            Number(
              selectedHalaqa
            )
          )
          .eq(
            "plan_month",
            period.start
          )
          .in(
            "student_id",
            ids
          );

      if (error) {
        throw error;
      }

      showToast(
        "تم إرسال الخطة للمشرف",
        "success"
      );

      await loadMonthlyPlan();

    } catch (error) {
      console.error(
        "SUBMIT MONTHLY PLAN:",
        error
      );

      showToast(
        error.message ||
          "تعذر إرسال الخطة للمشرف",
        "error"
      );
    } finally {
      setSubmitting(false);
    }
  }

  /* =====================================================
     WITHDRAW SUBMISSION

     مفيد الآن قبل بناء بوابة المشرف.
     لاحقًا يمكن تشديد هذه الصلاحية.
  ===================================================== */

  async function withdrawSubmission() {
    const submittedRows =
      rows.filter(
        (row) =>
          row.status ===
          "submitted"
      );

    if (
      submittedRows.length ===
      0
    ) {
      return;
    }

    const confirmed =
      window.confirm(
        "هل تريد سحب الخطط المرسلة وإعادتها إلى مسودة للتعديل؟"
      );

    if (!confirmed) {
      return;
    }

    setWithdrawing(true);

    try {
      const ids =
        submittedRows.map(
          (row) =>
            Number(
              row.student_id
            )
        );

      const {
        error,
      } =
        await supabase
          .from(
            "monthly_plans"
          )
          .update({
            status:
              "draft",

            submitted_at:
              null,
          })
          .eq(
            "halaqa_id",
            Number(
              selectedHalaqa
            )
          )
          .eq(
            "plan_month",
            period.start
          )
          .in(
            "student_id",
            ids
          );

      if (error) {
        throw error;
      }

      showToast(
        "تم سحب الإرسال وإعادة الخطة إلى مسودة",
        "success"
      );

      await loadMonthlyPlan();

    } catch (error) {
      console.error(
        "WITHDRAW PLAN:",
        error
      );

      showToast(
        error.message ||
          "تعذر سحب الإرسال",
        "error"
      );
    } finally {
      setWithdrawing(false);
    }
  }

  /* =====================================================
     COPY PREVIOUS MONTH
  ===================================================== */

  async function copyPreviousMonth() {
    if (
      !selectedHalaqa
    ) {
      return;
    }

    if (
      !confirmDiscard()
    ) {
      return;
    }

    const previous =
      getPreviousHijriMonth(
        hijriYear,
        hijriMonth
      );

    const previousPeriod =
      getHijriMonthRange(
        previous.year,
        previous.month
      );

    const confirmed =
      window.confirm(
        `نسخ خطط ${
          HIJRI_MONTHS[
            previous.month - 1
          ]
        } ${previous.year} هـ إلى ${
          HIJRI_MONTHS[
            hijriMonth - 1
          ]
        } ${hijriYear} هـ؟\n\nسيتم نسخ النطاقات والأهداف للطلاب الموجودين في الشهر الحالي.`
      );

    if (!confirmed) {
      return;
    }

    setCopying(true);

    try {
      let {
        data:
          previousPlans,
        error,
      } =
        await supabase
          .from(
            "monthly_plans"
          )
          .select("*")
          .eq(
            "halaqa_id",
            Number(
              selectedHalaqa
            )
          )
          .eq(
            "plan_month",
            previousPeriod.start
          );

      if (error) {
        throw error;
      }

      /*
        fallback بالهجري
      */

      if (
        !previousPlans ||
        previousPlans.length ===
          0
      ) {
        const result =
          await supabase
            .from(
              "monthly_plans"
            )
            .select("*")
            .eq(
              "halaqa_id",
              Number(
                selectedHalaqa
              )
            )
            .eq(
              "hijri_year",
              previous.year
            )
            .eq(
              "hijri_month",
              previous.month
            );

        if (
          result.error
        ) {
          throw result.error;
        }

        previousPlans =
          result.data ||
          [];
      }

      if (
        previousPlans.length ===
        0
      ) {
        showToast(
          "لا توجد خطة محفوظة للشهر السابق",
          "info"
        );

        return;
      }

      const previousMap =
        new Map(
          previousPlans.map(
            (plan) => [
              Number(
                plan.student_id
              ),
              plan,
            ]
          )
        );

      let copiedCount = 0;

      setRows(
        (current) =>
          current.map(
            (row) => {
              if (
                isLockedPlan(
                  row
                )
              ) {
                return row;
              }

              const old =
                previousMap.get(
                  Number(
                    row.student_id
                  )
                );

              if (!old) {
                return row;
              }

              copiedCount += 1;

              return {
                ...row,

                memorization_from_surah:
                  old.memorization_from_surah ||
                  "",

                memorization_from_ayah:
                  old.memorization_from_ayah ??
                  "",

                memorization_to_surah:
                  old.memorization_to_surah ||
                  "",

                memorization_to_ayah:
                  old.memorization_to_ayah ??
                  "",

                memorization_target_faces:
                  Number(
                    old.memorization_target_faces ||
                      0
                  ),

                revision_from_surah:
                  old.revision_from_surah ||
                  "",

                revision_from_ayah:
                  old.revision_from_ayah ??
                  "",

                revision_to_surah:
                  old.revision_to_surah ||
                  "",

                revision_to_ayah:
                  old.revision_to_ayah ??
                  "",

                revision_target_faces:
                  Number(
                    old.revision_target_faces ||
                      0
                  ),

                /*
                  لا ننسخ ملاحظات الشهر
                  لأنها قد تكون خاصة
                  بالشهر السابق.
                */

                notes:
                  "",

                customization_reason:
                  "",

                plan_source:
                  "copied_previous",

                status:
                  "draft",

                dirty:
                  true,
              };
            }
          )
      );

      showToast(
        `تم نسخ خطط ${copiedCount} طالب`,
        "success"
      );

    } catch (error) {
      console.error(
        "COPY PREVIOUS PLAN:",
        error
      );

      showToast(
        error.message ||
          "تعذر نسخ الشهر السابق",
        "error"
      );
    } finally {
      setCopying(false);
    }
  }

  /* =====================================================
     APPLY HALAQA TEMPLATE
  ===================================================== */

  function applyHalaqaTemplate() {
    const memTarget =
      Number(
        template.memorization_target_faces ||
          0
      );

    const revTarget =
      Number(
        template.revision_target_faces ||
          0
      );

    if (
      memTarget <= 0 &&
      revTarget <= 0
    ) {
      showToast(
        "حدد هدف حفظ أو مراجعة واحدًا على الأقل",
        "error"
      );

      return;
    }

    if (
      memTarget > 0 &&
      (
        !template.memorization_from_surah ||
        !template.memorization_from_ayah ||
        !template.memorization_to_surah ||
        !template.memorization_to_ayah
      )
    ) {
      showToast(
        "أكمل نطاق الحفظ في خطة الحلقة",
        "error"
      );

      return;
    }

    if (
      revTarget > 0 &&
      (
        !template.revision_from_surah ||
        !template.revision_from_ayah ||
        !template.revision_to_surah ||
        !template.revision_to_ayah
      )
    ) {
      showToast(
        "أكمل نطاق المراجعة في خطة الحلقة",
        "error"
      );

      return;
    }

    const confirmed =
      window.confirm(
        "سيتم تطبيق الخطة الموحدة على جميع الطلاب القابلين للتعديل.\n\nيمكنك تخصيص أي طالب بعد ذلك."
      );

    if (!confirmed) {
      return;
    }

    setRows(
      (current) =>
        current.map(
          (row) => {
            if (
              isLockedPlan(
                row
              )
            ) {
              return row;
            }

            return {
              ...row,

              memorization_from_surah:
                template.memorization_from_surah,

              memorization_from_ayah:
                template.memorization_from_ayah,

              memorization_to_surah:
                template.memorization_to_surah,

              memorization_to_ayah:
                template.memorization_to_ayah,

              memorization_target_faces:
                Number(
                  template.memorization_target_faces ||
                    0
                ),

              revision_from_surah:
                template.revision_from_surah,

              revision_from_ayah:
                template.revision_from_ayah,

              revision_to_surah:
                template.revision_to_surah,

              revision_to_ayah:
                template.revision_to_ayah,

              revision_target_faces:
                Number(
                  template.revision_target_faces ||
                    0
                ),

              notes:
                template.notes ||
                row.notes,

              customization_reason:
                "",

              plan_source:
                "halaqa_template",

              status:
                "draft",

              dirty:
                true,
            };
          }
        )
    );

    setTemplateOpen(
      false
    );

    showToast(
      "تم تطبيق الخطة الموحدة على طلاب الحلقة",
      "success"
    );
  }

  /* =====================================================
     PERIOD
  ===================================================== */

  function applyPeriod(
    year,
    month
  ) {
    if (
      !confirmDiscard()
    ) {
      return;
    }

    const selectedIndex =
      Number(year) *
        12 +
      Number(month);

    const currentIndex =
      CURRENT_HIJRI.year *
        12 +
      CURRENT_HIJRI.month;

    if (
      selectedIndex >
      currentIndex
    ) {
      showToast(
        "لا يمكن اختيار شهر مستقبلي",
        "info"
      );

      return;
    }

    setHijriYear(
      Number(year)
    );

    setHijriMonth(
      Number(month)
    );

    setSearch("");
  }

  function moveMonth(
    amount
  ) {
    let year =
      Number(
        hijriYear
      );

    let month =
      Number(
        hijriMonth
      ) + amount;

    if (
      month > 12
    ) {
      month = 1;
      year += 1;
    }

    if (
      month < 1
    ) {
      month = 12;
      year -= 1;
    }

    applyPeriod(
      year,
      month
    );
  }

  function goCurrentMonth() {
    applyPeriod(
      CURRENT_HIJRI.year,
      CURRENT_HIJRI.month
    );
  }

  const isCurrentMonth =
    Number(
      hijriYear
    ) ===
      CURRENT_HIJRI.year &&
    Number(
      hijriMonth
    ) ===
      CURRENT_HIJRI.month;

  /* =====================================================
     HALAQA CHANGE
  ===================================================== */

  function changeHalaqa(
    value
  ) {
    if (
      !confirmDiscard()
    ) {
      return;
    }

    setSelectedHalaqa(
      value
    );

    setSearch("");
  }

  /* =====================================================
     FILTER
  ===================================================== */

  const filteredRows =
    useMemo(() => {
      const text =
        search
          .trim()
          .toLowerCase();

      if (!text) {
        return rows;
      }

      return rows.filter(
        (row) =>
          String(
            row.student_name ||
              ""
          )
            .toLowerCase()
            .includes(text) ||
          String(
            row.user_number ||
              ""
          )
            .toLowerCase()
            .includes(text)
      );
    }, [
      rows,
      search,
    ]);

  /* =====================================================
     STATS
  ===================================================== */

  const stats =
    useMemo(() => {
      const total =
        rows.length;

      const withPlans =
        rows.filter(
          (row) =>
            Number(
              row.memorization_target_faces ||
                0
            ) >
              0 ||
            Number(
              row.revision_target_faces ||
                0
            ) >
              0
        ).length;

      const submitted =
        rows.filter(
          (row) =>
            row.status ===
            "submitted"
        ).length;

      const approved =
        rows.filter(
          (row) =>
            row.status ===
            "approved"
        ).length;

      const needsRevision =
        rows.filter(
          (row) =>
            row.status ===
            "needs_revision"
        ).length;

      const totalMemTarget =
        rows.reduce(
          (
            sum,
            row
          ) =>
            sum +
            Number(
              row.memorization_target_faces ||
                0
            ),
          0
        );

      const totalMemDone =
        rows.reduce(
          (
            sum,
            row
          ) =>
            sum +
            Number(
              row.achieved_memorization_faces ||
                0
            ),
          0
        );

      const totalRevTarget =
        rows.reduce(
          (
            sum,
            row
          ) =>
            sum +
            Number(
              row.revision_target_faces ||
                0
            ),
          0
        );

      const totalRevDone =
        rows.reduce(
          (
            sum,
            row
          ) =>
            sum +
            Number(
              row.achieved_revision_faces ||
                0
            ),
          0
        );

      return {
        total,

        withPlans,

        missing:
          Math.max(
            0,
            total -
              withPlans
          ),

        submitted,

        approved,

        needsRevision,

        totalMemTarget:
          roundFaces(
            totalMemTarget
          ),

        totalMemDone:
          roundFaces(
            totalMemDone
          ),

        totalRevTarget:
          roundFaces(
            totalRevTarget
          ),

        totalRevDone:
          roundFaces(
            totalRevDone
          ),

        memPercent:
          calculatePercent(
            totalMemDone,
            totalMemTarget
          ),

        revPercent:
          calculatePercent(
            totalRevDone,
            totalRevTarget
          ),
      };
    }, [rows]);

  const hasSubmitted =
    rows.some(
      (row) =>
        row.status ===
        "submitted"
    );

  /* =====================================================
     PAGE LOADING
  ===================================================== */

  if (
    initialLoading
  ) {
    return (
      <div
        className="monthly-plan-page"
        dir="rtl"
      >
        <MonthlyPlanStyles />

        <PageLoading />
      </div>
    );
  }

  /* =====================================================
     RENDER
  ===================================================== */

  return (
    <div
      className="monthly-plan-page"
      dir="rtl"
    >
      <MonthlyPlanStyles />

      {/* =================================================
          HERO
      ================================================= */}

      <section
        className="plan-hero"
      >
        <div
          className="plan-hero-main"
        >
          <div
            className="plan-hero-icon"
          >
            <Target
              size={24}
            />
          </div>

          <div>
            <div
              className="plan-eyebrow"
            >
              <ShieldCheck
                size={13}
              />

              التخطيط التعليمي
            </div>

            <h1>
              الخطة الشهرية
            </h1>

            <p>
              تحديد أهداف الحفظ
              والمراجعة لكل طالب،
              ومتابعة الإنجاز الفعلي
              من التسميع والإنجاز
              الشهري لحظة بلحظة.
            </p>
          </div>
        </div>

        <div
          className="plan-hero-actions"
        >
          <button
            type="button"
            className="hero-btn secondary"
            onClick={
              copyPreviousMonth
            }
            disabled={
              copying ||
              loading
            }
          >
            {copying ? (
              <Loader2
                size={16}
                className="spin"
              />
            ) : (
              <Copy
                size={16}
              />
            )}

            <span>
              نسخ الشهر السابق
            </span>
          </button>

          <button
            type="button"
            className="hero-btn template"
            onClick={() => {
              setTemplate(
                createEmptyPlanData()
              );

              setTemplateOpen(
                true
              );
            }}
            disabled={
              loading
            }
          >
            <Layers3
              size={16}
            />

            <span>
              خطة موحدة للحلقة
            </span>
          </button>

          <button
            type="button"
            className="hero-btn save"
            onClick={() =>
              saveAll()
            }
            disabled={
              saving ||
              loading
            }
          >
            {saving ? (
              <Loader2
                size={16}
                className="spin"
              />
            ) : (
              <Save
                size={16}
              />
            )}

            <span>
              حفظ
            </span>
          </button>

          <button
            type="button"
            className="hero-btn submit"
            onClick={
              submitToSupervisor
            }
            disabled={
              submitting ||
              loading ||
              rows.length ===
                0
            }
          >
            {submitting ? (
              <Loader2
                size={16}
                className="spin"
              />
            ) : (
              <Send
                size={16}
              />
            )}

            <span>
              إرسال للمشرف
            </span>
          </button>

          {hasSubmitted && (
            <button
              type="button"
              className="hero-btn withdraw"
              onClick={
                withdrawSubmission
              }
              disabled={
                withdrawing
              }
            >
              {withdrawing ? (
                <Loader2
                  size={16}
                  className="spin"
                />
              ) : (
                <Undo2
                  size={16}
                />
              )}

              <span>
                سحب الإرسال
              </span>
            </button>
          )}
        </div>
      </section>

      {/* =================================================
          UNSAVED
      ================================================= */}

      {hasUnsavedChanges && (
        <div
          className="plan-unsaved"
        >
          <CircleAlert
            size={14}
          />

          توجد تعديلات غير
          محفوظة في الخطة الشهرية.

          <button
            type="button"
            onClick={() =>
              saveAll()
            }
          >
            حفظ الآن
          </button>
        </div>
      )}

      {/* =================================================
          ARCHITECTURE NOTE
      ================================================= */}

      <div
        className="plan-flow-note"
      >
        <Sparkles
          size={15}
        />

        <div>
          <strong>
            الخطة ← التسميع ←
            الإنجاز
          </strong>

          <span>
            الخطة تحدد المطلوب،
            التسميع يسجل العمل
            الفعلي، والإنجاز الشهري
            يضيف أي إنجاز يدوي غير
            مسجل ثم تعرض هذه الصفحة
            نسبة تحقيق الهدف مباشرة.
          </span>
        </div>
      </div>

      {/* =================================================
          PERIOD
      ================================================= */}

      <section
        className="plan-period-card"
      >
        <button
          type="button"
          className="period-arrow"
          onClick={() =>
            moveMonth(-1)
          }
        >
          <ChevronRight
            size={19}
          />
        </button>

        <div
          className="plan-period-main"
        >
          <div
            className="plan-period-icon"
          >
            <CalendarDays
              size={21}
            />
          </div>

          <div
            className="plan-period-content"
          >
            <span>
              شهر الخطة —
              تقويم أم القرى
            </span>

            <div
              className="plan-period-selects"
            >
              <div
                className="select-shell"
              >
                <select
                  value={
                    hijriMonth
                  }
                  onChange={(
                    event
                  ) => {
                    applyPeriod(
                      hijriYear,
                      Number(
                        event.target
                          .value
                      )
                    );
                  }}
                >
                  {HIJRI_MONTHS.map(
                    (
                      month,
                      index
                    ) => (
                      <option
                        key={
                          month
                        }
                        value={
                          index +
                          1
                        }
                        disabled={
                          Number(
                            hijriYear
                          ) ===
                            CURRENT_HIJRI.year &&
                          index +
                            1 >
                            CURRENT_HIJRI.month
                        }
                      >
                        {month}
                      </option>
                    )
                  )}
                </select>

                <ChevronDown
                  size={14}
                />
              </div>

              <div
                className="select-shell year"
              >
                <select
                  value={
                    hijriYear
                  }
                  onChange={(
                    event
                  ) => {
                    const year =
                      Number(
                        event.target
                          .value
                      );

                    let month =
                      Number(
                        hijriMonth
                      );

                    if (
                      year ===
                        CURRENT_HIJRI.year &&
                      month >
                        CURRENT_HIJRI.month
                    ) {
                      month =
                        CURRENT_HIJRI.month;
                    }

                    applyPeriod(
                      year,
                      month
                    );
                  }}
                >
                  {Array.from(
                    {
                      length:
                        CURRENT_HIJRI.year -
                        1400 +
                        1,
                    },
                    (
                      _,
                      index
                    ) =>
                      CURRENT_HIJRI.year -
                      index
                  ).map(
                    (year) => (
                      <option
                        key={
                          year
                        }
                        value={
                          year
                        }
                      >
                        {year} هـ
                      </option>
                    )
                  )}
                </select>

                <ChevronDown
                  size={14}
                />
              </div>
            </div>

            {period && (
              <div
                className="period-gregorian"
              >
                <span>
                  التخزين
                  والاستعلام
                  بالميلادي
                </span>

                <strong>
                  {formatGregorianDate(
                    period.start
                  )}

                  <b>
                    ←
                  </b>

                  {formatGregorianDate(
                    period.end
                  )}
                </strong>
              </div>
            )}
          </div>
        </div>

        <div
          className="period-current"
        >
          {!isCurrentMonth && (
            <button
              type="button"
              onClick={
                goCurrentMonth
              }
            >
              الشهر الحالي
            </button>
          )}
        </div>

        <button
          type="button"
          className="period-arrow"
          onClick={() =>
            moveMonth(1)
          }
          disabled={
            isCurrentMonth
          }
        >
          <ChevronLeft
            size={19}
          />
        </button>
      </section>

      {/* =================================================
          SCOPE
      ================================================= */}

      <section
        className="plan-scope-card"
      >
        <div
          className="plan-scope-heading"
        >
          <div
            className="scope-icon"
          >
            <Layers3
              size={17}
            />
          </div>

          <div>
            <strong>
              نطاق الخطة
            </strong>

            <span>
              اختر الحلقة وابحث عن
              الطالب
            </span>
          </div>
        </div>

        <div
          className="plan-scope-grid"
        >
          <div
            className="field"
          >
            <label>
              الحلقة
            </label>

            <div
              className="select-wrap"
            >
              <select
                value={
                  selectedHalaqa
                }
                onChange={(
                  event
                ) =>
                  changeHalaqa(
                    event.target
                      .value
                  )
                }
              >
                {halaqat.length ===
                  0 && (
                  <option value="">
                    لا توجد حلقات
                  </option>
                )}

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
                      {
                        halaqa.name
                      }
                    </option>
                  )
                )}
              </select>

              <ChevronDown
                size={15}
              />
            </div>
          </div>

          <div
            className="field"
          >
            <label>
              البحث
            </label>

            <div
              className="search-wrap"
            >
              <Search
                size={15}
              />

              <input
                value={
                  search
                }
                onChange={(
                  event
                ) =>
                  setSearch(
                    event.target
                      .value
                  )
                }
                placeholder="اسم الطالب أو رقمه..."
              />

              {search && (
                <button
                  type="button"
                  onClick={() =>
                    setSearch("")
                  }
                >
                  <X
                    size={13}
                  />
                </button>
              )}
            </div>
          </div>

          {selectedHalaqaData && (
            <div
              className="halaqa-card"
            >
              <span>
                الحلقة الحالية
              </span>

              <strong>
                {
                  selectedHalaqaData.name
                }
              </strong>

              <small>
                {
                  selectedHalaqaData.mosque_name
                }

                {selectedHalaqaData.halaqa_period
                  ? ` • ${
                      HALAQA_PERIODS[
                        selectedHalaqaData
                          .halaqa_period
                      ] ||
                      ""
                    }`
                  : ""}
              </small>
            </div>
          )}
        </div>
      </section>

      {/* =================================================
          STATS
      ================================================= */}

      <section
        className="plan-stats"
      >
        <PlanStat
          icon={Users}
          title="طلاب الشهر"
          value={
            stats.total
          }
          subtitle="ضمن الحلقة"
          tone="students"
        />

        <PlanStat
          icon={CheckCircle2}
          title="لديهم خطة"
          value={
            stats.withPlans
          }
          subtitle={`${stats.missing} بدون خطة`}
          tone="planned"
        />

        <PlanStat
          icon={BookOpen}
          title="خطة الحفظ"
          value={`${formatFaces(
            stats.totalMemDone
          )} / ${formatFaces(
            stats.totalMemTarget
          )}`}
          subtitle={`${stats.memPercent}% من الهدف`}
          tone="memorization"
        />

        <PlanStat
          icon={RefreshCw}
          title="خطة المراجعة"
          value={`${formatFaces(
            stats.totalRevDone
          )} / ${formatFaces(
            stats.totalRevTarget
          )}`}
          subtitle={`${stats.revPercent}% من الهدف`}
          tone="revision"
        />

        <PlanStat
          icon={BadgeCheck}
          title="حالة الاعتماد"
          value={
            stats.approved
          }
          subtitle={`${stats.submitted} مرسلة • ${stats.needsRevision} تحتاج تعديل`}
          tone="approval"
        />
      </section>

      {/* =================================================
          STUDENTS HEADER
      ================================================= */}

      <div
        className="plan-students-header"
      >
        <div>
          <h2>
            خطط الطلاب
          </h2>

          <p>
            حدد المطلوب ثم راقب
            تحقيق الخطة مباشرة.
          </p>
        </div>

        <span>
          <UserRound
            size={13}
          />

          {
            filteredRows.length
          }

          طالب
        </span>
      </div>

      {/* =================================================
          CONTENT
      ================================================= */}

      {loading ? (
        <InlineLoading />
      ) : halaqat.length ===
        0 ? (
        <EmptyState
          icon={Layers3}
          title="لا توجد حلقات مرتبطة بك"
          description="يجب أن يربطك المشرف بحلقة أولًا."
        />
      ) : filteredRows.length ===
        0 ? (
        <EmptyState
          icon={Users}
          title="لا يوجد طلاب"
          description={
            search
              ? "لا يوجد طالب مطابق للبحث."
              : "لا يوجد طلاب في هذه الحلقة خلال الشهر المحدد."
          }
        />
      ) : (
        <section
          className="plan-grid"
        >
          {filteredRows.map(
            (row) => (
              <StudentPlanCard
                key={
                  row.student_id
                }
                row={row}
                period={period}
                onChange={(
                  field,
                  value
                ) =>
                  updateRow(
                    row.student_id,
                    field,
                    value
                  )
                }
              />
            )
          )}
        </section>
      )}

      {/* =================================================
          TEMPLATE MODAL
      ================================================= */}

      {templateOpen && (
        <TemplateModal
          template={
            template
          }
          setTemplate={
            setTemplate
          }
          onApply={
            applyHalaqaTemplate
          }
          onClose={() =>
            setTemplateOpen(
              false
            )
          }
        />
      )}
    </div>
  );
}

/* =========================================================
   STUDENT PLAN CARD
========================================================= */

function StudentPlanCard({
  row,
  period,
  onChange,
}) {
  const locked =
    isLockedPlan(row);

  const status =
    getStatusInfo(
      row.status
    );

  const source =
    getSourceInfo(
      row.plan_source
    );

  const mem =
    getPaceInfo({
      achieved:
        row.achieved_memorization_faces,

      target:
        row.memorization_target_faces,

      period,
    });

  const revision =
    getPaceInfo({
      achieved:
        row.achieved_revision_faces,

      target:
        row.revision_target_faces,

      period,
    });

  return (
    <article
      className={
        locked
          ? "student-plan-card locked"
          : "student-plan-card"
      }
    >
      <div
        className="student-plan-line"
      />

      {/* HEADER */}

      <div
        className="student-plan-header"
      >
        <div
          className="student-plan-identity"
        >
          <div
            className="student-plan-avatar"
          >
            <UserRound
              size={19}
            />
          </div>

          <div
            style={{
              minWidth: 0,
            }}
          >
            <h3>
              {
                row.student_name
              }
            </h3>

            <span>
              {row.user_number
                ? `رقم الطالب: ${row.user_number}`
                : "طالب الحلقة"}
            </span>
          </div>
        </div>

        <div
          className="student-plan-badges"
        >
          <span
            className={
              `plan-source-badge ${source.className}`
            }
          >
            {source.label}
          </span>

          <span
            className={
              `plan-status-badge ${status.className}`
            }
          >
            {status.label}
          </span>
        </div>
      </div>

      {/* SUPERVISOR NOTE */}

      {row.status ===
        "needs_revision" &&
        row.supervisor_note && (
        <div
          className="supervisor-note"
        >
          <CircleAlert
            size={13}
          />

          <div>
            <strong>
              ملاحظة المشرف
            </strong>

            <span>
              {
                row.supervisor_note
              }
            </span>
          </div>
        </div>
      )}

      {/* LIVE SOURCE */}

      <div
        className="plan-live-source"
      >
        <div>
          <History
            size={12}
          />

          <span>
            جلسات التسميع
          </span>

          <strong>
            {
              row.recitation_sessions
            }
          </strong>
        </div>

        <div>
          <CalendarDays
            size={12}
          />

          <span>
            آخر تسميع
          </span>

          <strong>
            {row.last_recitation_date
              ? formatHijriDate(
                  row.last_recitation_date
                )
              : "لا يوجد"}
          </strong>
        </div>
      </div>

      {/* PLANS */}

      <div
        className="plan-sections"
      >
        <PlanSection
          type="memorization"
          title="خطة الحفظ"
          icon={
            <BookOpen
              size={16}
            />
          }
          locked={locked}
          fromSurah={
            row.memorization_from_surah
          }
          fromAyah={
            row.memorization_from_ayah
          }
          toSurah={
            row.memorization_to_surah
          }
          toAyah={
            row.memorization_to_ayah
          }
          target={
            row.memorization_target_faces
          }
          achieved={
            row.achieved_memorization_faces
          }
          automatic={
            row.auto_memorization_faces
          }
          manual={
            row.manual_memorization_faces
          }
          pace={mem}
          onChange={
            onChange
          }
          fieldPrefix="memorization"
        />

        <PlanSection
          type="revision"
          title="خطة المراجعة"
          icon={
            <RefreshCw
              size={16}
            />
          }
          locked={locked}
          fromSurah={
            row.revision_from_surah
          }
          fromAyah={
            row.revision_from_ayah
          }
          toSurah={
            row.revision_to_surah
          }
          toAyah={
            row.revision_to_ayah
          }
          target={
            row.revision_target_faces
          }
          achieved={
            row.achieved_revision_faces
          }
          automatic={
            row.auto_revision_faces
          }
          manual={
            row.manual_revision_faces
          }
          pace={
            revision
          }
          onChange={
            onChange
          }
          fieldPrefix="revision"
        />
      </div>

      {/* CUSTOMIZATION */}

      <div
        className="plan-card-bottom"
      >
        <div
          className="bottom-field"
        >
          <label>
            سبب تخصيص الخطة
          </label>

          <input
            value={
              row.customization_reason
            }
            disabled={
              locked
            }
            onChange={(
              event
            ) =>
              onChange(
                "customization_reason",
                event.target
                  .value
              )
            }
            placeholder="اختياري: طالب جديد، يحتاج تثبيت، متقدم..."
          />
        </div>

        <div
          className="bottom-field"
        >
          <label>
            <MessageSquareText
              size={12}
            />

            ملاحظات الخطة
          </label>

          <textarea
            rows={2}
            value={
              row.notes
            }
            disabled={
              locked
            }
            onChange={(
              event
            ) =>
              onChange(
                "notes",
                event.target
                  .value
              )
            }
            placeholder="ملاحظات تعليمية خاصة بخطة هذا الشهر..."
          />
        </div>
      </div>

      {locked && (
        <div
          className="plan-lock-note"
        >
          <ShieldCheck
            size={13}
          />

          {row.status ===
          "approved"
            ? "هذه الخطة معتمدة من المشرف ومقفلة للتعديل."
            : "هذه الخطة مرسلة للمشرف ومقفلة مؤقتًا حتى يتم اعتمادها أو إعادتها للتعديل."}
        </div>
      )}
    </article>
  );
}

/* =========================================================
   PLAN SECTION
========================================================= */

function PlanSection({
  type,
  title,
  icon,
  locked,
  fromSurah,
  fromAyah,
  toSurah,
  toAyah,
  target,
  achieved,
  automatic,
  manual,
  pace,
  onChange,
  fieldPrefix,
}) {
  const targetNumber =
    Number(
      target || 0
    );

  const achievedNumber =
    Number(
      achieved || 0
    );

  const remaining =
    Math.max(
      0,
      roundFaces(
        targetNumber -
          achievedNumber
      )
    );

  const barWidth =
    targetNumber > 0
      ? Math.min(
          100,
          pace.percentage
        )
      : 0;

  return (
    <section
      className={
        `student-plan-section ${type}`
      }
    >
      {/* Title */}

      <div
        className="plan-section-title"
      >
        <div>
          {icon}

          <strong>
            {title}
          </strong>
        </div>

        <span
          className={
            `pace-badge ${pace.className}`
          }
        >
          {pace.label}
        </span>
      </div>

      {/* Range */}

      <div
        className="plan-range-grid"
      >
        <SurahField
          label="من سورة"
          value={
            fromSurah
          }
          disabled={
            locked
          }
          onChange={(
            value
          ) =>
            onChange(
              `${fieldPrefix}_from_surah`,
              value
            )
          }
        />

        <NumberField
          label="من آية"
          value={
            fromAyah
          }
          disabled={
            locked
          }
          min="1"
          step="1"
          onChange={(
            value
          ) =>
            onChange(
              `${fieldPrefix}_from_ayah`,
              value
            )
          }
        />

        <SurahField
          label="إلى سورة"
          value={
            toSurah
          }
          disabled={
            locked
          }
          onChange={(
            value
          ) =>
            onChange(
              `${fieldPrefix}_to_surah`,
              value
            )
          }
        />

        <NumberField
          label="إلى آية"
          value={
            toAyah
          }
          disabled={
            locked
          }
          min="1"
          step="1"
          onChange={(
            value
          ) =>
            onChange(
              `${fieldPrefix}_to_ayah`,
              value
            )
          }
        />
      </div>

      {/* Target */}

      <div
        className="plan-target-row"
      >
        <div>
          <label>
            عدد الأوجه المطلوب
            إنجازها
          </label>

          <div
            className="target-input"
          >
            <input
              type="number"
              min="0"
              step="0.1"
              disabled={
                locked
              }
              value={
                target
              }
              onChange={(
                event
              ) =>
                onChange(
                  `${fieldPrefix}_target_faces`,
                  event.target
                    .value ===
                    ""
                    ? ""
                    : Number(
                        event.target
                          .value
                      )
                )
              }
              placeholder="0"
            />

            <span>
              وجه
            </span>
          </div>
        </div>

        <div
          className="target-summary"
        >
          <span>
            المنجز
          </span>

          <strong>
            {formatFaces(
              achieved
            )}

            <small>
              {" "}
              /{" "}
              {formatFaces(
                target
              )}
            </small>
          </strong>
        </div>
      </div>

      {/* Progress */}

      <div
        className="plan-progress"
      >
        <div
          className="progress-heading"
        >
          <div>
            <span>
              نسبة تحقيق الخطة
            </span>

            <strong>
              {pace.percentage}
              %
            </strong>
          </div>

          <div>
            <span>
              المتبقي
            </span>

            <strong>
              {formatFaces(
                remaining
              )}{" "}
              وجه
            </strong>
          </div>
        </div>

        <div
          className="progress-track"
        >
          <div
            className={
              `progress-fill ${pace.className}`
            }
            style={{
              width:
                `${barWidth}%`,
            }}
          />
        </div>

        <div
          className="progress-foot"
        >
          <span>
            المتوقع حسب مرور
            الشهر:
            {" "}
            {pace.expected}%
          </span>

          <span>
            {formatFaces(
              automatic
            )}{" "}
            تلقائي

            {Number(
              manual || 0
            ) > 0
              ? ` + ${formatFaces(
                  manual
                )} يدوي`
              : ""}
          </span>
        </div>
      </div>
    </section>
  );
}

/* =========================================================
   SURAH FIELD
========================================================= */

function SurahField({
  label,
  value,
  onChange,
  disabled,
}) {
  return (
    <div
      className="plan-field"
    >
      <label>
        {label}
      </label>

      <div
        className="plan-select-wrap"
      >
        <select
          value={
            value
          }
          disabled={
            disabled
          }
          onChange={(
            event
          ) =>
            onChange(
              event.target
                .value
            )
          }
        >
          <option value="">
            اختر السورة
          </option>

          {surahs.map(
            (surah) => (
              <option
                key={
                  surah
                }
                value={
                  surah
                }
              >
                {surah}
              </option>
            )
          )}
        </select>

        <ChevronDown
          size={13}
        />
      </div>
    </div>
  );
}

/* =========================================================
   NUMBER FIELD
========================================================= */

function NumberField({
  label,
  value,
  onChange,
  disabled,
  min,
  step,
}) {
  return (
    <div
      className="plan-field"
    >
      <label>
        {label}
      </label>

      <input
        type="number"
        value={
          value
        }
        disabled={
          disabled
        }
        min={min}
        step={step}
        onChange={(
          event
        ) =>
          onChange(
            event.target
              .value ===
              ""
              ? ""
              : Number(
                  event.target
                    .value
                )
          )
        }
        placeholder="رقم الآية"
      />
    </div>
  );
}

/* =========================================================
   TEMPLATE MODAL
========================================================= */

function TemplateModal({
  template,
  setTemplate,
  onApply,
  onClose,
}) {
  function setValue(
    field,
    value
  ) {
    setTemplate(
      (current) => ({
        ...current,

        [field]:
          value,
      })
    );
  }

  return (
    <div
      className="template-overlay"
      onMouseDown={(
        event
      ) => {
        if (
          event.target ===
          event.currentTarget
        ) {
          onClose();
        }
      }}
    >
      <div
        className="template-modal"
      >
        <div
          className="template-header"
        >
          <div>
            <span>
              تطبيق سريع
            </span>

            <h2>
              خطة موحدة للحلقة
            </h2>

            <p>
              طبّق هدفًا موحدًا
              ثم خصّص الطلاب
              المختلفين بعد ذلك.
            </p>
          </div>

          <button
            type="button"
            onClick={
              onClose
            }
          >
            <X
              size={17}
            />
          </button>
        </div>

        <div
          className="template-body"
        >
          <TemplateSection
            title="خطة الحفظ"
            icon={
              <BookOpen
                size={16}
              />
            }
            prefix="memorization"
            data={
              template
            }
            setValue={
              setValue
            }
          />

          <TemplateSection
            title="خطة المراجعة"
            icon={
              <RefreshCw
                size={16}
              />
            }
            prefix="revision"
            data={
              template
            }
            setValue={
              setValue
            }
          />

          <div
            className="template-notes"
          >
            <label>
              ملاحظات عامة
            </label>

            <textarea
              rows={3}
              value={
                template.notes
              }
              onChange={(
                event
              ) =>
                setValue(
                  "notes",
                  event.target
                    .value
                )
              }
              placeholder="ملاحظة اختيارية ستطبق على الطلاب..."
            />
          </div>
        </div>

        <div
          className="template-footer"
        >
          <button
            type="button"
            className="cancel"
            onClick={
              onClose
            }
          >
            إلغاء
          </button>

          <button
            type="button"
            className="apply"
            onClick={
              onApply
            }
          >
            <Layers3
              size={15}
            />

            تطبيق على طلاب
            الحلقة
          </button>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   TEMPLATE SECTION
========================================================= */

function TemplateSection({
  title,
  icon,
  prefix,
  data,
  setValue,
}) {
  return (
    <section
      className="template-section"
    >
      <div
        className="template-section-title"
      >
        {icon}

        <strong>
          {title}
        </strong>
      </div>

      <div
        className="template-range"
      >
        <SurahField
          label="من سورة"
          value={
            data[
              `${prefix}_from_surah`
            ]
          }
          onChange={(
            value
          ) =>
            setValue(
              `${prefix}_from_surah`,
              value
            )
          }
        />

        <NumberField
          label="من آية"
          value={
            data[
              `${prefix}_from_ayah`
            ]
          }
          min="1"
          step="1"
          onChange={(
            value
          ) =>
            setValue(
              `${prefix}_from_ayah`,
              value
            )
          }
        />

        <SurahField
          label="إلى سورة"
          value={
            data[
              `${prefix}_to_surah`
            ]
          }
          onChange={(
            value
          ) =>
            setValue(
              `${prefix}_to_surah`,
              value
            )
          }
        />

        <NumberField
          label="إلى آية"
          value={
            data[
              `${prefix}_to_ayah`
            ]
          }
          min="1"
          step="1"
          onChange={(
            value
          ) =>
            setValue(
              `${prefix}_to_ayah`,
              value
            )
          }
        />
      </div>

      <div
        className="template-target"
      >
        <label>
          عدد الأوجه
          المطلوب إنجازها
        </label>

        <div>
          <input
            type="number"
            min="0"
            step="0.1"
            value={
              data[
                `${prefix}_target_faces`
              ]
            }
            onChange={(
              event
            ) =>
              setValue(
                `${prefix}_target_faces`,
                event.target
                  .value ===
                  ""
                  ? ""
                  : Number(
                      event.target
                        .value
                    )
              )
            }
          />

          <span>
            وجه
          </span>
        </div>
      </div>
    </section>
  );
}

/* =========================================================
   STAT
========================================================= */

function PlanStat({
  icon: Icon,
  title,
  value,
  subtitle,
  tone,
}) {
  return (
    <div
      className={
        `plan-stat ${tone}`
      }
    >
      <div
        className="plan-stat-icon"
      >
        <Icon
          size={18}
        />
      </div>

      <div
        className="plan-stat-content"
      >
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
   EMPTY
========================================================= */

function EmptyState({
  icon: Icon,
  title,
  description,
}) {
  return (
    <div
      className="plan-empty"
    >
      <div
        className="plan-empty-icon"
      >
        <Icon
          size={27}
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
   LOADING
========================================================= */

function InlineLoading() {
  return (
    <div
      className="plan-inline-loading"
    >
      <Loader2
        size={26}
        className="spin"
      />

      <strong>
        جارٍ تجهيز خطط الطلاب...
      </strong>

      <span>
        يتم ربط الخطة
        بالتسميع والإنجاز
        الشهري.
      </span>
    </div>
  );
}

function PageLoading() {
  return (
    <div
      className="plan-page-loading"
    >
      <div
        className="plan-loading-icon"
      >
        <Loader2
          size={28}
          className="spin"
        />
      </div>

      <h3>
        جارٍ تجهيز الخطة
        الشهرية
      </h3>

      <p>
        يتم تحميل حلقاتك
        وتجهيز الفترة الهجرية...
      </p>
    </div>
  );
}

/* =========================================================
   CSS
========================================================= */

function MonthlyPlanStyles() {
  return (
    <style>
      {`
        .monthly-plan-page {
          width: 100%;
          max-width: 1600px;
          margin: 0 auto;
          color: #0f172a;
        }

        .monthly-plan-page * {
          box-sizing: border-box;
        }

        .monthly-plan-page button,
        .monthly-plan-page input,
        .monthly-plan-page select,
        .monthly-plan-page textarea {
          font-family: inherit;
        }

        /* ==========================================
           HERO
        ========================================== */

        .plan-hero {
          position: relative;
          overflow: hidden;

          display: flex;
          align-items: center;
          justify-content: space-between;

          gap: 18px;

          padding: 22px 24px;
          margin-bottom: 14px;

          border:
            1px solid rgba(15,81,50,.1);

          border-radius: 23px;

          background:
            linear-gradient(
              135deg,
              #ffffff 0%,
              #f5faf7 63%,
              #fffaf0 100%
            );

          box-shadow:
            0 13px 37px
            rgba(15,81,50,.05);
        }

        .plan-hero::before {
          content: "";

          position: absolute;

          width: 280px;
          height: 280px;

          left: -145px;
          top: -170px;

          border-radius: 50%;

          background:
            radial-gradient(
              circle,
              rgba(201,162,39,.15),
              transparent 70%
            );

          pointer-events: none;
        }

        .plan-hero-main {
          position: relative;
          z-index: 2;

          display: flex;
          align-items: center;

          gap: 12px;

          min-width: 0;
        }

        .plan-hero-icon {
          width: 50px;
          height: 50px;

          flex: 0 0 50px;

          border-radius: 16px;

          display: flex;
          align-items: center;
          justify-content: center;

          color: #fff;

          background:
            linear-gradient(
              135deg,
              #0f5132,
              #0f766e
            );

          box-shadow:
            0 10px 24px
            rgba(15,81,50,.18);
        }

        .plan-eyebrow {
          display: flex;
          align-items: center;

          gap: 5px;

          margin-bottom: 3px;

          color: #9a741f;

          font-size: 9px;
          font-weight: 900;
        }

        .plan-hero h1 {
          margin: 0;

          color: #173d2b;

          font-size: 25px;
          font-weight: 950;
        }

        .plan-hero p {
          max-width: 500px;

          margin: 5px 0 0;

          color: #758079;

          font-size: 10px;
          line-height: 1.75;
        }

        .plan-hero-actions {
          position: relative;
          z-index: 2;

          display: flex;
          flex-wrap: wrap;
          justify-content: flex-end;

          gap: 6px;
        }

        .hero-btn {
          min-height: 40px;

          padding: 0 11px;

          border-radius: 10px;

          display: inline-flex;
          align-items: center;
          justify-content: center;

          gap: 5px;

          font-size: 8px;
          font-weight: 900;

          cursor: pointer;
        }

        .hero-btn.secondary {
          border:
            1px solid #dce4df;

          color: #536158;
          background: #fff;
        }

        .hero-btn.template {
          border:
            1px solid #ead8a9;

          color: #84651e;
          background: #fffaf0;
        }

        .hero-btn.save {
          border: none;

          color: #fff;

          background:
            linear-gradient(
              135deg,
              #0f5132,
              #0f766e
            );
        }

        .hero-btn.submit {
          border: none;

          color: #fff;

          background:
            linear-gradient(
              135deg,
              #947019,
              #c69a30
            );
        }

        .hero-btn.withdraw {
          border:
            1px solid #ead8a9;

          color: #84651e;
          background: #fff;
        }

        .hero-btn:disabled {
          opacity: .5;
          cursor: wait;
        }

        /* ==========================================
           UNSAVED
        ========================================== */

        .plan-unsaved {
          display: flex;
          align-items: center;

          gap: 6px;

          margin-bottom: 12px;
          padding: 9px 12px;

          border:
            1px solid #efd9a7;

          border-radius: 12px;

          color: #765a17;
          background: #fff8e7;

          font-size: 8px;
        }

        .plan-unsaved button {
          margin-right: auto;

          border: none;
          border-radius: 8px;

          padding: 6px 9px;

          color: #fff;
          background: #8a6717;

          font-size: 7px;
          font-weight: 900;

          cursor: pointer;
        }

        /* ==========================================
           FLOW NOTE
        ========================================== */

        .plan-flow-note {
          display: flex;
          align-items: center;

          gap: 8px;

          padding: 10px 13px;
          margin-bottom: 14px;

          border:
            1px solid #dcebe3;

          border-radius: 13px;

          color: #37624c;
          background: #f4faf6;
        }

        .plan-flow-note strong {
          display: block;

          margin-bottom: 1px;

          font-size: 8px;
        }

        .plan-flow-note span {
          display: block;

          color: #678074;

          font-size: 7px;
          line-height: 1.65;
        }

        /* ==========================================
           PERIOD
        ========================================== */

        .plan-period-card {
          display: grid;

          grid-template-columns:
            42px
            minmax(0,1fr)
            auto
            42px;

          align-items: center;

          gap: 10px;

          padding: 14px;
          margin-bottom: 14px;

          border:
            1px solid #e3e9e5;

          border-radius: 19px;

          background: #fff;

          box-shadow:
            0 7px 23px
            rgba(15,23,42,.03);
        }

        .period-arrow {
          width: 40px;
          height: 40px;

          border:
            1px solid #dfe6e2;

          border-radius: 11px;

          display: flex;
          align-items: center;
          justify-content: center;

          color: #0f5132;
          background: #fff;

          cursor: pointer;
        }

        .period-arrow:disabled {
          opacity: .3;
          cursor: not-allowed;
        }

        .plan-period-main {
          min-width: 0;

          display: flex;
          align-items: center;

          gap: 10px;
        }

        .plan-period-icon {
          width: 44px;
          height: 44px;

          flex: 0 0 44px;

          border-radius: 13px;

          display: flex;
          align-items: center;
          justify-content: center;

          color: #0f5132;
          background: #edf7f1;
        }

        .plan-period-content {
          min-width: 0;
        }

        .plan-period-content
        > span {
          display: block;

          margin-bottom: 4px;

          color: #8a958e;

          font-size: 7px;
        }

        .plan-period-selects {
          display: flex;
          align-items: center;

          gap: 6px;
        }

        .select-shell {
          position: relative;
        }

        .select-shell select {
          min-width: 155px;
          height: 35px;

          appearance: none;

          padding:
            0 10px 0 28px;

          border:
            1px solid #dce4df;

          border-radius: 9px;

          outline: none;

          color: #173d2b;
          background: #fbfdfc;

          font-size: 10px;
          font-weight: 900;

          cursor: pointer;
        }

        .select-shell.year
        select {
          min-width: 90px;
        }

        .select-shell > svg {
          position: absolute;

          left: 8px;
          top: 50%;

          transform:
            translateY(-50%);

          color: #859089;

          pointer-events: none;
        }

        .period-gregorian {
          margin-top: 6px;
        }

        .period-gregorian
        > span {
          display: block;

          color: #a0a8a3;

          font-size: 6px;
        }

        .period-gregorian
        strong {
          display: flex;
          align-items: center;
          flex-wrap: wrap;

          gap: 5px;

          margin-top: 2px;

          color: #7b672f;

          font-size: 7px;
        }

        .period-gregorian b {
          color: #a6aea9;
        }

        .period-current button {
          min-height: 34px;

          padding: 0 10px;

          border:
            1px solid #cadcd1;

          border-radius: 9px;

          color: #0f5132;
          background: #f5faf7;

          font-size: 7px;
          font-weight: 850;

          cursor: pointer;
        }

        /* ==========================================
           SCOPE
        ========================================== */

        .plan-scope-card {
          padding: 13px;
          margin-bottom: 14px;

          border:
            1px solid #e4eae6;

          border-radius: 18px;

          background: #fff;

          box-shadow:
            0 6px 21px
            rgba(15,23,42,.025);
        }

        .plan-scope-heading {
          display: flex;
          align-items: center;

          gap: 8px;

          margin-bottom: 10px;
        }

        .scope-icon {
          width: 34px;
          height: 34px;

          flex: 0 0 34px;

          border-radius: 10px;

          display: flex;
          align-items: center;
          justify-content: center;

          color: #0f5132;
          background: #edf7f1;
        }

        .plan-scope-heading
        strong {
          display: block;

          color: #33443a;

          font-size: 9px;
        }

        .plan-scope-heading
        span {
          display: block;

          margin-top: 1px;

          color: #939c96;

          font-size: 6px;
        }

        .plan-scope-grid {
          display: grid;

          grid-template-columns:
            minmax(190px,.7fr)
            minmax(250px,1.2fr)
            minmax(200px,.8fr);

          gap: 8px;

          align-items: end;
        }

        .field label {
          display: block;

          margin-bottom: 4px;

          color: #627067;

          font-size: 7px;
          font-weight: 850;
        }

        .select-wrap,
        .search-wrap {
          position: relative;
        }

        .select-wrap select,
        .search-wrap input {
          width: 100%;
          height: 39px;

          border:
            1px solid #dce4df;

          border-radius: 10px;

          outline: none;

          color: #33443a;
          background: #fbfdfc;

          font-size: 8px;
        }

        .select-wrap select {
          appearance: none;

          padding:
            0 9px 0 29px;
        }

        .select-wrap > svg {
          position: absolute;

          left: 9px;
          top: 50%;

          transform:
            translateY(-50%);

          color: #859089;

          pointer-events: none;
        }

        .search-wrap > svg {
          position: absolute;

          right: 10px;
          top: 50%;

          transform:
            translateY(-50%);

          color: #8c9690;

          pointer-events: none;
        }

        .search-wrap input {
          padding:
            0 34px 0 31px;
        }

        .search-wrap button {
          position: absolute;

          left: 6px;
          top: 50%;

          width: 25px;
          height: 25px;

          transform:
            translateY(-50%);

          border: none;
          border-radius: 7px;

          display: flex;
          align-items: center;
          justify-content: center;

          color: #667169;
          background: #edf1ef;

          cursor: pointer;
        }

        .halaqa-card {
          min-height: 55px;

          padding: 8px 10px;

          border:
            1px solid #eee0bd;

          border-radius: 11px;

          background:
            linear-gradient(
              135deg,
              #fffdf8,
              #fff9eb
            );
        }

        .halaqa-card span,
        .halaqa-card small {
          display: block;

          color: #96865f;

          font-size: 6px;
        }

        .halaqa-card strong {
          display: block;

          margin: 2px 0;

          color: #70571a;

          font-size: 9px;
          font-weight: 900;
        }

        /* ==========================================
           STATS
        ========================================== */

        .plan-stats {
          display: grid;

          grid-template-columns:
            repeat(
              5,
              minmax(0,1fr)
            );

          gap: 9px;

          margin-bottom: 17px;
        }

        .plan-stat {
          min-width: 0;

          display: flex;
          align-items: center;

          gap: 8px;

          padding: 12px;

          border:
            1px solid #e5ebe7;

          border-radius: 16px;

          background: #fff;

          box-shadow:
            0 6px 20px
            rgba(15,23,42,.025);
        }

        .plan-stat-icon {
          width: 36px;
          height: 36px;

          flex: 0 0 36px;

          border-radius: 11px;

          display: flex;
          align-items: center;
          justify-content: center;
        }

        .plan-stat.students
        .plan-stat-icon {
          color: #0f5132;
          background: #edf7f1;
        }

        .plan-stat.planned
        .plan-stat-icon {
          color: #166534;
          background: #ecfdf3;
        }

        .plan-stat.memorization
        .plan-stat-icon {
          color: #047857;
          background: #eaf8ef;
        }

        .plan-stat.revision
        .plan-stat-icon {
          color: #0f766e;
          background: #edf8f7;
        }

        .plan-stat.approval
        .plan-stat-icon {
          color: #927536;
          background: #fff8e7;
        }

        .plan-stat-content {
          min-width: 0;
        }

        .plan-stat-content > span {
          display: block;

          color: #7f8a83;

          font-size: 7px;
        }

        .plan-stat-content > strong {
          display: block;

          margin-top: 1px;

          color: #173d2b;

          font-size: 17px;
          font-weight: 950;
        }

        .plan-stat-content > small {
          display: block;

          margin-top: 1px;

          color: #9ba39e;

          font-size: 6px;
          line-height: 1.4;
        }

        /* ==========================================
           HEADER
        ========================================== */

        .plan-students-header {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;

          gap: 8px;

          margin-bottom: 10px;
        }

        .plan-students-header h2 {
          margin: 0;

          color: #173d2b;

          font-size: 17px;
          font-weight: 950;
        }

        .plan-students-header p {
          margin: 3px 0 0;

          color: #909993;

          font-size: 7px;
        }

        .plan-students-header
        > span {
          display: inline-flex;
          align-items: center;

          gap: 4px;

          color: #758178;

          font-size: 7px;
          font-weight: 850;
        }

        /* ==========================================
           GRID
        ========================================== */

        .plan-grid {
          display: grid;

          grid-template-columns:
            repeat(
              auto-fit,
              minmax(
                min(100%,550px),
                1fr
              )
            );

          gap: 12px;
        }

        .student-plan-card {
          position: relative;
          overflow: hidden;

          min-width: 0;

          padding: 14px;

          border:
            1px solid #e4eae6;

          border-radius: 19px;

          background: #fff;

          box-shadow:
            0 7px 24px
            rgba(15,23,42,.035);

          transition:
            transform .2s ease,
            box-shadow .2s ease;
        }

        .student-plan-card:hover {
          transform:
            translateY(-2px);

          box-shadow:
            0 13px 31px
            rgba(15,81,50,.065);
        }

        .student-plan-card.locked {
          background:
            linear-gradient(
              180deg,
              #fff,
              #fbfcfb
            );
        }

        .student-plan-line {
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

        .student-plan-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;

          gap: 8px;

          margin-bottom: 10px;
        }

        .student-plan-identity {
          display: flex;
          align-items: center;

          gap: 8px;

          min-width: 0;
        }

        .student-plan-avatar {
          width: 39px;
          height: 39px;

          flex: 0 0 39px;

          border-radius: 12px;

          display: flex;
          align-items: center;
          justify-content: center;

          color: #0f5132;
          background: #edf7f1;
        }

        .student-plan-identity
        h3 {
          margin: 0;

          overflow: hidden;

          color: #293a30;

          font-size: 11px;
          font-weight: 950;

          white-space: nowrap;
          text-overflow: ellipsis;
        }

        .student-plan-identity
        span {
          display: block;

          margin-top: 2px;

          color: #939c96;

          font-size: 6px;
        }

        .student-plan-badges {
          display: flex;
          flex-wrap: wrap;
          justify-content: flex-end;

          gap: 4px;
        }

        .plan-source-badge,
        .plan-status-badge {
          min-height: 23px;

          padding: 0 7px;

          border-radius: 999px;

          display: inline-flex;
          align-items: center;
          justify-content: center;

          font-size: 6px;
          font-weight: 850;
        }

        .plan-source-badge.individual {
          color: #0f766e;
          background: #edf8f7;
        }

        .plan-source-badge.copied {
          color: #6f5a24;
          background: #fff8e7;
        }

        .plan-source-badge.template {
          color: #047857;
          background: #ecfdf3;
        }

        .plan-status-badge.draft {
          color: #64748b;
          background: #f1f5f9;
        }

        .plan-status-badge.submitted {
          color: #1d4ed8;
          background: #eff6ff;
        }

        .plan-status-badge.approved {
          color: #166534;
          background: #dcfce7;
        }

        .plan-status-badge.needs-revision {
          color: #b45309;
          background: #fff7ed;
        }

        /* ==========================================
           SUPERVISOR NOTE
        ========================================== */

        .supervisor-note {
          display: flex;
          align-items: flex-start;

          gap: 6px;

          margin-bottom: 9px;
          padding: 8px 9px;

          border:
            1px solid #fed7aa;

          border-radius: 10px;

          color: #9a4d08;
          background: #fff7ed;
        }

        .supervisor-note strong {
          display: block;

          font-size: 7px;
        }

        .supervisor-note span {
          display: block;

          margin-top: 2px;

          color: #a46127;

          font-size: 6px;
          line-height: 1.5;
        }

        /* ==========================================
           LIVE SOURCE
        ========================================== */

        .plan-live-source {
          display: grid;

          grid-template-columns:
            1fr 1.5fr;

          gap: 6px;

          margin-bottom: 9px;
          padding: 8px;

          border-radius: 10px;

          background: #f7faf8;
        }

        .plan-live-source
        > div {
          display: flex;
          align-items: center;

          gap: 4px;

          min-width: 0;

          color: #7d8981;

          font-size: 6px;
        }

        .plan-live-source
        strong {
          overflow: hidden;

          color: #46554c;

          font-size: 7px;

          white-space: nowrap;
          text-overflow: ellipsis;
        }

        /* ==========================================
           PLAN SECTIONS
        ========================================== */

        .plan-sections {
          display: grid;

          grid-template-columns:
            1fr 1fr;

          gap: 8px;
        }

        .student-plan-section {
          overflow: hidden;

          border:
            1px solid #e4eae6;

          border-radius: 14px;

          background: #fbfdfc;
        }

        .plan-section-title {
          display: flex;
          align-items: center;
          justify-content: space-between;

          gap: 7px;

          padding: 9px 10px;

          border-bottom:
            1px solid #e9eeeb;
        }

        .plan-section-title
        > div {
          display: flex;
          align-items: center;

          gap: 5px;
        }

        .plan-section-title
        strong {
          color: #33443a;

          font-size: 8px;
        }

        .student-plan-section.memorization
        .plan-section-title
        > div {
          color: #047857;
        }

        .student-plan-section.revision
        .plan-section-title
        > div {
          color: #0f766e;
        }

        /* Pace Badge */

        .pace-badge {
          min-height: 22px;

          padding: 0 6px;

          border-radius: 999px;

          display: inline-flex;
          align-items: center;
          justify-content: center;

          font-size: 5.8px;
          font-weight: 850;
        }

        .pace-badge.no-plan {
          color: #64748b;
          background: #f1f5f9;
        }

        .pace-badge.completed,
        .pace-badge.ahead {
          color: #166534;
          background: #dcfce7;
        }

        .pace-badge.on-track {
          color: #047857;
          background: #ecfdf3;
        }

        .pace-badge.near {
          color: #0f766e;
          background: #edf8f7;
        }

        .pace-badge.watch {
          color: #927536;
          background: #fff8e7;
        }

        .pace-badge.behind {
          color: #b42318;
          background: #fff0ef;
        }

        /* ==========================================
           RANGE
        ========================================== */

        .plan-range-grid {
          display: grid;

          grid-template-columns:
            minmax(105px,1fr)
            minmax(65px,.55fr)
            minmax(105px,1fr)
            minmax(65px,.55fr);

          gap: 5px;

          padding: 8px;
        }

        .plan-field {
          min-width: 0;
        }

        .plan-field label {
          display: block;

          margin-bottom: 4px;

          color: #738077;

          font-size: 5.8px;
          font-weight: 800;
        }

        .plan-field input,
        .plan-field select {
          width: 100%;
          height: 34px;

          border:
            1px solid #dce4df;

          border-radius: 8px;

          outline: none;

          color: #3b4a41;
          background: #fff;

          font-size: 7px;
        }

        .plan-field input {
          padding: 0 7px;
        }

        .plan-select-wrap {
          position: relative;
        }

        .plan-select-wrap select {
          appearance: none;

          padding:
            0 7px 0 23px;
        }

        .plan-select-wrap > svg {
          position: absolute;

          left: 6px;
          top: 50%;

          transform:
            translateY(-50%);

          color: #89938c;

          pointer-events: none;
        }

        .plan-field
        input:disabled,
        .plan-field
        select:disabled {
          color: #87928b;
          background: #f1f4f2;

          cursor: not-allowed;
        }

        /* ==========================================
           TARGET
        ========================================== */

        .plan-target-row {
          display: grid;

          grid-template-columns:
            1fr .7fr;

          gap: 6px;

          padding:
            0 8px 8px;
        }

        .plan-target-row label {
          display: block;

          margin-bottom: 4px;

          color: #6c7971;

          font-size: 6px;
          font-weight: 850;
        }

        .target-input {
          position: relative;
        }

        .target-input input {
          width: 100%;
          height: 35px;

          padding:
            0 7px 0 37px;

          border:
            1px solid #dce4df;

          border-radius: 9px;

          outline: none;

          color: #33443a;
          background: #fff;

          font-size: 8px;
        }

        .target-input span {
          position: absolute;

          left: 8px;
          top: 50%;

          transform:
            translateY(-50%);

          color: #89938c;

          font-size: 6px;
        }

        .target-summary {
          padding: 7px 8px;

          border:
            1px solid #e2e9e5;

          border-radius: 9px;

          background: #fff;
        }

        .target-summary span {
          display: block;

          color: #89938c;

          font-size: 6px;
        }

        .target-summary strong {
          display: block;

          margin-top: 2px;

          color: #0f5132;

          font-size: 13px;
          font-weight: 950;
        }

        .target-summary small {
          color: #89938c;

          font-size: 7px;
        }

        /* ==========================================
           PROGRESS
        ========================================== */

        .plan-progress {
          padding: 8px 9px;

          border-top:
            1px solid #e8edea;

          background: #fff;
        }

        .progress-heading {
          display: flex;
          align-items: center;
          justify-content: space-between;

          gap: 8px;

          margin-bottom: 6px;
        }

        .progress-heading
        > div {
          display: flex;
          align-items: center;

          gap: 4px;
        }

        .progress-heading span {
          color: #87928b;

          font-size: 5.8px;
        }

        .progress-heading strong {
          color: #425047;

          font-size: 7px;
        }

        .progress-track {
          height: 6px;

          overflow: hidden;

          border-radius: 999px;

          background: #e8edea;
        }

        .progress-fill {
          height: 100%;

          border-radius: 999px;

          transition:
            width .3s ease;
        }

        .progress-fill.completed,
        .progress-fill.ahead,
        .progress-fill.on-track {
          background:
            linear-gradient(
              90deg,
              #0f5132,
              #16a36d
            );
        }

        .progress-fill.near {
          background:
            linear-gradient(
              90deg,
              #0f766e,
              #2fa99d
            );
        }

        .progress-fill.watch {
          background:
            linear-gradient(
              90deg,
              #b18a31,
              #d5ad52
            );
        }

        .progress-fill.behind {
          background:
            linear-gradient(
              90deg,
              #b42318,
              #dc665d
            );
        }

        .progress-fill.no-plan {
          width: 0 !important;
        }

        .progress-foot {
          display: flex;
          align-items: center;
          justify-content: space-between;

          gap: 6px;

          margin-top: 5px;

          color: #98a19b;

          font-size: 5.5px;
        }

        /* ==========================================
           BOTTOM
        ========================================== */

        .plan-card-bottom {
          display: grid;

          grid-template-columns:
            .8fr 1.2fr;

          gap: 7px;

          margin-top: 8px;
        }

        .bottom-field label {
          display: flex;
          align-items: center;

          gap: 4px;

          margin-bottom: 4px;

          color: #6c7971;

          font-size: 6px;
          font-weight: 850;
        }

        .bottom-field input,
        .bottom-field textarea {
          width: 100%;

          border:
            1px solid #dce4df;

          border-radius: 9px;

          outline: none;

          color: #3d4c43;
          background: #fbfdfc;

          font-size: 7px;
        }

        .bottom-field input {
          height: 35px;

          padding: 0 8px;
        }

        .bottom-field textarea {
          min-height: 52px;

          padding: 7px;

          resize: vertical;

          line-height: 1.55;
        }

        .bottom-field
        input:disabled,
        .bottom-field
        textarea:disabled {
          background: #f1f4f2;
          cursor: not-allowed;
        }

        .plan-lock-note {
          display: flex;
          align-items: flex-start;

          gap: 5px;

          margin-top: 8px;
          padding: 7px 8px;

          border-radius: 9px;

          color: #65736a;
          background: #f2f5f3;

          font-size: 6px;
          line-height: 1.5;
        }

        /* ==========================================
           TEMPLATE MODAL
        ========================================== */

        .template-overlay {
          position: fixed;
          inset: 0;

          z-index: 7000;

          display: flex;
          align-items: center;
          justify-content: center;

          padding: 16px;

          background:
            rgba(15,23,42,.58);

          backdrop-filter:
            blur(5px);
        }

        .template-modal {
          width:
            min(850px,100%);

          max-height:
            calc(100dvh - 32px);

          overflow-y: auto;

          border-radius: 22px;

          background: #f8faf9;

          box-shadow:
            0 30px 90px
            rgba(15,23,42,.28);
        }

        .template-header {
          position: sticky;
          top: 0;

          z-index: 10;

          display: flex;
          align-items: flex-start;
          justify-content: space-between;

          gap: 10px;

          padding: 15px 17px;

          border-bottom:
            1px solid #e7ede9;

          background:
            rgba(255,255,255,.97);

          backdrop-filter:
            blur(12px);
        }

        .template-header
        > div > span {
          color: #927536;

          font-size: 7px;
          font-weight: 900;
        }

        .template-header h2 {
          margin:
            2px 0 0;

          color: #173d2b;

          font-size: 15px;
        }

        .template-header p {
          margin:
            3px 0 0;

          color: #919a94;

          font-size: 7px;
        }

        .template-header
        > button {
          width: 35px;
          height: 35px;

          border: none;
          border-radius: 9px;

          display: flex;
          align-items: center;
          justify-content: center;

          color: #64748b;
          background: #f1f5f3;

          cursor: pointer;
        }

        .template-body {
          padding: 12px;
        }

        .template-section {
          padding: 12px;
          margin-bottom: 9px;

          border:
            1px solid #e4eae6;

          border-radius: 14px;

          background: #fff;
        }

        .template-section-title {
          display: flex;
          align-items: center;

          gap: 5px;

          margin-bottom: 10px;

          color: #0f5132;
        }

        .template-section-title
        strong {
          color: #34443a;

          font-size: 9px;
        }

        .template-range {
          display: grid;

          grid-template-columns:
            1fr .55fr 1fr .55fr;

          gap: 6px;
        }

        .template-target {
          margin-top: 9px;
        }

        .template-target label,
        .template-notes label {
          display: block;

          margin-bottom: 4px;

          color: #657169;

          font-size: 6px;
          font-weight: 850;
        }

        .template-target > div {
          position: relative;
        }

        .template-target input {
          width: 100%;
          height: 36px;

          padding:
            0 8px 0 38px;

          border:
            1px solid #dce4df;

          border-radius: 9px;

          outline: none;

          font-size: 8px;
        }

        .template-target
        > div > span {
          position: absolute;

          left: 8px;
          top: 50%;

          transform:
            translateY(-50%);

          color: #8b958e;

          font-size: 6px;
        }

        .template-notes {
          padding: 12px;

          border:
            1px solid #e4eae6;

          border-radius: 14px;

          background: #fff;
        }

        .template-notes textarea {
          width: 100%;
          min-height: 70px;

          padding: 8px;

          border:
            1px solid #dce4df;

          border-radius: 9px;

          outline: none;

          resize: vertical;

          font-size: 7px;
        }

        .template-footer {
          position: sticky;
          bottom: 0;

          display: flex;
          justify-content: flex-end;

          gap: 6px;

          padding: 11px 13px;

          border-top:
            1px solid #e7ede9;

          background:
            rgba(255,255,255,.97);
        }

        .template-footer button {
          min-height: 38px;

          padding: 0 13px;

          border-radius: 9px;

          font-size: 7px;
          font-weight: 900;

          cursor: pointer;
        }

        .template-footer
        .cancel {
          border:
            1px solid #dce3df;

          color: #647168;
          background: #fff;
        }

        .template-footer
        .apply {
          border: none;

          display: inline-flex;
          align-items: center;

          gap: 5px;

          color: #fff;

          background:
            linear-gradient(
              135deg,
              #0f5132,
              #0f766e
            );
        }

        /* ==========================================
           EMPTY / LOADING
        ========================================== */

        .plan-empty {
          padding: 50px 20px;

          border:
            1px dashed #cbd7d0;

          border-radius: 18px;

          text-align: center;

          background: #fff;
        }

        .plan-empty-icon,
        .plan-loading-icon {
          width: 55px;
          height: 55px;

          margin:
            0 auto 10px;

          border-radius: 16px;

          display: flex;
          align-items: center;
          justify-content: center;

          color: #0f5132;
          background: #edf7f1;
        }

        .plan-empty h3,
        .plan-page-loading h3 {
          margin: 0;

          color: #35453b;

          font-size: 13px;
        }

        .plan-empty p,
        .plan-page-loading p {
          margin: 4px 0 0;

          color: #8d9790;

          font-size: 8px;
        }

        .plan-inline-loading {
          min-height: 190px;

          display: flex;
          align-items: center;
          justify-content: center;
          flex-direction: column;

          gap: 7px;

          color: #718077;

          text-align: center;
        }

        .plan-inline-loading
        strong {
          font-size: 9px;
        }

        .plan-inline-loading
        span {
          color: #979f9a;

          font-size: 7px;
        }

        .plan-page-loading {
          min-height: 60vh;

          display: flex;
          align-items: center;
          justify-content: center;
          flex-direction: column;

          text-align: center;
        }

        /* ==========================================
           ANIMATION
        ========================================== */

        @keyframes planSpin {
          to {
            transform:
              rotate(360deg);
          }
        }

        .spin {
          animation:
            planSpin
            .8s linear infinite;
        }

        /* ==========================================
           TABLET
        ========================================== */

        @media (
          max-width: 1150px
        ) {
          .plan-stats {
            grid-template-columns:
              repeat(
                3,
                minmax(0,1fr)
              );
          }

          .plan-scope-grid {
            grid-template-columns:
              1fr 1fr;
          }

          .halaqa-card {
            grid-column:
              1 / -1;
          }

          .plan-sections {
            grid-template-columns:
              1fr;
          }
        }

        /* ==========================================
           MOBILE
        ========================================== */

        @media (
          max-width: 720px
        ) {
          .plan-hero {
            align-items:
              flex-start;

            padding: 16px;

            border-radius: 19px;
          }

          .plan-hero-icon {
            width: 42px;
            height: 42px;

            flex-basis: 42px;
          }

          .plan-hero h1 {
            font-size: 20px;
          }

          .plan-hero p {
            display: none;
          }

          .plan-hero-actions {
            gap: 4px;
          }

          .hero-btn {
            width: 38px;
            min-height: 38px;

            padding: 0;
          }

          .hero-btn span {
            display: none;
          }

          /* Period */

          .plan-period-card {
            grid-template-columns:
              37px
              minmax(0,1fr)
              37px;

            gap: 6px;
          }

          .period-current {
            grid-column:
              1 / -1;

            text-align: center;
          }

          .plan-period-icon {
            display: none;
          }

          .plan-period-selects {
            flex-wrap: wrap;
          }

          .select-shell {
            flex: 1;
          }

          .select-shell select,
          .select-shell.year
          select {
            width: 100%;
            min-width: 0;
          }

          /* Scope */

          .plan-scope-grid {
            grid-template-columns:
              1fr;
          }

          .halaqa-card {
            grid-column: auto;
          }

          /* Stats */

          .plan-stats {
            grid-template-columns:
              repeat(
                2,
                minmax(0,1fr)
              );

            gap: 7px;
          }

          .plan-stat {
            padding: 10px;
          }

          /* Student */

          .student-plan-card:hover {
            transform: none;
          }

          .student-plan-header {
            flex-direction:
              column;
          }

          .student-plan-badges {
            justify-content:
              flex-start;
          }

          .plan-range-grid {
            grid-template-columns:
              1fr 1fr;
          }

          .plan-target-row {
            grid-template-columns:
              1fr;
          }

          .plan-card-bottom {
            grid-template-columns:
              1fr;
          }

          /* Template */

          .template-overlay {
            align-items:
              flex-end;

            padding: 7px;
          }

          .template-modal {
            max-height: 95dvh;

            border-radius:
              21px 21px
              9px 9px;
          }

          .template-range {
            grid-template-columns:
              1fr 1fr;
          }
        }

        @media (
          max-width: 430px
        ) {
          .plan-hero {
            padding: 13px;
          }

          .plan-hero h1 {
            font-size: 18px;
          }

          .plan-hero-icon {
            width: 38px;
            height: 38px;

            flex-basis: 38px;
          }

          .plan-eyebrow {
            font-size: 7px;
          }

          .plan-stats {
            grid-template-columns:
              1fr 1fr;
          }

          .plan-stat-content
          > strong {
            font-size: 14px;
          }

          .plan-range-grid {
            grid-template-columns:
              1fr 1fr;
          }

          .progress-foot {
            align-items:
              flex-start;

            flex-direction:
              column;
          }
        }
      `}
    </style>
  );
}
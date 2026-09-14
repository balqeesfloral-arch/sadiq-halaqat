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
   SMART DAILY PLAN HELPERS
========================================================= */

const RECITATION_DAY_META = [
  { value: "sunday", label: "الأحد", jsDay: 0 },
  { value: "monday", label: "الإثنين", jsDay: 1 },
  { value: "tuesday", label: "الثلاثاء", jsDay: 2 },
  { value: "wednesday", label: "الأربعاء", jsDay: 3 },
  { value: "thursday", label: "الخميس", jsDay: 4 },
  { value: "friday", label: "الجمعة", jsDay: 5 },
  { value: "saturday", label: "السبت", jsDay: 6 },
];

function normalizeRecitationDays(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((day) =>
    RECITATION_DAY_META.some((item) => item.value === day)
  );
}

function countScheduledSessions(period, recitationDays) {
  const days = normalizeRecitationDays(recitationDays);

  if (!period || days.length === 0) {
    return 0;
  }

  const allowed = new Set(
    RECITATION_DAY_META
      .filter((item) => days.includes(item.value))
      .map((item) => item.jsDay)
  );

  const cursor = parseLocalDate(period.start);
  const end = parseLocalDate(period.end);
  let count = 0;

  while (cursor <= end) {
    if (allowed.has(cursor.getDay())) {
      count += 1;
    }

    cursor.setDate(cursor.getDate() + 1);
  }

  return count;
}

function getScheduledElapsedPercent(period, recitationDays, plannedSessions) {
  if (!period) {
    return 0;
  }

  const total = Number(plannedSessions || 0) ||
    countScheduledSessions(period, recitationDays);

  if (total <= 0) {
    return getElapsedPercent(period);
  }

  const todayText = getLocalDate();

  if (todayText < period.start) {
    return 0;
  }

  if (todayText > period.end) {
    return 100;
  }

  const elapsed = countScheduledSessions(
    { start: period.start, end: todayText },
    recitationDays
  );

  return Math.min(
    100,
    Math.max(0, Math.round((elapsed / total) * 100))
  );
}

function acceptedEvaluation(value) {
  const text = String(value || "").trim();

  // السجلات القديمة التي لا تحتوي تقييمًا تبقى محسوبة كما كانت.
  return !text || text !== "إعادة";
}

function recitationLessonFaces(record) {
  if (!acceptedEvaluation(record?.lesson_evaluation)) {
    return 0;
  }

  const amount = Number(record?.lesson_amount_value || 0);
  const unit = record?.lesson_amount_unit;

  if (amount > 0 && (unit === "lines" || unit === "faces")) {
    return unit === "lines" ? amount / 15 : amount;
  }

  return Number(
    record?.lesson_faces_manual ??
      record?.lesson_faces ??
      0
  );
}

function recitationReviewFaces(record) {
  if (!acceptedEvaluation(record?.review_evaluation)) {
    return 0;
  }

  return Number(record?.review_faces || 0);
}

function nooraniaAcceptedFaces(record, kind) {
  const evaluation =
    kind === "lesson"
      ? record?.lesson_evaluation
      : record?.revision_evaluation;

  if (!acceptedEvaluation(evaluation)) {
    return 0;
  }

  return Number(
    kind === "lesson"
      ? record?.lesson_faces || 0
      : record?.revision_faces || 0
  );
}

function amountToFaces(amount, unit) {
  const number = Number(amount || 0);

  if (!Number.isFinite(number) || number <= 0) {
    return 0;
  }

  if (unit === "lines") {
    return roundFaces(number / 15);
  }

  return roundFaces(number);
}

function monthlyTargetFaces(amount, unit, sessions) {
  const number = Number(amount || 0);
  const count = Number(sessions || 0);

  if (!Number.isFinite(number) || number <= 0 || count <= 0) {
    return 0;
  }

  if (unit === "lines") {
    return roundFaces((number * count) / 15);
  }

  return roundFaces(number * count);
}

function inferDailyPlan(targetFaces, sessions) {
  const total = Number(targetFaces || 0);
  const count = Number(sessions || 0);

  if (total <= 0 || count <= 0) {
    return {
      amount: "",
      unit: "lines",
    };
  }

  const dailyFaces = total / count;
  const dailyLines = dailyFaces * 15;
  const roundedLines = Math.round(dailyLines);

  if (
    dailyFaces < 1 &&
    Math.abs(dailyLines - roundedLines) < 0.02
  ) {
    return {
      amount: roundedLines,
      unit: "lines",
    };
  }

  return {
    amount: roundFaces(dailyFaces),
    unit: "faces",
  };
}

function formatPagesAndLines(faces) {
  const safeFaces = Math.max(0, Number(faces || 0));
  const wholePages = Math.floor(safeFaces + 1e-9);
  const lines = Math.round((safeFaces - wholePages) * 15);

  let pages = wholePages;
  let remainingLines = lines;

  if (remainingLines >= 15) {
    pages += 1;
    remainingLines = 0;
  }

  const pageText =
    pages === 0
      ? ""
      : pages === 1
        ? "صفحة واحدة"
        : pages === 2
          ? "صفحتان"
          : `${pages} صفحات`;

  const lineText =
    remainingLines === 0
      ? ""
      : remainingLines === 1
        ? "سطر واحد"
        : remainingLines === 2
          ? "سطران"
          : `${remainingLines} أسطر`;

  if (pageText && lineText) {
    return `${pageText} + ${lineText}`;
  }

  return pageText || lineText || "0";
}

function formatDailyAmount(amount, unit) {
  const number = Number(amount || 0);

  if (!number) {
    return "غير محدد";
  }

  if (unit === "lines") {
    return `${formatFaces(number / 15)} وجه • ${number} سطر`;
  }

  return `${formatFaces(number)} وجه`;
}

function isQuranGoal(goal) {
  if (!goal || goal === "other") {
    return true;
  }

  return ["quran", "noorania_quran", "memorization", "revision", "memorization_revision", "tajweed"].includes(goal);
}

function isNooraniaGoal(goal) {
  return ["noorania", "noorania_quran", "foundation"].includes(goal);
}

function nooraniaMonthlyTarget(amount, unit, sessions) {
  const number = Number(amount || 0);
  const count = Number(sessions || 0);

  if (!Number.isFinite(number) || number <= 0 || count <= 0) {
    return 0;
  }

  return Math.round((number * count + Number.EPSILON) * 100) / 100;
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
  expectedPercent = null,
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
    Number.isFinite(Number(expectedPercent))
      ? Number(expectedPercent)
      : getElapsedPercent(period);

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
    memorization_daily_amount:
      "",

    memorization_daily_unit:
      "lines",

    revision_daily_amount:
      "",

    revision_daily_unit:
      "faces",

    recitation_days_snapshot:
      [],

    planned_sessions:
      0,

    noorania_lesson_daily_amount:
      "",

    noorania_lesson_daily_unit:
      "lesson",

    noorania_revision_daily_amount:
      "",

    noorania_revision_daily_unit:
      "faces",

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
            learning_goal,
            recitation_days
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
            lesson_faces_manual,
            lesson_amount_value,
            lesson_amount_unit,
            lesson_evaluation,
            review_faces,
            review_evaluation
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

      const {
        data:
          nooraniaRecitations,
        error:
          nooraniaRecitationsError,
      } =
        await supabase
          .from(
            "noorania_recitations"
          )
          .select(`
            id,
            student_id,
            recitation_date,
            lesson_faces,
            lesson_evaluation,
            revision_faces,
            revision_evaluation
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
        nooraniaRecitationsError
      ) {
        throw nooraniaRecitationsError;
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
            recitationLessonFaces(record);

          old.revision +=
            recitationReviewFaces(record);

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

      const nooraniaRecitationMap =
        new Map();

      (
        nooraniaRecitations || []
      ).forEach(
        (record) => {
          const id =
            Number(
              record.student_id
            );

          const old =
            nooraniaRecitationMap.get(
              id
            ) || {
              lessonFaces: 0,
              revisionFaces: 0,
              sessions: 0,
              lastDate: null,
            };

          old.lessonFaces +=
            Number(
              record.lesson_faces || 0
            );

          old.revisionFaces +=
            Number(
              record.revision_faces || 0
            );

          old.sessions += 1;

          if (
            !old.lastDate ||
            record.recitation_date > old.lastDate
          ) {
            old.lastDate = record.recitation_date;
          }

          nooraniaRecitationMap.set(
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

              const profileDays =
                normalizeRecitationDays(
                  profile.recitation_days
                );

              const storedDays =
                normalizeRecitationDays(
                  plan?.recitation_days_snapshot
                );

              const planDays =
                storedDays.length
                  ? storedDays
                  : profileDays;

              const calculatedSessions =
                countScheduledSessions(
                  period,
                  planDays
                );

              const plannedSessions =
                Number(
                  plan?.planned_sessions || 0
                ) > 0
                  ? Number(
                      plan.planned_sessions
                    )
                  : calculatedSessions;

              const inferredMem =
                inferDailyPlan(
                  plan?.memorization_target_faces,
                  plannedSessions
                );

              const inferredRev =
                inferDailyPlan(
                  plan?.revision_target_faces,
                  plannedSessions
                );

              const memDailyAmount =
                plan?.memorization_daily_amount ??
                inferredMem.amount;

              const memDailyUnit =
                plan?.memorization_daily_unit ||
                inferredMem.unit ||
                "lines";

              const revDailyAmount =
                plan?.revision_daily_amount ??
                inferredRev.amount;

              const revDailyUnit =
                plan?.revision_daily_unit ||
                inferredRev.unit ||
                "faces";

              const calculatedMemTarget =
                monthlyTargetFaces(
                  memDailyAmount,
                  memDailyUnit,
                  plannedSessions
                );

              const calculatedRevTarget =
                monthlyTargetFaces(
                  revDailyAmount,
                  revDailyUnit,
                  plannedSessions
                );

              const nooraniaLive =
                nooraniaRecitationMap.get(
                  studentId
                ) || {
                  lessonFaces: 0,
                  revisionFaces: 0,
                  sessions: 0,
                  lastDate: null,
                };

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

                recitation_days:
                  profileDays,

                recitation_days_snapshot:
                  planDays,

                planned_sessions:
                  plannedSessions,

                memorization_daily_amount:
                  memDailyAmount,

                memorization_daily_unit:
                  memDailyUnit,

                revision_daily_amount:
                  revDailyAmount,

                revision_daily_unit:
                  revDailyUnit,

                noorania_lesson_daily_amount:
                  plan?.noorania_lesson_daily_amount ??
                  "",

                noorania_lesson_daily_unit:
                  plan?.noorania_lesson_daily_unit ||
                  "lesson",

                noorania_revision_daily_amount:
                  plan?.noorania_revision_daily_amount ??
                  "",

                noorania_revision_daily_unit:
                  plan?.noorania_revision_daily_unit ||
                  "faces",

                achieved_noorania_lesson_faces:
                  roundFaces(
                    nooraniaLive.lessonFaces
                  ),

                achieved_noorania_revision_faces:
                  roundFaces(
                    nooraniaLive.revisionFaces
                  ),

                noorania_recitation_sessions:
                  nooraniaLive.sessions,

                noorania_last_recitation_date:
                  nooraniaLive.lastDate,

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
                    memDailyAmount !== "" &&
                    Number(plannedSessions) > 0
                      ? calculatedMemTarget
                      : plan?.memorization_target_faces ||
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
                    revDailyAmount !== "" &&
                    Number(plannedSessions) > 0
                      ? calculatedRevTarget
                      : plan?.revision_target_faces ||
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

            const next = {
              ...row,
              [field]: value,
            };

            if (
              [
                "memorization_daily_amount",
                "memorization_daily_unit",
              ].includes(field)
            ) {
              next.memorization_target_faces =
                monthlyTargetFaces(
                  next.memorization_daily_amount,
                  next.memorization_daily_unit,
                  next.planned_sessions
                );
            }

            if (
              [
                "revision_daily_amount",
                "revision_daily_unit",
              ].includes(field)
            ) {
              next.revision_target_faces =
                monthlyTargetFaces(
                  next.revision_daily_amount,
                  next.revision_daily_unit,
                  next.planned_sessions
                );
            }

            return {
              ...next,

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
        row.memorization_target_faces || 0
      ) > 0 ||
      Number(
        row.revision_target_faces || 0
      ) > 0 ||
      Number(
        row.noorania_lesson_daily_amount || 0
      ) > 0 ||
      Number(
        row.noorania_revision_daily_amount || 0
      ) > 0 ||
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
    for (const row of rows) {
      const numericFields = [
        row.memorization_daily_amount,
        row.revision_daily_amount,
        row.noorania_lesson_daily_amount,
        row.noorania_revision_daily_amount,
        row.memorization_target_faces,
        row.revision_target_faces,
      ];

      if (
        numericFields.some(
          (value) =>
            value !== "" &&
            value !== null &&
            value !== undefined &&
            Number(value) < 0
        )
      ) {
        showToast(
          `لا يمكن إدخال مقدار سالب للطالب ${row.student_name}`,
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
    if (!validateNumbers()) {
      return false;
    }

    for (const row of rows) {
      const quranRequired = isQuranGoal(row.learning_goal);
      const nooraniaRequired = isNooraniaGoal(row.learning_goal);

      const hasQuranPlan =
        Number(row.memorization_target_faces || 0) > 0 ||
        Number(row.revision_target_faces || 0) > 0;

      const hasNooraniaPlan =
        Number(row.noorania_lesson_daily_amount || 0) > 0 ||
        Number(row.noorania_revision_daily_amount || 0) > 0;

      if (
        quranRequired &&
        !nooraniaRequired &&
        !hasQuranPlan
      ) {
        showToast(
          `حدد خطة القرآن للطالب ${row.student_name}`,
          "error"
        );
        return false;
      }

      if (
        nooraniaRequired &&
        !quranRequired &&
        !hasNooraniaPlan
      ) {
        showToast(
          `حدد خطة القاعدة للطالب ${row.student_name}`,
          "error"
        );
        return false;
      }

      if (
        quranRequired &&
        nooraniaRequired &&
        !hasQuranPlan &&
        !hasNooraniaPlan
      ) {
        showToast(
          `حدد خطة القرآن أو القاعدة للطالب ${row.student_name}`,
          "error"
        );
        return false;
      }

      const usesDailyPlan =
        Number(row.memorization_daily_amount || 0) > 0 ||
        Number(row.revision_daily_amount || 0) > 0 ||
        hasNooraniaPlan;

      if (
        usesDailyPlan &&
        Number(row.planned_sessions || 0) <= 0
      ) {
        showToast(
          `لا توجد أيام تسميع محددة للطالب ${row.student_name}. عدّل أيام التسميع من ملف الطالب أولًا.`,
          "error"
        );
        return false;
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

      memorization_daily_amount:
        numberOrNull(
          row.memorization_daily_amount
        ),

      memorization_daily_unit:
        textOrNull(
          row.memorization_daily_unit
        ),

      revision_daily_amount:
        numberOrNull(
          row.revision_daily_amount
        ),

      revision_daily_unit:
        textOrNull(
          row.revision_daily_unit
        ),

      recitation_days_snapshot:
        normalizeRecitationDays(
          row.recitation_days_snapshot?.length
            ? row.recitation_days_snapshot
            : row.recitation_days
        ),

      planned_sessions:
        Number(
          row.planned_sessions || 0
        ),

      noorania_lesson_daily_amount:
        numberOrNull(
          row.noorania_lesson_daily_amount
        ),

      noorania_lesson_daily_unit:
        textOrNull(
          row.noorania_lesson_daily_unit
        ),

      noorania_revision_daily_amount:
        numberOrNull(
          row.noorania_revision_daily_amount
        ),

      noorania_revision_daily_unit:
        textOrNull(
          row.noorania_revision_daily_unit
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

              const oldSessions =
                Number(old.planned_sessions || 0);

              const oldMemDaily =
                old.memorization_daily_amount ??
                inferDailyPlan(
                  old.memorization_target_faces,
                  oldSessions
                ).amount;

              const oldMemUnit =
                old.memorization_daily_unit ||
                inferDailyPlan(
                  old.memorization_target_faces,
                  oldSessions
                ).unit ||
                "lines";

              const oldRevDaily =
                old.revision_daily_amount ??
                inferDailyPlan(
                  old.revision_target_faces,
                  oldSessions
                ).amount;

              const oldRevUnit =
                old.revision_daily_unit ||
                inferDailyPlan(
                  old.revision_target_faces,
                  oldSessions
                ).unit ||
                "faces";

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

                memorization_daily_amount:
                  oldMemDaily,

                memorization_daily_unit:
                  oldMemUnit,

                memorization_target_faces:
                  monthlyTargetFaces(
                    oldMemDaily,
                    oldMemUnit,
                    row.planned_sessions
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

                revision_daily_amount:
                  oldRevDaily,

                revision_daily_unit:
                  oldRevUnit,

                revision_target_faces:
                  monthlyTargetFaces(
                    oldRevDaily,
                    oldRevUnit,
                    row.planned_sessions
                  ),

                noorania_lesson_daily_amount:
                  old.noorania_lesson_daily_amount ?? "",

                noorania_lesson_daily_unit:
                  old.noorania_lesson_daily_unit || "lesson",

                noorania_revision_daily_amount:
                  old.noorania_revision_daily_amount ?? "",

                noorania_revision_daily_unit:
                  old.noorania_revision_daily_unit || "faces",

                recitation_days_snapshot:
                  row.recitation_days,

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
    const hasQuran =
      Number(template.memorization_daily_amount || 0) > 0 ||
      Number(template.revision_daily_amount || 0) > 0;

    const hasNoorania =
      Number(template.noorania_lesson_daily_amount || 0) > 0 ||
      Number(template.noorania_revision_daily_amount || 0) > 0;

    if (!hasQuran && !hasNoorania) {
      showToast(
        "حدد مقدارًا يوميًا واحدًا على الأقل",
        "error"
      );
      return;
    }

    const confirmed = window.confirm(
      "سيتم تطبيق المقادير اليومية على جميع الطلاب القابلين للتعديل، مع حساب الهدف الشهري لكل طالب حسب أيام تسميعه الفعلية."
    );

    if (!confirmed) {
      return;
    }

    setRows((current) =>
      current.map((row) => {
        if (isLockedPlan(row)) {
          return row;
        }

        const quranStudent = isQuranGoal(row.learning_goal);
        const nooraniaStudent = isNooraniaGoal(row.learning_goal);

        const next = {
          ...row,
          memorization_daily_amount:
            quranStudent ? template.memorization_daily_amount : "",
          memorization_daily_unit:
            quranStudent ? template.memorization_daily_unit : "lines",
          revision_daily_amount:
            quranStudent ? template.revision_daily_amount : "",
          revision_daily_unit:
            quranStudent ? template.revision_daily_unit : "faces",
          noorania_lesson_daily_amount:
            nooraniaStudent ? template.noorania_lesson_daily_amount : "",
          noorania_lesson_daily_unit:
            nooraniaStudent ? template.noorania_lesson_daily_unit : "lesson",
          noorania_revision_daily_amount:
            nooraniaStudent ? template.noorania_revision_daily_amount : "",
          noorania_revision_daily_unit:
            nooraniaStudent ? template.noorania_revision_daily_unit : "faces",
          recitation_days_snapshot:
            row.recitation_days,
          notes:
            template.notes || row.notes,
          customization_reason: "",
          plan_source: "halaqa_template",
          status: "draft",
          dirty: true,
        };

        next.memorization_target_faces = monthlyTargetFaces(
          next.memorization_daily_amount,
          next.memorization_daily_unit,
          row.planned_sessions
        );

        next.revision_target_faces = monthlyTargetFaces(
          next.revision_daily_amount,
          next.revision_daily_unit,
          row.planned_sessions
        );

        return next;
      })
    );

    setTemplateOpen(false);
    showToast(
      "تم تطبيق الخطة الذكية على طلاب الحلقة",
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
            Number(row.memorization_target_faces || 0) > 0 ||
            Number(row.revision_target_faces || 0) > 0 ||
            Number(row.noorania_lesson_daily_amount || 0) > 0 ||
            Number(row.noorania_revision_daily_amount || 0) > 0
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
              حدّد المقدار اليومي لكل طالب، وسيعرض الصديق الهدف الشهري النهائي تلقائيًا.
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
  const [detailsOpen, setDetailsOpen] = useState(false);

  const locked = isLockedPlan(row);
  const status = getStatusInfo(row.status);
  const source = getSourceInfo(row.plan_source);

  const scheduledExpected = getScheduledElapsedPercent(
    period,
    row.recitation_days_snapshot,
    row.planned_sessions
  );

  const mem = getPaceInfo({
    achieved: row.achieved_memorization_faces,
    target: row.memorization_target_faces,
    period,
    expectedPercent: scheduledExpected,
  });

  const revision = getPaceInfo({
    achieved: row.achieved_revision_faces,
    target: row.revision_target_faces,
    period,
    expectedPercent: scheduledExpected,
  });

  function dailyLabel(amount, unit) {
    const value = Number(amount || 0);
    if (!value) return "لم تحدد";
    return `${formatFaces(value)} ${unit === "lines" ? "سطر" : "صفحة"}`;
  }

  function nooraniaLabel(amount, unit) {
    const value = Number(amount || 0);
    if (!value) return "لم تحدد";
    const label = unit === "lesson" ? "درس" : unit === "lines" ? "سطر" : "صفحة";
    return `${formatFaces(value)} ${label}`;
  }

  return (
    <>
      <article className={`plan-summary-card ${locked ? "locked" : ""}`}>
        <div className="plan-summary-accent" />

        <div className="plan-summary-header">
          <div className="student-plan-identity compact">
            <div className="student-plan-avatar compact-avatar">
              <UserRound size={18} />
            </div>

            <div className="plan-summary-name">
              <h3>{row.student_name}</h3>
              <span>{row.user_number ? `رقم الطالب: ${row.user_number}` : "طالب الحلقة"}</span>
            </div>
          </div>

          <div className="student-plan-badges compact-badges">
            <span className={`plan-source-badge ${source.className}`}>{source.label}</span>
            <span className={`plan-status-badge ${status.className}`}>{status.label}</span>
          </div>
        </div>

        <div className="plan-summary-days">
          <CalendarDays size={15} />
          <span>أيام التسميع</span>
          <strong>
            {row.recitation_days_snapshot?.length
              ? row.recitation_days_snapshot
                  .map((day) => RECITATION_DAY_META.find((item) => item.value === day)?.label || day)
                  .join(" • ")
              : "غير محددة"}
          </strong>
        </div>

        <div className="plan-summary-grid">
          {isQuranGoal(row.learning_goal) && (
            <>
              <SummaryItem
                label="الحفظ اليومي"
                value={dailyLabel(row.memorization_daily_amount, row.memorization_daily_unit)}
                sub={`الهدف: ${formatPagesAndLines(row.memorization_target_faces)}`}
              />
              <SummaryItem
                label="المراجعة اليومية"
                value={dailyLabel(row.revision_daily_amount, row.revision_daily_unit)}
                sub={`الهدف: ${formatPagesAndLines(row.revision_target_faces)}`}
              />
            </>
          )}

          {isNooraniaGoal(row.learning_goal) && (
            <>
              <SummaryItem
                label="درس القاعدة"
                value={nooraniaLabel(row.noorania_lesson_daily_amount, row.noorania_lesson_daily_unit)}
                sub="خطة القاعدة النورانية"
              />
              <SummaryItem
                label="مراجعة القاعدة"
                value={nooraniaLabel(row.noorania_revision_daily_amount, row.noorania_revision_daily_unit)}
                sub="جنب الدرس مستقل"
              />
            </>
          )}
        </div>

        <div className="plan-summary-footer">
          <div className="plan-summary-state">
            {locked ? <ShieldCheck size={15} /> : <Sparkles size={15} />}
            <span>{locked ? "الخطة مقفلة حاليًا" : "اضغط عرض لإضافة أو تعديل تفاصيل الخطة"}</span>
          </div>

          <button type="button" className="plan-view-button" onClick={() => setDetailsOpen(true)}>
            <Search size={16} />
            عرض
          </button>
        </div>
      </article>

      {detailsOpen && (
        <div
          className="plan-details-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setDetailsOpen(false);
          }}
        >
          <section className="plan-details-modal" role="dialog" aria-modal="true">
            <header className="plan-details-header">
              <div className="student-plan-identity">
                <div className="student-plan-avatar">
                  <UserRound size={20} />
                </div>
                <div>
                  <span className="plan-details-eyebrow">الخطة الشهرية</span>
                  <h2>{row.student_name}</h2>
                  <p>{row.user_number || "طالب الحلقة"}</p>
                </div>
              </div>

              <button type="button" className="plan-details-close" onClick={() => setDetailsOpen(false)}>
                <X size={19} />
              </button>
            </header>

            <div className="plan-details-body">
              {row.status === "needs_revision" && row.supervisor_note && (
                <div className="supervisor-note modal-note">
                  <CircleAlert size={15} />
                  <div>
                    <strong>ملاحظة المشرف</strong>
                    <span>{row.supervisor_note}</span>
                  </div>
                </div>
              )}

              <div className="smart-plan-schedule modal-schedule">
                <div className="smart-plan-schedule-head">
                  <div>
                    <CalendarDays size={16} />
                    <strong>أيام التسميع</strong>
                  </div>
                </div>

                <div className="smart-day-chips">
                  {row.recitation_days_snapshot?.length ? (
                    row.recitation_days_snapshot.map((day) => (
                      <span key={day}>
                        {RECITATION_DAY_META.find((item) => item.value === day)?.label || day}
                      </span>
                    ))
                  ) : (
                    <span className="empty-days">لا توجد أيام تسميع محددة في ملف الطالب</span>
                  )}
                </div>
              </div>

              <div className="smart-programs modal-programs">
                {isQuranGoal(row.learning_goal) && (
                  <section className="smart-program-block quran-program">
                    <div className="smart-program-title">
                      <div>
                        <BookOpen size={18} />
                        <strong>خطة القرآن</strong>
                      </div>
                    </div>

                    <div className="plan-sections">
                      <PlanSection
                        type="memorization"
                        title="الحفظ اليومي"
                        icon={<BookOpen size={16} />}
                        locked={locked}
                        fromSurah={row.memorization_from_surah}
                        fromAyah={row.memorization_from_ayah}
                        toSurah={row.memorization_to_surah}
                        toAyah={row.memorization_to_ayah}
                        target={row.memorization_target_faces}
                        achieved={row.achieved_memorization_faces}
                        automatic={row.auto_memorization_faces}
                        manual={row.manual_memorization_faces}
                        pace={mem}
                        onChange={onChange}
                        fieldPrefix="memorization"
                        dailyAmount={row.memorization_daily_amount}
                        dailyUnit={row.memorization_daily_unit}
                        plannedSessions={row.planned_sessions}
                      />

                      <PlanSection
                        type="revision"
                        title="المراجعة اليومية"
                        icon={<RefreshCw size={16} />}
                        locked={locked}
                        fromSurah={row.revision_from_surah}
                        fromAyah={row.revision_from_ayah}
                        toSurah={row.revision_to_surah}
                        toAyah={row.revision_to_ayah}
                        target={row.revision_target_faces}
                        achieved={row.achieved_revision_faces}
                        automatic={row.auto_revision_faces}
                        manual={row.manual_revision_faces}
                        pace={revision}
                        onChange={onChange}
                        fieldPrefix="revision"
                        dailyAmount={row.revision_daily_amount}
                        dailyUnit={row.revision_daily_unit}
                        plannedSessions={row.planned_sessions}
                      />
                    </div>
                  </section>
                )}

                {isNooraniaGoal(row.learning_goal) && (
                  <NooraniaPlanSection row={row} locked={locked} onChange={onChange} />
                )}
              </div>

              <div className="plan-card-bottom modal-bottom-fields">
                <div className="bottom-field">
                  <label>سبب تخصيص الخطة</label>
                  <input
                    value={row.customization_reason}
                    disabled={locked}
                    onChange={(event) => onChange("customization_reason", event.target.value)}
                    placeholder="اختياري: طالب جديد، يحتاج تثبيت، متقدم..."
                  />
                </div>

                <div className="bottom-field">
                  <label>
                    <MessageSquareText size={14} />
                    ملاحظات الخطة
                  </label>
                  <textarea
                    rows={3}
                    value={row.notes}
                    disabled={locked}
                    onChange={(event) => onChange("notes", event.target.value)}
                    placeholder="ملاحظات تعليمية خاصة بخطة هذا الشهر..."
                  />
                </div>
              </div>

              {locked && (
                <div className="plan-lock-note modal-lock-note">
                  <ShieldCheck size={14} />
                  {row.status === "approved"
                    ? "هذه الخطة معتمدة من المشرف ومقفلة للتعديل."
                    : "هذه الخطة مرسلة للمشرف ومقفلة مؤقتًا حتى يتم اعتمادها أو إعادتها للتعديل."}
                </div>
              )}
            </div>

            <footer className="plan-details-footer">
              <button type="button" onClick={() => setDetailsOpen(false)}>إغلاق</button>
            </footer>
          </section>
        </div>
      )}
    </>
  );
}

function SummaryItem({ label, value, sub }) {
  return (
    <div className="plan-summary-item">
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{sub}</small>
    </div>
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
  dailyAmount,
  dailyUnit,
  plannedSessions,
}) {
  const targetNumber = Number(target || 0);
  const achievedNumber = Number(achieved || 0);

  const remaining = Math.max(
    0,
    roundFaces(targetNumber - achievedNumber)
  );

  const barWidth =
    targetNumber > 0
      ? Math.min(100, pace.percentage)
      : 0;

  return (
    <section className={`student-plan-section ${type} smart-plan-section`}>
      <div className="plan-section-title">
        <div>
          {icon}
          <strong>{title}</strong>
        </div>

        <span className={`pace-badge ${pace.className}`}>
          {pace.label}
        </span>
      </div>

      <div className="daily-plan-editor">
        <div className="daily-plan-input-block">
          <label>المقدار اليومي</label>

          <div className="daily-amount-control">
            <input
              type="number"
              min="0"
              step={dailyUnit === "lines" ? "1" : "0.25"}
              disabled={locked}
              value={dailyAmount ?? ""}
              onChange={(event) =>
                onChange(
                  `${fieldPrefix}_daily_amount`,
                  event.target.value === ""
                    ? ""
                    : Number(event.target.value)
                )
              }
              placeholder={dailyUnit === "lines" ? "مثال: 3" : "مثال: 0.5"}
            />

            <div className="daily-unit-toggle">
              <button
                type="button"
                disabled={locked}
                className={dailyUnit === "lines" ? "active" : ""}
                onClick={() => onChange(`${fieldPrefix}_daily_unit`, "lines")}
              >
                أسطر
              </button>

              <button
                type="button"
                disabled={locked}
                className={dailyUnit === "faces" ? "active" : ""}
                onClick={() => onChange(`${fieldPrefix}_daily_unit`, "faces")}
              >
                صفحات
              </button>
            </div>
          </div>


        </div>

        <div className="monthly-target-card clean-result">
          <span>الهدف الشهري</span>
          <strong>{formatPagesAndLines(targetNumber)}</strong>
        </div>
      </div>

      <div className="plan-progress smart-plan-progress">
        <div className="progress-heading">
          <div>
            <span>المنجز</span>
            <strong>
              {formatPagesAndLines(achievedNumber)}
            </strong>
          </div>

          <div>
            <span>المتبقي</span>
            <strong>{formatPagesAndLines(remaining)}</strong>
          </div>

          <div>
            <span>تحقيق الخطة</span>
            <strong>{pace.percentage}%</strong>
          </div>
        </div>

        <div className="progress-track">
          <div
            className={`progress-fill ${pace.className}`}
            style={{ width: `${barWidth}%` }}
          />
        </div>

        <div className="progress-foot">
          <span>المتوقع حسب جلسات التسميع الفعلية: {pace.expected}%</span>
          <span>
            {formatFaces(automatic)} تلقائي
            {Number(manual || 0) > 0
              ? ` + ${formatFaces(manual)} يدوي`
              : ""}
          </span>
        </div>
      </div>

      <details className="advanced-route-details">
        <summary>
          <span>تفاصيل المسار القرآني — اختياري</span>
          <ChevronDown size={14} />
        </summary>

        <div className="plan-range-grid">
          <SurahField
            label="من سورة"
            value={fromSurah}
            disabled={locked}
            onChange={(value) =>
              onChange(`${fieldPrefix}_from_surah`, value)
            }
          />

          <NumberField
            label="من آية"
            value={fromAyah}
            disabled={locked}
            min="1"
            step="1"
            onChange={(value) =>
              onChange(`${fieldPrefix}_from_ayah`, value)
            }
          />

          <SurahField
            label="إلى سورة"
            value={toSurah}
            disabled={locked}
            onChange={(value) =>
              onChange(`${fieldPrefix}_to_surah`, value)
            }
          />

          <NumberField
            label="إلى آية"
            value={toAyah}
            disabled={locked}
            min="1"
            step="1"
            onChange={(value) =>
              onChange(`${fieldPrefix}_to_ayah`, value)
            }
          />
        </div>
      </details>
    </section>
  );
}

function NooraniaPlanSection({ row, locked, onChange }) {
  const sessions = Number(row.planned_sessions || 0);

  const lessonTarget = nooraniaMonthlyTarget(
    row.noorania_lesson_daily_amount,
    row.noorania_lesson_daily_unit,
    sessions
  );

  const revisionTarget = nooraniaMonthlyTarget(
    row.noorania_revision_daily_amount,
    row.noorania_revision_daily_unit,
    sessions
  );

  return (
    <section className="smart-program-block noorania-program">
      <div className="smart-program-title">
        <div>
          <Layers3 size={17} />
          <strong>خطة القاعدة النورانية</strong>
        </div>


      </div>

      <div className="noorania-plan-grid">
        <NooraniaDailyCard
          title="الدرس اليومي"
          amount={row.noorania_lesson_daily_amount}
          unit={row.noorania_lesson_daily_unit}
          sessions={sessions}
          target={lessonTarget}
          locked={locked}
          units={[
            { value: "lesson", label: "درس" },
            { value: "lines", label: "أسطر" },
            { value: "faces", label: "صفحات" },
          ]}
          onAmountChange={(value) =>
            onChange("noorania_lesson_daily_amount", value)
          }
          onUnitChange={(value) =>
            onChange("noorania_lesson_daily_unit", value)
          }
        />

        <NooraniaDailyCard
          title="المراجعة اليومية"
          amount={row.noorania_revision_daily_amount}
          unit={row.noorania_revision_daily_unit}
          sessions={sessions}
          target={revisionTarget}
          locked={locked}
          units={[
            { value: "lines", label: "أسطر" },
            { value: "faces", label: "صفحات" },
          ]}
          onAmountChange={(value) =>
            onChange("noorania_revision_daily_amount", value)
          }
          onUnitChange={(value) =>
            onChange("noorania_revision_daily_unit", value)
          }
        />
      </div>

      <div className="noorania-plan-note">
        <Sparkles size={14} />
        <span>
          جنب الدرس يبقى في صفحة التسميع ولا يدخل في حساب الخطة الشهرية.
        </span>
      </div>
    </section>
  );
}

function NooraniaDailyCard({
  title,
  amount,
  unit,
  sessions,
  target,
  locked,
  units,
  onAmountChange,
  onUnitChange,
}) {
  const unitLabel = units.find((item) => item.value === unit)?.label || "وحدة";

  return (
    <div className="noorania-daily-card">
      <div className="noorania-daily-title">
        <strong>{title}</strong>
      </div>

      <div className="noorania-daily-control">
        <input
          type="number"
          min="0"
          step={unit === "lines" || unit === "lesson" ? "1" : "0.25"}
          disabled={locked}
          value={amount ?? ""}
          onChange={(event) =>
            onAmountChange(
              event.target.value === ""
                ? ""
                : Number(event.target.value)
            )
          }
          placeholder="المقدار"
        />

        <select
          value={unit}
          disabled={locked}
          onChange={(event) => onUnitChange(event.target.value)}
        >
          {units.map((item) => (
            <option value={item.value} key={item.value}>
              {item.label}
            </option>
          ))}
        </select>
      </div>

      <div className="noorania-monthly-target clean-result">
        <span>الهدف الشهري</span>
        <strong>
          {target || 0} {unitLabel}
        </strong>
      </div>
    </div>
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
          <section className="template-section smart-template-section">
            <div className="template-section-title">
              <BookOpen size={16} />
              <strong>خطة القرآن اليومية</strong>
            </div>

            <div className="template-smart-grid">
              <SmartTemplateAmount
                label="الحفظ اليومي"
                amount={template.memorization_daily_amount}
                unit={template.memorization_daily_unit}
                onAmount={(value) => setValue("memorization_daily_amount", value)}
                onUnit={(value) => setValue("memorization_daily_unit", value)}
              />

              <SmartTemplateAmount
                label="المراجعة اليومية"
                amount={template.revision_daily_amount}
                unit={template.revision_daily_unit}
                onAmount={(value) => setValue("revision_daily_amount", value)}
                onUnit={(value) => setValue("revision_daily_unit", value)}
              />
            </div>
          </section>

          <section className="template-section smart-template-section">
            <div className="template-section-title">
              <Layers3 size={16} />
              <strong>خطة القاعدة اليومية</strong>
            </div>

            <div className="template-smart-grid">
              <NooraniaTemplateAmount
                label="درس القاعدة"
                amount={template.noorania_lesson_daily_amount}
                unit={template.noorania_lesson_daily_unit}
                units={[
                  { value: "lesson", label: "درس" },
                  { value: "lines", label: "أسطر" },
                  { value: "faces", label: "صفحات" },
                ]}
                onAmount={(value) => setValue("noorania_lesson_daily_amount", value)}
                onUnit={(value) => setValue("noorania_lesson_daily_unit", value)}
              />

              <NooraniaTemplateAmount
                label="مراجعة القاعدة"
                amount={template.noorania_revision_daily_amount}
                unit={template.noorania_revision_daily_unit}
                units={[
                  { value: "lines", label: "أسطر" },
                  { value: "faces", label: "صفحات" },
                ]}
                onAmount={(value) => setValue("noorania_revision_daily_amount", value)}
                onUnit={(value) => setValue("noorania_revision_daily_unit", value)}
              />
            </div>
          </section>

          <div className="template-notes">
            <label>ملاحظات عامة</label>

            <textarea
              rows={3}
              value={template.notes}
              onChange={(event) => setValue("notes", event.target.value)}
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

function SmartTemplateAmount({
  label,
  amount,
  unit,
  onAmount,
  onUnit,
}) {
  return (
    <div className="template-smart-amount">
      <label>{label}</label>
      <div>
        <input
          type="number"
          min="0"
          step={unit === "lines" ? "1" : "0.25"}
          value={amount ?? ""}
          onChange={(event) =>
            onAmount(
              event.target.value === ""
                ? ""
                : Number(event.target.value)
            )
          }
          placeholder="المقدار"
        />

        <select value={unit} onChange={(event) => onUnit(event.target.value)}>
          <option value="lines">أسطر</option>
          <option value="faces">صفحات</option>
        </select>
      </div>
    </div>
  );
}

function NooraniaTemplateAmount({
  label,
  amount,
  unit,
  units,
  onAmount,
  onUnit,
}) {
  return (
    <div className="template-smart-amount">
      <label>{label}</label>
      <div>
        <input
          type="number"
          min="0"
          step={unit === "faces" ? "0.25" : "1"}
          value={amount ?? ""}
          onChange={(event) =>
            onAmount(
              event.target.value === ""
                ? ""
                : Number(event.target.value)
            )
          }
          placeholder="المقدار"
        />

        <select value={unit} onChange={(event) => onUnit(event.target.value)}>
          {units.map((item) => (
            <option value={item.value} key={item.value}>
              {item.label}
            </option>
          ))}
        </select>
      </div>
    </div>
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


        /* ==========================================
           SMART PLAN PRO MAX — 2026
        ========================================== */

        .monthly-plan-page {
          --smart-green: #0f4c45;
          --smart-deep: #082f2a;
          --smart-gold: #d1b34c;
          --smart-ink: #173a33;
          --smart-muted: #71837c;
          --smart-border: #dce6e2;
        }

        .plan-hero {
          min-height: 178px;
          padding: 26px 28px;
          border-radius: 25px;
          background:
            radial-gradient(circle at 10% 10%, rgba(209,179,76,.14), transparent 25%),
            linear-gradient(135deg, #ffffff 0%, #f4f9f6 68%, #fffaf0 100%);
          box-shadow: 0 16px 38px rgba(8,47,42,.055);
        }

        .plan-hero h1 {
          font-size: 29px;
          line-height: 1.2;
        }

        .plan-hero p {
          max-width: 760px;
          font-size: 13px;
          line-height: 1.85;
        }

        .plan-eyebrow,
        .plan-flow-note,
        .plan-filter-label,
        .plan-stat-content > span,
        .plan-stat-content > small,
        .student-plan-identity span,
        .plan-source-badge,
        .plan-status-badge,
        .plan-live-source span,
        .plan-lock-note,
        .bottom-field label,
        .plan-field label {
          font-size: 11px;
          line-height: 1.55;
        }

        .plan-students-header h2 {
          font-size: 19px;
        }

        .plan-students-header p,
        .plan-students-header > span {
          font-size: 12px;
        }

        .student-plan-card {
          padding: 18px;
          border-radius: 21px;
          box-shadow: 0 10px 28px rgba(8,47,42,.045);
        }

        .student-plan-identity h3 {
          font-size: 15px;
          line-height: 1.4;
        }

        .smart-plan-schedule {
          margin-top: 13px;
          padding: 12px 13px;
          border: 1px solid #dfe9e5;
          border-radius: 14px;
          background: linear-gradient(135deg, #f8fbfa, #ffffff);
        }

        .smart-plan-schedule-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
        }

        .smart-plan-schedule-head > div {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          color: var(--smart-green);
        }

        .smart-plan-schedule-head strong {
          font-size: 12px;
          font-weight: 950;
        }


        .monthly-target-card.clean-result,
        .noorania-monthly-target.clean-result {
          position: relative;
          overflow: hidden;
          min-height: 86px;
          display: grid;
          align-content: center;
          justify-items: center;
          text-align: center;
          border: 1px solid rgba(15,76,69,.12);
          background:
            radial-gradient(circle at 15% 10%, rgba(209,179,76,.13), transparent 34%),
            linear-gradient(135deg, #f8fcfa, #ffffff);
        }

        .monthly-target-card.clean-result::before,
        .noorania-monthly-target.clean-result::before {
          content: "";
          position: absolute;
          top: 0;
          right: 0;
          width: 4px;
          height: 100%;
          background: linear-gradient(180deg, #0f4c45, #d1b34c);
        }

        .monthly-target-card.clean-result span,
        .noorania-monthly-target.clean-result span {
          color: #71837c;
          font-size: 11px;
          font-weight: 850;
        }

        .monthly-target-card.clean-result strong,
        .noorania-monthly-target.clean-result strong {
          margin-top: 6px;
          color: #082f2a;
          font-size: 20px;
          line-height: 1.35;
          font-weight: 950;
        }

        .smart-session-count {
          min-height: 29px;
          display: inline-flex;
          align-items: center;
          padding: 0 9px;
          border-radius: 999px;
          background: #eef7f3;
          color: #2d6c5c;
          font-size: 10px;
          font-weight: 900;
        }

        .smart-day-chips {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin-top: 9px;
        }

        .smart-day-chips > span {
          min-height: 29px;
          display: inline-flex;
          align-items: center;
          padding: 0 9px;
          border: 1px solid #dce7e2;
          border-radius: 9px;
          background: #fff;
          color: #60766e;
          font-size: 10px;
          font-weight: 850;
        }

        .smart-day-chips > span.empty-days {
          border-style: dashed;
          color: #a06f1d;
          background: #fffaf0;
        }

        .smart-programs {
          display: grid;
          gap: 13px;
          margin-top: 13px;
        }

        .smart-program-block {
          padding: 13px;
          border: 1px solid #dfe8e4;
          border-radius: 17px;
          background: #fbfcfb;
        }

        .smart-program-block.quran-program {
          background:
            radial-gradient(circle at 100% 0%, rgba(15,76,69,.045), transparent 26%),
            #fbfdfc;
        }

        .smart-program-block.noorania-program {
          background:
            radial-gradient(circle at 0 0, rgba(209,179,76,.08), transparent 28%),
            #fffdf8;
        }

        .smart-program-title {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 10px;
        }

        .smart-program-title > div {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          color: var(--smart-green);
        }

        .smart-program-title strong {
          color: var(--smart-deep);
          font-size: 13px;
          font-weight: 950;
        }

        .smart-program-title > span {
          color: #7c8f88;
          font-size: 10px;
          font-weight: 750;
        }

        .plan-sections {
          gap: 10px;
        }

        .smart-plan-section {
          padding: 14px;
          border-radius: 15px;
          background: #fff;
        }

        .plan-section-title strong {
          font-size: 13px;
        }

        .pace-badge {
          font-size: 10px;
        }

        .daily-plan-editor {
          display: grid;
          grid-template-columns: minmax(0, 1.25fr) minmax(180px, .75fr);
          gap: 10px;
          margin-top: 11px;
        }

        .daily-plan-input-block,
        .monthly-target-card {
          min-height: 112px;
          padding: 11px;
          border: 1px solid #e1e9e6;
          border-radius: 13px;
          background: #f9fbfa;
        }

        .daily-plan-input-block > label,
        .monthly-target-card > span {
          display: block;
          color: #6f827b;
          font-size: 10px;
          font-weight: 850;
        }

        .daily-amount-control {
          display: grid;
          grid-template-columns: minmax(90px, 1fr) auto;
          gap: 7px;
          margin-top: 7px;
        }

        .daily-amount-control > input,
        .noorania-daily-control input,
        .noorania-daily-control select,
        .template-smart-amount input,
        .template-smart-amount select {
          min-width: 0;
          height: 42px;
          border: 1px solid #d9e4df;
          border-radius: 10px;
          outline: none;
          background: #fff;
          color: #294840;
          font-family: inherit;
          font-size: 13px;
          font-weight: 800;
        }

        .daily-amount-control > input,
        .noorania-daily-control input,
        .template-smart-amount input {
          padding: 0 10px;
        }

        .daily-amount-control > input:focus,
        .noorania-daily-control input:focus,
        .noorania-daily-control select:focus,
        .template-smart-amount input:focus,
        .template-smart-amount select:focus {
          border-color: #9fc7bb;
          box-shadow: 0 0 0 4px rgba(15,76,69,.055);
        }

        .daily-unit-toggle {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          overflow: hidden;
          border: 1px solid #d9e4df;
          border-radius: 10px;
          background: #fff;
        }

        .daily-unit-toggle button {
          min-width: 62px;
          border: 0;
          background: transparent;
          color: #6f817b;
          font-size: 10px;
          font-weight: 900;
          cursor: pointer;
        }

        .daily-unit-toggle button + button {
          border-right: 1px solid #e3eae7;
        }

        .daily-unit-toggle button.active {
          background: #eaf7f1;
          color: #147a5e;
        }

        .daily-conversion-note {
          display: block;
          margin-top: 7px;
          color: #83948e;
          font-size: 10px;
          line-height: 1.5;
        }

        .monthly-target-card {
          display: grid;
          align-content: center;
        }

        .monthly-target-card strong {
          display: block;
          margin-top: 5px;
          color: var(--smart-deep);
          font-size: 17px;
          line-height: 1.35;
          font-weight: 950;
        }

        .monthly-target-card small {
          display: block;
          margin-top: 5px;
          color: #81928c;
          font-size: 9px;
          line-height: 1.5;
        }

        .smart-plan-progress {
          margin-top: 10px;
        }

        .smart-plan-progress .progress-heading {
          grid-template-columns: repeat(3, minmax(0,1fr));
        }

        .smart-plan-progress .progress-heading span {
          font-size: 9px;
        }

        .smart-plan-progress .progress-heading strong {
          font-size: 11px;
          line-height: 1.45;
        }

        .advanced-route-details {
          margin-top: 10px;
          border-top: 1px dashed #dde5e2;
          padding-top: 9px;
        }

        .advanced-route-details > summary {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          list-style: none;
          color: #687c75;
          font-size: 10px;
          font-weight: 850;
          cursor: pointer;
        }

        .advanced-route-details > summary::-webkit-details-marker {
          display: none;
        }

        .advanced-route-details[open] > summary svg {
          transform: rotate(180deg);
        }

        .advanced-route-details .plan-range-grid {
          margin-top: 10px;
        }

        .noorania-plan-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0,1fr));
          gap: 10px;
        }

        .noorania-daily-card {
          padding: 12px;
          border: 1px solid #eadfb7;
          border-radius: 13px;
          background: rgba(255,255,255,.88);
        }

        .noorania-daily-title {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
        }

        .noorania-daily-title strong {
          color: #5c4914;
          font-size: 12px;
          font-weight: 950;
        }

        .noorania-daily-title span {
          color: #9a8442;
          font-size: 9px;
          font-weight: 850;
        }

        .noorania-daily-control {
          display: grid;
          grid-template-columns: 1fr 100px;
          gap: 7px;
          margin-top: 8px;
        }

        .noorania-daily-control select,
        .template-smart-amount select {
          padding: 0 8px;
        }

        .noorania-monthly-target {
          margin-top: 9px;
          padding: 9px;
          border-radius: 10px;
          background: #fff9e8;
        }

        .noorania-monthly-target span,
        .noorania-monthly-target strong,
        .noorania-monthly-target small {
          display: block;
        }

        .noorania-monthly-target span {
          color: #9b8240;
          font-size: 9px;
          font-weight: 800;
        }

        .noorania-monthly-target strong {
          margin-top: 3px;
          color: #5e4c19;
          font-size: 15px;
          font-weight: 950;
        }

        .noorania-monthly-target small {
          margin-top: 3px;
          color: #9a8a61;
          font-size: 9px;
        }

        .noorania-plan-note {
          display: flex;
          align-items: center;
          gap: 7px;
          margin-top: 9px;
          color: #8e742c;
          font-size: 10px;
          line-height: 1.5;
          font-weight: 800;
        }

        .template-smart-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0,1fr));
          gap: 9px;
        }

        .template-smart-amount {
          padding: 10px;
          border: 1px solid #e0e8e5;
          border-radius: 12px;
          background: #f9fbfa;
        }

        .template-smart-amount > label {
          display: block;
          margin-bottom: 6px;
          color: #566c65;
          font-size: 10px;
          font-weight: 900;
        }

        .template-smart-amount > div {
          display: grid;
          grid-template-columns: 1fr 90px;
          gap: 7px;
        }

        .plan-field input,
        .plan-field select,
        .bottom-field input,
        .bottom-field textarea,
        .plan-filter-control input,
        .plan-filter-control select {
          font-size: 12px;
        }

        @media (max-width: 900px) {
          .daily-plan-editor,
          .noorania-plan-grid,
          .template-smart-grid {
            grid-template-columns: 1fr;
          }

          .smart-program-title,
          .smart-plan-schedule-head {
            align-items: flex-start;
            flex-direction: column;
          }
        }

        @media (max-width: 560px) {
          .plan-hero h1 {
            font-size: 22px;
          }

          .plan-hero p {
            font-size: 12px;
          }

          .daily-amount-control {
            grid-template-columns: 1fr;
          }

          .daily-unit-toggle {
            min-height: 40px;
          }

          .smart-plan-progress .progress-heading {
            grid-template-columns: 1fr;
            gap: 6px;
          }

          .noorania-daily-control,
          .template-smart-amount > div {
            grid-template-columns: 1fr;
          }
        }

        /* ==========================================
           PRO MAX v3 — بطاقات مختصرة + نافذة عرض
        ========================================== */

        .plan-grid {
          grid-template-columns: repeat(auto-fill, minmax(310px, 1fr));
          gap: 12px;
        }

        .plan-summary-card {
          position: relative;
          overflow: hidden;
          min-height: 220px;
          padding: 16px;
          border: 1px solid #dfe8e4;
          border-radius: 19px;
          background: linear-gradient(180deg, #fff, #fbfdfc);
          box-shadow: 0 10px 26px rgba(8,47,42,.045);
          transition: transform .18s ease, box-shadow .18s ease, border-color .18s ease;
        }

        .plan-summary-card:hover {
          transform: translateY(-2px);
          border-color: #bdd5cd;
          box-shadow: 0 16px 34px rgba(8,47,42,.075);
        }

        .plan-summary-card.locked { background: #fbfcfb; }

        .plan-summary-accent {
          position: absolute;
          top: 0;
          right: 0;
          width: 4px;
          height: 100%;
          background: linear-gradient(180deg, #0f4c45, #d1b34c);
        }

        .plan-summary-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 12px;
        }

        .student-plan-identity.compact { gap: 10px; }
        .compact-avatar { width: 42px; height: 42px; flex-basis: 42px; }
        .plan-summary-name { min-width: 0; }
        .plan-summary-name h3 {
          margin: 0;
          overflow: hidden;
          color: #173d33;
          font-size: 15px;
          line-height: 1.4;
          font-weight: 950;
          white-space: nowrap;
          text-overflow: ellipsis;
        }
        .plan-summary-name span {
          display: block;
          margin-top: 4px;
          color: #82918b;
          font-size: 11px;
          font-weight: 750;
        }
        .compact-badges .plan-source-badge,
        .compact-badges .plan-status-badge {
          min-height: 25px;
          padding: 0 8px;
          font-size: 9px;
        }

        .plan-summary-days {
          display: grid;
          grid-template-columns: 18px auto 1fr;
          gap: 7px;
          align-items: center;
          margin-top: 13px;
          padding: 9px 10px;
          border-radius: 11px;
          background: #f4f8f6;
          color: #587068;
        }
        .plan-summary-days span { font-size: 10px; font-weight: 850; }
        .plan-summary-days strong {
          overflow: hidden;
          color: #345048;
          font-size: 11px;
          font-weight: 900;
          white-space: nowrap;
          text-overflow: ellipsis;
        }

        .plan-summary-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0,1fr));
          gap: 8px;
          margin-top: 10px;
        }
        .plan-summary-item {
          min-height: 76px;
          padding: 10px;
          border: 1px solid #e5ece9;
          border-radius: 12px;
          background: #fff;
        }
        .plan-summary-item span,
        .plan-summary-item strong,
        .plan-summary-item small { display: block; }
        .plan-summary-item span { color: #81928b; font-size: 10px; font-weight: 800; }
        .plan-summary-item strong { margin-top: 4px; color: #173d33; font-size: 13px; font-weight: 950; }
        .plan-summary-item small { margin-top: 4px; color: #9b8a57; font-size: 9px; font-weight: 750; }

        .plan-summary-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          margin-top: 12px;
          padding-top: 11px;
          border-top: 1px solid #edf1ef;
        }
        .plan-summary-state {
          min-width: 0;
          display: flex;
          align-items: center;
          gap: 6px;
          color: #72847d;
          font-size: 10px;
          font-weight: 750;
        }
        .plan-view-button {
          min-height: 37px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 0 13px;
          border: 0;
          border-radius: 10px;
          background: #0f4c45;
          color: #fff;
          font-family: inherit;
          font-size: 11px;
          font-weight: 900;
          cursor: pointer;
          box-shadow: 0 8px 18px rgba(15,76,69,.14);
        }

        .plan-details-overlay {
          position: fixed;
          inset: 0;
          z-index: 10020;
          display: grid;
          place-items: center;
          padding: 18px;
          background: rgba(3,24,21,.58);
          backdrop-filter: blur(7px);
        }
        .plan-details-modal {
          width: min(1060px, 100%);
          max-height: calc(100vh - 36px);
          overflow: auto;
          border: 1px solid rgba(255,255,255,.5);
          border-radius: 23px;
          background: #fff;
          box-shadow: 0 36px 100px rgba(3,27,23,.28);
        }
        .plan-details-header {
          position: sticky;
          top: 0;
          z-index: 5;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
          padding: 17px 19px;
          border-bottom: 1px solid #e4ece8;
          background: rgba(255,255,255,.97);
          backdrop-filter: blur(12px);
        }
        .plan-details-eyebrow { color: #9a7a27; font-size: 10px; font-weight: 900; }
        .plan-details-header h2 { margin: 2px 0 0; color: #0f3b32; font-size: 19px; font-weight: 950; }
        .plan-details-header p { margin: 3px 0 0; color: #83938d; font-size: 10px; }
        .plan-details-close {
          width: 38px;
          height: 38px;
          display: grid;
          place-items: center;
          border: 1px solid #dfe8e4;
          border-radius: 11px;
          background: #fff;
          color: #587068;
          cursor: pointer;
        }
        .plan-details-body { padding: 17px 18px 22px; }
        .modal-schedule { margin-bottom: 13px; }
        .modal-programs .smart-program-block { margin-top: 12px; }
        .modal-bottom-fields { margin-top: 13px; }
        .modal-note { margin-bottom: 12px; }
        .modal-lock-note { margin-top: 13px; }
        .plan-details-footer {
          position: sticky;
          bottom: 0;
          z-index: 5;
          display: flex;
          justify-content: flex-end;
          padding: 11px 18px;
          border-top: 1px solid #e5ece9;
          background: rgba(250,252,251,.97);
        }
        .plan-details-footer button {
          min-height: 39px;
          padding: 0 16px;
          border: 0;
          border-radius: 10px;
          background: #eef4f1;
          color: #3d5c53;
          font-family: inherit;
          font-size: 11px;
          font-weight: 900;
          cursor: pointer;
        }

        /* تكبير المقروئية داخل نافذة التفاصيل فقط بدون تضخيم الصناديق */
        .plan-details-modal .smart-program-title strong,
        .plan-details-modal .plan-section-title strong,
        .plan-details-modal .noorania-daily-title strong,
        .plan-details-modal .bottom-field label,
        .plan-details-modal .daily-plan-input-block label,
        .plan-details-modal .plan-field label { font-size: 11px; }
        .plan-details-modal input,
        .plan-details-modal select,
        .plan-details-modal textarea { font-size: 12px; }
        .plan-details-modal .daily-plan-editor {
          grid-template-columns: minmax(0,1fr) 155px;
          gap: 9px;
        }
        .plan-details-modal .monthly-target-card.clean-result,
        .plan-details-modal .noorania-monthly-target.clean-result {
          min-height: 70px;
          padding: 9px;
        }
        .plan-details-modal .monthly-target-card.clean-result strong,
        .plan-details-modal .noorania-monthly-target.clean-result strong { font-size: 16px; }
        .plan-details-modal .progress-heading span,
        .plan-details-modal .progress-foot,
        .plan-details-modal .pace-badge { font-size: 9px; }
        .plan-details-modal .progress-heading strong { font-size: 11px; }
        .plan-details-modal .smart-day-chips span { font-size: 10px; }

        @media (max-width: 700px) {
          .plan-grid { grid-template-columns: 1fr; }
          .plan-summary-grid { grid-template-columns: 1fr 1fr; }
          .plan-details-overlay { align-items: end; padding: 6px; }
          .plan-details-modal { max-height: calc(100vh - 12px); border-radius: 20px 20px 8px 8px; }
          .plan-details-modal .plan-sections,
          .plan-details-modal .noorania-plan-grid,
          .plan-details-modal .plan-card-bottom { grid-template-columns: 1fr; }
          .plan-details-modal .daily-plan-editor { grid-template-columns: 1fr; }
        }

        @media (max-width: 430px) {
          .plan-summary-grid { grid-template-columns: 1fr; }
          .plan-summary-header { flex-direction: column; }
          .compact-badges { justify-content: flex-start; }
        }

      `}
    </style>
  );
}
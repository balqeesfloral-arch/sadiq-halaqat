// src/pages/teacher/MonthlyPlan.jsx

import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { BadgeCheck, BookOpen, CalendarDays, CheckCircle2, ChevronDown, ChevronLeft, ChevronRight, CircleAlert, Copy, Layers3, Loader2, MessageSquareText, RefreshCw, Save, Search, Send, ShieldCheck, Sparkles, Target, Undo2, UserRound, Users, X } from "lucide-react";

import {
  supabase,
} from "../../lib/supabase";

import {
  useTeacherPreferences,
} from "../../context/TeacherPreferencesContext";

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

function countScheduledSessions(period, recitationDays, holidayDates = []) {
  const days = normalizeRecitationDays(recitationDays);

  if (!period || days.length === 0) {
    return 0;
  }

  const allowed = new Set(
    RECITATION_DAY_META
      .filter((item) => days.includes(item.value))
      .map((item) => item.jsDay)
  );

  const excluded = holidayDates instanceof Set
    ? holidayDates
    : new Set((holidayDates || []).filter(Boolean));

  const cursor = parseLocalDate(period.start);
  const end = parseLocalDate(period.end);
  let count = 0;

  while (cursor <= end) {
    const dateText = getLocalDate(cursor);

    if (
      allowed.has(cursor.getDay()) &&
      !excluded.has(dateText)
    ) {
      count += 1;
    }

    cursor.setDate(cursor.getDate() + 1);
  }

  return count;
}

function getScheduledElapsedPercent(
  period,
  recitationDays,
  plannedSessions,
  holidayDates = []
) {
  if (!period) {
    return 0;
  }

  const total = Number(plannedSessions || 0) ||
    countScheduledSessions(period, recitationDays, holidayDates);

  if (total <= 0) {
    return normalizeRecitationDays(recitationDays).length > 0
      ? 0
      : getElapsedPercent(period);
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
    recitationDays,
    holidayDates
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

  if (record?.lesson_faces_manual !== null && record?.lesson_faces_manual !== undefined) {
    return Number(record.lesson_faces_manual || 0);
  }

  const amount = Number(record?.lesson_amount_value || 0);
  const unit = record?.lesson_amount_unit;

  if (amount > 0 && (unit === "lines" || unit === "faces")) {
    return unit === "lines" ? amount / 15 : amount;
  }

  return Number(record?.lesson_faces || 0);
}

function recitationReviewFaces(record) {
  if (!acceptedEvaluation(record?.review_evaluation)) {
    return 0;
  }

  return Number(record?.review_faces || 0);
}

function hasCompletePlanRange(fromSurah, fromAyah, toSurah, toAyah) {
  return Boolean(
    String(fromSurah || "").trim() &&
    Number(fromAyah || 0) > 0 &&
    String(toSurah || "").trim() &&
    Number(toAyah || 0) > 0
  );
}

function hasAnyPlanRange(fromSurah, fromAyah, toSurah, toAyah) {
  return Boolean(
    String(fromSurah || "").trim() ||
    Number(fromAyah || 0) > 0 ||
    String(toSurah || "").trim() ||
    Number(toAyah || 0) > 0
  );
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


function normalizePlanDirection(value) {
  return value === "backward"
    ? "backward"
    : "forward";
}

function hasPlanStart(surah, ayah) {
  return Boolean(
    String(surah || "").trim() &&
    Number(ayah || 0) > 0
  );
}

function totalDailyPlanAmount(amount, sessions) {
  const daily = Number(amount || 0);
  const count = Number(sessions || 0);

  if (!Number.isFinite(daily) || daily <= 0 || count <= 0) {
    return 0;
  }

  return Math.round((daily * count + Number.EPSILON) * 100) / 100;
}

function firstRpcRow(data) {
  return Array.isArray(data)
    ? data[0] || null
    : data || null;
}

async function generateAutomaticQuranRange({
  direction,
  startSurah,
  startAyah,
  dailyAmount,
  dailyUnit,
  sessions,
}) {
  const normalizedDirection = normalizePlanDirection(direction);
  const targetAmount = totalDailyPlanAmount(dailyAmount, sessions);

  if (
    !hasPlanStart(startSurah, startAyah) ||
    targetAmount <= 0 ||
    !["lines", "faces"].includes(dailyUnit)
  ) {
    return null;
  }

  if (normalizedDirection === "backward") {
    /*
      الاتجاه العكسي هنا يعني عكس ترتيب السور فقط.
      داخل كل سورة تبقى القراءة طبيعية من أول آية إلى آخر آية:
      الناس 1..6 -> الفلق 1..5 -> الإخلاص 1..4 ...
    */
    const { data, error } = await supabase.rpc(
      "quran_generate_reverse_surah_assignment",
      {
        p_start_surah: startSurah,
        p_start_ayah: Number(startAyah),
        p_target_amount: targetAmount,
        p_target_unit: dailyUnit,
      }
    );

    if (error) throw error;

    const generated = firstRpcRow(data);
    if (!generated) return null;

    return {
      from_surah: startSurah,
      from_ayah: Number(startAyah),
      to_surah: generated.end_surah_name,
      to_ayah: Number(generated.end_ayah),
      target_faces: Number(generated.faces || 0),
      target_lines: Number(generated.quran_lines || 0),
      start_page: generated.start_page ?? null,
      end_page: generated.end_page ?? null,
      precision_label: generated.precision_label || "",
      requested_amount: targetAmount,
    };
  }

  const { data, error } = await supabase.rpc(
    "quran_generate_assignment",
    {
      p_start_surah: startSurah,
      p_start_ayah: Number(startAyah),
      p_target_amount: targetAmount,
      p_target_unit: dailyUnit,
      p_limit_surah: null,
      p_limit_ayah: null,
    }
  );

  if (error) throw error;

  const generated = firstRpcRow(data);
  if (!generated) return null;

  return {
    from_surah: startSurah,
    from_ayah: Number(startAyah),
    to_surah: generated.end_surah_name,
    to_ayah: Number(generated.end_ayah),
    target_faces: Number(generated.faces || 0),
    target_lines: Number(generated.quran_lines || 0),
    start_page: generated.start_page ?? null,
    end_page: generated.end_page ?? null,
    precision_label: generated.precision_label || "",
    requested_amount: targetAmount,
  };
}

async function getQuranPositionInfo(surah, ayah) {
  if (!hasPlanStart(surah, ayah)) return null;

  const { data, error } = await supabase.rpc(
    "quran_position_info",
    {
      p_surah: surah,
      p_ayah: Number(ayah),
    }
  );

  if (error) throw error;
  return firstRpcRow(data);
}

async function pickDirectionalEndpoint(first, second, direction) {
  const candidates = [first, second].filter(
    (item) => hasPlanStart(item?.surah, item?.ayah)
  );

  if (!candidates.length) return null;
  if (candidates.length === 1) return candidates[0];

  const infos = await Promise.all(
    candidates.map(async (item) => ({
      item,
      info: await getQuranPositionInfo(item.surah, item.ayah),
    }))
  );

  const valid = infos.filter(
    (entry) => Number(entry.info?.source_id || 0) > 0
  );

  if (!valid.length) return candidates[candidates.length - 1];

  if (normalizePlanDirection(direction) === "backward") {
    /*
      ترتيب المسار: السور تنازليًا، والآيات داخل السورة تصاعديًا.
      لذلك "الأبعد" في المسار هو السورة ذات الرقم الأصغر،
      أو الآية ذات الرقم الأكبر عندما تكون السورة نفسها.
    */
    valid.sort((a, b) => {
      const aSurah = Number(a.info?.surah_no || 0);
      const bSurah = Number(b.info?.surah_no || 0);

      if (aSurah !== bSurah) {
        return bSurah - aSurah;
      }

      return Number(a.info?.ayah || 0) - Number(b.info?.ayah || 0);
    });

    return valid[valid.length - 1].item;
  }

  valid.sort((a, b) =>
    Number(a.info.source_id) - Number(b.info.source_id)
  );

  return valid[valid.length - 1].item;
}

async function moveOneAyahFrom(position, direction) {
  if (!hasPlanStart(position?.surah, position?.ayah)) {
    return null;
  }

  const rpcName = normalizePlanDirection(direction) === "backward"
    ? "quran_next_reverse_surah_position"
    : "quran_next_ayah";

  const { data, error } = await supabase.rpc(rpcName, {
    p_surah: position.surah,
    p_ayah: Number(position.ayah),
  });

  if (error) throw error;

  const moved = firstRpcRow(data);

  if (!moved) {
    return position;
  }

  return {
    surah: moved.surah_name,
    ayah: Number(moved.ayah),
  };
}

async function resolveContinuationStart({
  records,
  type,
  direction,
  fallbackSurah,
  fallbackAyah,
}) {
  const sorted = [...(records || [])].sort((a, b) => {
    const dateCompare = String(b.recitation_date || "").localeCompare(
      String(a.recitation_date || "")
    );

    if (dateCompare !== 0) return dateCompare;
    return Number(b.id || 0) - Number(a.id || 0);
  });

  for (const record of sorted) {
    const evaluation = type === "memorization"
      ? record.lesson_evaluation
      : record.review_evaluation;

    if (!acceptedEvaluation(evaluation)) continue;

    const first = type === "memorization"
      ? {
          surah: record.from_surah,
          ayah: record.from_ayah,
        }
      : {
          surah: record.review_surah,
          ayah: record.review_from_ayah,
        };

    const second = type === "memorization"
      ? {
          surah: record.to_surah,
          ayah: record.to_ayah,
        }
      : {
          surah: record.review_to_surah || record.review_surah,
          ayah: record.review_to_ayah,
        };

    if (
      !hasPlanStart(first.surah, first.ayah) &&
      !hasPlanStart(second.surah, second.ayah)
    ) {
      continue;
    }

    const actualEnd = await pickDirectionalEndpoint(
      first,
      second,
      direction
    );

    if (actualEnd) {
      return moveOneAyahFrom(actualEnd, direction);
    }
  }

  if (hasPlanStart(fallbackSurah, fallbackAyah)) {
    return moveOneAyahFrom(
      {
        surah: fallbackSurah,
        ayah: Number(fallbackAyah),
      },
      direction
    );
  }

  return null;
}

async function applyAutomaticRangeToSnapshot(row, prefix) {
  const autoField = `${prefix}_auto_range`;
  const directionField = `${prefix}_direction`;
  const fromSurahField = `${prefix}_from_surah`;
  const fromAyahField = `${prefix}_from_ayah`;
  const toSurahField = `${prefix}_to_surah`;
  const toAyahField = `${prefix}_to_ayah`;
  const amountField = `${prefix}_daily_amount`;
  const unitField = `${prefix}_daily_unit`;
  const targetField = `${prefix}_target_faces`;

  if (!row?.[autoField]) return row;

  const generated = await generateAutomaticQuranRange({
    direction: row?.[directionField],
    startSurah: row?.[fromSurahField],
    startAyah: row?.[fromAyahField],
    dailyAmount: row?.[amountField],
    dailyUnit: row?.[unitField],
    sessions: row?.planned_sessions,
  });

  if (!generated) {
    return {
      ...row,
      [toSurahField]: "",
      [toAyahField]: "",
      [targetField]: 0,
      [`${prefix}_target_lines`]: 0,
      [`${prefix}_start_page`]: null,
      [`${prefix}_end_page`]: null,
      [`${prefix}_route_error`]: "",
    };
  }

  return {
    ...row,
    [toSurahField]: generated.to_surah || "",
    [toAyahField]: generated.to_ayah || "",
    [targetField]: roundFaces(generated.target_faces || 0),
    [`${prefix}_target_lines`]: Number(generated.target_lines || 0),
    [`${prefix}_start_page`]: generated.start_page ?? null,
    [`${prefix}_end_page`]: generated.end_page ?? null,
    [`${prefix}_precision_label`]: generated.precision_label || "",
    [`${prefix}_route_error`]: "",
  };
}

async function buildNextMonthPlanSnapshot({
  row,
  previousPlan,
  previousRecitations,
}) {
  if (!previousPlan) return row;

  const memorizationDirection = normalizePlanDirection(
    previousPlan.memorization_direction
  );
  const revisionDirection = normalizePlanDirection(
    previousPlan.revision_direction
  );

  const [memorizationStart, revisionStart] = await Promise.all([
    resolveContinuationStart({
      records: previousRecitations,
      type: "memorization",
      direction: memorizationDirection,
      fallbackSurah: previousPlan.memorization_to_surah,
      fallbackAyah: previousPlan.memorization_to_ayah,
    }),
    resolveContinuationStart({
      records: previousRecitations,
      type: "revision",
      direction: revisionDirection,
      fallbackSurah: previousPlan.revision_to_surah,
      fallbackAyah: previousPlan.revision_to_ayah,
    }),
  ]);

  const oldSessions = Number(previousPlan.planned_sessions || 0);

  const oldMemDaily =
    previousPlan.memorization_daily_amount ??
    inferDailyPlan(
      previousPlan.memorization_target_faces,
      oldSessions
    ).amount;

  const oldMemUnit =
    previousPlan.memorization_daily_unit ||
    inferDailyPlan(
      previousPlan.memorization_target_faces,
      oldSessions
    ).unit ||
    "lines";

  const oldRevDaily =
    previousPlan.revision_daily_amount ??
    inferDailyPlan(
      previousPlan.revision_target_faces,
      oldSessions
    ).amount;

  const oldRevUnit =
    previousPlan.revision_daily_unit ||
    inferDailyPlan(
      previousPlan.revision_target_faces,
      oldSessions
    ).unit ||
    "faces";

  let next = {
    ...row,

    memorization_direction: memorizationDirection,
    memorization_auto_range: true,
    memorization_from_surah: memorizationStart?.surah || "",
    memorization_from_ayah: memorizationStart?.ayah || "",
    memorization_to_surah: "",
    memorization_to_ayah: "",
    memorization_daily_amount: oldMemDaily,
    memorization_daily_unit: oldMemUnit,
    memorization_target_faces: 0,

    revision_direction: revisionDirection,
    revision_auto_range: true,
    revision_from_surah: revisionStart?.surah || "",
    revision_from_ayah: revisionStart?.ayah || "",
    revision_to_surah: "",
    revision_to_ayah: "",
    revision_daily_amount: oldRevDaily,
    revision_daily_unit: oldRevUnit,
    revision_target_faces: 0,

    noorania_lesson_daily_amount:
      previousPlan.noorania_lesson_daily_amount ?? "",
    noorania_lesson_daily_unit:
      previousPlan.noorania_lesson_daily_unit || "lesson",
    noorania_revision_daily_amount:
      previousPlan.noorania_revision_daily_amount ?? "",
    noorania_revision_daily_unit:
      previousPlan.noorania_revision_daily_unit || "faces",

    recitation_days_snapshot: row.recitation_days,
    notes: "",
    customization_reason: "",
    plan_source: "copied_previous",
    status: "draft",
    auto_continued_from_previous: true,
    dirty: true,
  };

  next = await applyAutomaticRangeToSnapshot(next, "memorization");
  next = await applyAutomaticRangeToSnapshot(next, "revision");

  return next;
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

    memorization_direction:
      "forward",

    memorization_auto_range:
      true,

    revision_direction:
      "forward",

    revision_auto_range:
      true,

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

    side_lesson_policy_id:
      null,

    side_lesson_mode:
      "none",

    side_lesson_amount:
      "",

    side_lesson_unit:
      "faces",

    boundary_suggestion_mode:
      "ayah_and_surah",

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
  const {
    teacherPreferences = {},
  } = useTeacherPreferences();

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

  const [
    autoSaving,
    setAutoSaving,
  ] = useState(false);

  const [
    lastAutoSavedAt,
    setLastAutoSavedAt,
  ] = useState(null);

  const routeRequestRef =
    useRef(new Map());

  const routeTimerRef =
    useRef(new Map());

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

  const hasPendingRouteGeneration =
    useMemo(
      () =>
        rows.some(
          (row) =>
            row.memorization_generating ||
            row.revision_generating
        ),
      [rows]
    );

  useEffect(() => {
    return () => {
      routeTimerRef.current.forEach((timer) =>
        clearTimeout(timer)
      );

      routeTimerRef.current.clear();
    };
  }, []);

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

  useEffect(() => {
    if (
      !hasUnsavedChanges ||
      hasPendingRouteGeneration ||
      loading ||
      saving ||
      autoSaving ||
      submitting ||
      withdrawing ||
      copying
    ) {
      return;
    }

    const timer = setTimeout(async () => {
      setAutoSaving(true);

      try {
        const saved = await saveAll({
          silent: true,
          reload: false,
          controlLoading: false,
        });

        if (saved) {
          setLastAutoSavedAt(new Date());
        }
      } finally {
        setAutoSaving(false);
      }
    }, 1200);

    return () => clearTimeout(timer);
  }, [
    rows,
    hasUnsavedChanges,
    hasPendingRouteGeneration,
    loading,
    saving,
    autoSaving,
    submitting,
    withdrawing,
    copying,
    selectedHalaqa,
    hijriYear,
    hijriMonth,
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

  useEffect(() => {
    if (!halaqat.length || !teacher?.id) return;

    let preferred = "";

    if (teacherPreferences.remember_last_halaqa) {
      try {
        preferred =
          localStorage.getItem(
            `sadiq_teacher_last_halaqa_${teacher.id}`
          ) || "";
      } catch {
        preferred = "";
      }
    }

    if (
      !preferred &&
      teacherPreferences.default_halaqa_id
    ) {
      preferred = String(
        teacherPreferences.default_halaqa_id
      );
    }

    if (
      preferred &&
      halaqat.some(
        (item) => String(item.id) === String(preferred)
      ) &&
      String(selectedHalaqa) !== String(preferred)
    ) {
      setSelectedHalaqa(String(preferred));
    }
  }, [
    halaqat,
    teacher?.id,
    teacherPreferences.default_halaqa_id,
    teacherPreferences.remember_last_halaqa,
  ]);

  useEffect(() => {
    if (
      !teacher?.id ||
      !selectedHalaqa ||
      !teacherPreferences.remember_last_halaqa
    ) {
      return;
    }

    try {
      localStorage.setItem(
        `sadiq_teacher_last_halaqa_${teacher.id}`,
        String(selectedHalaqa)
      );
    } catch {
      // التذكر المحلي تحسين تجربة فقط.
    }
  }, [
    teacher?.id,
    selectedHalaqa,
    teacherPreferences.remember_last_halaqa,
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
        let preferredHalaqa = "";

        if (teacherPreferences.remember_last_halaqa) {
          try {
            preferredHalaqa =
              localStorage.getItem(
                `sadiq_teacher_last_halaqa_${teacherProfile.id}`
              ) || "";
          } catch {
            preferredHalaqa = "";
          }
        }

        if (
          !preferredHalaqa &&
          teacherPreferences.default_halaqa_id
        ) {
          preferredHalaqa = String(
            teacherPreferences.default_halaqa_id
          );
        }

        const preferredExists =
          preferredHalaqa &&
          prepared.some(
            (item) =>
              String(item.id) === String(preferredHalaqa)
          );

        setSelectedHalaqa(
          preferredExists
            ? String(preferredHalaqa)
            : String(prepared[0].id)
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
         الشهر السابق للاستمرار التلقائي
      =========================================== */

      const previousMonth =
        getPreviousHijriMonth(
          hijriYear,
          hijriMonth
        );

      const previousPeriod =
        getHijriMonthRange(
          previousMonth.year,
          previousMonth.month
        );

      let {
        data: previousPlans,
        error: previousPlansError,
      } = await supabase
        .from("monthly_plans")
        .select("*")
        .eq("halaqa_id", Number(selectedHalaqa))
        .eq("plan_month", previousPeriod.start)
        .in("student_id", studentIds);

      if (previousPlansError) throw previousPlansError;

      if (!previousPlans?.length) {
        const fallbackPrevious = await supabase
          .from("monthly_plans")
          .select("*")
          .eq("halaqa_id", Number(selectedHalaqa))
          .eq("hijri_year", previousMonth.year)
          .eq("hijri_month", previousMonth.month)
          .in("student_id", studentIds);

        if (fallbackPrevious.error) throw fallbackPrevious.error;
        previousPlans = fallbackPrevious.data || [];
      }

      const {
        data: previousRecitations,
        error: previousRecitationsError,
      } = await supabase
        .from("recitations")
        .select(`
          id, student_id, recitation_date,
          from_surah, from_ayah, to_surah, to_ayah, lesson_evaluation,
          review_surah, review_from_ayah, review_to_surah, review_to_ayah, review_evaluation
        `)
        .eq("halaqa_id", Number(selectedHalaqa))
        .in("student_id", studentIds)
        .gte("recitation_date", previousPeriod.start)
        .lte("recitation_date", previousPeriod.end)
        .order("recitation_date", { ascending: false })
        .order("id", { ascending: false });

      if (previousRecitationsError) throw previousRecitationsError;

      const previousPlanMap = new Map(
        (previousPlans || []).map((plan) => [
          Number(plan.student_id),
          plan,
        ])
      );

      const previousRecitationMap = new Map();

      (previousRecitations || []).forEach((record) => {
        const studentId = Number(record.student_id);
        const list = previousRecitationMap.get(studentId) || [];
        list.push(record);
        previousRecitationMap.set(studentId, list);
      });

      /* ===========================================
         سياسة جنب الدرس
      =========================================== */

      const { data: policyRows, error: policyError } = await supabase
        .from("quran_student_policies")
        .select(`
          id, student_id, halaqa_id, teacher_id,
          side_lesson_mode, side_lesson_amount, side_lesson_unit,
          boundary_suggestion_mode, effective_from, effective_to, active
        `)
        .eq("halaqa_id", Number(selectedHalaqa))
        .in("student_id", studentIds)
        .eq("active", true);

      if (policyError) throw policyError;

      const policyMap = new Map(
        (policyRows || []).map((policy) => [Number(policy.student_id), policy])
      );

      /* ===========================================
         إجازات الحلقة خلال الشهر
         تخصم فقط إذا صادفت يوم تسميع فعلي.
      =========================================== */

      const { data: holidayRows, error: holidayError } = await supabase
        .from("attendance_holidays")
        .select("holiday_date")
        .eq("halaqa_id", Number(selectedHalaqa))
        .gte("holiday_date", period.start)
        .lte("holiday_date", period.end);

      if (holidayError) throw holidayError;

      const holidayDates = (holidayRows || [])
        .map((item) => item.holiday_date)
        .filter(Boolean);

      const holidayDateSet = new Set(holidayDates);

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

              const policy =
                policyMap.get(studentId) || null;

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

              const scheduledSessionsBeforeHolidays =
                countScheduledSessions(
                  period,
                  planDays
                );

              const effectiveScheduledSessions =
                countScheduledSessions(
                  period,
                  planDays,
                  holidayDateSet
                );

              const holidaySessions =
                Math.max(
                  scheduledSessionsBeforeHolidays - effectiveScheduledSessions,
                  0
                );

              /*
                إذا كانت أيام التسميع معروفة نعيد الحساب حيًا دائمًا،
                حتى لو أضيفت الإجازة بعد إنشاء الخطة.
                الخطط القديمة التي لا تحتوي أيامًا واضحة تبقى على
                planned_sessions المخزن حفاظًا على التوافق.
              */
              const plannedSessions =
                planDays.length > 0
                  ? effectiveScheduledSessions
                  : Number(plan?.planned_sessions || 0);

              const defaultMemTarget =
                Number(
                  teacherPreferences.plan_default_mem_faces || 0
                );

              const defaultRevTarget =
                Number(
                  teacherPreferences.plan_default_revision_faces || 0
                );

              const baseMemTarget =
                Number(plan?.memorization_target_faces || 0) > 0
                  ? Number(plan.memorization_target_faces)
                  : defaultMemTarget;

              const baseRevTarget =
                Number(plan?.revision_target_faces || 0) > 0
                  ? Number(plan.revision_target_faces)
                  : defaultRevTarget;

              const inferredMem =
                inferDailyPlan(
                  baseMemTarget,
                  plannedSessions
                );

              const inferredRev =
                inferDailyPlan(
                  baseRevTarget,
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

                scheduled_sessions_before_holidays:
                  scheduledSessionsBeforeHolidays,

                holiday_sessions:
                  holidaySessions,

                holiday_dates:
                  holidayDates,

                stored_planned_sessions:
                  Number(plan?.planned_sessions || 0),

                memorization_direction:
                  normalizePlanDirection(plan?.memorization_direction),

                memorization_auto_range:
                  plan?.memorization_auto_range ?? (plan ? false : true),

                revision_direction:
                  normalizePlanDirection(plan?.revision_direction),

                revision_auto_range:
                  plan?.revision_auto_range ?? (plan ? false : true),

                memorization_generating:
                  false,

                revision_generating:
                  false,

                memorization_route_error:
                  "",

                revision_route_error:
                  "",

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
                    plan?.memorization_from_surah &&
                    plan?.memorization_from_ayah &&
                    plan?.memorization_to_surah &&
                    plan?.memorization_to_ayah
                      ? Number(plan?.memorization_target_faces || 0)
                      : (baseMemTarget || calculatedMemTarget || 0)
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
                    plan?.revision_from_surah &&
                    plan?.revision_from_ayah &&
                    plan?.revision_to_surah &&
                    plan?.revision_to_ayah
                      ? Number(plan?.revision_target_faces || 0)
                      : (baseRevTarget || calculatedRevTarget || 0)
                  ),

                side_lesson_policy_id:
                  policy?.id || null,

                side_lesson_mode:
                  policy?.side_lesson_mode || "none",

                side_lesson_amount:
                  policy?.side_lesson_amount ?? "",

                side_lesson_unit:
                  policy?.side_lesson_unit || "faces",

                boundary_suggestion_mode:
                  policy?.boundary_suggestion_mode || "ayah_and_surah",

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

      const selectedIsCurrentMonth =
        Number(hijriYear) === Number(CURRENT_HIJRI.year) &&
        Number(hijriMonth) === Number(CURRENT_HIJRI.month);

      const smartRows = await Promise.all(
        result.map(async (row) => {
          const currentPlan = planMap.get(Number(row.student_id)) || null;

          if (currentPlan) {
            // مجرد فتح شهر تاريخي لا يجب أن يعيد حساب الخطة أو يحفظها تلقائيًا.
            if (!selectedIsCurrentMonth) {
              return row;
            }
            const sessionsChanged =
              Number(currentPlan.planned_sessions || 0) !==
              Number(row.planned_sessions || 0);

            let next = { ...row };
            let changed = false;

            if (
              next.memorization_auto_range &&
              (sessionsChanged ||
                !hasCompletePlanRange(
                  next.memorization_from_surah,
                  next.memorization_from_ayah,
                  next.memorization_to_surah,
                  next.memorization_to_ayah
                ))
            ) {
              const regenerated = await applyAutomaticRangeToSnapshot(
                next,
                "memorization"
              );

              changed =
                regenerated.memorization_to_surah !== next.memorization_to_surah ||
                Number(regenerated.memorization_to_ayah || 0) !== Number(next.memorization_to_ayah || 0) ||
                Number(regenerated.memorization_target_faces || 0) !== Number(next.memorization_target_faces || 0);

              next = regenerated;
            }

            if (
              next.revision_auto_range &&
              (sessionsChanged ||
                !hasCompletePlanRange(
                  next.revision_from_surah,
                  next.revision_from_ayah,
                  next.revision_to_surah,
                  next.revision_to_ayah
                ))
            ) {
              const regenerated = await applyAutomaticRangeToSnapshot(
                next,
                "revision"
              );

              changed =
                changed ||
                regenerated.revision_to_surah !== next.revision_to_surah ||
                Number(regenerated.revision_to_ayah || 0) !== Number(next.revision_to_ayah || 0) ||
                Number(regenerated.revision_target_faces || 0) !== Number(next.revision_target_faces || 0);

              next = regenerated;
            }

            return changed
              ? { ...next, dirty: true }
              : next;
          }

          // الاستمرار التلقائي من الشهر السابق يحدث للشهر الحالي فقط.
          // الأشهر التاريخية تبقى للعرض أو للتوليد اليدوي المقصود.
          if (!selectedIsCurrentMonth) return row;

          const previousPlan =
            previousPlanMap.get(Number(row.student_id)) || null;

          if (!previousPlan) return row;

          return buildNextMonthPlanSnapshot({
            row,
            previousPlan,
            previousRecitations:
              previousRecitationMap.get(Number(row.student_id)) || [],
          });
        })
      );

      setRows(smartRows);

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

  async function calculatePlanRange(
    fromSurah,
    fromAyah,
    toSurah,
    toAyah,
    direction = "forward"
  ) {
    if (!hasCompletePlanRange(fromSurah, fromAyah, toSurah, toAyah)) {
      return null;
    }

    const backward = normalizePlanDirection(direction) === "backward";
    const rpcName = backward
      ? "quran_reverse_surah_range_metrics"
      : "quran_range_metrics";

    const { data, error } = await supabase.rpc(rpcName, {
      p_from_surah: fromSurah,
      p_from_ayah: Number(fromAyah),
      p_to_surah: toSurah,
      p_to_ayah: Number(toAyah),
    });

    if (error) throw error;
    return Array.isArray(data) ? data[0] || null : data || null;
  }

  async function refreshRouteTarget(studentId, prefix, snapshot) {
    try {
      const metrics = await calculatePlanRange(
        snapshot[`${prefix}_from_surah`],
        snapshot[`${prefix}_from_ayah`],
        snapshot[`${prefix}_to_surah`],
        snapshot[`${prefix}_to_ayah`],
        snapshot[`${prefix}_direction`]
      );

      setRows((current) =>
        current.map((row) => {
          if (Number(row.student_id) !== Number(studentId)) return row;

          return {
            ...row,
            [`${prefix}_target_faces`]: metrics ? Number(metrics.faces || 0) : 0,
            [`${prefix}_target_lines`]: metrics ? Number(metrics.quran_lines || 0) : 0,
            [`${prefix}_start_page`]: metrics?.start_page ?? null,
            [`${prefix}_end_page`]: metrics?.end_page ?? null,
            [`${prefix}_route_error`]: "",
          };
        })
      );
    } catch (error) {
      console.error("PLAN QURAN RANGE:", error);

      setRows((current) =>
        current.map((row) => {
          if (Number(row.student_id) !== Number(studentId)) return row;

          return {
            ...row,
            [`${prefix}_route_error`]:
              /QURAN_RANGE_REVERSED|QURAN_REVERSE_SURAH_RANGE_INVALID/.test(
                String(error?.message || "")
              )
                ? "نهاية المسار لا توافق اتجاه السير المحدد"
                : "تعذر حساب المسار من المصحف",
          };
        })
      );
    }
  }


  async function regenerateAutoRoute(studentId, prefix, snapshot) {
    const requestKey = `${studentId}-${prefix}`;
    const requestToken = Number(routeRequestRef.current.get(requestKey) || 0) + 1;

    routeRequestRef.current.set(requestKey, requestToken);

    setRows((current) =>
      current.map((row) =>
        Number(row.student_id) === Number(studentId)
          ? {
              ...row,
              [`${prefix}_generating`]: true,
              [`${prefix}_route_error`]: "",
            }
          : row
      )
    );

    try {
      const next = await applyAutomaticRangeToSnapshot(
        {
          ...snapshot,
          [`${prefix}_auto_range`]: true,
        },
        prefix
      );

      if (routeRequestRef.current.get(requestKey) !== requestToken) {
        return;
      }

      setRows((current) =>
        current.map((row) => {
          if (Number(row.student_id) !== Number(studentId)) return row;

          return {
            ...row,
            [`${prefix}_to_surah`]: next[`${prefix}_to_surah`] || "",
            [`${prefix}_to_ayah`]: next[`${prefix}_to_ayah`] || "",
            [`${prefix}_target_faces`]: Number(next[`${prefix}_target_faces`] || 0),
            [`${prefix}_target_lines`]: Number(next[`${prefix}_target_lines`] || 0),
            [`${prefix}_start_page`]: next[`${prefix}_start_page`] ?? null,
            [`${prefix}_end_page`]: next[`${prefix}_end_page`] ?? null,
            [`${prefix}_precision_label`]: next[`${prefix}_precision_label`] || "",
            [`${prefix}_auto_range`]: true,
            [`${prefix}_generating`]: false,
            [`${prefix}_route_error`]: "",
            dirty: true,
          };
        })
      );
    } catch (error) {
      if (routeRequestRef.current.get(requestKey) !== requestToken) {
        return;
      }

      console.error("AUTO PLAN QURAN RANGE:", error);

      setRows((current) =>
        current.map((row) => {
          if (Number(row.student_id) !== Number(studentId)) return row;

          return {
            ...row,
            [`${prefix}_generating`]: false,
            [`${prefix}_route_error`]:
              String(error?.message || "").includes("QURAN_RANGE_REVERSED")
                ? "اتجاه المسار لا يطابق نقطة البداية"
                : "تعذر حساب نهاية الخطة تلقائيًا",
          };
        })
      );
    }
  }

  function scheduleAutoRoute(studentId, prefix, snapshot) {
    const key = `${studentId}-${prefix}`;
    const oldTimer = routeTimerRef.current.get(key);

    if (oldTimer) clearTimeout(oldTimer);

    const timer = setTimeout(() => {
      routeTimerRef.current.delete(key);
      void regenerateAutoRoute(studentId, prefix, snapshot);
    }, 320);

    routeTimerRef.current.set(key, timer);
  }

  /* =====================================================
     UPDATE ROW
  ===================================================== */

  function updateRow(
    studentId,
    field,
    value
  ) {
    const currentRow = rows.find(
      (row) => Number(row.student_id) === Number(studentId)
    );

    if (!currentRow) return;

    if (isLockedPlan(currentRow)) {
      showToast(
        "الخطة مقفلة حاليًا ولا يمكن تعديلها",
        "info"
      );
      return;
    }

    const routeField = field.match(
      /^(memorization|revision)_(from_surah|from_ayah|to_surah|to_ayah|daily_amount|daily_unit|direction|auto_range)$/
    );

    const prefix = routeField?.[1] || null;
    const part = routeField?.[2] || null;

    const nextSnapshot = {
      ...currentRow,
      [field]: value,
      dirty: true,
    };

    if (prefix && ["to_surah", "to_ayah"].includes(part)) {
      nextSnapshot[`${prefix}_auto_range`] = false;
    }

    if (prefix && part === "direction") {
      nextSnapshot[`${prefix}_direction`] = normalizePlanDirection(value);
      nextSnapshot[`${prefix}_auto_range`] = true;
    }

    if (prefix && part === "auto_range") {
      nextSnapshot[`${prefix}_auto_range`] = Boolean(value);
    }

    setRows((current) =>
      current.map((row) => {
        if (Number(row.student_id) !== Number(studentId)) {
          return row;
        }

        return {
          ...nextSnapshot,
          plan_source:
            ["notes", "customization_reason"].includes(field)
              ? row.plan_source
              : "individual",
        };
      })
    );

    if (!prefix) return;

    const autoEnabled = Boolean(nextSnapshot[`${prefix}_auto_range`]);

    if (autoEnabled) {
      scheduleAutoRoute(studentId, prefix, nextSnapshot);
      return;
    }

    if (["from_surah", "from_ayah", "to_surah", "to_ayah", "direction"].includes(part)) {
      void refreshRouteTarget(studentId, prefix, nextSnapshot);
    }
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
    if (hasPendingRouteGeneration) {
      showToast(
        "انتظر لحظات حتى يكتمل حساب نهاية الخطة تلقائيًا",
        "info"
      );
      return false;
    }

    if (!validateNumbers()) {
      return false;
    }

    for (const row of rows) {
      const quranRequired = isQuranGoal(row.learning_goal);
      const nooraniaRequired = isNooraniaGoal(row.learning_goal);

      const memAny = hasAnyPlanRange(
        row.memorization_from_surah,
        row.memorization_from_ayah,
        row.memorization_to_surah,
        row.memorization_to_ayah
      );

      const memComplete = hasCompletePlanRange(
        row.memorization_from_surah,
        row.memorization_from_ayah,
        row.memorization_to_surah,
        row.memorization_to_ayah
      );

      const revAny = hasAnyPlanRange(
        row.revision_from_surah,
        row.revision_from_ayah,
        row.revision_to_surah,
        row.revision_to_ayah
      );

      const revComplete = hasCompletePlanRange(
        row.revision_from_surah,
        row.revision_from_ayah,
        row.revision_to_surah,
        row.revision_to_ayah
      );

      if (memAny && !memComplete) {
        showToast(
          `أكمل مسار الحفظ من سورة/آية إلى سورة/آية للطالب ${row.student_name}`,
          "error"
        );
        return false;
      }

      if (revAny && !revComplete) {
        showToast(
          `أكمل مسار المراجعة من سورة/آية إلى سورة/آية للطالب ${row.student_name}`,
          "error"
        );
        return false;
      }

      if (row.memorization_route_error || row.revision_route_error) {
        showToast(
          `صحح نطاق القرآن للطالب ${row.student_name} قبل الإرسال`,
          "error"
        );
        return false;
      }

      if (memComplete && Number(row.memorization_daily_amount || 0) <= 0) {
        showToast(
          `حدد سرعة الحفظ اليومية للطالب ${row.student_name}`,
          "error"
        );
        return false;
      }

      if (revComplete && Number(row.revision_daily_amount || 0) <= 0) {
        showToast(
          `حدد سرعة المراجعة اليومية للطالب ${row.student_name}`,
          "error"
        );
        return false;
      }

      const hasQuranPlan = memComplete || revComplete;

      const hasNooraniaPlan =
        Number(row.noorania_lesson_daily_amount || 0) > 0 ||
        Number(row.noorania_revision_daily_amount || 0) > 0;

      if (quranRequired && !nooraniaRequired && !hasQuranPlan) {
        showToast(
          `حدد مسار القرآن للطالب ${row.student_name}`,
          "error"
        );
        return false;
      }

      if (nooraniaRequired && !quranRequired && !hasNooraniaPlan) {
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
          `حدد مسار القرآن أو خطة القاعدة للطالب ${row.student_name}`,
          "error"
        );
        return false;
      }

      const usesDailyPlan =
        (memComplete && Number(row.memorization_daily_amount || 0) > 0) ||
        (revComplete && Number(row.revision_daily_amount || 0) > 0) ||
        hasNooraniaPlan;

      if (usesDailyPlan && Number(row.planned_sessions || 0) <= 0) {
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

      memorization_direction:
        normalizePlanDirection(
          row.memorization_direction
        ),

      memorization_auto_range:
        Boolean(
          row.memorization_auto_range
        ),

      revision_direction:
        normalizePlanDirection(
          row.revision_direction
        ),

      revision_auto_range:
        Boolean(
          row.revision_auto_range
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

  async function saveQuranStudentPolicy(row) {
    if (!isQuranGoal(row.learning_goal)) return;

    const mode = row.side_lesson_mode || "none";
    const needsAmount = mode === "previous_amount";

    if (needsAmount && (Number(row.side_lesson_amount || 0) <= 0 ||
        !["lines", "faces"].includes(row.side_lesson_unit))) {
      throw new Error(`حدد مقدار جنب الدرس ووحدته للطالب ${row.student_name}`);
    }

    const payload = {
      student_id: Number(row.student_id),
      halaqa_id: Number(selectedHalaqa),
      teacher_id: Number(teacher.id),
      side_lesson_mode: mode,
      side_lesson_amount: needsAmount ? Number(row.side_lesson_amount) : null,
      side_lesson_unit: needsAmount ? (row.side_lesson_unit || "faces") : null,
      boundary_suggestion_mode: row.boundary_suggestion_mode || "ayah_and_surah",
      active: true,
      effective_to: null,
      updated_at: new Date().toISOString(),
    };

    if (row.side_lesson_policy_id) {
      const { error } = await supabase
        .from("quran_student_policies")
        .update(payload)
        .eq("id", Number(row.side_lesson_policy_id));
      if (error) throw error;
      return;
    }

    const { data: existing, error: existingError } = await supabase
      .from("quran_student_policies")
      .select("id")
      .eq("student_id", Number(row.student_id))
      .eq("halaqa_id", Number(selectedHalaqa))
      .eq("active", true)
      .maybeSingle();
    if (existingError) throw existingError;

    if (existing?.id) {
      const { error } = await supabase
        .from("quran_student_policies")
        .update(payload)
        .eq("id", Number(existing.id));
      if (error) throw error;
      return;
    }

    const { error } = await supabase
      .from("quran_student_policies")
      .insert({
        ...payload,
        effective_from: period?.start || getLocalDate(),
      });
    if (error) throw error;
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

              await saveQuranStudentPolicy(row);
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

            await saveQuranStudentPolicy(row);
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
    if (!selectedHalaqa || !period) return;

    if (!confirmDiscard()) return;

    const previous = getPreviousHijriMonth(
      hijriYear,
      hijriMonth
    );

    const previousPeriod = getHijriMonthRange(
      previous.year,
      previous.month
    );

    const confirmed = window.confirm(
      `إعادة توليد خطة ${HIJRI_MONTHS[hijriMonth - 1]} ${hijriYear} هـ من آخر موضع فعلي في ${HIJRI_MONTHS[previous.month - 1]} ${previous.year} هـ؟\n\nسيحافظ النظام على المقدار اليومي والاتجاه، ويحسب النهاية الجديدة حسب أيام التسميع الفعلية بعد خصم الإجازات.`
    );

    if (!confirmed) return;

    setCopying(true);

    try {
      let { data: previousPlans, error } = await supabase
        .from("monthly_plans")
        .select("*")
        .eq("halaqa_id", Number(selectedHalaqa))
        .eq("plan_month", previousPeriod.start);

      if (error) throw error;

      if (!previousPlans?.length) {
        const fallback = await supabase
          .from("monthly_plans")
          .select("*")
          .eq("halaqa_id", Number(selectedHalaqa))
          .eq("hijri_year", previous.year)
          .eq("hijri_month", previous.month);

        if (fallback.error) throw fallback.error;
        previousPlans = fallback.data || [];
      }

      if (!previousPlans.length) {
        showToast(
          "لا توجد خطة محفوظة للشهر السابق",
          "info"
        );
        return;
      }

      const studentIds = rows.map((row) => Number(row.student_id));

      const { data: previousRecitations, error: recitationsError } = await supabase
        .from("recitations")
        .select(`
          id, student_id, recitation_date,
          from_surah, from_ayah, to_surah, to_ayah, lesson_evaluation,
          review_surah, review_from_ayah, review_to_surah, review_to_ayah, review_evaluation
        `)
        .eq("halaqa_id", Number(selectedHalaqa))
        .in("student_id", studentIds)
        .gte("recitation_date", previousPeriod.start)
        .lte("recitation_date", previousPeriod.end)
        .order("recitation_date", { ascending: false })
        .order("id", { ascending: false });

      if (recitationsError) throw recitationsError;

      const previousMap = new Map(
        previousPlans.map((plan) => [
          Number(plan.student_id),
          plan,
        ])
      );

      const recitationMap = new Map();
      (previousRecitations || []).forEach((record) => {
        const studentId = Number(record.student_id);
        const list = recitationMap.get(studentId) || [];
        list.push(record);
        recitationMap.set(studentId, list);
      });

      let copiedCount = 0;

      const nextRows = await Promise.all(
        rows.map(async (row) => {
          if (isLockedPlan(row)) return row;

          const previousPlan = previousMap.get(Number(row.student_id));
          if (!previousPlan) return row;

          copiedCount += 1;

          return buildNextMonthPlanSnapshot({
            row,
            previousPlan,
            previousRecitations:
              recitationMap.get(Number(row.student_id)) || [],
          });
        })
      );

      setRows(nextRows);

      showToast(
        `تم توليد خطط ${copiedCount} طالب من آخر موضع فعلي`,
        "success"
      );
    } catch (error) {
      console.error("SMART PREVIOUS PLAN:", error);

      showToast(
        error.message || "تعذر توليد الخطة من الشهر السابق",
        "error"
      );
    } finally {
      setCopying(false);
    }
  }

  /* =====================================================
     APPLY HALAQA TEMPLATE
  ===================================================== */

  async function applyHalaqaTemplate() {
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
      "سيتم تطبيق المقادير اليومية على جميع الطلاب القابلين للتعديل، ثم يعاد حساب نهاية الخطة تلقائيًا لكل طالب لديه نقطة بداية حسب أيام تسميعه الفعلية بعد خصم الإجازات."
    );

    if (!confirmed) return;

    setLoading(true);

    try {
      const nextRows = await Promise.all(
        rows.map(async (row) => {
          if (isLockedPlan(row)) return row;

          const quranStudent = isQuranGoal(row.learning_goal);
          const nooraniaStudent = isNooraniaGoal(row.learning_goal);

          let next = {
            ...row,
            memorization_daily_amount:
              quranStudent ? template.memorization_daily_amount : "",
            memorization_daily_unit:
              quranStudent ? template.memorization_daily_unit : "lines",
            revision_daily_amount:
              quranStudent ? template.revision_daily_amount : "",
            revision_daily_unit:
              quranStudent ? template.revision_daily_unit : "faces",
            memorization_auto_range:
              quranStudent ? true : row.memorization_auto_range,
            revision_auto_range:
              quranStudent ? true : row.revision_auto_range,
            noorania_lesson_daily_amount:
              nooraniaStudent ? template.noorania_lesson_daily_amount : "",
            noorania_lesson_daily_unit:
              nooraniaStudent ? template.noorania_lesson_daily_unit : "lesson",
            noorania_revision_daily_amount:
              nooraniaStudent ? template.noorania_revision_daily_amount : "",
            noorania_revision_daily_unit:
              nooraniaStudent ? template.noorania_revision_daily_unit : "faces",
            recitation_days_snapshot: row.recitation_days,
            notes: template.notes || row.notes,
            customization_reason: "",
            plan_source: "halaqa_template",
            status: "draft",
            dirty: true,
          };

          if (quranStudent) {
            next = await applyAutomaticRangeToSnapshot(next, "memorization");
            next = await applyAutomaticRangeToSnapshot(next, "revision");
          }

          return next;
        })
      );

      setRows(nextRows);
      setTemplateOpen(false);

      showToast(
        "تم تطبيق الخطة الذكية وإعادة حساب النهايات تلقائيًا",
        "success"
      );
    } catch (error) {
      console.error("APPLY SMART HALAQA TEMPLATE:", error);
      showToast(
        error.message || "تعذر تطبيق الخطة الموحدة",
        "error"
      );
    } finally {
      setLoading(false);
    }
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
              حدّد نقطة البداية والمقدار اليومي والاتجاه مرة واحدة؛ والصديق يحسب نهاية الحفظ والمراجعة تلقائيًا حسب الجلسات الفعلية بعد خصم الإجازات.
            </p>
          </div>
        </div>

        <div
          className="plan-hero-actions"
        >
          {teacherPreferences.plan_copy_previous_suggestion !== false && (
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
                توليد من الشهر السابق
              </span>
            </button>
          )}

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

          <div className={`autosave-chip ${autoSaving ? "saving" : ""}`}>
            {autoSaving ? (
              <Loader2 size={14} className="spin" />
            ) : (
              <Save size={14} />
            )}
            <span>
              {autoSaving
                ? "حفظ تلقائي..."
                : lastAutoSavedAt
                  ? "تم الحفظ تلقائيًا"
                  : "الحفظ التلقائي مفعّل"}
            </span>
          </div>

          <button
            type="button"
            className="hero-btn save"
            onClick={() =>
              saveAll()
            }
            disabled={
              saving ||
              autoSaving ||
              loading ||
              hasPendingRouteGeneration
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
              حفظ الآن
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
              autoSaving ||
              hasPendingRouteGeneration ||
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

          {hasPendingRouteGeneration
            ? "جارٍ حساب نهاية الخطة من المصحف..."
            : autoSaving
              ? "جارٍ حفظ التعديلات تلقائيًا..."
              : "تم رصد تعديلات وستُحفظ تلقائيًا خلال لحظات."}

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
                showPace={teacherPreferences.plan_show_pace !== false}
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
  showPace = true,
  onChange,
}) {
  const [detailsOpen, setDetailsOpen] = useState(false);

  const locked = isLockedPlan(row);
  const status = getStatusInfo(row.status);
  const source = getSourceInfo(row.plan_source);

  const scheduledExpected = getScheduledElapsedPercent(
    period,
    row.recitation_days_snapshot,
    row.planned_sessions,
    row.holiday_dates
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

                <div className="holiday-session-summary">
                  <span>
                    الجلسات الفعلية للشهر: <strong>{row.planned_sessions || 0}</strong>
                  </span>
                  {Number(row.holiday_sessions || 0) > 0 && (
                    <span className="holiday-deduction">
                      خصم {row.holiday_sessions} {Number(row.holiday_sessions) === 1 ? "جلسة إجازة" : "جلسات إجازة"}
                      {" • "}
                      قبل الخصم {row.scheduled_sessions_before_holidays}
                    </span>
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
                        direction={row.memorization_direction}
                        autoRange={row.memorization_auto_range}
                        generating={row.memorization_generating}
                        routeError={row.memorization_route_error}
                        showPace={showPace}
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
                        direction={row.revision_direction}
                        autoRange={row.revision_auto_range}
                        generating={row.revision_generating}
                        routeError={row.revision_route_error}
                        showPace={showPace}
                      />
                    </div>

                    <SideLessonPolicyEditor
                      row={row}
                      locked={locked}
                      onChange={onChange}
                    />
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
  direction = "forward",
  autoRange = true,
  generating = false,
  routeError = "",
  showPace = true,
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

  const routeComplete = hasCompletePlanRange(
    fromSurah,
    fromAyah,
    toSurah,
    toAyah
  );

  const startComplete = hasPlanStart(
    fromSurah,
    fromAyah
  );

  const totalRequested = totalDailyPlanAmount(
    dailyAmount,
    plannedSessions
  );

  return (
    <section className={`student-plan-section ${type} smart-plan-section`}>
      <div className="plan-section-title">
        <div>
          {icon}
          <strong>{title}</strong>
        </div>

        {showPace && (
          <span className={`pace-badge ${pace.className}`}>
            {pace.label}
          </span>
        )}
      </div>

      <div className="route-first-card">
        <div className="route-first-head">
          <div>
            <BookOpen size={15} />
            <strong>المسار القرآني الذكي</strong>
          </div>
          <span>{autoRange ? "النهاية تُحسب تلقائيًا" : "النهاية معدلة يدويًا"}</span>
        </div>

        <div className="route-direction-panel">
          <div className="route-direction-label">
            <span>اتجاه السير</span>
            <small>في اتجاه الناس نعكس ترتيب السور فقط، أما الآيات فتبقى من أول السورة إلى آخرها.</small>
          </div>

          <div className="route-direction-toggle">
            <button
              type="button"
              disabled={locked}
              className={normalizePlanDirection(direction) === "forward" ? "active" : ""}
              onClick={() => onChange(`${fieldPrefix}_direction`, "forward")}
            >
              من البقرة وما بعدها
            </button>

            <button
              type="button"
              disabled={locked}
              className={normalizePlanDirection(direction) === "backward" ? "active" : ""}
              onClick={() => onChange(`${fieldPrefix}_direction`, "backward")}
            >
              من الناس وما قبلها
            </button>
          </div>
        </div>

        <div className="plan-range-grid route-required-grid">
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
            label={autoRange ? "إلى سورة — تلقائي" : "إلى سورة — يدوي"}
            value={toSurah}
            disabled={locked || autoRange}
            onChange={(value) =>
              onChange(`${fieldPrefix}_to_surah`, value)
            }
          />

          <NumberField
            label={autoRange ? "إلى آية — تلقائي" : "إلى آية — يدوي"}
            value={toAyah}
            disabled={locked || autoRange}
            min="1"
            step="1"
            onChange={(value) =>
              onChange(`${fieldPrefix}_to_ayah`, value)
            }
          />
        </div>

        <div className="auto-range-switch-row">
          <button
            type="button"
            className={autoRange ? "auto-range-switch active" : "auto-range-switch"}
            disabled={locked}
            onClick={() => onChange(`${fieldPrefix}_auto_range`, !autoRange)}
          >
            <Sparkles size={14} />
            {autoRange ? "الحساب التلقائي مفعّل" : "تفعيل الحساب التلقائي"}
          </button>

          {!autoRange && (
            <span className="manual-range-note">
              عدّل النهاية يدويًا، أو أعد تشغيل الحساب التلقائي في أي وقت.
            </span>
          )}
        </div>

        <div className={`route-calculated-result ${routeComplete ? "ready" : "empty"}`}>
          {generating ? (
            <>
              <Loader2 size={15} className="spin" />
              <span>جارٍ حساب نهاية الخطة من المصحف...</span>
            </>
          ) : routeError ? (
            <>
              <CircleAlert size={15} />
              <span>{routeError}</span>
            </>
          ) : routeComplete ? (
            <>
              <ShieldCheck size={15} />
              <span>
                {autoRange ? "النهاية المحسوبة:" : "حجم المسار اليدوي:"}
              </span>
              <strong>{formatPagesAndLines(targetNumber)}</strong>
            </>
          ) : !startComplete ? (
            <span>ابدأ باختيار السورة والآية فقط.</span>
          ) : Number(dailyAmount || 0) <= 0 ? (
            <span>حدد مقدار التسميع اليومي ليحسب الصديق نهاية الشهر.</span>
          ) : Number(plannedSessions || 0) <= 0 ? (
            <span>لا توجد جلسات فعلية في هذا الشهر بعد خصم الإجازات.</span>
          ) : (
            <span>سيتم حساب نهاية الخطة تلقائيًا.</span>
          )}
        </div>
      </div>

      <div className="daily-plan-editor speed-only-editor">
        <div className="daily-plan-input-block">
          <label>سرعة الجلسة</label>

          <div className="daily-amount-control">
            <input
              type="number"
              min="0"
              step={dailyUnit === "lines" ? "1" : "0.25"}
              disabled={locked || !startComplete}
              value={dailyAmount ?? ""}
              onChange={(event) =>
                onChange(
                  `${fieldPrefix}_daily_amount`,
                  event.target.value === ""
                    ? ""
                    : Number(event.target.value)
                )
              }
              placeholder={dailyUnit === "lines" ? "مثال: 3" : "مثال: 1"}
            />

            <div className="daily-unit-toggle">
              <button
                type="button"
                disabled={locked || !startComplete}
                className={dailyUnit === "lines" ? "active" : ""}
                onClick={() => onChange(`${fieldPrefix}_daily_unit`, "lines")}
              >
                أسطر
              </button>

              <button
                type="button"
                disabled={locked || !startComplete}
                className={dailyUnit === "faces" ? "active" : ""}
                onClick={() => onChange(`${fieldPrefix}_daily_unit`, "faces")}
              >
                صفحات
              </button>
            </div>
          </div>

          <small className="speed-helper">
            {autoRange
              ? `الصديق يضرب المقدار في ${plannedSessions || 0} جلسة فعلية${totalRequested > 0 ? ` = ${formatFaces(totalRequested)} ${dailyUnit === "lines" ? "سطر" : "صفحة"}` : ""} ثم يحدد آخر آية تلقائيًا.`
              : "الحساب التلقائي متوقف؛ النهاية التي أدخلتها يدويًا هي المعتمدة."}
          </small>
        </div>

        <div className="monthly-target-card clean-result route-target-card">
          <span>{autoRange ? "هدف الشهر التلقائي" : "حجم المسار"}</span>
          <strong>{routeComplete ? formatPagesAndLines(targetNumber) : "—"}</strong>
        </div>
      </div>

      {showPace && routeComplete && (
        <div className="plan-progress smart-plan-progress">
          <div className="progress-heading">
            <div>
              <span>المنجز</span>
              <strong>{formatPagesAndLines(achievedNumber)}</strong>
            </div>

            <div>
              <span>المتبقي</span>
              <strong>{formatPagesAndLines(remaining)}</strong>
            </div>

            <div>
              <span>تحقيق المسار</span>
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
      )}
    </section>
  );
}

function SideLessonPolicyEditor({ row, locked, onChange }) {
  const modes = [
    { value: "none", label: "بدون جنب درس", hint: "يظهر الدرس والمراجعة فقط" },
    { value: "previous_amount", label: "مقدار سابق", hint: "يرجع قبل درس اليوم بالمقدار المحدد" },
    { value: "previous_surah", label: "السورة السابقة", hint: "السورة السابقة كاملة تلقائيًا" },
    { value: "from_surah_start", label: "من بداية السورة", hint: "من أول السورة إلى ما قبل درس اليوم" },
  ];

  return (
    <section className="side-policy-card">
      <div className="side-policy-head">
        <div>
          <Target size={17} />
          <div>
            <strong>سياسة جنب الدرس</strong>
            <span>تحدد مرة واحدة ويولدها النظام تلقائيًا في كل جلسة</span>
          </div>
        </div>
        <span className="side-policy-badge">لا يدخل في الحفظ الجديد</span>
      </div>

      <div className="side-policy-modes">
        {modes.map((item) => (
          <button
            type="button"
            key={item.value}
            disabled={locked}
            className={row.side_lesson_mode === item.value ? "active" : ""}
            onClick={() => onChange("side_lesson_mode", item.value)}
          >
            <strong>{item.label}</strong>
            <span>{item.hint}</span>
          </button>
        ))}
      </div>

      {row.side_lesson_mode === "previous_amount" && (
        <div className="side-policy-amount">
          <label>المقدار السابق</label>
          <div className="daily-amount-control">
            <input
              type="number"
              min="0.25"
              step={row.side_lesson_unit === "lines" ? "1" : "0.25"}
              disabled={locked}
              value={row.side_lesson_amount ?? ""}
              onChange={(event) =>
                onChange("side_lesson_amount", event.target.value === "" ? "" : Number(event.target.value))
              }
              placeholder={row.side_lesson_unit === "lines" ? "مثال: 5" : "مثال: 1"}
            />
            <div className="daily-unit-toggle">
              <button type="button" disabled={locked} className={row.side_lesson_unit === "lines" ? "active" : ""} onClick={() => onChange("side_lesson_unit", "lines")}>أسطر</button>
              <button type="button" disabled={locked} className={row.side_lesson_unit === "faces" ? "active" : ""} onClick={() => onChange("side_lesson_unit", "faces")}>أوجه</button>
            </div>
          </div>
        </div>
      )}

      <div className="side-policy-boundary">
        <label>اقتراح الحد الطبيعي</label>
        <select disabled={locked} value={row.boundary_suggestion_mode || "ayah_and_surah"} onChange={(event) => onChange("boundary_suggestion_mode", event.target.value)}>
          <option value="ayah_and_surah">نهاية آية أو سورة</option>
          <option value="ayah">نهاية آية</option>
          <option value="surah">نهاية سورة</option>
          <option value="none">بدون اقتراح</option>
        </select>
        <small>النظام يقترح فقط، والمعلم يقرر.</small>
      </div>
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

          gap: calc(18px * var(--app-density,1));

          padding: calc(22px * var(--app-density,1)) calc(24px * var(--app-density,1));
          margin-bottom: 14px;

          border:
            1px solid color-mix(in srgb,var(--app-color-0f5132,#0f5132) 10%,transparent);

          border-radius: calc(23px * var(--app-radius-scale,1));

          background:
            linear-gradient(
              135deg,
              #ffffff 0%,
              var(--app-color-f5faf7,#f5faf7) 63%,
              #fffaf0 100%
            );

          box-shadow:
            0 13px 37px
            color-mix(in srgb,var(--app-color-0f5132,#0f5132) 5%,transparent);
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

          gap: calc(12px * var(--app-density,1));

          min-width: 0;
        }

        .plan-hero-icon {
          width: 50px;
          height: 50px;

          flex: 0 0 50px;

          border-radius: calc(16px * var(--app-radius-scale,1));

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
            0 10px 24px
            color-mix(in srgb,var(--app-color-0f5132,#0f5132) 18%,transparent);
        }

        .plan-eyebrow {
          display: flex;
          align-items: center;

          gap: calc(5px * var(--app-density,1));

          margin-bottom: 3px;

          color: #9a741f;

          font-size: calc(9px * var(--app-font-scale,1));
          font-weight: 900;
        }

        .plan-hero h1 {
          margin: 0;

          color: var(--app-color-173d2b,#173d2b);

          font-size: calc(25px * var(--app-font-scale,1));
          font-weight: 950;
        }

        .plan-hero p {
          max-width: 500px;

          margin: 5px 0 0;

          color: #758079;

          font-size: calc(10px * var(--app-font-scale,1));
          line-height: 1.75;
        }

        .plan-hero-actions {
          position: relative;
          z-index: 2;

          display: flex;
          flex-wrap: wrap;
          justify-content: flex-end;

          gap: calc(6px * var(--app-density,1));
        }

        .hero-btn {
          min-height: 40px;

          padding: 0 calc(11px * var(--app-density,1));

          border-radius: calc(10px * var(--app-radius-scale,1));

          display: inline-flex;
          align-items: center;
          justify-content: center;

          gap: calc(5px * var(--app-density,1));

          font-size: calc(8px * var(--app-font-scale,1));
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
              var(--app-color-0f5132,#0f5132),
              var(--app-color-0f766e,#0f766e)
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

          gap: calc(6px * var(--app-density,1));

          margin-bottom: 12px;
          padding: calc(9px * var(--app-density,1)) calc(12px * var(--app-density,1));

          border:
            1px solid #efd9a7;

          border-radius: calc(12px * var(--app-radius-scale,1));

          color: #765a17;
          background: #fff8e7;

          font-size: calc(8px * var(--app-font-scale,1));
        }

        .plan-unsaved button {
          margin-right: auto;

          border: none;
          border-radius: calc(8px * var(--app-radius-scale,1));

          padding: calc(6px * var(--app-density,1)) calc(9px * var(--app-density,1));

          color: #fff;
          background: #8a6717;

          font-size: calc(7px * var(--app-font-scale,1));
          font-weight: 900;

          cursor: pointer;
        }

        /* ==========================================
           FLOW NOTE
        ========================================== */

        .plan-flow-note {
          display: flex;
          align-items: center;

          gap: calc(8px * var(--app-density,1));

          padding: calc(10px * var(--app-density,1)) calc(13px * var(--app-density,1));
          margin-bottom: 14px;

          border:
            1px solid #dcebe3;

          border-radius: calc(13px * var(--app-radius-scale,1));

          color: #37624c;
          background: #f4faf6;
        }

        .plan-flow-note strong {
          display: block;

          margin-bottom: 1px;

          font-size: calc(8px * var(--app-font-scale,1));
        }

        .plan-flow-note span {
          display: block;

          color: #678074;

          font-size: calc(7px * var(--app-font-scale,1));
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

          gap: calc(10px * var(--app-density,1));

          padding: calc(14px * var(--app-density,1));
          margin-bottom: 14px;

          border:
            1px solid #e3e9e5;

          border-radius: calc(19px * var(--app-radius-scale,1));

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

          border-radius: calc(11px * var(--app-radius-scale,1));

          display: flex;
          align-items: center;
          justify-content: center;

          color: var(--app-color-0f5132,#0f5132);
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

          gap: calc(10px * var(--app-density,1));
        }

        .plan-period-icon {
          width: 44px;
          height: 44px;

          flex: 0 0 44px;

          border-radius: calc(13px * var(--app-radius-scale,1));

          display: flex;
          align-items: center;
          justify-content: center;

          color: var(--app-color-0f5132,#0f5132);
          background: var(--app-color-edf7f1,#edf7f1);
        }

        .plan-period-content {
          min-width: 0;
        }

        .plan-period-content
        > span {
          display: block;

          margin-bottom: 4px;

          color: #8a958e;

          font-size: calc(7px * var(--app-font-scale,1));
        }

        .plan-period-selects {
          display: flex;
          align-items: center;

          gap: calc(6px * var(--app-density,1));
        }

        .select-shell {
          position: relative;
        }

        .select-shell select {
          min-width: 155px;
          height: 35px;

          appearance: none;

          padding:
            0 calc(10px * var(--app-density,1)) 0 calc(28px * var(--app-density,1));

          border:
            1px solid #dce4df;

          border-radius: calc(9px * var(--app-radius-scale,1));

          outline: none;

          color: var(--app-color-173d2b,#173d2b);
          background: #fbfdfc;

          font-size: calc(10px * var(--app-font-scale,1));
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

          font-size: calc(6px * var(--app-font-scale,1));
        }

        .period-gregorian
        strong {
          display: flex;
          align-items: center;
          flex-wrap: wrap;

          gap: calc(5px * var(--app-density,1));

          margin-top: 2px;

          color: #7b672f;

          font-size: calc(7px * var(--app-font-scale,1));
        }

        .period-gregorian b {
          color: #a6aea9;
        }

        .period-current button {
          min-height: 34px;

          padding: 0 calc(10px * var(--app-density,1));

          border:
            1px solid #cadcd1;

          border-radius: calc(9px * var(--app-radius-scale,1));

          color: var(--app-color-0f5132,#0f5132);
          background: var(--app-color-f5faf7,#f5faf7);

          font-size: calc(7px * var(--app-font-scale,1));
          font-weight: 850;

          cursor: pointer;
        }

        /* ==========================================
           SCOPE
        ========================================== */

        .plan-scope-card {
          padding: calc(13px * var(--app-density,1));
          margin-bottom: 14px;

          border:
            1px solid #e4eae6;

          border-radius: calc(18px * var(--app-radius-scale,1));

          background: #fff;

          box-shadow:
            0 6px 21px
            rgba(15,23,42,.025);
        }

        .plan-scope-heading {
          display: flex;
          align-items: center;

          gap: calc(8px * var(--app-density,1));

          margin-bottom: 10px;
        }

        .scope-icon {
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

        .plan-scope-heading
        strong {
          display: block;

          color: #33443a;

          font-size: calc(9px * var(--app-font-scale,1));
        }

        .plan-scope-heading
        span {
          display: block;

          margin-top: 1px;

          color: #939c96;

          font-size: calc(6px * var(--app-font-scale,1));
        }

        .plan-scope-grid {
          display: grid;

          grid-template-columns:
            minmax(190px,.7fr)
            minmax(250px,1.2fr)
            minmax(200px,.8fr);

          gap: calc(8px * var(--app-density,1));

          align-items: end;
        }

        .field label {
          display: block;

          margin-bottom: 4px;

          color: #627067;

          font-size: calc(7px * var(--app-font-scale,1));
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

          border-radius: calc(10px * var(--app-radius-scale,1));

          outline: none;

          color: #33443a;
          background: #fbfdfc;

          font-size: calc(8px * var(--app-font-scale,1));
        }

        .select-wrap select {
          appearance: none;

          padding:
            0 calc(9px * var(--app-density,1)) 0 calc(29px * var(--app-density,1));
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
            0 calc(34px * var(--app-density,1)) 0 calc(31px * var(--app-density,1));
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
          border-radius: calc(7px * var(--app-radius-scale,1));

          display: flex;
          align-items: center;
          justify-content: center;

          color: #667169;
          background: #edf1ef;

          cursor: pointer;
        }

        .halaqa-card {
          min-height: 55px;

          padding: calc(8px * var(--app-density,1)) calc(10px * var(--app-density,1));

          border:
            1px solid #eee0bd;

          border-radius: calc(11px * var(--app-radius-scale,1));

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

          font-size: calc(6px * var(--app-font-scale,1));
        }

        .halaqa-card strong {
          display: block;

          margin: 2px 0;

          color: #70571a;

          font-size: calc(9px * var(--app-font-scale,1));
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

          gap: calc(9px * var(--app-density,1));

          margin-bottom: 17px;
        }

        .plan-stat {
          min-width: 0;

          display: flex;
          align-items: center;

          gap: calc(8px * var(--app-density,1));

          padding: calc(12px * var(--app-density,1));

          border:
            1px solid #e5ebe7;

          border-radius: calc(16px * var(--app-radius-scale,1));

          background: #fff;

          box-shadow:
            0 6px 20px
            rgba(15,23,42,.025);
        }

        .plan-stat-icon {
          width: 36px;
          height: 36px;

          flex: 0 0 36px;

          border-radius: calc(11px * var(--app-radius-scale,1));

          display: flex;
          align-items: center;
          justify-content: center;
        }

        .plan-stat.students
        .plan-stat-icon {
          color: var(--app-color-0f5132,#0f5132);
          background: var(--app-color-edf7f1,#edf7f1);
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
          color: var(--app-color-0f766e,#0f766e);
          background: var(--app-color-edf8f7,#edf8f7);
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

          font-size: calc(7px * var(--app-font-scale,1));
        }

        .plan-stat-content > strong {
          display: block;

          margin-top: 1px;

          color: var(--app-color-173d2b,#173d2b);

          font-size: calc(17px * var(--app-font-scale,1));
          font-weight: 950;
        }

        .plan-stat-content > small {
          display: block;

          margin-top: 1px;

          color: #9ba39e;

          font-size: calc(6px * var(--app-font-scale,1));
          line-height: 1.4;
        }

        /* ==========================================
           HEADER
        ========================================== */

        .plan-students-header {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;

          gap: calc(8px * var(--app-density,1));

          margin-bottom: 10px;
        }

        .plan-students-header h2 {
          margin: 0;

          color: var(--app-color-173d2b,#173d2b);

          font-size: calc(17px * var(--app-font-scale,1));
          font-weight: 950;
        }

        .plan-students-header p {
          margin: 3px 0 0;

          color: #909993;

          font-size: calc(7px * var(--app-font-scale,1));
        }

        .plan-students-header
        > span {
          display: inline-flex;
          align-items: center;

          gap: calc(4px * var(--app-density,1));

          color: #758178;

          font-size: calc(7px * var(--app-font-scale,1));
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

          gap: calc(12px * var(--app-density,1));
        }

        .student-plan-card {
          position: relative;
          overflow: hidden;

          min-width: 0;

          padding: calc(14px * var(--app-density,1));

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

        .student-plan-card:hover {
          transform:
            translateY(-2px);

          box-shadow:
            0 13px 31px
            color-mix(in srgb,var(--app-color-0f5132,#0f5132) 6.5%,transparent);
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
              var(--app-color-0f5132,#0f5132),
              #c9a227
            );
        }

        .student-plan-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;

          gap: calc(8px * var(--app-density,1));

          margin-bottom: 10px;
        }

        .student-plan-identity {
          display: flex;
          align-items: center;

          gap: calc(8px * var(--app-density,1));

          min-width: 0;
        }

        .student-plan-avatar {
          width: 39px;
          height: 39px;

          flex: 0 0 39px;

          border-radius: calc(12px * var(--app-radius-scale,1));

          display: flex;
          align-items: center;
          justify-content: center;

          color: var(--app-color-0f5132,#0f5132);
          background: var(--app-color-edf7f1,#edf7f1);
        }

        .student-plan-identity
        h3 {
          margin: 0;

          overflow: hidden;

          color: #293a30;

          font-size: calc(11px * var(--app-font-scale,1));
          font-weight: 950;

          white-space: nowrap;
          text-overflow: ellipsis;
        }

        .student-plan-identity
        span {
          display: block;

          margin-top: 2px;

          color: #939c96;

          font-size: calc(6px * var(--app-font-scale,1));
        }

        .student-plan-badges {
          display: flex;
          flex-wrap: wrap;
          justify-content: flex-end;

          gap: calc(4px * var(--app-density,1));
        }

        .plan-source-badge,
        .plan-status-badge {
          min-height: 23px;

          padding: 0 calc(7px * var(--app-density,1));

          border-radius: 999px;

          display: inline-flex;
          align-items: center;
          justify-content: center;

          font-size: calc(6px * var(--app-font-scale,1));
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

          gap: calc(6px * var(--app-density,1));

          margin-bottom: 9px;
          padding: calc(8px * var(--app-density,1)) calc(9px * var(--app-density,1));

          border:
            1px solid #fed7aa;

          border-radius: calc(10px * var(--app-radius-scale,1));

          color: #9a4d08;
          background: #fff7ed;
        }

        .supervisor-note strong {
          display: block;

          font-size: calc(7px * var(--app-font-scale,1));
        }

        .supervisor-note span {
          display: block;

          margin-top: 2px;

          color: #a46127;

          font-size: calc(6px * var(--app-font-scale,1));
          line-height: 1.5;
        }

        /* ==========================================
           LIVE SOURCE
        ========================================== */

        .plan-live-source {
          display: grid;

          grid-template-columns:
            1fr 1.5fr;

          gap: calc(6px * var(--app-density,1));

          margin-bottom: 9px;
          padding: calc(8px * var(--app-density,1));

          border-radius: calc(10px * var(--app-radius-scale,1));

          background: var(--app-color-f7faf8,#f7faf8);
        }

        .plan-live-source
        > div {
          display: flex;
          align-items: center;

          gap: calc(4px * var(--app-density,1));

          min-width: 0;

          color: #7d8981;

          font-size: calc(6px * var(--app-font-scale,1));
        }

        .plan-live-source
        strong {
          overflow: hidden;

          color: #46554c;

          font-size: calc(7px * var(--app-font-scale,1));

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

          gap: calc(8px * var(--app-density,1));
        }

        .student-plan-section {
          overflow: hidden;

          border:
            1px solid #e4eae6;

          border-radius: calc(14px * var(--app-radius-scale,1));

          background: #fbfdfc;
        }

        .plan-section-title {
          display: flex;
          align-items: center;
          justify-content: space-between;

          gap: calc(7px * var(--app-density,1));

          padding: calc(9px * var(--app-density,1)) calc(10px * var(--app-density,1));

          border-bottom:
            1px solid #e9eeeb;
        }

        .plan-section-title
        > div {
          display: flex;
          align-items: center;

          gap: calc(5px * var(--app-density,1));
        }

        .plan-section-title
        strong {
          color: #33443a;

          font-size: calc(8px * var(--app-font-scale,1));
        }

        .student-plan-section.memorization
        .plan-section-title
        > div {
          color: #047857;
        }

        .student-plan-section.revision
        .plan-section-title
        > div {
          color: var(--app-color-0f766e,#0f766e);
        }

        /* Pace Badge */

        .pace-badge {
          min-height: 22px;

          padding: 0 calc(6px * var(--app-density,1));

          border-radius: 999px;

          display: inline-flex;
          align-items: center;
          justify-content: center;

          font-size: calc(5.8px * var(--app-font-scale,1));
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

          gap: calc(5px * var(--app-density,1));

          padding: calc(8px * var(--app-density,1));
        }

        .plan-field {
          min-width: 0;
        }

        .plan-field label {
          display: block;

          margin-bottom: 4px;

          color: #738077;

          font-size: calc(5.8px * var(--app-font-scale,1));
          font-weight: 800;
        }

        .plan-field input,
        .plan-field select {
          width: 100%;
          height: 34px;

          border:
            1px solid #dce4df;

          border-radius: calc(8px * var(--app-radius-scale,1));

          outline: none;

          color: #3b4a41;
          background: #fff;

          font-size: calc(7px * var(--app-font-scale,1));
        }

        .plan-field input {
          padding: 0 calc(7px * var(--app-density,1));
        }

        .plan-select-wrap {
          position: relative;
        }

        .plan-select-wrap select {
          appearance: none;

          padding:
            0 calc(7px * var(--app-density,1)) 0 calc(23px * var(--app-density,1));
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

          gap: calc(6px * var(--app-density,1));

          padding:
            0 calc(8px * var(--app-density,1)) calc(8px * var(--app-density,1));
        }

        .plan-target-row label {
          display: block;

          margin-bottom: 4px;

          color: #6c7971;

          font-size: calc(6px * var(--app-font-scale,1));
          font-weight: 850;
        }

        .target-input {
          position: relative;
        }

        .target-input input {
          width: 100%;
          height: 35px;

          padding:
            0 calc(7px * var(--app-density,1)) 0 calc(37px * var(--app-density,1));

          border:
            1px solid #dce4df;

          border-radius: calc(9px * var(--app-radius-scale,1));

          outline: none;

          color: #33443a;
          background: #fff;

          font-size: calc(8px * var(--app-font-scale,1));
        }

        .target-input span {
          position: absolute;

          left: 8px;
          top: 50%;

          transform:
            translateY(-50%);

          color: #89938c;

          font-size: calc(6px * var(--app-font-scale,1));
        }

        .target-summary {
          padding: calc(7px * var(--app-density,1)) calc(8px * var(--app-density,1));

          border:
            1px solid #e2e9e5;

          border-radius: calc(9px * var(--app-radius-scale,1));

          background: #fff;
        }

        .target-summary span {
          display: block;

          color: #89938c;

          font-size: calc(6px * var(--app-font-scale,1));
        }

        .target-summary strong {
          display: block;

          margin-top: 2px;

          color: var(--app-color-0f5132,#0f5132);

          font-size: calc(13px * var(--app-font-scale,1));
          font-weight: 950;
        }

        .target-summary small {
          color: #89938c;

          font-size: calc(7px * var(--app-font-scale,1));
        }

        /* ==========================================
           PROGRESS
        ========================================== */

        .plan-progress {
          padding: calc(8px * var(--app-density,1)) calc(9px * var(--app-density,1));

          border-top:
            1px solid #e8edea;

          background: #fff;
        }

        .progress-heading {
          display: flex;
          align-items: center;
          justify-content: space-between;

          gap: calc(8px * var(--app-density,1));

          margin-bottom: 6px;
        }

        .progress-heading
        > div {
          display: flex;
          align-items: center;

          gap: calc(4px * var(--app-density,1));
        }

        .progress-heading span {
          color: #87928b;

          font-size: calc(5.8px * var(--app-font-scale,1));
        }

        .progress-heading strong {
          color: #425047;

          font-size: calc(7px * var(--app-font-scale,1));
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
              var(--app-color-0f5132,#0f5132),
              #16a36d
            );
        }

        .progress-fill.near {
          background:
            linear-gradient(
              90deg,
              var(--app-color-0f766e,#0f766e),
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

          gap: calc(6px * var(--app-density,1));

          margin-top: 5px;

          color: #98a19b;

          font-size: calc(5.5px * var(--app-font-scale,1));
        }

        /* ==========================================
           BOTTOM
        ========================================== */

        .plan-card-bottom {
          display: grid;

          grid-template-columns:
            .8fr 1.2fr;

          gap: calc(7px * var(--app-density,1));

          margin-top: 8px;
        }

        .bottom-field label {
          display: flex;
          align-items: center;

          gap: calc(4px * var(--app-density,1));

          margin-bottom: 4px;

          color: #6c7971;

          font-size: calc(6px * var(--app-font-scale,1));
          font-weight: 850;
        }

        .bottom-field input,
        .bottom-field textarea {
          width: 100%;

          border:
            1px solid #dce4df;

          border-radius: calc(9px * var(--app-radius-scale,1));

          outline: none;

          color: #3d4c43;
          background: #fbfdfc;

          font-size: calc(7px * var(--app-font-scale,1));
        }

        .bottom-field input {
          height: 35px;

          padding: 0 calc(8px * var(--app-density,1));
        }

        .bottom-field textarea {
          min-height: 52px;

          padding: calc(7px * var(--app-density,1));

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

          gap: calc(5px * var(--app-density,1));

          margin-top: 8px;
          padding: calc(7px * var(--app-density,1)) calc(8px * var(--app-density,1));

          border-radius: calc(9px * var(--app-radius-scale,1));

          color: #65736a;
          background: #f2f5f3;

          font-size: calc(6px * var(--app-font-scale,1));
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

          padding: calc(16px * var(--app-density,1));

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

          border-radius: calc(22px * var(--app-radius-scale,1));

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

          gap: calc(10px * var(--app-density,1));

          padding: calc(15px * var(--app-density,1)) calc(17px * var(--app-density,1));

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

          font-size: calc(7px * var(--app-font-scale,1));
          font-weight: 900;
        }

        .template-header h2 {
          margin:
            2px 0 0;

          color: var(--app-color-173d2b,#173d2b);

          font-size: calc(15px * var(--app-font-scale,1));
        }

        .template-header p {
          margin:
            3px 0 0;

          color: #919a94;

          font-size: calc(7px * var(--app-font-scale,1));
        }

        .template-header
        > button {
          width: 35px;
          height: 35px;

          border: none;
          border-radius: calc(9px * var(--app-radius-scale,1));

          display: flex;
          align-items: center;
          justify-content: center;

          color: #64748b;
          background: #f1f5f3;

          cursor: pointer;
        }

        .template-body {
          padding: calc(12px * var(--app-density,1));
        }

        .template-section {
          padding: calc(12px * var(--app-density,1));
          margin-bottom: 9px;

          border:
            1px solid #e4eae6;

          border-radius: calc(14px * var(--app-radius-scale,1));

          background: #fff;
        }

        .template-section-title {
          display: flex;
          align-items: center;

          gap: calc(5px * var(--app-density,1));

          margin-bottom: 10px;

          color: var(--app-color-0f5132,#0f5132);
        }

        .template-section-title
        strong {
          color: #34443a;

          font-size: calc(9px * var(--app-font-scale,1));
        }

        .template-range {
          display: grid;

          grid-template-columns:
            1fr .55fr 1fr .55fr;

          gap: calc(6px * var(--app-density,1));
        }

        .template-target {
          margin-top: 9px;
        }

        .template-target label,
        .template-notes label {
          display: block;

          margin-bottom: 4px;

          color: #657169;

          font-size: calc(6px * var(--app-font-scale,1));
          font-weight: 850;
        }

        .template-target > div {
          position: relative;
        }

        .template-target input {
          width: 100%;
          height: 36px;

          padding:
            0 calc(8px * var(--app-density,1)) 0 calc(38px * var(--app-density,1));

          border:
            1px solid #dce4df;

          border-radius: calc(9px * var(--app-radius-scale,1));

          outline: none;

          font-size: calc(8px * var(--app-font-scale,1));
        }

        .template-target
        > div > span {
          position: absolute;

          left: 8px;
          top: 50%;

          transform:
            translateY(-50%);

          color: #8b958e;

          font-size: calc(6px * var(--app-font-scale,1));
        }

        .template-notes {
          padding: calc(12px * var(--app-density,1));

          border:
            1px solid #e4eae6;

          border-radius: calc(14px * var(--app-radius-scale,1));

          background: #fff;
        }

        .template-notes textarea {
          width: 100%;
          min-height: 70px;

          padding: calc(8px * var(--app-density,1));

          border:
            1px solid #dce4df;

          border-radius: calc(9px * var(--app-radius-scale,1));

          outline: none;

          resize: vertical;

          font-size: calc(7px * var(--app-font-scale,1));
        }

        .template-footer {
          position: sticky;
          bottom: 0;

          display: flex;
          justify-content: flex-end;

          gap: calc(6px * var(--app-density,1));

          padding: calc(11px * var(--app-density,1)) calc(13px * var(--app-density,1));

          border-top:
            1px solid #e7ede9;

          background:
            rgba(255,255,255,.97);
        }

        .template-footer button {
          min-height: 38px;

          padding: 0 calc(13px * var(--app-density,1));

          border-radius: calc(9px * var(--app-radius-scale,1));

          font-size: calc(7px * var(--app-font-scale,1));
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

          gap: calc(5px * var(--app-density,1));

          color: #fff;

          background:
            linear-gradient(
              135deg,
              var(--app-color-0f5132,#0f5132),
              var(--app-color-0f766e,#0f766e)
            );
        }

        /* ==========================================
           EMPTY / LOADING
        ========================================== */

        .plan-empty {
          padding: calc(50px * var(--app-density,1)) calc(20px * var(--app-density,1));

          border:
            1px dashed #cbd7d0;

          border-radius: calc(18px * var(--app-radius-scale,1));

          text-align: center;

          background: #fff;
        }

        .plan-empty-icon,
        .plan-loading-icon {
          width: 55px;
          height: 55px;

          margin:
            0 auto 10px;

          border-radius: calc(16px * var(--app-radius-scale,1));

          display: flex;
          align-items: center;
          justify-content: center;

          color: var(--app-color-0f5132,#0f5132);
          background: var(--app-color-edf7f1,#edf7f1);
        }

        .plan-empty h3,
        .plan-page-loading h3 {
          margin: 0;

          color: #35453b;

          font-size: calc(13px * var(--app-font-scale,1));
        }

        .plan-empty p,
        .plan-page-loading p {
          margin: 4px 0 0;

          color: #8d9790;

          font-size: calc(8px * var(--app-font-scale,1));
        }

        .plan-inline-loading {
          min-height: 190px;

          display: flex;
          align-items: center;
          justify-content: center;
          flex-direction: column;

          gap: calc(7px * var(--app-density,1));

          color: #718077;

          text-align: center;
        }

        .plan-inline-loading
        strong {
          font-size: calc(9px * var(--app-font-scale,1));
        }

        .plan-inline-loading
        span {
          color: #979f9a;

          font-size: calc(7px * var(--app-font-scale,1));
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

            padding: calc(16px * var(--app-density,1));

            border-radius: calc(19px * var(--app-radius-scale,1));
          }

          .plan-hero-icon {
            width: 42px;
            height: 42px;

            flex-basis: 42px;
          }

          .plan-hero h1 {
            font-size: calc(20px * var(--app-font-scale,1));
          }

          .plan-hero p {
            display: none;
          }

          .plan-hero-actions {
            gap: calc(4px * var(--app-density,1));
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

            gap: calc(6px * var(--app-density,1));
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

            gap: calc(7px * var(--app-density,1));
          }

          .plan-stat {
            padding: calc(10px * var(--app-density,1));
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

            padding: calc(7px * var(--app-density,1));
          }

          .template-modal {
            max-height: 95dvh;

            border-radius:
              calc(21px * var(--app-radius-scale,1)) calc(21px * var(--app-radius-scale,1))
              calc(9px * var(--app-radius-scale,1)) calc(9px * var(--app-radius-scale,1));
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
            padding: calc(13px * var(--app-density,1));
          }

          .plan-hero h1 {
            font-size: calc(18px * var(--app-font-scale,1));
          }

          .plan-hero-icon {
            width: 38px;
            height: 38px;

            flex-basis: 38px;
          }

          .plan-eyebrow {
            font-size: calc(7px * var(--app-font-scale,1));
          }

          .plan-stats {
            grid-template-columns:
              1fr 1fr;
          }

          .plan-stat-content
          > strong {
            font-size: calc(14px * var(--app-font-scale,1));
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
          --smart-green: var(--app-color-0f4c45,#0f4c45);
          --smart-deep: var(--app-color-082f2a,#082f2a);
          --smart-gold: #d1b34c;
          --smart-ink: #173a33;
          --smart-muted: #71837c;
          --smart-border: #dce6e2;
        }

        .plan-hero {
          min-height: 178px;
          padding: calc(26px * var(--app-density,1)) calc(28px * var(--app-density,1));
          border-radius: calc(25px * var(--app-radius-scale,1));
          background:
            radial-gradient(circle at 10% 10%, rgba(209,179,76,.14), transparent 25%),
            linear-gradient(135deg, #ffffff 0%, #f4f9f6 68%, #fffaf0 100%);
          box-shadow: 0 16px 38px color-mix(in srgb,var(--app-color-082f2a,#082f2a) 5.5%,transparent);
        }

        .plan-hero h1 {
          font-size: calc(29px * var(--app-font-scale,1));
          line-height: 1.2;
        }

        .plan-hero p {
          max-width: 760px;
          font-size: calc(13px * var(--app-font-scale,1));
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
          font-size: calc(11px * var(--app-font-scale,1));
          line-height: 1.55;
        }

        .plan-students-header h2 {
          font-size: calc(19px * var(--app-font-scale,1));
        }

        .plan-students-header p,
        .plan-students-header > span {
          font-size: calc(12px * var(--app-font-scale,1));
        }

        .student-plan-card {
          padding: calc(18px * var(--app-density,1));
          border-radius: calc(21px * var(--app-radius-scale,1));
          box-shadow: 0 10px 28px color-mix(in srgb,var(--app-color-082f2a,#082f2a) 4.5%,transparent);
        }

        .student-plan-identity h3 {
          font-size: calc(15px * var(--app-font-scale,1));
          line-height: 1.4;
        }

        .smart-plan-schedule {
          margin-top: 13px;
          padding: calc(12px * var(--app-density,1)) calc(13px * var(--app-density,1));
          border: 1px solid #dfe9e5;
          border-radius: calc(14px * var(--app-radius-scale,1));
          background: linear-gradient(135deg, #f8fbfa, #ffffff);
        }

        .smart-plan-schedule-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: calc(10px * var(--app-density,1));
        }

        .smart-plan-schedule-head > div {
          display: inline-flex;
          align-items: center;
          gap: calc(6px * var(--app-density,1));
          color: var(--smart-green);
        }

        .smart-plan-schedule-head strong {
          font-size: calc(12px * var(--app-font-scale,1));
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
          border: 1px solid color-mix(in srgb,var(--app-color-0f4c45,#0f4c45) 12%,transparent);
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
          background: linear-gradient(180deg, var(--app-color-0f4c45,#0f4c45), #d1b34c);
        }

        .monthly-target-card.clean-result span,
        .noorania-monthly-target.clean-result span {
          color: #71837c;
          font-size: calc(11px * var(--app-font-scale,1));
          font-weight: 850;
        }

        .monthly-target-card.clean-result strong,
        .noorania-monthly-target.clean-result strong {
          margin-top: 6px;
          color: var(--app-color-082f2a,#082f2a);
          font-size: calc(20px * var(--app-font-scale,1));
          line-height: 1.35;
          font-weight: 950;
        }

        .smart-session-count {
          min-height: 29px;
          display: inline-flex;
          align-items: center;
          padding: 0 calc(9px * var(--app-density,1));
          border-radius: 999px;
          background: #eef7f3;
          color: #2d6c5c;
          font-size: calc(10px * var(--app-font-scale,1));
          font-weight: 900;
        }

        .smart-day-chips {
          display: flex;
          flex-wrap: wrap;
          gap: calc(6px * var(--app-density,1));
          margin-top: 9px;
        }

        .smart-day-chips > span {
          min-height: 29px;
          display: inline-flex;
          align-items: center;
          padding: 0 calc(9px * var(--app-density,1));
          border: 1px solid #dce7e2;
          border-radius: calc(9px * var(--app-radius-scale,1));
          background: #fff;
          color: #60766e;
          font-size: calc(10px * var(--app-font-scale,1));
          font-weight: 850;
        }

        .smart-day-chips > span.empty-days {
          border-style: dashed;
          color: #a06f1d;
          background: #fffaf0;
        }

        .smart-programs {
          display: grid;
          gap: calc(13px * var(--app-density,1));
          margin-top: 13px;
        }

        .smart-program-block {
          padding: calc(13px * var(--app-density,1));
          border: 1px solid #dfe8e4;
          border-radius: calc(17px * var(--app-radius-scale,1));
          background: #fbfcfb;
        }

        .smart-program-block.quran-program {
          background:
            radial-gradient(circle at 100% 0%, color-mix(in srgb,var(--app-color-0f4c45,#0f4c45) 4.5%,transparent), transparent 26%),
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
          gap: calc(12px * var(--app-density,1));
          margin-bottom: 10px;
        }

        .smart-program-title > div {
          display: inline-flex;
          align-items: center;
          gap: calc(7px * var(--app-density,1));
          color: var(--smart-green);
        }

        .smart-program-title strong {
          color: var(--smart-deep);
          font-size: calc(13px * var(--app-font-scale,1));
          font-weight: 950;
        }

        .smart-program-title > span {
          color: #7c8f88;
          font-size: calc(10px * var(--app-font-scale,1));
          font-weight: 750;
        }

        .plan-sections {
          gap: calc(10px * var(--app-density,1));
        }

        .smart-plan-section {
          padding: calc(14px * var(--app-density,1));
          border-radius: calc(15px * var(--app-radius-scale,1));
          background: #fff;
        }

        .plan-section-title strong {
          font-size: calc(13px * var(--app-font-scale,1));
        }

        .pace-badge {
          font-size: calc(10px * var(--app-font-scale,1));
        }

        .daily-plan-editor {
          display: grid;
          grid-template-columns: minmax(0, 1.25fr) minmax(180px, .75fr);
          gap: calc(10px * var(--app-density,1));
          margin-top: 11px;
        }

        .daily-plan-input-block,
        .monthly-target-card {
          min-height: 112px;
          padding: calc(11px * var(--app-density,1));
          border: 1px solid #e1e9e6;
          border-radius: calc(13px * var(--app-radius-scale,1));
          background: #f9fbfa;
        }

        .daily-plan-input-block > label,
        .monthly-target-card > span {
          display: block;
          color: #6f827b;
          font-size: calc(10px * var(--app-font-scale,1));
          font-weight: 850;
        }

        .daily-amount-control {
          display: grid;
          grid-template-columns: minmax(90px, 1fr) auto;
          gap: calc(7px * var(--app-density,1));
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
          border-radius: calc(10px * var(--app-radius-scale,1));
          outline: none;
          background: #fff;
          color: #294840;
          font-family: inherit;
          font-size: calc(13px * var(--app-font-scale,1));
          font-weight: 800;
        }

        .daily-amount-control > input,
        .noorania-daily-control input,
        .template-smart-amount input {
          padding: 0 calc(10px * var(--app-density,1));
        }

        .daily-amount-control > input:focus,
        .noorania-daily-control input:focus,
        .noorania-daily-control select:focus,
        .template-smart-amount input:focus,
        .template-smart-amount select:focus {
          border-color: #9fc7bb;
          box-shadow: 0 0 0 4px color-mix(in srgb,var(--app-color-0f4c45,#0f4c45) 5.5%,transparent);
        }

        .daily-unit-toggle {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          overflow: hidden;
          border: 1px solid #d9e4df;
          border-radius: calc(10px * var(--app-radius-scale,1));
          background: #fff;
        }

        .daily-unit-toggle button {
          min-width: 62px;
          border: 0;
          background: transparent;
          color: #6f817b;
          font-size: calc(10px * var(--app-font-scale,1));
          font-weight: 900;
          cursor: pointer;
        }

        .daily-unit-toggle button + button {
          border-right: 1px solid #e3eae7;
        }

        .daily-unit-toggle button.active {
          background: #eaf7f1;
          color: var(--app-color-147a5e,#147a5e);
        }

        .daily-conversion-note {
          display: block;
          margin-top: 7px;
          color: #83948e;
          font-size: calc(10px * var(--app-font-scale,1));
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
          font-size: calc(17px * var(--app-font-scale,1));
          line-height: 1.35;
          font-weight: 950;
        }

        .monthly-target-card small {
          display: block;
          margin-top: 5px;
          color: #81928c;
          font-size: calc(9px * var(--app-font-scale,1));
          line-height: 1.5;
        }

        .smart-plan-progress {
          margin-top: 10px;
        }

        .smart-plan-progress .progress-heading {
          grid-template-columns: repeat(3, minmax(0,1fr));
        }

        .smart-plan-progress .progress-heading span {
          font-size: calc(9px * var(--app-font-scale,1));
        }

        .smart-plan-progress .progress-heading strong {
          font-size: calc(11px * var(--app-font-scale,1));
          line-height: 1.45;
        }

        .advanced-route-details {
          margin-top: 10px;
          border-top: 1px dashed #dde5e2;
          padding-top: calc(9px * var(--app-density,1));
        }

        .advanced-route-details > summary {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: calc(8px * var(--app-density,1));
          list-style: none;
          color: #687c75;
          font-size: calc(10px * var(--app-font-scale,1));
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
          gap: calc(10px * var(--app-density,1));
        }

        .noorania-daily-card {
          padding: calc(12px * var(--app-density,1));
          border: 1px solid #eadfb7;
          border-radius: calc(13px * var(--app-radius-scale,1));
          background: rgba(255,255,255,.88);
        }

        .noorania-daily-title {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: calc(8px * var(--app-density,1));
        }

        .noorania-daily-title strong {
          color: #5c4914;
          font-size: calc(12px * var(--app-font-scale,1));
          font-weight: 950;
        }

        .noorania-daily-title span {
          color: #9a8442;
          font-size: calc(9px * var(--app-font-scale,1));
          font-weight: 850;
        }

        .noorania-daily-control {
          display: grid;
          grid-template-columns: 1fr 100px;
          gap: calc(7px * var(--app-density,1));
          margin-top: 8px;
        }

        .noorania-daily-control select,
        .template-smart-amount select {
          padding: 0 calc(8px * var(--app-density,1));
        }

        .noorania-monthly-target {
          margin-top: 9px;
          padding: calc(9px * var(--app-density,1));
          border-radius: calc(10px * var(--app-radius-scale,1));
          background: #fff9e8;
        }

        .noorania-monthly-target span,
        .noorania-monthly-target strong,
        .noorania-monthly-target small {
          display: block;
        }

        .noorania-monthly-target span {
          color: #9b8240;
          font-size: calc(9px * var(--app-font-scale,1));
          font-weight: 800;
        }

        .noorania-monthly-target strong {
          margin-top: 3px;
          color: #5e4c19;
          font-size: calc(15px * var(--app-font-scale,1));
          font-weight: 950;
        }

        .noorania-monthly-target small {
          margin-top: 3px;
          color: #9a8a61;
          font-size: calc(9px * var(--app-font-scale,1));
        }

        .noorania-plan-note {
          display: flex;
          align-items: center;
          gap: calc(7px * var(--app-density,1));
          margin-top: 9px;
          color: #8e742c;
          font-size: calc(10px * var(--app-font-scale,1));
          line-height: 1.5;
          font-weight: 800;
        }

        .template-smart-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0,1fr));
          gap: calc(9px * var(--app-density,1));
        }

        .template-smart-amount {
          padding: calc(10px * var(--app-density,1));
          border: 1px solid #e0e8e5;
          border-radius: calc(12px * var(--app-radius-scale,1));
          background: #f9fbfa;
        }

        .template-smart-amount > label {
          display: block;
          margin-bottom: 6px;
          color: #566c65;
          font-size: calc(10px * var(--app-font-scale,1));
          font-weight: 900;
        }

        .template-smart-amount > div {
          display: grid;
          grid-template-columns: 1fr 90px;
          gap: calc(7px * var(--app-density,1));
        }

        .plan-field input,
        .plan-field select,
        .bottom-field input,
        .bottom-field textarea,
        .plan-filter-control input,
        .plan-filter-control select {
          font-size: calc(12px * var(--app-font-scale,1));
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
            font-size: calc(22px * var(--app-font-scale,1));
          }

          .plan-hero p {
            font-size: calc(12px * var(--app-font-scale,1));
          }

          .daily-amount-control {
            grid-template-columns: 1fr;
          }

          .daily-unit-toggle {
            min-height: 40px;
          }

          .smart-plan-progress .progress-heading {
            grid-template-columns: 1fr;
            gap: calc(6px * var(--app-density,1));
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
          gap: calc(12px * var(--app-density,1));
        }

        .plan-summary-card {
          position: relative;
          overflow: hidden;
          min-height: 220px;
          padding: calc(16px * var(--app-density,1));
          border: 1px solid #dfe8e4;
          border-radius: calc(19px * var(--app-radius-scale,1));
          background: linear-gradient(180deg, #fff, #fbfdfc);
          box-shadow: 0 10px 26px color-mix(in srgb,var(--app-color-082f2a,#082f2a) 4.5%,transparent);
          transition: transform .18s ease, box-shadow .18s ease, border-color .18s ease;
        }

        .plan-summary-card:hover {
          transform: translateY(-2px);
          border-color: #bdd5cd;
          box-shadow: 0 16px 34px color-mix(in srgb,var(--app-color-082f2a,#082f2a) 7.5%,transparent);
        }

        .plan-summary-card.locked { background: #fbfcfb; }

        .plan-summary-accent {
          position: absolute;
          top: 0;
          right: 0;
          width: 4px;
          height: 100%;
          background: linear-gradient(180deg, var(--app-color-0f4c45,#0f4c45), #d1b34c);
        }

        .plan-summary-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: calc(12px * var(--app-density,1));
        }

        .student-plan-identity.compact { gap: calc(10px * var(--app-density,1)); }
        .compact-avatar { width: 42px; height: 42px; flex-basis: 42px; }
        .plan-summary-name { min-width: 0; }
        .plan-summary-name h3 {
          margin: 0;
          overflow: hidden;
          color: var(--app-color-173d33,#173d33);
          font-size: calc(15px * var(--app-font-scale,1));
          line-height: 1.4;
          font-weight: 950;
          white-space: nowrap;
          text-overflow: ellipsis;
        }
        .plan-summary-name span {
          display: block;
          margin-top: 4px;
          color: #82918b;
          font-size: calc(11px * var(--app-font-scale,1));
          font-weight: 750;
        }
        .compact-badges .plan-source-badge,
        .compact-badges .plan-status-badge {
          min-height: 25px;
          padding: 0 calc(8px * var(--app-density,1));
          font-size: calc(9px * var(--app-font-scale,1));
        }

        .plan-summary-days {
          display: grid;
          grid-template-columns: 18px auto 1fr;
          gap: calc(7px * var(--app-density,1));
          align-items: center;
          margin-top: 13px;
          padding: calc(9px * var(--app-density,1)) calc(10px * var(--app-density,1));
          border-radius: calc(11px * var(--app-radius-scale,1));
          background: var(--app-color-f4f8f6,#f4f8f6);
          color: #587068;
        }
        .plan-summary-days span { font-size: calc(10px * var(--app-font-scale,1)); font-weight: 850; }
        .plan-summary-days strong {
          overflow: hidden;
          color: #345048;
          font-size: calc(11px * var(--app-font-scale,1));
          font-weight: 900;
          white-space: nowrap;
          text-overflow: ellipsis;
        }

        .plan-summary-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0,1fr));
          gap: calc(8px * var(--app-density,1));
          margin-top: 10px;
        }
        .plan-summary-item {
          min-height: 76px;
          padding: calc(10px * var(--app-density,1));
          border: 1px solid #e5ece9;
          border-radius: calc(12px * var(--app-radius-scale,1));
          background: #fff;
        }
        .plan-summary-item span,
        .plan-summary-item strong,
        .plan-summary-item small { display: block; }
        .plan-summary-item span { color: #81928b; font-size: calc(10px * var(--app-font-scale,1)); font-weight: 800; }
        .plan-summary-item strong { margin-top: 4px; color: var(--app-color-173d33,#173d33); font-size: calc(13px * var(--app-font-scale,1)); font-weight: 950; }
        .plan-summary-item small { margin-top: 4px; color: #9b8a57; font-size: calc(9px * var(--app-font-scale,1)); font-weight: 750; }

        .plan-summary-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: calc(10px * var(--app-density,1));
          margin-top: 12px;
          padding-top: calc(11px * var(--app-density,1));
          border-top: 1px solid #edf1ef;
        }
        .plan-summary-state {
          min-width: 0;
          display: flex;
          align-items: center;
          gap: calc(6px * var(--app-density,1));
          color: #72847d;
          font-size: calc(10px * var(--app-font-scale,1));
          font-weight: 750;
        }
        .plan-view-button {
          min-height: 37px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: calc(6px * var(--app-density,1));
          padding: 0 calc(13px * var(--app-density,1));
          border: 0;
          border-radius: calc(10px * var(--app-radius-scale,1));
          background: var(--app-color-0f4c45,#0f4c45);
          color: #fff;
          font-family: inherit;
          font-size: calc(11px * var(--app-font-scale,1));
          font-weight: 900;
          cursor: pointer;
          box-shadow: 0 8px 18px color-mix(in srgb,var(--app-color-0f4c45,#0f4c45) 14.000000000000002%,transparent);
        }

        .plan-details-overlay {
          position: fixed;
          inset: 0;
          z-index: 10020;
          display: grid;
          place-items: center;
          padding: calc(18px * var(--app-density,1));
          background: rgba(3,24,21,.58);
          backdrop-filter: blur(7px);
        }
        .plan-details-modal {
          width: min(1060px, 100%);
          max-height: calc(100vh - 36px);
          overflow: auto;
          border: 1px solid rgba(255,255,255,.5);
          border-radius: calc(23px * var(--app-radius-scale,1));
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
          gap: calc(14px * var(--app-density,1));
          padding: calc(17px * var(--app-density,1)) calc(19px * var(--app-density,1));
          border-bottom: 1px solid #e4ece8;
          background: rgba(255,255,255,.97);
          backdrop-filter: blur(12px);
        }
        .plan-details-eyebrow { color: #9a7a27; font-size: calc(10px * var(--app-font-scale,1)); font-weight: 900; }
        .plan-details-header h2 { margin: 2px 0 0; color: #0f3b32; font-size: calc(19px * var(--app-font-scale,1)); font-weight: 950; }
        .plan-details-header p { margin: 3px 0 0; color: #83938d; font-size: calc(10px * var(--app-font-scale,1)); }
        .plan-details-close {
          width: 38px;
          height: 38px;
          display: grid;
          place-items: center;
          border: 1px solid #dfe8e4;
          border-radius: calc(11px * var(--app-radius-scale,1));
          background: #fff;
          color: #587068;
          cursor: pointer;
        }
        .plan-details-body { padding: calc(17px * var(--app-density,1)) calc(18px * var(--app-density,1)) calc(22px * var(--app-density,1)); }
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
          padding: calc(11px * var(--app-density,1)) calc(18px * var(--app-density,1));
          border-top: 1px solid #e5ece9;
          background: rgba(250,252,251,.97);
        }
        .plan-details-footer button {
          min-height: 39px;
          padding: 0 calc(16px * var(--app-density,1));
          border: 0;
          border-radius: calc(10px * var(--app-radius-scale,1));
          background: #eef4f1;
          color: #3d5c53;
          font-family: inherit;
          font-size: calc(11px * var(--app-font-scale,1));
          font-weight: 900;
          cursor: pointer;
        }

        /* تكبير المقروئية داخل نافذة التفاصيل فقط بدون تضخيم الصناديق */
        .plan-details-modal .smart-program-title strong,
        .plan-details-modal .plan-section-title strong,
        .plan-details-modal .noorania-daily-title strong,
        .plan-details-modal .bottom-field label,
        .plan-details-modal .daily-plan-input-block label,
        .plan-details-modal .plan-field label { font-size: calc(11px * var(--app-font-scale,1)); }
        .plan-details-modal input,
        .plan-details-modal select,
        .plan-details-modal textarea { font-size: calc(12px * var(--app-font-scale,1)); }
        .plan-details-modal .daily-plan-editor {
          grid-template-columns: minmax(0,1fr) 155px;
          gap: calc(9px * var(--app-density,1));
        }
        .plan-details-modal .monthly-target-card.clean-result,
        .plan-details-modal .noorania-monthly-target.clean-result {
          min-height: 70px;
          padding: calc(9px * var(--app-density,1));
        }
        .plan-details-modal .monthly-target-card.clean-result strong,
        .plan-details-modal .noorania-monthly-target.clean-result strong { font-size: calc(16px * var(--app-font-scale,1)); }
        .plan-details-modal .progress-heading span,
        .plan-details-modal .progress-foot,
        .plan-details-modal .pace-badge { font-size: calc(9px * var(--app-font-scale,1)); }
        .plan-details-modal .progress-heading strong { font-size: calc(11px * var(--app-font-scale,1)); }
        .plan-details-modal .holiday-session-summary { display:flex; align-items:center; gap:8px; flex-wrap:wrap; margin-top:10px; font-size:10px; color:#607069; }
        .holiday-session-summary strong { color:var(--app-color-173d2b,#173d2b); font-size:12px; }
        .holiday-session-summary .holiday-deduction { color:#8a6a10; background:#fffaf0; border:1px solid rgba(201,162,39,.22); border-radius:999px; padding:4px 8px; }
        .smart-day-chips span { font-size: calc(10px * var(--app-font-scale,1)); }

        @media (max-width: 700px) {
          .plan-grid { grid-template-columns: 1fr; }
          .plan-summary-grid { grid-template-columns: 1fr 1fr; }
          .plan-details-overlay { align-items: end; padding: calc(6px * var(--app-density,1)); }
          .plan-details-modal { max-height: calc(100vh - 12px); border-radius: calc(20px * var(--app-radius-scale,1)) calc(20px * var(--app-radius-scale,1)) calc(8px * var(--app-radius-scale,1)) calc(8px * var(--app-radius-scale,1)); }
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


        .route-first-card {
          border: 1px solid rgba(27, 92, 70, .14);
          border-radius: 18px;
          padding: 14px;
          background:
            radial-gradient(circle at top right, rgba(201,166,88,.09), transparent 32%),
            linear-gradient(135deg, #fbfdfc, #ffffff);
          margin-bottom: 12px;
        }

        .route-first-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          margin-bottom: 11px;
        }

        .route-first-head > div {
          display: flex;
          align-items: center;
          gap: 7px;
          color: #17483a;
        }

        .route-first-head strong {
          font-size: 12px;
          font-weight: 900;
        }

        .route-first-head > span {
          color: #85703d;
          font-size: 10px;
          font-weight: 800;
        }

        .route-required-grid {
          margin-top: 0;
        }

        .route-calculated-result {
          min-height: 42px;
          margin-top: 10px;
          border-radius: 13px;
          display: flex;
          align-items: center;
          gap: 7px;
          padding: 9px 11px;
          font-size: 11px;
        }

        .route-calculated-result.ready {
          color: #1b5a47;
          background: rgba(223, 242, 234, .7);
          border: 1px solid rgba(27, 90, 71, .12);
        }

        .route-calculated-result.empty {
          color: #728079;
          background: #f8faf9;
          border: 1px dashed #dce6e1;
        }

        .route-calculated-result strong {
          color: #7b6127;
          margin-inline-start: auto;
          font-weight: 900;
        }

        .side-policy-card {
          margin-top: 14px;
          border: 1px solid rgba(164, 125, 44, 0.18);
          border-radius: 22px;
          padding: 18px;
          background: radial-gradient(circle at top left, rgba(184,146,61,.08), transparent 34%), linear-gradient(180deg, rgba(255,255,255,.96), rgba(248,249,244,.96));
        }
        .side-policy-head { display:flex; align-items:center; justify-content:space-between; gap:12px; margin-bottom:14px; }
        .side-policy-head > div { display:flex; align-items:flex-start; gap:10px; }
        .side-policy-head strong { display:block; color:#263a2b; }
        .side-policy-head span { display:block; color:#768078; font-size:12px; margin-top:3px; }
        .side-policy-badge { padding:7px 10px; border-radius:999px; background:rgba(66,97,68,.08); color:#426144 !important; white-space:nowrap; }
        .side-policy-modes { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:9px; }
        .side-policy-modes button { border:1px solid #e1e5dd; border-radius:15px; background:#fff; padding:12px; text-align:right; cursor:pointer; transition:.18s ease; }
        .side-policy-modes button:hover:not(:disabled) { transform:translateY(-2px); }
        .side-policy-modes button.active { border-color:#557558; box-shadow:0 8px 24px rgba(54,81,57,.10); background:#f8fbf7; }
        .side-policy-modes button strong { display:block; color:#2b3e2e; font-size:13px; }
        .side-policy-modes button span { display:block; color:#858c85; font-size:11px; margin-top:4px; line-height:1.55; }
        .side-policy-amount,.side-policy-boundary { margin-top:13px; }
        .side-policy-amount > label,.side-policy-boundary > label { display:block; font-size:12px; color:#667068; margin-bottom:7px; }
        .side-policy-boundary select { width:100%; min-height:42px; border:1px solid #dfe4dc; border-radius:12px; padding:0 12px; background:#fff; color:#314034; }
        .side-policy-boundary small { display:block; margin-top:6px; color:#8a918b; }
        @media (max-width:820px) { .side-policy-modes { grid-template-columns:repeat(2,minmax(0,1fr)); } .side-policy-head { align-items:flex-start; flex-direction:column; } }

        .speed-only-editor {
          align-items: stretch;
        }

        .speed-helper {
          display: block;
          margin-top: 7px;
          color: #728079;
          font-size: 10px;
          line-height: 1.65;
        }

        .route-target-card {
          border-color: rgba(201,166,88,.18);
          background: rgba(201,166,88,.07);
        }

        .route-direction-panel {
          display: grid;
          grid-template-columns: minmax(130px,.45fr) minmax(0,1fr);
          gap: 10px;
          align-items: center;
          margin-bottom: 12px;
          padding: 10px;
          border: 1px solid #e7ece9;
          border-radius: 14px;
          background: #f9fbfa;
        }
        .route-direction-label span {
          display: block;
          color: #31584d;
          font-size: 11px;
          font-weight: 900;
        }
        .route-direction-label small {
          display: block;
          margin-top: 3px;
          color: #87938e;
          font-size: 9px;
        }
        .route-direction-toggle {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 6px;
        }
        .route-direction-toggle button {
          min-height: 38px;
          padding: 7px 9px;
          border: 1px solid #dfe7e3;
          border-radius: 11px;
          background: #fff;
          color: #64756e;
          font-family: inherit;
          font-size: 10px;
          font-weight: 850;
          cursor: pointer;
        }
        .route-direction-toggle button.active {
          border-color: rgba(20,91,72,.28);
          background: #eaf5f0;
          color: #145b48;
          box-shadow: inset 0 0 0 1px rgba(20,91,72,.05);
        }
        .route-direction-toggle button:disabled { opacity: .55; cursor: not-allowed; }

        .auto-range-switch-row {
          display: flex;
          align-items: center;
          gap: 9px;
          flex-wrap: wrap;
          margin-top: 10px;
        }
        .auto-range-switch {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          min-height: 34px;
          padding: 0 10px;
          border: 1px solid #dfe7e3;
          border-radius: 999px;
          background: #fff;
          color: #65766f;
          font-family: inherit;
          font-size: 10px;
          font-weight: 900;
          cursor: pointer;
        }
        .auto-range-switch.active {
          border-color: rgba(176,137,47,.24);
          background: #fff9e9;
          color: #80631e;
        }
        .manual-range-note {
          color: #7f8a85;
          font-size: 9px;
          line-height: 1.5;
        }

        .autosave-chip {
          min-height: 38px;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 0 10px;
          border: 1px solid rgba(25,103,79,.13);
          border-radius: 12px;
          background: rgba(236,247,242,.85);
          color: #24634f;
          font-size: 10px;
          font-weight: 900;
          white-space: nowrap;
        }
        .autosave-chip.saving {
          border-color: rgba(176,137,47,.18);
          background: #fff9e9;
          color: #836720;
        }

        @media (max-width: 700px) {
          .route-direction-panel { grid-template-columns: 1fr; }
          .route-direction-toggle { grid-template-columns: 1fr; }
          .autosave-chip { width: 100%; justify-content: center; }
        }
      `}
    </style>
  );
}
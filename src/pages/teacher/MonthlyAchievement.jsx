// src/pages/teacher/MonthlyAchievement.jsx

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  BadgeCheck,
  BookOpen,
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  FileSpreadsheet,
  History,
  Layers3,
  Loader2,
  MessageSquareText,
  Printer,
  RefreshCw,
  Save,
  Search,
  ShieldCheck,
  Sparkles,
  Target,
  Trophy,
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

import * as XLSX from "xlsx";

/* =========================================================
   الشهور الهجرية
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
   فترات الحلقات
========================================================= */

const HALAQA_PERIODS = {
  after_fajr: "بعد الفجر",
  after_dhuhr: "بعد الظهر",
  after_asr: "بعد العصر",
  after_maghrib: "بعد المغرب",
  after_isha: "بعد العشاء",
};

/* =========================================================
   Hijri / Gregorian Helpers
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

const hijriCache =
  new Map();

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
  value
) {
  return new Date(
    `${value}T12:00:00`
  );
}

function pad2(value) {
  return String(value)
    .padStart(2, "0");
}

function roundFaces(
  value
) {
  return (
    Math.round(
      (
        Number(value || 0) +
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
    roundFaces(value);

  if (
    Number.isInteger(number)
  ) {
    return String(number);
  }

  return number
    .toFixed(2)
    .replace(
      /\.?0+$/,
      ""
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
    year: result.year,
    month: result.month,
    day: result.day,
  };
}

/*
  يحول تاريخ هجري أم القرى
  إلى تاريخ ميلادي.

  لا نرسل السنة الهجرية مباشرة
  إلى عمود date في PostgreSQL.
*/

function findGregorianForHijri(
  hijriYear,
  hijriMonth,
  hijriDay = 1
) {
  const cacheKey =
    `date-${hijriYear}-${hijriMonth}-${hijriDay}`;

  if (
    hijriCache.has(
      cacheKey
    )
  ) {
    return hijriCache.get(
      cacheKey
    );
  }

  /*
    تقريب السنة الميلادية
    لتقليل نطاق البحث.
  */

  const approxYear =
    Math.floor(
      Number(hijriYear) *
        0.970224 +
        621.5774
    );

  const cursor =
    new Date(
      approxYear - 1,
      0,
      1,
      12,
      0,
      0
    );

  const end =
    new Date(
      approxYear + 1,
      11,
      31,
      12,
      0,
      0
    );

  while (
    cursor <= end
  ) {
    const parts =
      getHijriParts(
        cursor
      );

    if (
      parts.year ===
        Number(
          hijriYear
        ) &&
      parts.month ===
        Number(
          hijriMonth
        ) &&
      parts.day ===
        Number(
          hijriDay
        )
    ) {
      const result =
        getLocalDate(
          cursor
        );

      hijriCache.set(
        cacheKey,
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
  hijriYear,
  hijriMonth
) {
  const cacheKey =
    `range-${hijriYear}-${hijriMonth}`;

  if (
    hijriCache.has(
      cacheKey
    )
  ) {
    return hijriCache.get(
      cacheKey
    );
  }

  const start =
    findGregorianForHijri(
      hijriYear,
      hijriMonth,
      1
    );

  let nextYear =
    Number(hijriYear);

  let nextMonth =
    Number(hijriMonth) + 1;

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

  hijriCache.set(
    cacheKey,
    result
  );

  return result;
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
        year: "numeric",
        month: "long",
        day: "numeric",
      }
    ).format(
      parseLocalDate(
        value
      )
    );
  } catch {
    return value;
  }
}

function formatHijriFullDate(
  value
) {
  if (!value) {
    return "—";
  }

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
        value
      )
    );
  } catch {
    return value;
  }
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
        year: "numeric",
        month: "long",
        day: "numeric",
      }
    ).format(
      parseLocalDate(
        value
      )
    );
  } catch {
    return value;
  }
}

function escapeHtml(
  value
) {
  return String(
    value ?? ""
  )
    .replaceAll(
      "&",
      "&amp;"
    )
    .replaceAll(
      "<",
      "&lt;"
    )
    .replaceAll(
      ">",
      "&gt;"
    )
    .replaceAll(
      '"',
      "&quot;"
    )
    .replaceAll(
      "'",
      "&#039;"
    );
}

/* =========================================================
   Current Hijri Month
========================================================= */

const CURRENT_HIJRI =
  getHijriParts(
    new Date()
  );

/* =========================================================
   اختيار أفضل سجل قديم/حديث
========================================================= */

function selectExistingProgress({
  rows,
  studentId,
  period,
  hijriYear,
  hijriMonth,
}) {
  const studentRows =
    (rows || [])
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
    studentRows.length ===
    0
  ) {
    return null;
  }

  /*
    النسخة الجديدة:
    progress_month =
    التاريخ الميلادي لبداية
    الشهر الهجري.
  */

  const exact =
    studentRows.find(
      (row) =>
        row.progress_month ===
        period.start
    );

  if (exact) {
    return exact;
  }

  /*
    لو سبق حفظ hijri_year/month
    ولكن progress_month مختلف.
  */

  const byHijri =
    studentRows.find(
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

  if (byHijri) {
    return byHijri;
  }

  /*
    دعم النظام القديم:
    كان يحفظ 1448-03-01
    كأنه تاريخ ميلادي.
  */

  const oldKey =
    `${hijriYear}-${pad2(
      hijriMonth
    )}-01`;

  return (
    studentRows.find(
      (row) =>
        row.progress_month ===
        oldKey
    ) ||
    null
  );
}

/* =========================================================
   PAGE
========================================================= */

export default function MonthlyAchievement() {
  /* =====================================================
     Teacher / Scope
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
     Monthly Data
  ===================================================== */

  const [
    rows,
    setRows,
  ] = useState([]);

  const [
    rawRecitations,
    setRawRecitations,
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
    approving,
    setApproving,
  ] = useState(false);

  const [
    detailStudent,
    setDetailStudent,
  ] = useState(null);

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
          "HIJRI PERIOD:",
          error
        );

        return null;
      }
    }, [
      hijriYear,
      hijriMonth,
    ]);

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

  function confirmLoseChanges() {
    if (
      !hasUnsavedChanges
    ) {
      return true;
    }

    return window.confirm(
      "لديك تعديلات غير محفوظة.\n\nهل تريد الانتقال بدون حفظها؟"
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
      loadMonthlyData();
    }
  }, [
    selectedHalaqa,
    hijriYear,
    hijriMonth,
  ]);

  /* =====================================================
     Load Teacher Scope
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

      /* Teacher */

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
          teacherLinks,
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
        halaqaIds.length ===
        0
      ) {
        setHalaqat([]);
        setRows([]);

        return;
      }

      /* Halaqat */

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

      /* Mosques */

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
        prepared.length >
        0
      ) {
        setSelectedHalaqa(
          String(
            prepared[0].id
          )
        );
      }

    } catch (error) {
      console.error(
        "LOAD MONTHLY SCOPE:",
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
     Load Monthly Data
  ===================================================== */

  async function loadMonthlyData() {
    if (
      !selectedHalaqa ||
      !period
    ) {
      return;
    }

    setLoading(true);

    try {
      /* -----------------------------------------
         الطلاب الذين كانوا في الحلقة
         خلال الشهر.

         لا نعتمد is_current فقط،
         حتى تعمل التقارير التاريخية.
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
        setRawRecitations([]);

        return;
      }

      /* -----------------------------------------
         Profiles
      ----------------------------------------- */

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

      /* -----------------------------------------
         Existing monthly_progress

         نجلب جميع سجلات هؤلاء الطلاب
         لهذه الحلقة، ثم نختار السجل
         الأنسب في JavaScript.

         هذا يدعم:
         - النظام الجديد
         - hijri_year/month
         - سجلات النظام القديمة
      ----------------------------------------- */

      const {
        data:
          allExistingProgress,
        error:
          progressError,
      } =
        await supabase
          .from(
            "monthly_progress"
          )
          .select("*")
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
          .order(
            "id",
            {
              ascending:
                false,
            }
          );

      if (
        progressError
      ) {
        throw progressError;
      }

      /* -----------------------------------------
         Recitations
      ----------------------------------------- */

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
            halaqa_id,
            teacher_id,
            recitation_date,

            from_surah,
            from_ayah,
            to_surah,
            to_ayah,

            lesson_evaluation,
            lesson_amount_type,
            lesson_faces,

            review_surah,
            review_from_ayah,
            review_to_surah,
            review_to_ayah,

            review_evaluation,
            review_faces,

            notes
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
          )
          .order(
            "recitation_date",
            {
              ascending:
                true,
            }
          )
          .order(
            "id",
            {
              ascending:
                true,
            }
          );

      if (
        recitationsError
      ) {
        throw recitationsError;
      }

      setRawRecitations(
        recitations || []
      );

      /* -----------------------------------------
         Aggregate
      ----------------------------------------- */

      const aggregate =
        new Map();

      (
        recitations || []
      ).forEach(
        (record) => {
          const studentId =
            Number(
              record.student_id
            );

          const old =
            aggregate.get(
              studentId
            ) || {
              memorization: 0,
              revision: 0,
              sessions: 0,
              lessonSessions: 0,
              revisionSessions: 0,
              lastDate: null,
            };

          const lesson =
            Number(
              record.lesson_faces ||
                0
            );

          const revision =
            Number(
              record.review_faces ||
                0
            );

          old.sessions += 1;

          old.memorization +=
            lesson;

          old.revision +=
            revision;

          if (
            lesson > 0
          ) {
            old.lessonSessions +=
              1;
          }

          if (
            revision > 0
          ) {
            old.revisionSessions +=
              1;
          }

          if (
            !old.lastDate ||
            record.recitation_date >
              old.lastDate
          ) {
            old.lastDate =
              record.recitation_date;
          }

          aggregate.set(
            studentId,
            old
          );
        }
      );

      /* -----------------------------------------
         Build Rows
      ----------------------------------------- */

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

              const auto =
                aggregate.get(
                  studentId
                ) || {
                  memorization: 0,
                  revision: 0,
                  sessions: 0,
                  lessonSessions: 0,
                  revisionSessions: 0,
                  lastDate: null,
                };

              const existing =
                selectExistingProgress({
                  rows:
                    allExistingProgress,

                  studentId,

                  period,

                  hijriYear,

                  hijriMonth,
                });

              const autoMem =
                roundFaces(
                  auto.memorization
                );

              const autoRev =
                roundFaces(
                  auto.revision
                );

              const manualMem =
                roundFaces(
                  existing
                    ?.manual_memorization_faces ||
                    0
                );

              const manualRev =
                roundFaces(
                  existing
                    ?.manual_revision_faces ||
                    0
                );

              const finalMem =
                roundFaces(
                  autoMem +
                    manualMem
                );

              const finalRev =
                roundFaces(
                  autoRev +
                    manualRev
                );

              /*
                لو الاعتماد موجود
                لكن أرقام التسميع
                تغيرت بعده،
                نعتبر المصدر متغيرًا.
              */

              const sourceChanged =
                Boolean(
                  existing &&
                  (
                    roundFaces(
                      existing
                        .auto_memorization_faces ||
                        0
                    ) !==
                      autoMem ||

                    roundFaces(
                      existing
                        .auto_revision_faces ||
                        0
                    ) !==
                      autoRev ||

                    Number(
                      existing
                        .source_recitations_count ||
                        0
                    ) !==
                      Number(
                        auto.sessions
                      )
                  )
                );

              return {
                id:
                  studentId,

                progress_id:
                  existing?.id ||
                  null,

                old_progress_month:
                  existing
                    ?.progress_month ||
                  null,

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

                auto_memorization_faces:
                  autoMem,

                manual_memorization_faces:
                  manualMem,

                manual_memorization_reason:
                  existing
                    ?.manual_memorization_reason ||
                  "",

                final_memorization_faces:
                  finalMem,

                auto_revision_faces:
                  autoRev,

                manual_revision_faces:
                  manualRev,

                manual_revision_reason:
                  existing
                    ?.manual_revision_reason ||
                  "",

                final_revision_faces:
                  finalRev,

                source_recitations_count:
                  Number(
                    auto.sessions
                  ),

                lesson_sessions:
                  Number(
                    auto.lessonSessions
                  ),

                revision_sessions:
                  Number(
                    auto.revisionSessions
                  ),

                last_recitation_date:
                  auto.lastDate,

                notes:
                  existing?.notes ||
                  "",

                delay_reason:
                  existing
                    ?.delay_reason ||
                  "",

                memorization_completed:
                  Boolean(
                    existing
                      ?.memorization_completed
                  ),

                revision_completed:
                  Boolean(
                    existing
                      ?.revision_completed
                  ),

                approved:
                  Boolean(
                    existing
                      ?.approved
                  ) &&
                  !sourceChanged,

                source_changed:
                  sourceChanged,

                legacy_record:
                  Boolean(
                    existing &&
                    existing.progress_month !==
                      period.start
                  ),

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
        "LOAD MONTHLY DATA:",
        error
      );

      showToast(
        error.message ||
          "تعذر حساب الإنجاز الشهري",
        "error"
      );
    } finally {
      setLoading(false);
    }
  }

  /* =====================================================
     Update Row
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

            const next = {
              ...row,

              [field]: value,

              /*
                أي تعديل من المعلم
                يلغي الاعتماد محليًا
                حتى يعاد الحفظ
                والاعتماد.
              */

              approved: false,

              dirty: true,
            };

            if (
              field ===
                "manual_memorization_faces" &&
              Number(
                value || 0
              ) <= 0
            ) {
              next.manual_memorization_reason =
                "";
            }

            if (
              field ===
                "manual_revision_faces" &&
              Number(
                value || 0
              ) <= 0
            ) {
              next.manual_revision_reason =
                "";
            }

            next.final_memorization_faces =
              roundFaces(
                Number(
                  next.auto_memorization_faces ||
                    0
                ) +
                  Number(
                    next.manual_memorization_faces ||
                      0
                  )
              );

            next.final_revision_faces =
              roundFaces(
                Number(
                  next.auto_revision_faces ||
                    0
                ) +
                  Number(
                    next.manual_revision_faces ||
                      0
                  )
              );

            return next;
          }
        )
    );
  }

  /* =====================================================
     Validation
  ===================================================== */

  function validateRows() {
    for (
      const row of rows
    ) {
      const manualMem =
        Number(
          row.manual_memorization_faces ||
            0
        );

      const manualRev =
        Number(
          row.manual_revision_faces ||
            0
        );

      if (
        manualMem < 0 ||
        manualRev < 0
      ) {
        showToast(
          `لا يمكن إدخال عدد أوجه سالب للطالب ${row.student_name}`,
          "error"
        );

        return false;
      }

      if (
        manualMem > 0 &&
        !String(
          row.manual_memorization_reason ||
            ""
        ).trim()
      ) {
        showToast(
          `اكتب سبب إضافة أوجه الحفظ يدويًا للطالب ${row.student_name}`,
          "error"
        );

        return false;
      }

      if (
        manualRev > 0 &&
        !String(
          row.manual_revision_reason ||
            ""
        ).trim()
      ) {
        showToast(
          `اكتب سبب إضافة أوجه المراجعة يدويًا للطالب ${row.student_name}`,
          "error"
        );

        return false;
      }
    }

    return true;
  }

  /* =====================================================
     Payload
  ===================================================== */

  function buildPayload(
    row
  ) {
    const halaqa =
      halaqat.find(
        (item) =>
          Number(
            item.id
          ) ===
          Number(
            selectedHalaqa
          )
      );

    const finalMem =
      roundFaces(
        row.final_memorization_faces
      );

    const finalRev =
      roundFaces(
        row.final_revision_faces
      );

    return {
      student_id:
        Number(
          row.student_id
        ),

      halaqa_id:
        Number(
          selectedHalaqa
        ),

      /*
        موجود في الجدول القديم
        ونبقيه للتوافق.
      */

      mosque_id:
        halaqa?.mosque_id ||
        null,

      teacher_id:
        teacher?.id ||
        null,

      /*
        هذا ميلادي فعلي.
      */

      progress_month:
        period.start,

      hijri_year:
        Number(
          hijriYear
        ),

      hijri_month:
        Number(
          hijriMonth
        ),

      /* -------------------------------
         Automatic
      ------------------------------- */

      auto_memorization_faces:
        roundFaces(
          row.auto_memorization_faces
        ),

      auto_revision_faces:
        roundFaces(
          row.auto_revision_faces
        ),

      /* -------------------------------
         Manual
      ------------------------------- */

      manual_memorization_faces:
        roundFaces(
          row.manual_memorization_faces
        ),

      manual_revision_faces:
        roundFaces(
          row.manual_revision_faces
        ),

      manual_memorization_reason:
        String(
          row.manual_memorization_reason ||
            ""
        ).trim() ||
        null,

      manual_revision_reason:
        String(
          row.manual_revision_reason ||
            ""
        ).trim() ||
        null,

      /* -------------------------------
         Final
      ------------------------------- */

      final_memorization_faces:
        finalMem,

      final_revision_faces:
        finalRev,

      /*
        توافق مؤقت مع
        vw_monthly_progress_report.

        الأعمدة القديمة قد تكون integer،
        لذلك نخزن تقريبًا صحيحًا فيها.

        الدقة الحقيقية موجودة في:
        final_*_faces
      */

      memorization_pages:
        Math.round(
          finalMem
        ),

      revision_pages:
        Math.round(
          finalRev
        ),

      /* -------------------------------
         Source
      ------------------------------- */

      source_recitations_count:
        Number(
          row.source_recitations_count ||
            0
        ),

      calculated_at:
        new Date()
          .toISOString(),

      /* -------------------------------
         Legacy fields

         سنعيد بناء معناها لاحقًا
         عند إضافة الخطة الشهرية.
      ------------------------------- */

      memorization_completed:
        Boolean(
          row.memorization_completed
        ),

      revision_completed:
        Boolean(
          row.revision_completed
        ),

      delay_reason:
        String(
          row.delay_reason ||
            ""
        ).trim() ||
        null,

      notes:
        String(
          row.notes ||
            ""
        ).trim() ||
        null,

      approved:
        Boolean(
          row.approved
        ),
    };
  }

  /* =====================================================
     Persist
  ===================================================== */

  async function persistRows({
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
      !selectedHalaqa ||
      !teacher?.id ||
      !period
    ) {
      showToast(
        "بيانات المعلم أو الحلقة غير مكتملة",
        "error"
      );

      return false;
    }

    if (
      !validateRows()
    ) {
      return false;
    }

    if (
      controlLoading
    ) {
      setSaving(true);
    }

    try {
      /*
        إذا كان السجل قديمًا،
        نحدثه بواسطة id
        ونحوّل progress_month
        إلى التاريخ الميلادي الصحيح.

        إذا كان جديدًا نستخدم upsert.
      */

      await Promise.all(
        rows.map(
          async (row) => {
            const payload =
              buildPayload(
                row
              );

            if (
              row.progress_id
            ) {
              const {
                error,
              } =
                await supabase
                  .from(
                    "monthly_progress"
                  )
                  .update(
                    payload
                  )
                  .eq(
                    "id",
                    row.progress_id
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
                  "monthly_progress"
                )
                .upsert(
                  payload,
                  {
                    onConflict:
                      "student_id,halaqa_id,progress_month",
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
          "تم حفظ الإنجاز الشهري بنجاح",
          "success"
        );
      }

      if (reload) {
        await loadMonthlyData();
      } else {
        setRows(
          (current) =>
            current.map(
              (row) => ({
                ...row,

                dirty:
                  false,

                source_changed:
                  false,

                legacy_record:
                  false,
              })
            )
        );
      }

      return true;

    } catch (error) {
      console.error(
        "SAVE MONTHLY:",
        error
      );

      showToast(
        error.message ||
          "تعذر حفظ الإنجاز الشهري",
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

  async function saveAll() {
    await persistRows();
  }

  /* =====================================================
     Approve
  ===================================================== */

  async function approveAll() {
    if (
      rows.length === 0
    ) {
      showToast(
        "لا توجد بيانات للاعتماد",
        "error"
      );

      return;
    }

    if (
      !validateRows()
    ) {
      return;
    }

    const confirmed =
      window.confirm(
        `اعتماد إنجاز شهر ${
          HIJRI_MONTHS[
            hijriMonth - 1
          ]
        } ${hijriYear} هـ؟\n\nإذا تم تعديل التسميع لاحقًا سيظهر تنبيه بأن مصدر الإنجاز تغير ويحتاج إعادة اعتماد.`
      );

    if (!confirmed) {
      return;
    }

    setApproving(true);

    try {
      /*
        نحفظ أولًا.
      */

      const saved =
        await persistRows({
          silent: true,
          reload: false,
          controlLoading:
            false,
        });

      if (!saved) {
        return;
      }

      const studentIds =
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
            "monthly_progress"
          )
          .update({
            approved: true,
          })
          .eq(
            "halaqa_id",
            Number(
              selectedHalaqa
            )
          )
          .eq(
            "progress_month",
            period.start
          )
          .in(
            "student_id",
            studentIds
          );

      if (error) {
        throw error;
      }

      showToast(
        "تم اعتماد الإنجاز الشهري",
        "success"
      );

      await loadMonthlyData();

    } catch (error) {
      console.error(
        "APPROVE MONTHLY:",
        error
      );

      showToast(
        error.message ||
          "تعذر اعتماد الإنجاز الشهري",
        "error"
      );
    } finally {
      setApproving(false);
    }
  }

  /* =====================================================
     Recalculate
  ===================================================== */

  async function recalculate() {
    if (
      hasUnsavedChanges
    ) {
      const confirmed =
        window.confirm(
          "سيتم إلغاء التعديلات غير المحفوظة وإعادة الحساب من سجلات التسميع.\n\nهل تريد المتابعة؟"
        );

      if (!confirmed) {
        return;
      }
    }

    await loadMonthlyData();

    showToast(
      "تم إعادة احتساب الإنجاز من التسميع",
      "success"
    );
  }

  /* =====================================================
     Filter Rows
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
     Stats
  ===================================================== */

  const stats =
    useMemo(() => {
      const totalStudents =
        rows.length;

      const autoMem =
        rows.reduce(
          (
            sum,
            row
          ) =>
            sum +
            Number(
              row.auto_memorization_faces ||
                0
            ),
          0
        );

      const manualMem =
        rows.reduce(
          (
            sum,
            row
          ) =>
            sum +
            Number(
              row.manual_memorization_faces ||
                0
            ),
          0
        );

      const finalMem =
        rows.reduce(
          (
            sum,
            row
          ) =>
            sum +
            Number(
              row.final_memorization_faces ||
                0
            ),
          0
        );

      const autoRev =
        rows.reduce(
          (
            sum,
            row
          ) =>
            sum +
            Number(
              row.auto_revision_faces ||
                0
            ),
          0
        );

      const manualRev =
        rows.reduce(
          (
            sum,
            row
          ) =>
            sum +
            Number(
              row.manual_revision_faces ||
                0
            ),
          0
        );

      const finalRev =
        rows.reduce(
          (
            sum,
            row
          ) =>
            sum +
            Number(
              row.final_revision_faces ||
                0
            ),
          0
        );

      const sessions =
        rows.reduce(
          (
            sum,
            row
          ) =>
            sum +
            Number(
              row.source_recitations_count ||
                0
            ),
          0
        );

      const approved =
        rows.filter(
          (row) =>
            row.approved
        ).length;

      const active =
        rows.filter(
          (row) =>
            Number(
              row.final_memorization_faces
            ) >
              0 ||
            Number(
              row.final_revision_faces
            ) >
              0
        ).length;

      const manualStudents =
        rows.filter(
          (row) =>
            Number(
              row.manual_memorization_faces
            ) >
              0 ||
            Number(
              row.manual_revision_faces
            ) >
              0
        ).length;

      return {
        totalStudents,

        autoMem:
          roundFaces(
            autoMem
          ),

        manualMem:
          roundFaces(
            manualMem
          ),

        finalMem:
          roundFaces(
            finalMem
          ),

        autoRev:
          roundFaces(
            autoRev
          ),

        manualRev:
          roundFaces(
            manualRev
          ),

        finalRev:
          roundFaces(
            finalRev
          ),

        sessions,

        approved,

        active,

        manualStudents,
      };
    }, [rows]);

  /* =====================================================
     Details
  ===================================================== */

  const detailRecords =
    useMemo(() => {
      if (
        !detailStudent
      ) {
        return [];
      }

      return rawRecitations.filter(
        (record) =>
          Number(
            record.student_id
          ) ===
          Number(
            detailStudent.student_id
          )
      );
    }, [
      rawRecitations,
      detailStudent,
    ]);

  /* =====================================================
     Halaqa
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
     Period Navigation
  ===================================================== */

  function applyPeriod(
    year,
    month
  ) {
    if (
      !confirmLoseChanges()
    ) {
      return;
    }

    const requestedIndex =
      Number(year) *
        12 +
      Number(month);

    const currentIndex =
      CURRENT_HIJRI.year *
        12 +
      CURRENT_HIJRI.month;

    if (
      requestedIndex >
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

  function moveHijriMonth(
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
     Halaqa Change
  ===================================================== */

  function changeHalaqa(
    value
  ) {
    if (
      !confirmLoseChanges()
    ) {
      return;
    }

    setSelectedHalaqa(
      value
    );

    setSearch("");
  }

  /* =====================================================
     Excel
  ===================================================== */

  function exportExcel() {
    if (
      rows.length === 0
    ) {
      showToast(
        "لا توجد بيانات للتصدير",
        "error"
      );

      return;
    }

    const data =
      rows.map(
        (row) => ({
          الطالب:
            row.student_name,

          "رقم الطالب":
            row.user_number ||
            "",

          "الحفظ من التسميع":
            row.auto_memorization_faces,

          "إضافة حفظ يدوية":
            row.manual_memorization_faces,

          "إجمالي الحفظ":
            row.final_memorization_faces,

          "سبب إضافة الحفظ":
            row.manual_memorization_reason ||
            "",

          "المراجعة من التسميع":
            row.auto_revision_faces,

          "إضافة مراجعة يدوية":
            row.manual_revision_faces,

          "إجمالي المراجعة":
            row.final_revision_faces,

          "سبب إضافة المراجعة":
            row.manual_revision_reason ||
            "",

          "جلسات التسميع":
            row.source_recitations_count,

          "جلسات الحفظ":
            row.lesson_sessions,

          "جلسات المراجعة":
            row.revision_sessions,

          "آخر تسميع":
            row.last_recitation_date ||
            "",

          ملاحظات:
            row.notes ||
            "",

          الحالة:
            row.approved
              ? "معتمد"
              : "غير معتمد",
        })
      );

    const worksheet =
      XLSX.utils
        .json_to_sheet(
          data
        );

    worksheet[
      "!cols"
    ] = [
      { wch: 25 },
      { wch: 14 },
      { wch: 18 },
      { wch: 18 },
      { wch: 16 },
      { wch: 40 },
      { wch: 20 },
      { wch: 20 },
      { wch: 18 },
      { wch: 40 },
      { wch: 14 },
      { wch: 14 },
      { wch: 14 },
      { wch: 16 },
      { wch: 35 },
      { wch: 14 },
    ];

    const workbook =
      XLSX.utils
        .book_new();

    XLSX.utils
      .book_append_sheet(
        workbook,
        worksheet,
        "الإنجاز الشهري"
      );

    XLSX.writeFile(
      workbook,
      `monthly-achievement-${hijriYear}-${pad2(
        hijriMonth
      )}.xlsx`
    );

    showToast(
      "تم تصدير Excel",
      "success"
    );
  }

  /* =====================================================
     Print
  ===================================================== */

  function printReport() {
    if (
      rows.length === 0 ||
      !period
    ) {
      showToast(
        "لا توجد بيانات للطباعة",
        "error"
      );

      return;
    }

    const printWindow =
      window.open(
        "",
        "_blank"
      );

    if (!printWindow) {
      showToast(
        "تعذر فتح نافذة الطباعة",
        "error"
      );

      return;
    }

    const origin =
      window.location.origin;

    const rowsHtml =
      rows
        .map(
          (
            row,
            index
          ) => `
            <tr>
              <td>
                ${index + 1}
              </td>

              <td class="student-name">
                ${escapeHtml(
                  row.student_name
                )}
              </td>

              <td>
                ${formatFaces(
                  row.auto_memorization_faces
                )}
              </td>

              <td>
                ${formatFaces(
                  row.manual_memorization_faces
                )}
              </td>

              <td class="total-cell">
                ${formatFaces(
                  row.final_memorization_faces
                )}
              </td>

              <td>
                ${formatFaces(
                  row.auto_revision_faces
                )}
              </td>

              <td>
                ${formatFaces(
                  row.manual_revision_faces
                )}
              </td>

              <td class="total-cell">
                ${formatFaces(
                  row.final_revision_faces
                )}
              </td>

              <td>
                ${
                  row.source_recitations_count
                }
              </td>

              <td>
                <span class="${
                  row.approved
                    ? "approved"
                    : "draft"
                }">
                  ${
                    row.approved
                      ? "معتمد"
                      : "غير معتمد"
                  }
                </span>
              </td>
            </tr>
          `
        )
        .join("");

    printWindow.document.write(`
      <!DOCTYPE html>

      <html
        lang="ar"
        dir="rtl"
      >
        <head>
          <meta charset="utf-8" />

          <title>
            تقرير الإنجاز الشهري
          </title>

          <style>
            * {
              box-sizing:
                border-box;
            }

            body {
              margin: 0;
              padding: 25px;

              font-family:
                Tahoma,
                Arial,
                sans-serif;

              color: #25372d;
              background: #f5f7f5;
            }

            .watermark {
              position: fixed;

              width: 600px;

              top: 50%;
              left: 50%;

              transform:
                translate(
                  -50%,
                  -50%
                );

              opacity: .045;

              z-index: 0;
            }

            .pattern-right {
              position: fixed;

              width: 130px;

              right: 12px;
              top: 12px;

              opacity: .06;

              z-index: 0;
            }

            .pattern-left {
              position: fixed;

              width: 130px;

              left: 12px;
              top: 12px;

              opacity: .06;

              z-index: 0;
            }

            .report {
              position: relative;
              z-index: 2;
            }

            .hero {
              display: flex;
              align-items: center;
              justify-content: center;

              gap: 18px;

              padding: 24px;

              border-radius: 23px;

              color: #fff;

              background:
                linear-gradient(
                  135deg,
                  #0f5132,
                  #0f766e
                );
            }

            .hero img {
              width: 82px;
            }

            .hero h1 {
              margin: 0;

              font-size: 28px;
            }

            .hero p {
              margin:
                5px 0 0;

              opacity: .88;

              font-size: 11px;
            }

            .hero .month {
              margin-top: 7px;

              font-size: 13px;
              font-weight: 700;
            }

            .info-grid {
              display: grid;

              grid-template-columns:
                repeat(
                  4,
                  1fr
                );

              gap: 10px;

              margin:
                14px 0;
            }

            .info-card {
              padding: 13px;

              border-radius: 13px;

              text-align: center;

              background: #fff;
            }

            .info-card span {
              display: block;

              color: #829087;

              font-size: 8px;
            }

            .info-card strong {
              display: block;

              margin-top: 3px;

              color: #173d2b;

              font-size: 11px;
            }

            .stats-grid {
              display: grid;

              grid-template-columns:
                repeat(
                  5,
                  1fr
                );

              gap: 9px;

              margin-bottom: 14px;
            }

            .stat {
              padding: 12px;

              border-radius: 13px;

              text-align: center;

              background: #fff;
            }

            .stat strong {
              display: block;

              color: #0f5132;

              font-size: 20px;
            }

            .stat span {
              color: #7e8a82;

              font-size: 8px;
            }

            .table-wrapper {
              overflow: hidden;

              border-radius: 15px;

              background: #fff;
            }

            table {
              width: 100%;

              border-collapse:
                collapse;

              font-size: 8px;
            }

            th {
              padding: 9px 5px;

              color: #fff;

              background: #0f5132;
            }

            td {
              padding: 8px 5px;

              border-bottom:
                1px solid #e8ece9;

              text-align: center;
            }

            .student-name {
              text-align: right;

              font-weight: 700;
            }

            .total-cell {
              color: #0f5132;

              background: #f5faf7;

              font-weight: 900;
            }

            .approved,
            .draft {
              display:
                inline-block;

              padding:
                4px 7px;

              border-radius:
                999px;

              font-weight: 700;
            }

            .approved {
              color: #166534;
              background: #dcfce7;
            }

            .draft {
              color: #64748b;
              background: #f1f5f9;
            }

            .footer {
              margin-top: 14px;
              padding: 12px;

              border-radius: 13px;

              text-align: center;

              color: #7c8981;
              background: #fff;

              font-size: 8px;
            }

            @page {
              size:
                A4 landscape;

              margin:
                8mm;
            }

            @media print {
              body {
                padding: 0;

                -webkit-print-color-adjust:
                  exact !important;

                print-color-adjust:
                  exact !important;
              }
            }
          </style>
        </head>

        <body>
          <img
            src="${origin}/logo.png"
            class="watermark"
          />

          <img
            src="${origin}/patterns/Z-1.png"
            class="pattern-right"
          />

          <img
            src="${origin}/patterns/Z-3.png"
            class="pattern-left"
          />

          <div class="report">
            <div class="hero">
              <img
                src="${origin}/logo.png"
              />

              <div>
                <h1>
                  تقرير الإنجاز الشهري
                </h1>

                <p>
                  نظام الصديق لإدارة حلقات القرآن الكريم
                </p>

                <div class="month">
                  ${
                    HIJRI_MONTHS[
                      hijriMonth -
                        1
                    ]
                  }
                  ${hijriYear} هـ
                </div>
              </div>
            </div>

            <div class="info-grid">
              <div class="info-card">
                <span>
                  الحلقة
                </span>

                <strong>
                  ${escapeHtml(
                    selectedHalaqaData
                      ?.name ||
                      "-"
                  )}
                </strong>
              </div>

              <div class="info-card">
                <span>
                  المسجد
                </span>

                <strong>
                  ${escapeHtml(
                    selectedHalaqaData
                      ?.mosque_name ||
                      "-"
                  )}
                </strong>
              </div>

              <div class="info-card">
                <span>
                  المعلم
                </span>

                <strong>
                  ${escapeHtml(
                    teacher
                      ?.full_name ||
                      "-"
                  )}
                </strong>
              </div>

              <div class="info-card">
                <span>
                  الفترة الميلادية
                </span>

                <strong>
                  ${escapeHtml(
                    formatGregorianDate(
                      period.start
                    )
                  )}

                  —

                  ${escapeHtml(
                    formatGregorianDate(
                      period.end
                    )
                  )}
                </strong>
              </div>
            </div>

            <div class="stats-grid">
              <div class="stat">
                <strong>
                  ${
                    stats.totalStudents
                  }
                </strong>

                <span>
                  الطلاب
                </span>
              </div>

              <div class="stat">
                <strong>
                  ${formatFaces(
                    stats.finalMem
                  )}
                </strong>

                <span>
                  الحفظ
                </span>
              </div>

              <div class="stat">
                <strong>
                  ${formatFaces(
                    stats.finalRev
                  )}
                </strong>

                <span>
                  المراجعة
                </span>
              </div>

              <div class="stat">
                <strong>
                  ${
                    stats.sessions
                  }
                </strong>

                <span>
                  جلسات التسميع
                </span>
              </div>

              <div class="stat">
                <strong>
                  ${
                    stats.approved
                  }
                </strong>

                <span>
                  المعتمدون
                </span>
              </div>
            </div>

            <div class="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>الطالب</th>

                    <th>
                      حفظ تلقائي
                    </th>

                    <th>
                      حفظ يدوي
                    </th>

                    <th>
                      إجمالي الحفظ
                    </th>

                    <th>
                      مراجعة تلقائية
                    </th>

                    <th>
                      مراجعة يدوية
                    </th>

                    <th>
                      إجمالي المراجعة
                    </th>

                    <th>
                      الجلسات
                    </th>

                    <th>
                      الاعتماد
                    </th>
                  </tr>
                </thead>

                <tbody>
                  ${rowsHtml}
                </tbody>
              </table>
            </div>

            <div class="footer">
              تم إنشاء التقرير بواسطة نظام الصديق
              —
              ${
                HIJRI_MONTHS[
                  hijriMonth -
                    1
                ]
              }
              ${hijriYear} هـ
            </div>
          </div>

          <script>
            window.onload =
              function () {
                setTimeout(
                  function () {
                    window.focus();
                    window.print();
                  },
                  350
                );
              };
          </script>
        </body>
      </html>
    `);

    printWindow.document.close();
  }

  /* =====================================================
     Loading
  ===================================================== */

  if (
    initialLoading
  ) {
    return (
      <div
        className="monthly-achievement-page"
        dir="rtl"
      >
        <MonthlyStyles />

        <PageLoading />
      </div>
    );
  }

  /* =====================================================
     Render
  ===================================================== */

  return (
    <div
      className="monthly-achievement-page"
      dir="rtl"
    >
      <MonthlyStyles />

      {/* =================================================
          HERO
      ================================================= */}

      <section
        className="monthly-hero"
      >
        <div
          className="monthly-hero-main"
        >
          <div
            className="monthly-hero-icon"
          >
            <Target
              size={24}
            />
          </div>

          <div>
            <div
              className="monthly-eyebrow"
            >
              <ShieldCheck
                size={13}
              />

              مركز متابعة
              الإنجاز
            </div>

            <h1>
              الإنجاز الشهري
            </h1>

            <p>
              احتساب فعلي من
              جلسات التسميع، مع
              إمكانية إضافة الأوجه
              غير المسجلة يدويًا
              وتوثيق مصدر كل رقم.
            </p>
          </div>
        </div>

        <div
          className="monthly-actions"
        >
          <button
            type="button"
            className="hero-action recalc"
            onClick={
              recalculate
            }
            disabled={
              loading
            }
          >
            <RefreshCw
              size={16}
              className={
                loading
                  ? "spin"
                  : ""
              }
            />

            <span>
              إعادة احتساب
            </span>
          </button>

          <button
            type="button"
            className="hero-action excel"
            onClick={
              exportExcel
            }
          >
            <FileSpreadsheet
              size={16}
            />

            <span>
              Excel
            </span>
          </button>

          <button
            type="button"
            className="hero-action print"
            onClick={
              printReport
            }
          >
            <Printer
              size={16}
            />

            <span>
              طباعة / PDF
            </span>
          </button>

          <button
            type="button"
            className="hero-action save"
            onClick={
              saveAll
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
            className="hero-action approve"
            onClick={
              approveAll
            }
            disabled={
              approving ||
              loading
            }
          >
            {approving ? (
              <Loader2
                size={16}
                className="spin"
              />
            ) : (
              <BadgeCheck
                size={16}
              />
            )}

            <span>
              اعتماد الشهر
            </span>
          </button>
        </div>
      </section>

      {/* =================================================
          UNSAVED
      ================================================= */}

      {hasUnsavedChanges && (
        <div
          className="unsaved-notice"
        >
          <CircleAlert
            size={14}
          />

          توجد تعديلات لم يتم
          حفظها بعد.

          <button
            type="button"
            onClick={
              saveAll
            }
          >
            حفظ الآن
          </button>
        </div>
      )}

      {/* =================================================
          SOURCE INFO
      ================================================= */}

      <div
        className="monthly-source-note"
      >
        <Sparkles
          size={14}
        />

        <div>
          <strong>
            حساب ذكي وشفاف
          </strong>

          <span>
            الأرقام التلقائية
            تأتي مباشرة من
            جلسات التسميع، بينما
            الإضافات اليدوية تحفظ
            منفصلة مع سبب واضح.
          </span>
        </div>
      </div>

      {/* =================================================
          PERIOD
      ================================================= */}

      <section
        className="period-selector-card"
      >
        <button
          type="button"
          className="period-arrow"
          onClick={() =>
            moveHijriMonth(-1)
          }
          title="الشهر السابق"
        >
          <ChevronRight
            size={19}
          />
        </button>

        <div
          className="period-main"
        >
          <div
            className="period-icon"
          >
            <CalendarDays
              size={21}
            />
          </div>

          <div
            className="period-content"
          >
            <span
              className="period-label"
            >
              الشهر الهجري
              — تقويم أم القرى
            </span>

            <div
              className="period-select-row"
            >
              <div
                className="period-select"
              >
                <select
                  value={
                    hijriMonth
                  }
                  onChange={(
                    event
                  ) => {
                    const month =
                      Number(
                        event
                          .target
                          .value
                      );

                    applyPeriod(
                      hijriYear,
                      month
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
                className="period-select year"
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
                        event
                          .target
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
                className="period-conversion"
              >
                <span>
                  الفترة الميلادية
                  المستخدمة في
                  قاعدة البيانات
                </span>

                <strong>
                  {formatGregorianDate(
                    period.start
                  )}

                  <span>
                    ←
                  </span>

                  {formatGregorianDate(
                    period.end
                  )}
                </strong>
              </div>
            )}
          </div>
        </div>

        <div
          className="period-current-area"
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
            moveHijriMonth(1)
          }
          disabled={
            isCurrentMonth
          }
          title="الشهر التالي"
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
        className="scope-card"
      >
        <div
          className="scope-heading"
        >
          <div
            className="scope-heading-icon"
          >
            <Layers3
              size={17}
            />
          </div>

          <div>
            <strong>
              نطاق التقرير
            </strong>

            <span>
              حلقات المعلم فقط
            </span>
          </div>
        </div>

        <div
          className="scope-grid"
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
                value={search}
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
              className="halaqa-summary"
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
        className="monthly-stats"
      >
        <MonthlyStat
          icon={Users}
          title="طلاب الشهر"
          value={
            stats.totalStudents
          }
          subtitle={`${stats.active} لديهم إنجاز`}
          tone="students"
        />

        <MonthlyStat
          icon={BookOpen}
          title="إجمالي الحفظ"
          value={
            formatFaces(
              stats.finalMem
            )
          }
          subtitle={`${formatFaces(
            stats.autoMem
          )} تلقائي + ${formatFaces(
            stats.manualMem
          )} يدوي`}
          tone="memorization"
        />

        <MonthlyStat
          icon={
            RefreshCw
          }
          title="إجمالي المراجعة"
          value={
            formatFaces(
              stats.finalRev
            )
          }
          subtitle={`${formatFaces(
            stats.autoRev
          )} تلقائي + ${formatFaces(
            stats.manualRev
          )} يدوي`}
          tone="revision"
        />

        <MonthlyStat
          icon={History}
          title="جلسات التسميع"
          value={
            stats.sessions
          }
          subtitle="مصدر الحساب التلقائي"
          tone="sessions"
        />

        <MonthlyStat
          icon={BadgeCheck}
          title="السجلات المعتمدة"
          value={`${stats.approved}/${stats.totalStudents}`}
          subtitle={`${stats.manualStudents} بها إضافة يدوية`}
          tone="approved"
        />
      </section>

      {/* =================================================
          STUDENT HEADER
      ================================================= */}

      <div
        className="students-section-header"
      >
        <div>
          <h2>
            إنجاز الطلاب
          </h2>

          <p>
            كل رقم موضح بحسب
            مصدره: تلقائي أو يدوي.
          </p>
        </div>

        <div
          className="students-count"
        >
          <UserRound
            size={13}
          />

          {
            filteredRows.length
          }

          طالب
        </div>
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
          description="يجب أن يقوم المشرف بربطك بحلقة أولًا."
        />
      ) : filteredRows.length ===
        0 ? (
        <EmptyState
          icon={Users}
          title="لا يوجد طلاب"
          description={
            search
              ? "لا يوجد طالب مطابق للبحث الحالي."
              : "لا يوجد طلاب ضمن هذه الحلقة خلال الشهر المحدد."
          }
        />
      ) : (
        <section
          className="achievement-grid"
        >
          {filteredRows.map(
            (row) => (
              <StudentAchievementCard
                key={
                  row.student_id
                }
                row={row}
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
                onDetails={() =>
                  setDetailStudent(
                    row
                  )
                }
              />
            )
          )}
        </section>
      )}

      {/* =================================================
          DETAILS
      ================================================= */}

      {detailStudent && (
        <DetailsModal
          student={
            detailStudent
          }
          records={
            detailRecords
          }
          onClose={() =>
            setDetailStudent(
              null
            )
          }
        />
      )}
    </div>
  );
}

/* =========================================================
   Student Achievement Card
========================================================= */

function StudentAchievementCard({
  row,
  onChange,
  onDetails,
}) {
  const hasAuto =
    Number(
      row.auto_memorization_faces ||
        0
    ) >
      0 ||
    Number(
      row.auto_revision_faces ||
        0
    ) >
      0;

  const hasManual =
    Number(
      row.manual_memorization_faces ||
        0
    ) >
      0 ||
    Number(
      row.manual_revision_faces ||
        0
    ) >
      0;

  let sourceText =
    "بدون إنجاز";

  let sourceClass =
    "none";

  if (
    hasAuto &&
    hasManual
  ) {
    sourceText =
      "مختلط";

    sourceClass =
      "mixed";
  } else if (hasAuto) {
    sourceText =
      "تلقائي";

    sourceClass =
      "auto";
  } else if (
    hasManual
  ) {
    sourceText =
      "يدوي";

    sourceClass =
      "manual";
  }

  return (
    <article
      className="student-achievement-card"
    >
      <div
        className="student-card-line"
      />

      {/* Header */}

      <div
        className="student-card-header"
      >
        <div
          className="student-identity"
        >
          <div
            className="student-avatar"
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
          className="student-badges"
        >
          {row.legacy_record && (
            <span
              className="legacy-badge"
            >
              سجل قديم
            </span>
          )}

          {row.source_changed && (
            <span
              className="changed-badge"
            >
              <CircleAlert
                size={11}
              />

              المصدر تغيّر
            </span>
          )}

          <span
            className={
              `source-badge ${sourceClass}`
            }
          >
            {sourceText}
          </span>

          <span
            className={
              row.approved
                ? "approved-badge"
                : "draft-badge"
            }
          >
            {row.approved ? (
              <BadgeCheck
                size={11}
              />
            ) : (
              <History
                size={11}
              />
            )}

            {row.approved
              ? "معتمد"
              : "مسودة"}
          </span>
        </div>
      </div>

      {/* Source Info */}

      <div
        className="student-source-info"
      >
        <div>
          <History
            size={12}
          />

          <span>
            الجلسات
          </span>

          <strong>
            {
              row.source_recitations_count
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

        <button
          type="button"
          onClick={
            onDetails
          }
        >
          <Search
            size={12}
          />

          تفاصيل الحساب
        </button>
      </div>

      {/* Achievement */}

      <div
        className="achievement-columns"
      >
        <AchievementBlock
          type="memorization"
          icon={
            <BookOpen
              size={16}
            />
          }
          title="الحفظ"
          automatic={
            row.auto_memorization_faces
          }
          manual={
            row.manual_memorization_faces
          }
          total={
            row.final_memorization_faces
          }
          reason={
            row.manual_memorization_reason
          }
          onManualChange={(
            value
          ) =>
            onChange(
              "manual_memorization_faces",
              value
            )
          }
          onReasonChange={(
            value
          ) =>
            onChange(
              "manual_memorization_reason",
              value
            )
          }
        />

        <AchievementBlock
          type="revision"
          icon={
            <RefreshCw
              size={16}
            />
          }
          title="المراجعة"
          automatic={
            row.auto_revision_faces
          }
          manual={
            row.manual_revision_faces
          }
          total={
            row.final_revision_faces
          }
          reason={
            row.manual_revision_reason
          }
          onManualChange={(
            value
          ) =>
            onChange(
              "manual_revision_faces",
              value
            )
          }
          onReasonChange={(
            value
          ) =>
            onChange(
              "manual_revision_reason",
              value
            )
          }
        />
      </div>

      {/* Notes */}

      <div
        className="monthly-notes"
      >
        <label>
          <MessageSquareText
            size={12}
          />

          ملاحظات الشهر
        </label>

        <textarea
          rows={2}
          value={
            row.notes
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
          placeholder="ملاحظة اختيارية عن أداء الطالب..."
        />
      </div>
    </article>
  );
}

/* =========================================================
   Achievement Block
========================================================= */

function AchievementBlock({
  type,
  icon,
  title,
  automatic,
  manual,
  total,
  reason,
  onManualChange,
  onReasonChange,
}) {
  const manualNumber =
    Number(
      manual || 0
    );

  return (
    <div
      className={
        `achievement-block ${type}`
      }
    >
      <div
        className="achievement-block-header"
      >
        <div>
          {icon}

          <strong>
            {title}
          </strong>
        </div>

        <span>
          بالأوجه
        </span>
      </div>

      {/* Automatic */}

      <div
        className="automatic-value"
      >
        <div>
          <Sparkles
            size={12}
          />

          <span>
            من التسميع
          </span>
        </div>

        <strong>
          {formatFaces(
            automatic
          )}

          <small>
            وجه
          </small>
        </strong>
      </div>

      {/* Manual */}

      <div
        className="manual-value"
      >
        <label>
          إضافة يدوية
        </label>

        <div
          className="manual-number"
        >
          <input
            type="number"
            min="0"
            step="0.1"
            value={
              manual
            }
            onChange={(
              event
            ) => {
              const value =
                event.target
                  .value;

              onManualChange(
                value === ""
                  ? ""
                  : Number(
                      value
                    )
              );
            }}
            placeholder="0"
          />

          <span>
            وجه
          </span>
        </div>
      </div>

      {/* Reason */}

      {manualNumber >
        0 && (
        <div
          className="manual-reason"
        >
          <label>
            سبب الإضافة
            <span>
              *
            </span>
          </label>

          <input
            value={
              reason
            }
            onChange={(
              event
            ) =>
              onReasonChange(
                event.target
                  .value
              )
            }
            placeholder={
              type ===
              "revision"
                ? "مثال: سمع الطالب 100 وجه مراجعة خارج تسجيل الجلسات"
                : "مثال: تم تسميع مقدار إضافي ولم يسجل في صفحة التسميع"
            }
          />
        </div>
      )}

      {/* Total */}

      <div
        className="final-value"
      >
        <span>
          الإجمالي النهائي
        </span>

        <strong>
          {formatFaces(
            total
          )}

          <small>
            وجه
          </small>
        </strong>
      </div>
    </div>
  );
}

/* =========================================================
   Details Modal
========================================================= */

function DetailsModal({
  student,
  records,
  onClose,
}) {
  const lessonTotal =
    records.reduce(
      (
        sum,
        record
      ) =>
        sum +
        Number(
          record.lesson_faces ||
            0
        ),
      0
    );

  const revisionTotal =
    records.reduce(
      (
        sum,
        record
      ) =>
        sum +
        Number(
          record.review_faces ||
            0
        ),
      0
    );

  return (
    <div
      className="details-overlay"
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
        className="details-modal"
      >
        <div
          className="details-header"
        >
          <div>
            <span>
              تفاصيل مصدر
              الإنجاز
            </span>

            <h2>
              {
                student.student_name
              }
            </h2>

            <p>
              كل جلسة دخلت في
              الحساب التلقائي
              لهذا الشهر.
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
          className="details-summary"
        >
          <div>
            <span>
              جلسات التسميع
            </span>

            <strong>
              {
                records.length
              }
            </strong>
          </div>

          <div>
            <span>
              الحفظ التلقائي
            </span>

            <strong>
              {formatFaces(
                lessonTotal
              )}
            </strong>
          </div>

          <div>
            <span>
              المراجعة التلقائية
            </span>

            <strong>
              {formatFaces(
                revisionTotal
              )}
            </strong>
          </div>
        </div>

        <div
          className="details-body"
        >
          {records.length ===
          0 ? (
            <div
              className="details-empty"
            >
              لا توجد جلسات
              تسميع لهذا الطالب
              في الشهر المحدد.
            </div>
          ) : (
            records.map(
              (
                record,
                index
              ) => (
                <article
                  key={
                    record.id
                  }
                  className="source-record"
                >
                  <div
                    className="source-number"
                  >
                    {index + 1}
                  </div>

                  <div
                    className="source-main"
                  >
                    <div
                      className="source-date"
                    >
                      <div>
                        <strong>
                          {formatHijriFullDate(
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

                    <div
                      className="source-values"
                    >
                      <div
                        className="source-range"
                      >
                        <span>
                          الدرس
                        </span>

                        <strong>
                          {record.from_surah ||
                            "غير مسجل"}

                          {record.from_ayah
                            ? ` (${record.from_ayah})`
                            : ""}

                          {record.to_surah
                            ? ` ← ${record.to_surah}`
                            : ""}

                          {record.to_ayah
                            ? ` (${record.to_ayah})`
                            : ""}
                        </strong>
                      </div>

                      <div>
                        <span>
                          أوجه الحفظ
                        </span>

                        <strong>
                          {formatFaces(
                            record.lesson_faces
                          )}
                        </strong>
                      </div>

                      <div>
                        <span>
                          أوجه المراجعة
                        </span>

                        <strong>
                          {formatFaces(
                            record.review_faces
                          )}
                        </strong>
                      </div>
                    </div>
                  </div>
                </article>
              )
            )
          )}
        </div>

        <div
          className="details-footer"
        >
          <button
            type="button"
            onClick={
              onClose
            }
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   Monthly Stat
========================================================= */

function MonthlyStat({
  icon: Icon,
  title,
  value,
  subtitle,
  tone,
}) {
  return (
    <div
      className={
        `monthly-stat ${tone}`
      }
    >
      <div
        className="monthly-stat-icon"
      >
        <Icon
          size={18}
        />
      </div>

      <div
        className="monthly-stat-content"
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
   Empty
========================================================= */

function EmptyState({
  icon: Icon,
  title,
  description,
}) {
  return (
    <div
      className="monthly-empty"
    >
      <div
        className="monthly-empty-icon"
      >
        <Icon
          size={26}
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

function InlineLoading() {
  return (
    <div
      className="monthly-inline-loading"
    >
      <Loader2
        size={26}
        className="spin"
      />

      <strong>
        جارٍ احتساب الإنجاز
        من جلسات التسميع...
      </strong>

      <span>
        يتم جمع أوجه الحفظ
        والمراجعة لكل طالب.
      </span>
    </div>
  );
}

function PageLoading() {
  return (
    <div
      className="monthly-page-loading"
    >
      <div
        className="monthly-page-loading-icon"
      >
        <Loader2
          size={28}
          className="spin"
        />
      </div>

      <h3>
        جارٍ تجهيز الإنجاز
        الشهري
      </h3>

      <p>
        يتم تحميل حلقات المعلم
        وتجهيز التقويم الهجري...
      </p>
    </div>
  );
}

/* =========================================================
   Styles
========================================================= */

function MonthlyStyles() {
  return (
    <style>
      {`
        .monthly-achievement-page {
          width: 100%;
          max-width: 1600px;
          margin: 0 auto;
          color: #0f172a;
        }

        .monthly-achievement-page * {
          box-sizing: border-box;
        }

        .monthly-achievement-page button,
        .monthly-achievement-page input,
        .monthly-achievement-page select,
        .monthly-achievement-page textarea {
          font-family: inherit;
        }

        /* =============================================
           HERO
        ============================================= */

        .monthly-hero {
          position: relative;
          overflow: hidden;

          display: flex;
          align-items: center;
          justify-content: space-between;

          gap: 18px;

          padding: 22px 24px;
          margin-bottom: 14px;

          border:
            1px solid
            rgba(15,81,50,.1);

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

        .monthly-hero::before {
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
              transparent 69%
            );

          pointer-events: none;
        }

        .monthly-hero-main {
          position: relative;
          z-index: 2;

          display: flex;
          align-items: center;

          gap: 12px;

          min-width: 0;
        }

        .monthly-hero-icon {
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

        .monthly-eyebrow {
          display: flex;
          align-items: center;

          gap: 5px;

          margin-bottom: 3px;

          color: #9a741f;

          font-size: 9px;
          font-weight: 900;
        }

        .monthly-hero h1 {
          margin: 0;

          color: #173d2b;

          font-size: 25px;
          font-weight: 950;
        }

        .monthly-hero p {
          max-width: 470px;

          margin: 5px 0 0;

          color: #758079;

          font-size: 10px;
          line-height: 1.75;
        }

        .monthly-actions {
          position: relative;
          z-index: 2;

          display: flex;
          flex-wrap: wrap;
          justify-content: flex-end;

          gap: 6px;
        }

        .hero-action {
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

        .hero-action.recalc,
        .hero-action.print {
          border:
            1px solid #dce4df;

          color: #536158;
          background: #fff;
        }

        .hero-action.excel {
          border:
            1px solid #b9d8c5;

          color: #047857;
          background: #f0faf4;
        }

        .hero-action.save {
          border: none;

          color: #fff;

          background:
            linear-gradient(
              135deg,
              #0f5132,
              #0f766e
            );
        }

        .hero-action.approve {
          border: none;

          color: #fff;

          background:
            linear-gradient(
              135deg,
              #947019,
              #c69a30
            );

          box-shadow:
            0 7px 17px
            rgba(148,112,25,.14);
        }

        .hero-action:disabled {
          opacity: .5;
          cursor: wait;
        }

        /* =============================================
           UNSAVED
        ============================================= */

        .unsaved-notice {
          display: flex;
          align-items: center;

          gap: 6px;

          margin-bottom: 12px;
          padding: 9px 12px;

          border:
            1px solid #f0d9a4;

          border-radius: 12px;

          color: #765a17;
          background: #fff8e7;

          font-size: 8px;
        }

        .unsaved-notice button {
          margin-right: auto;

          border: none;
          border-radius: 8px;

          padding: 6px 9px;

          color: #fff;
          background: #8a6717;

          font-size: 7px;
          font-weight: 850;

          cursor: pointer;
        }

        /* =============================================
           SOURCE NOTE
        ============================================= */

        .monthly-source-note {
          display: flex;
          align-items: center;

          gap: 8px;

          margin-bottom: 14px;
          padding: 10px 13px;

          border:
            1px solid #dcebe3;

          border-radius: 13px;

          color: #37624c;
          background: #f4faf6;
        }

        .monthly-source-note > svg {
          flex: 0 0 auto;
        }

        .monthly-source-note strong {
          display: block;

          margin-bottom: 1px;

          font-size: 8px;
        }

        .monthly-source-note span {
          display: block;

          color: #678074;

          font-size: 7px;
          line-height: 1.65;
        }

        /* =============================================
           PERIOD
        ============================================= */

        .period-selector-card {
          display: grid;

          grid-template-columns:
            42px
            minmax(0,1fr)
            auto
            42px;

          align-items: center;

          gap: 10px;

          margin-bottom: 14px;
          padding: 14px;

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

        .period-main {
          min-width: 0;

          display: flex;
          align-items: center;

          gap: 10px;
        }

        .period-icon {
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

        .period-content {
          min-width: 0;
        }

        .period-label {
          display: block;

          margin-bottom: 4px;

          color: #8a958e;

          font-size: 7px;
        }

        .period-select-row {
          display: flex;
          align-items: center;

          gap: 6px;
        }

        .period-select {
          position: relative;
        }

        .period-select select {
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

        .period-select.year
        select {
          min-width: 90px;
        }

        .period-select > svg {
          position: absolute;

          left: 8px;
          top: 50%;

          transform:
            translateY(-50%);

          color: #859089;

          pointer-events: none;
        }

        .period-conversion {
          margin-top: 6px;
        }

        .period-conversion > span {
          display: block;

          color: #a0a8a3;

          font-size: 6px;
        }

        .period-conversion strong {
          display: flex;
          align-items: center;
          flex-wrap: wrap;

          gap: 5px;

          margin-top: 2px;

          color: #7b672f;

          font-size: 7px;
        }

        .period-current-area button {
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

        /* =============================================
           SCOPE
        ============================================= */

        .scope-card {
          margin-bottom: 14px;
          padding: 13px;

          border:
            1px solid #e4eae6;

          border-radius: 18px;

          background: #fff;

          box-shadow:
            0 6px 21px
            rgba(15,23,42,.025);
        }

        .scope-heading {
          display: flex;
          align-items: center;

          gap: 8px;

          margin-bottom: 10px;
        }

        .scope-heading-icon {
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

        .scope-heading strong {
          display: block;

          color: #33443a;

          font-size: 9px;
        }

        .scope-heading span {
          display: block;

          margin-top: 1px;

          color: #939c96;

          font-size: 6px;
        }

        .scope-grid {
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

        .halaqa-summary {
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

        .halaqa-summary span,
        .halaqa-summary small {
          display: block;

          color: #96865f;

          font-size: 6px;
        }

        .halaqa-summary strong {
          display: block;

          margin: 2px 0;

          color: #70571a;

          font-size: 9px;
          font-weight: 900;
        }

        /* =============================================
           STATS
        ============================================= */

        .monthly-stats {
          display: grid;

          grid-template-columns:
            repeat(
              5,
              minmax(0,1fr)
            );

          gap: 9px;

          margin-bottom: 17px;
        }

        .monthly-stat {
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

        .monthly-stat-icon {
          width: 36px;
          height: 36px;

          flex: 0 0 36px;

          border-radius: 11px;

          display: flex;
          align-items: center;
          justify-content: center;
        }

        .monthly-stat.students
        .monthly-stat-icon {
          color: #0f5132;
          background: #edf7f1;
        }

        .monthly-stat.memorization
        .monthly-stat-icon {
          color: #047857;
          background: #eaf8ef;
        }

        .monthly-stat.revision
        .monthly-stat-icon {
          color: #0f766e;
          background: #edf8f7;
        }

        .monthly-stat.sessions
        .monthly-stat-icon {
          color: #927536;
          background: #fff8e7;
        }

        .monthly-stat.approved
        .monthly-stat-icon {
          color: #166534;
          background: #ecfdf3;
        }

        .monthly-stat-content {
          min-width: 0;
        }

        .monthly-stat-content > span {
          display: block;

          color: #7f8a83;

          font-size: 7px;
        }

        .monthly-stat-content > strong {
          display: block;

          margin-top: 1px;

          color: #173d2b;

          font-size: 18px;
          font-weight: 950;
        }

        .monthly-stat-content > small {
          display: block;

          margin-top: 1px;

          color: #9ba39e;

          font-size: 6px;

          line-height: 1.4;
        }

        /* =============================================
           SECTION
        ============================================= */

        .students-section-header {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;

          gap: 8px;

          margin-bottom: 10px;
        }

        .students-section-header h2 {
          margin: 0;

          color: #173d2b;

          font-size: 17px;
          font-weight: 950;
        }

        .students-section-header p {
          margin: 3px 0 0;

          color: #909993;

          font-size: 7px;
        }

        .students-count {
          display: inline-flex;
          align-items: center;

          gap: 4px;

          color: #758178;

          font-size: 7px;
          font-weight: 850;
        }

        /* =============================================
           GRID
        ============================================= */

        .achievement-grid {
          display: grid;

          grid-template-columns:
            repeat(
              auto-fit,
              minmax(
                min(100%,460px),
                1fr
              )
            );

          gap: 12px;
        }

        .student-achievement-card {
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

        .student-achievement-card:hover {
          transform:
            translateY(-2px);

          box-shadow:
            0 13px 31px
            rgba(15,81,50,.065);
        }

        .student-card-line {
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

        .student-card-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;

          gap: 8px;

          margin-bottom: 10px;
        }

        .student-identity {
          min-width: 0;

          display: flex;
          align-items: center;

          gap: 8px;
        }

        .student-avatar {
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

        .student-identity h3 {
          margin: 0;

          overflow: hidden;

          color: #293a30;

          font-size: 11px;
          font-weight: 950;

          white-space: nowrap;
          text-overflow: ellipsis;
        }

        .student-identity span {
          display: block;

          margin-top: 2px;

          color: #939c96;

          font-size: 6px;
        }

        .student-badges {
          display: flex;
          flex-wrap: wrap;
          justify-content: flex-end;

          gap: 4px;
        }

        .source-badge,
        .approved-badge,
        .draft-badge,
        .changed-badge,
        .legacy-badge {
          min-height: 23px;

          padding: 0 7px;

          border-radius: 999px;

          display: inline-flex;
          align-items: center;
          justify-content: center;

          gap: 3px;

          font-size: 6px;
          font-weight: 850;
        }

        .source-badge.auto {
          color: #047857;
          background: #ecfdf3;
        }

        .source-badge.manual {
          color: #927536;
          background: #fff7df;
        }

        .source-badge.mixed {
          color: #0f766e;
          background: #edf8f7;
        }

        .source-badge.none {
          color: #64748b;
          background: #f1f5f9;
        }

        .approved-badge {
          color: #166534;
          background: #dcfce7;
        }

        .draft-badge {
          color: #64748b;
          background: #f1f5f9;
        }

        .changed-badge {
          color: #b45309;
          background: #fff7ed;
        }

        .legacy-badge {
          color: #6b5b34;
          background: #fbf7eb;
        }

        /* =============================================
           SOURCE INFO
        ============================================= */

        .student-source-info {
          display: grid;

          grid-template-columns:
            .7fr
            1.4fr
            auto;

          gap: 6px;

          margin-bottom: 10px;
          padding: 8px;

          border-radius: 11px;

          background: #f7faf8;
        }

        .student-source-info
        > div {
          display: flex;
          align-items: center;

          gap: 4px;

          min-width: 0;

          color: #7e8982;

          font-size: 6px;
        }

        .student-source-info
        strong {
          overflow: hidden;

          color: #47564d;

          font-size: 7px;

          white-space: nowrap;
          text-overflow: ellipsis;
        }

        .student-source-info
        button {
          min-height: 29px;

          padding: 0 8px;

          border:
            1px solid #cfdcd4;

          border-radius: 8px;

          display: inline-flex;
          align-items: center;
          justify-content: center;

          gap: 4px;

          color: #0f5132;
          background: #fff;

          font-size: 6px;
          font-weight: 850;

          cursor: pointer;
        }

        /* =============================================
           BLOCKS
        ============================================= */

        .achievement-columns {
          display: grid;

          grid-template-columns:
            1fr 1fr;

          gap: 8px;
        }

        .achievement-block {
          overflow: hidden;

          border:
            1px solid #e5ebe7;

          border-radius: 13px;

          background: #fbfdfc;
        }

        .achievement-block-header {
          display: flex;
          align-items: center;
          justify-content: space-between;

          gap: 6px;

          padding: 9px 10px;

          border-bottom:
            1px solid #e9eeeb;
        }

        .achievement-block-header
        > div {
          display: flex;
          align-items: center;

          gap: 5px;
        }

        .achievement-block-header
        strong {
          color: #33443a;

          font-size: 8px;
        }

        .achievement-block-header
        > span {
          color: #929c95;

          font-size: 6px;
        }

        .achievement-block.memorization
        .achievement-block-header
        > div {
          color: #047857;
        }

        .achievement-block.revision
        .achievement-block-header
        > div {
          color: #0f766e;
        }

        /* Automatic */

        .automatic-value {
          display: flex;
          align-items: center;
          justify-content: space-between;

          gap: 6px;

          margin: 8px;
          padding: 8px;

          border-radius: 9px;

          color: #047857;
          background: #edf9f2;
        }

        .automatic-value
        > div {
          display: flex;
          align-items: center;

          gap: 4px;

          font-size: 7px;
        }

        .automatic-value
        > strong {
          font-size: 13px;
          font-weight: 950;
        }

        .automatic-value
        small {
          margin-right: 2px;

          font-size: 6px;
          font-weight: 700;
        }

        /* Manual */

        .manual-value,
        .manual-reason {
          padding:
            0 8px 8px;
        }

        .manual-value label,
        .manual-reason label {
          display: block;

          margin-bottom: 4px;

          color: #6c7971;

          font-size: 6px;
          font-weight: 850;
        }

        .manual-reason
        label span {
          color: #b42318;
        }

        .manual-number {
          position: relative;
        }

        .manual-number input,
        .manual-reason input {
          width: 100%;
          height: 35px;

          border:
            1px solid #dce4df;

          border-radius: 9px;

          outline: none;

          color: #33443a;
          background: #fff;

          font-size: 8px;
        }

        .manual-number input {
          padding:
            0 8px 0 37px;
        }

        .manual-number
        > span {
          position: absolute;

          left: 8px;
          top: 50%;

          transform:
            translateY(-50%);

          color: #89938c;

          font-size: 6px;
        }

        .manual-reason input {
          padding: 0 8px;
        }

        /* Total */

        .final-value {
          display: flex;
          align-items: center;
          justify-content: space-between;

          gap: 6px;

          padding: 9px 10px;

          border-top:
            1px solid #e7ece9;

          background: #fff;
        }

        .final-value
        > span {
          color: #727f76;

          font-size: 7px;
          font-weight: 800;
        }

        .final-value
        > strong {
          color: #173d2b;

          font-size: 15px;
          font-weight: 950;
        }

        .final-value
        small {
          margin-right: 2px;

          color: #88938c;

          font-size: 6px;
        }

        /* =============================================
           NOTES
        ============================================= */

        .monthly-notes {
          margin-top: 9px;
        }

        .monthly-notes label {
          display: flex;
          align-items: center;

          gap: 4px;

          margin-bottom: 4px;

          color: #69766e;

          font-size: 6px;
          font-weight: 850;
        }

        .monthly-notes textarea {
          width: 100%;
          min-height: 51px;

          padding: 8px;

          border:
            1px solid #dfe6e2;

          border-radius: 9px;

          outline: none;

          resize: vertical;

          color: #3e4d44;
          background: #fbfdfc;

          font-size: 7px;
          line-height: 1.6;
        }

        /* =============================================
           DETAILS MODAL
        ============================================= */

        .details-overlay {
          position: fixed;
          inset: 0;

          z-index: 6000;

          display: flex;
          align-items: center;
          justify-content: center;

          padding: 16px;

          background:
            rgba(15,23,42,.58);

          backdrop-filter:
            blur(5px);
        }

        .details-modal {
          width:
            min(
              800px,
              100%
            );

          max-height:
            calc(
              100dvh - 32px
            );

          overflow-y: auto;

          border-radius: 22px;

          background: #f8faf9;

          box-shadow:
            0 30px 90px
            rgba(15,23,42,.28);
        }

        .details-header {
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
            rgba(
              255,
              255,
              255,
              .97
            );

          backdrop-filter:
            blur(12px);
        }

        .details-header
        > div > span {
          color: #0f766e;

          font-size: 7px;
          font-weight: 900;
        }

        .details-header h2 {
          margin:
            2px 0 0;

          color: #173d2b;

          font-size: 15px;
        }

        .details-header p {
          margin:
            3px 0 0;

          color: #919a94;

          font-size: 7px;
        }

        .details-header
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

        .details-summary {
          display: grid;

          grid-template-columns:
            repeat(
              3,
              1fr
            );

          gap: 7px;

          padding: 12px;
        }

        .details-summary
        > div {
          padding: 10px;

          border:
            1px solid #e4eae6;

          border-radius: 11px;

          text-align: center;

          background: #fff;
        }

        .details-summary span {
          display: block;

          color: #87928b;

          font-size: 6px;
        }

        .details-summary strong {
          display: block;

          margin-top: 2px;

          color: #0f5132;

          font-size: 16px;
        }

        .details-body {
          padding:
            0 12px 12px;
        }

        .source-record {
          display: grid;

          grid-template-columns:
            30px
            minmax(0,1fr);

          gap: 8px;

          margin-bottom: 7px;
          padding: 10px;

          border:
            1px solid #e5ebe7;

          border-radius: 12px;

          background: #fff;
        }

        .source-number {
          width: 28px;
          height: 28px;

          border-radius: 9px;

          display: flex;
          align-items: center;
          justify-content: center;

          color: #0f5132;
          background: #edf7f1;

          font-size: 8px;
          font-weight: 900;
        }

        .source-main {
          min-width: 0;
        }

        .source-date {
          margin-bottom: 7px;
        }

        .source-date strong {
          display: block;

          color: #33443a;

          font-size: 8px;
        }

        .source-date span {
          display: block;

          margin-top: 2px;

          color: #949d97;

          font-size: 6px;
        }

        .source-values {
          display: grid;

          grid-template-columns:
            1.4fr
            .65fr
            .65fr;

          gap: 6px;
        }

        .source-values > div {
          min-width: 0;

          padding: 7px;

          border-radius: 8px;

          background: #f7faf8;
        }

        .source-values span {
          display: block;

          color: #909a93;

          font-size: 6px;
        }

        .source-values strong {
          display: block;

          margin-top: 2px;

          overflow: hidden;

          color: #3c4b42;

          font-size: 7px;

          white-space: nowrap;
          text-overflow: ellipsis;
        }

        .details-empty {
          padding: 35px;

          text-align: center;

          color: #8a958e;

          font-size: 8px;
        }

        .details-footer {
          position: sticky;
          bottom: 0;

          display: flex;
          justify-content: flex-end;

          padding: 10px 12px;

          border-top:
            1px solid #e7ede9;

          background:
            rgba(
              255,
              255,
              255,
              .97
            );
        }

        .details-footer button {
          min-height: 36px;

          padding: 0 15px;

          border: none;
          border-radius: 9px;

          color: #fff;
          background: #0f5132;

          font-size: 7px;
          font-weight: 900;

          cursor: pointer;
        }

        /* =============================================
           EMPTY / LOADING
        ============================================= */

        .monthly-empty {
          padding: 50px 20px;

          border:
            1px dashed #cbd7d0;

          border-radius: 18px;

          text-align: center;

          background: #fff;
        }

        .monthly-empty-icon,
        .monthly-page-loading-icon {
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

        .monthly-empty h3,
        .monthly-page-loading h3 {
          margin: 0;

          color: #35453b;

          font-size: 13px;
        }

        .monthly-empty p,
        .monthly-page-loading p {
          margin: 4px 0 0;

          color: #8d9790;

          font-size: 8px;
        }

        .monthly-inline-loading {
          min-height: 190px;

          display: flex;
          align-items: center;
          justify-content: center;
          flex-direction: column;

          gap: 7px;

          color: #718077;

          text-align: center;
        }

        .monthly-inline-loading strong {
          font-size: 9px;
        }

        .monthly-inline-loading span {
          color: #979f9a;

          font-size: 7px;
        }

        .monthly-page-loading {
          min-height: 60vh;

          display: flex;
          align-items: center;
          justify-content: center;
          flex-direction: column;

          text-align: center;
        }

        /* =============================================
           ANIMATION
        ============================================= */

        @keyframes monthlySpin {
          to {
            transform:
              rotate(360deg);
          }
        }

        .spin {
          animation:
            monthlySpin
            .8s linear infinite;
        }

        /* =============================================
           TABLET
        ============================================= */

        @media (
          max-width: 1100px
        ) {
          .monthly-stats {
            grid-template-columns:
              repeat(
                3,
                minmax(0,1fr)
              );
          }

          .scope-grid {
            grid-template-columns:
              1fr 1fr;
          }

          .halaqa-summary {
            grid-column:
              1 / -1;
          }

          .student-source-info {
            grid-template-columns:
              1fr 1fr;
          }

          .student-source-info
          button {
            grid-column:
              1 / -1;
          }
        }

        /* =============================================
           MOBILE
        ============================================= */

        @media (
          max-width: 720px
        ) {
          .monthly-hero {
            align-items:
              flex-start;

            padding: 16px;

            border-radius: 19px;
          }

          .monthly-hero-icon {
            width: 42px;
            height: 42px;

            flex-basis: 42px;
          }

          .monthly-hero h1 {
            font-size: 20px;
          }

          .monthly-hero p {
            display: none;
          }

          .monthly-actions {
            gap: 4px;
          }

          .hero-action {
            width: 38px;
            min-height: 38px;

            padding: 0;
          }

          .hero-action span {
            display: none;
          }

          /* PERIOD */

          .period-selector-card {
            grid-template-columns:
              37px
              minmax(0,1fr)
              37px;

            gap: 6px;
          }

          .period-current-area {
            grid-column:
              1 / -1;

            text-align: center;
          }

          .period-icon {
            display: none;
          }

          .period-select-row {
            flex-wrap: wrap;
          }

          .period-select {
            flex: 1;
          }

          .period-select select,
          .period-select.year
          select {
            width: 100%;
            min-width: 0;
          }

          /* SCOPE */

          .scope-grid {
            grid-template-columns:
              1fr;
          }

          .halaqa-summary {
            grid-column: auto;
          }

          /* STATS */

          .monthly-stats {
            grid-template-columns:
              repeat(
                2,
                minmax(0,1fr)
              );

            gap: 7px;
          }

          .monthly-stat {
            padding: 10px;
          }

          /* CARD */

          .student-achievement-card:hover {
            transform: none;
          }

          .student-card-header {
            flex-direction:
              column;
          }

          .student-badges {
            justify-content:
              flex-start;
          }

          .student-source-info {
            grid-template-columns:
              1fr;
          }

          .student-source-info
          button {
            grid-column: auto;
          }

          .achievement-columns {
            grid-template-columns:
              1fr;
          }

          /* MODAL */

          .details-overlay {
            align-items:
              flex-end;

            padding: 7px;
          }

          .details-modal {
            max-height:
              95dvh;

            border-radius:
              21px 21px
              9px 9px;
          }

          .details-summary {
            grid-template-columns:
              1fr 1fr;
          }

          .source-values {
            grid-template-columns:
              1fr;
          }
        }

        /* =============================================
           SMALL MOBILE
        ============================================= */

        @media (
          max-width: 430px
        ) {
          .monthly-hero {
            padding: 13px;
          }

          .monthly-hero h1 {
            font-size: 18px;
          }

          .monthly-hero-icon {
            width: 38px;
            height: 38px;

            flex-basis: 38px;
          }

          .monthly-eyebrow {
            font-size: 7px;
          }

          .monthly-source-note {
            font-size: 7px;
          }

          .monthly-stats {
            grid-template-columns:
              1fr 1fr;
          }

          .monthly-stat-content
          > strong {
            font-size: 15px;
          }

          .details-summary {
            grid-template-columns:
              1fr;
          }
        }
      `}
    </style>
  );
}
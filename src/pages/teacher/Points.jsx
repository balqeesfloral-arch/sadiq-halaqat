// src/pages/teacher/RewardsPage.jsx

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Award,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleSlash2,
  Clock3,
  Gift,
  History,
  Loader2,
  Medal,
  MinusCircle,
  Pencil,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  Trash2,
  TrendingDown,
  TrendingUp,
  Trophy,
  UserRound,
  Users,
  WalletCards,
  X,
  XCircle,
} from "lucide-react";
import {
  supabase,
} from "../../lib/supabase";

import GrantModal
  from "../../components/rewards/GrantModal";

import DeductionModal
  from "../../components/rewards/DeductionModal";

import EditTransactionModal
  from "../../components/rewards/EditTransactionModal";

import {
  showToast,
} from "../../components/Toast";

/* =========================================================
   Helpers - Date
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
  value
) {
  return new Date(
    `${value}T12:00:00`
  );
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
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      }
    ).format(
      parseLocalDate(value)
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
      parseLocalDate(value)
    );
  } catch {
    return value;
  }
}

/* =========================================================
   Halaqa Periods
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
   Page
========================================================= */

export default function RewardsPage() {
  /* =====================================================
     Data
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

  const [
    rewardTypes,
    setRewardTypes,
  ] = useState([]);

  const [
    transactions,
    setTransactions,
  ] = useState([]);

  /* =====================================================
     Page States
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
    refreshing,
    setRefreshing,
  ] = useState(false);

  const [
    deletingTransactionId,
    setDeletingTransactionId,
  ] = useState(null);

  /* =====================================================
     Tabs
  ===================================================== */

  const [
    activeTab,
    setActiveTab,
  ] = useState("points");

  /*
    all = كل السجل
    selected = التاريخ المحدد
  */

  const [
    historyScope,
    setHistoryScope,
  ] = useState("all");

  /* =====================================================
     Filters
  ===================================================== */

  const [
    selectedDate,
    setSelectedDate,
  ] = useState(
    getLocalDate()
  );

  const [
    selectedHalaqa,
    setSelectedHalaqa,
  ] = useState("");

  const [
    search,
    setSearch,
  ] = useState("");

  /* =====================================================
     Modals
  ===================================================== */

  const [
    selectedStudent,
    setSelectedStudent,
  ] = useState(null);

  const [
    grantOpen,
    setGrantOpen,
  ] = useState(false);

  const [
    deductionOpen,
    setDeductionOpen,
  ] = useState(false);

  const [
    editTransactionOpen,
    setEditTransactionOpen,
  ] = useState(false);

  const [
    editingTransaction,
    setEditingTransaction,
  ] = useState(null);

  /* =====================================================
     Start
  ===================================================== */

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (
      selectedHalaqa
    ) {
      loadScopeData(
        selectedHalaqa,
        selectedDate
      );
    }
  }, [
    selectedHalaqa,
    selectedDate,
  ]);

  /* =====================================================
     Initial Load
  ===================================================== */

  async function loadInitialData() {
    setInitialLoading(
      true
    );

    try {
      /* Auth */

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
        data: teacherProfile,
        error: teacherError,
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

      /* Teacher Halaqat */

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
        halaqaIds.length === 0
      ) {
        setHalaqat([]);
        setStudents([]);
        setTransactions([]);

        await loadRewardTypes();

        return;
      }

      /* Halaqat */

      const {
        data: halaqatRows,
        error: halaqatError,
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

      if (halaqatError) {
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
              (item) =>
                item.mosque_id
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

      const roleMap =
        new Map();

      (
        teacherLinks ||
        []
      ).forEach(
        (item) => {
          const id =
            Number(
              item.halaqa_id
            );

          if (
            !roleMap.has(id) ||
            item.role ===
              "main"
          ) {
            roleMap.set(
              id,
              item.role
            );
          }
        }
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

      await loadRewardTypes();

      /*
        نختار أول حلقة
        تلقائيًا حتى تكون الصفحة
        جاهزة فورًا.
      */

      if (
        preparedHalaqat.length >
        0
      ) {
        setSelectedHalaqa(
          String(
            preparedHalaqat[0]
              .id
          )
        );
      }

    } catch (error) {
      console.error(
        "LOAD REWARDS PAGE:",
        error
      );

      showToast(
        error.message ||
          "تعذر تحميل صفحة المنح والخصومات",
        "error"
      );
    } finally {
      setInitialLoading(
        false
      );
    }
  }

  /* =====================================================
     Reward Types - READ ONLY

     المعلم يقرأ الأنواع فقط.
     الإدارة تتم من المشرف.
  ===================================================== */

  async function loadRewardTypes() {
    const {
      data,
      error,
    } =
      await supabase
        .from(
          "reward_types"
        )
        .select("*")
        .eq(
          "is_active",
          true
        )
        .order(
          "points",
          {
            ascending:
              false,
          }
        );

    if (error) {
      throw error;
    }

    setRewardTypes(
      data || []
    );

    return data || [];
  }

  /* =====================================================
     Scope Data

     طلاب الحلقة
     + حضور التاريخ
     + عمليات المنح والخصم
  ===================================================== */

  async function loadScopeData(
    halaqaId = selectedHalaqa,
    date = selectedDate
  ) {
    if (!halaqaId) {
      setStudents([]);
      setAttendance([]);
      setTransactions([]);

      return;
    }

    setLoading(true);

    try {
      /* Current Students */

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

            profiles!student_halaqat_student_id_fkey(
              id,
              full_name,
              user_number,
              total_points,
              status
            )
          `)
          .eq(
            "halaqa_id",
            Number(halaqaId)
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

      const studentRows =
        (
          assignments || []
        )
          .map(
            (item) => {
              const profile =
                item.profiles;

              if (!profile) {
                return null;
              }

              if (
                profile.status ===
                "archived"
              ) {
                return null;
              }

              return {
                id:
                  Number(
                    profile.id
                  ),

                full_name:
                  profile.full_name,

                user_number:
                  profile.user_number,

                total_points:
                  Number(
                    profile.total_points ||
                      0
                  ),
              };
            }
          )
          .filter(Boolean);

      /*
        منع التكرار لو توجد
        بيانات ربط قديمة مكررة.
      */

      const uniqueStudents =
        Array.from(
          new Map(
            studentRows.map(
              (student) => [
                student.id,
                student,
              ]
            )
          ).values()
        );

      const studentIds =
        uniqueStudents.map(
          (student) =>
            student.id
        );

      /* Attendance */

      const {
        data: attendanceRows,
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
          .eq(
            "halaqa_id",
            Number(halaqaId)
          )
          .eq(
            "attendance_date",
            date
          );

      if (
        attendanceError
      ) {
        throw attendanceError;
      }

      const attendanceMap =
        new Map(
          (
            attendanceRows ||
            []
          ).map(
            (record) => [
              Number(
                record.student_id
              ),
              record.status,
            ]
          )
        );

      const preparedStudents =
        uniqueStudents
          .map(
            (student) => ({
              ...student,

              /*
                مهم:
                عدم وجود سجل حضور
                لا يعني غياب.
              */

              attendance:
                attendanceMap.get(
                  student.id
                ) ||
                "unrecorded",
            })
          )
          .sort(
            (a, b) =>
              Number(
                b.total_points
              ) -
              Number(
                a.total_points
              )
          );

      setStudents(
        preparedStudents
      );

      setAttendance(
        attendanceRows || []
      );

      /* Transactions */

      if (
        studentIds.length === 0
      ) {
        setTransactions([]);

        return;
      }

      /*
        مهم:
        هذه الصفحة خاصة فقط
        بالمنح والخصومات.

        لا نعرض هنا:
        recitation
        attendance
        exams
        وغيرها.
      */

      const {
        data:
          transactionRows,
        error:
          transactionsError,
      } =
        await supabase
          .from(
            "points_transactions"
          )
          .select(`
            *,
            profiles!points_transactions_student_id_fkey(
              full_name,
              user_number
            ),
            reward_types(
              name,
              type
            )
          `)
          .in(
            "student_id",
            studentIds
          )
          .in(
            "category",
            [
              "grant",
              "deduction",
            ]
          )
          .order(
            "created_at",
            {
              ascending:
                false,
            }
          );

      if (
        transactionsError
      ) {
        throw transactionsError;
      }

      const preparedTransactions =
        (
          transactionRows ||
          []
        ).map(
          (item) => ({
            ...item,

            student_name:
              item.profiles
                ?.full_name ||
              "طالب",

            student_number:
              item.profiles
                ?.user_number ||
              "",

            reward_name:
              item.reward_types
                ?.name ||
              item.reason ||
              "عملية نقاط",
          })
        );

      setTransactions(
        preparedTransactions
      );

    } catch (error) {
      console.error(
        "LOAD REWARDS SCOPE:",
        error
      );

      showToast(
        error.message ||
          "تعذر تحميل بيانات الحلقة",
        "error"
      );
    } finally {
      setLoading(false);
    }
  }

  /* =====================================================
     Refresh
  ===================================================== */

  async function refreshAll() {
    setRefreshing(true);

    try {
      await loadRewardTypes();

      await loadScopeData(
        selectedHalaqa,
        selectedDate
      );

      showToast(
        "تم تحديث البيانات",
        "success"
      );
    } catch (error) {
      console.error(
        error
      );

      showToast(
        error.message ||
          "تعذر تحديث البيانات",
        "error"
      );
    } finally {
      setRefreshing(false);
    }
  }

  /* =====================================================
     Reward Options
  ===================================================== */

  const rewardOptions =
    useMemo(
      () =>
        rewardTypes.filter(
          (item) =>
            item.type ===
              "reward" &&
            item.is_active !==
              false
        ),
      [rewardTypes]
    );

  const penaltyOptions =
    useMemo(
      () =>
        rewardTypes.filter(
          (item) =>
            item.type ===
              "penalty" &&
            item.is_active !==
              false
        ),
      [rewardTypes]
    );

  /* =====================================================
     Search Students
  ===================================================== */

  const filteredStudents =
    useMemo(() => {
      const text =
        search
          .trim()
          .toLowerCase();

      if (!text) {
        return students;
      }

      return students.filter(
        (student) =>
          String(
            student.full_name ||
              ""
          )
            .toLowerCase()
            .includes(text) ||
          String(
            student.user_number ||
              ""
          )
            .toLowerCase()
            .includes(text)
      );
    }, [
      students,
      search,
    ]);

  /* =====================================================
     Filter Transactions
  ===================================================== */

  const filteredTransactions =
    useMemo(() => {
      const text =
        search
          .trim()
          .toLowerCase();

      return transactions.filter(
        (item) => {
          const matchesSearch =
            !text ||
            String(
              item.student_name ||
                ""
            )
              .toLowerCase()
              .includes(text) ||
            String(
              item.reward_name ||
                ""
            )
              .toLowerCase()
              .includes(text);

          const matchesDate =
            historyScope ===
              "all" ||
            item.transaction_date ===
              selectedDate;

          return (
            matchesSearch &&
            matchesDate
          );
        }
      );
    }, [
      transactions,
      search,
      historyScope,
      selectedDate,
    ]);

  /* =====================================================
     Today's / Selected Date Transactions
  ===================================================== */

  const selectedDateTransactions =
    useMemo(
      () =>
        transactions.filter(
          (item) =>
            item.transaction_date ===
            selectedDate
        ),
      [
        transactions,
        selectedDate,
      ]
    );

  /* =====================================================
     Stats
  ===================================================== */

  const stats =
    useMemo(() => {
      const grants =
        selectedDateTransactions
          .filter(
            (item) =>
              item.category ===
              "grant"
          )
          .reduce(
            (
              total,
              item
            ) =>
              total +
              Math.max(
                Number(
                  item.points ||
                    0
                ),
                0
              ),
            0
          );

      const deductions =
        Math.abs(
          selectedDateTransactions
            .filter(
              (item) =>
                item.category ===
                "deduction"
            )
            .reduce(
              (
                total,
                item
              ) =>
                total +
                Number(
                  item.points ||
                    0
                ),
              0
            )
        );

      const present =
        students.filter(
          (student) =>
            student.attendance ===
              "present" ||
            student.attendance ===
              "late"
        ).length;

      return {
        students:
          students.length,

        present,

        grants,

        deductions,

        net:
          grants -
          deductions,
      };
    }, [
      students,
      selectedDateTransactions,
    ]);

  /* =====================================================
     Ranking
  ===================================================== */

  const rankMap =
    useMemo(() => {
      const sorted = [
        ...students,
      ].sort(
        (a, b) =>
          Number(
            b.total_points
          ) -
          Number(
            a.total_points
          )
      );

      return new Map(
        sorted.map(
          (
            student,
            index
          ) => [
            student.id,
            index + 1,
          ]
        )
      );
    }, [students]);

  const leader =
    useMemo(() => {
      if (
        students.length === 0
      ) {
        return null;
      }

      return [
        ...students,
      ].sort(
        (a, b) =>
          Number(
            b.total_points
          ) -
          Number(
            a.total_points
          )
      )[0];
    }, [students]);

  const maxPoints =
    useMemo(() => {
      return Math.max(
        1,
        ...students.map(
          (student) =>
            Math.max(
              Number(
                student.total_points ||
                  0
              ),
              0
            )
        )
      );
    }, [students]);

  /* =====================================================
     Open Modals
  ===================================================== */

  function openGrant(
    student
  ) {
    if (
      !canManagePoints(
        student.attendance
      )
    ) {
      showToast(
        getAttendanceLockMessage(
          student.attendance
        ),
        "info"
      );

      return;
    }

    setSelectedStudent(
      student
    );

    setGrantOpen(true);
  }

  function openDeduction(
    student
  ) {
    if (
      !canManagePoints(
        student.attendance
      )
    ) {
      showToast(
        getAttendanceLockMessage(
          student.attendance
        ),
        "info"
      );

      return;
    }

    setSelectedStudent(
      student
    );

    setDeductionOpen(
      true
    );
  }

  function openHistory(
    student
  ) {
    setSearch(
      student.full_name
    );

    setHistoryScope(
      "all"
    );

    setActiveTab(
      "history"
    );
  }

  /* =====================================================
     Saved
  ===================================================== */

  async function handleSaved() {
    await loadScopeData(
      selectedHalaqa,
      selectedDate
    );
  }

  /* =====================================================
     Edit Transaction
  ===================================================== */

  function openEditTransaction(
    item
  ) {
    setEditingTransaction(
      item
    );

    setEditTransactionOpen(
      true
    );
  }

  /* =====================================================
     Delete Transaction
  ===================================================== */

  async function deleteTransaction(
    item
  ) {
    const confirmed =
      window.confirm(
        `هل تريد حذف هذه العملية؟\n\nالطالب: ${
          item.student_name ||
          ""
        }\nالعملية: ${
          item.reward_name ||
          ""
        }\nالنقاط: ${
          item.points
        }\n\nسيتم إعادة حساب مجموع نقاط الطالب.`
      );

    if (!confirmed) {
      return;
    }

    setDeletingTransactionId(
      item.id
    );

    try {
      const {
        error,
      } =
        await supabase
          .from(
            "points_transactions"
          )
          .delete()
          .eq(
            "id",
            item.id
          );

      if (error) {
        throw error;
      }

      /*
        مهم جدًا:
        نحسب كل مصادر النقاط،
        وليس المنح والخصومات فقط.

        لأن الطالب قد يكون لديه
        نقاط تسميع واختبارات وغيرها.
      */

      const {
        data:
          allTransactions,
        error:
          totalError,
      } =
        await supabase
          .from(
            "points_transactions"
          )
          .select("points")
          .eq(
            "student_id",
            item.student_id
          );

      if (totalError) {
        throw totalError;
      }

      const total =
        (
          allTransactions ||
          []
        ).reduce(
          (
            sum,
            row
          ) =>
            sum +
            Number(
              row.points ||
                0
            ),
          0
        );

      const {
        error:
          profileError,
      } =
        await supabase
          .from("profiles")
          .update({
            total_points:
              total,
          })
          .eq(
            "id",
            item.student_id
          );

      if (
        profileError
      ) {
        throw profileError;
      }

      showToast(
        "تم حذف العملية وإعادة حساب نقاط الطالب",
        "success"
      );

      await loadScopeData(
        selectedHalaqa,
        selectedDate
      );

    } catch (error) {
      console.error(
        "DELETE TRANSACTION:",
        error
      );

      showToast(
        error.message ||
          "تعذر حذف العملية",
        "error"
      );
    } finally {
      setDeletingTransactionId(
        null
      );
    }
  }

  /* =====================================================
     Date Navigation
  ===================================================== */

  function changeDate(
    amount
  ) {
    const date =
      parseLocalDate(
        selectedDate
      );

    date.setDate(
      date.getDate() +
        amount
    );

    const newDate =
      getLocalDate(date);

    if (
      newDate >
      getLocalDate()
    ) {
      showToast(
        "لا يمكن اختيار تاريخ مستقبلي",
        "info"
      );

      return;
    }

    setSelectedDate(
      newDate
    );
  }

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
     Render Loading
  ===================================================== */

  if (initialLoading) {
    return (
      <div
        className="rewards-page"
        dir="rtl"
      >
        <RewardsStyles />

        <PageLoading />
      </div>
    );
  }

  return (
    <div
      className="rewards-page"
      dir="rtl"
    >
      <RewardsStyles />

      {/* =================================================
          HERO
      ================================================= */}

      <section
        className="rewards-hero"
      >
        <div
          className="rewards-hero-main"
        >
          <div
            className="hero-symbol"
          >
            <Award
              size={25}
            />
          </div>

          <div>
            <div
              className="hero-eyebrow"
            >
              <ShieldCheck
                size={13}
              />

              مركز التحفيز
              والانضباط
            </div>

            <h1>
              المنح والخصومات
            </h1>

            <p>
              تحفيز الطلاب،
              متابعة الانضباط،
              وإدارة نقاط حلقاتك
              بطريقة واضحة وعادلة.
            </p>
          </div>
        </div>

        <div
          className="hero-side"
        >
          {leader && (
            <div
              className="leader-mini"
            >
              <div
                className="leader-medal"
              >
                <Medal
                  size={18}
                />
              </div>

              <div>
                <span>
                  متصدر الحلقة
                </span>

                <strong>
                  {
                    leader.full_name
                  }
                </strong>

                <small>
                  {
                    leader.total_points
                  }{" "}
                  نقطة
                </small>
              </div>
            </div>
          )}

          <button
            type="button"
            className="rewards-refresh"
            onClick={
              refreshAll
            }
            disabled={
              refreshing
            }
          >
            <RefreshCw
              size={17}
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
        </div>
      </section>

      {/* =================================================
          PERMISSION INFO
      ================================================= */}

      <div
        className="teacher-scope-note"
      >
        <Sparkles
          size={14}
        />

        تظهر لك حلقاتك وطلابك
        فقط. أنواع المنح
        والخصومات يتم اعتمادها
        وإدارتها من المشرف،
        ويستطيع المعلم استخدامها
        فقط.
      </div>

      {/* =================================================
          DATE
      ================================================= */}

      <section
        className="reward-date-card"
      >
        <button
          type="button"
          className="date-navigation"
          onClick={() =>
            changeDate(-1)
          }
        >
          <ChevronRight
            size={18}
          />
        </button>

        <div
          className="reward-date-icon"
        >
          <CalendarDays
            size={20}
          />
        </div>

        <div
          className="reward-date-text"
        >
          <span>
            التاريخ المحدد
          </span>

          <strong>
            {formatHijriDate(
              selectedDate
            )}
          </strong>

          <small>
            {formatGregorianDate(
              selectedDate
            )}
          </small>
        </div>

        <div
          className="reward-date-actions"
        >
          <input
            type="date"
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

          {selectedDate !==
            getLocalDate() && (
            <button
              type="button"
              onClick={() =>
                setSelectedDate(
                  getLocalDate()
                )
              }
            >
              اليوم
            </button>
          )}
        </div>

        <button
          type="button"
          className="date-navigation"
          onClick={() =>
            changeDate(1)
          }
          disabled={
            selectedDate ===
            getLocalDate()
          }
        >
          <ChevronLeft
            size={18}
          />
        </button>
      </section>

      {/* =================================================
          STATS
      ================================================= */}

      <section
        className="rewards-stats"
      >
        <RewardStatCard
          icon={Users}
          title="طلاب الحلقة"
          value={
            stats.students
          }
          subtitle="الطلاب الحاليون"
          tone="students"
        />

        <RewardStatCard
          icon={
            CheckCircle2
          }
          title="الحاضرون"
          value={
            stats.present
          }
          subtitle="حاضر أو متأخر"
          tone="attendance"
        />

        <RewardStatCard
          icon={Gift}
          title="المنح"
          value={
            stats.grants
          }
          subtitle="في التاريخ المحدد"
          tone="grant"
          sign="+"
        />

        <RewardStatCard
          icon={
            TrendingDown
          }
          title="الخصومات"
          value={
            stats.deductions
          }
          subtitle="في التاريخ المحدد"
          tone="deduction"
          sign="-"
        />

        <RewardStatCard
          icon={Trophy}
          title="صافي النقاط"
          value={
            stats.net
          }
          subtitle="المنح − الخصومات"
          tone={
            stats.net >= 0
              ? "net"
              : "deduction"
          }
        />
      </section>

      {/* =================================================
          FILTERS
      ================================================= */}

      <section
        className="rewards-filters"
      >
        <div
          className="filter-heading"
        >
          <div
            className="filter-icon"
          >
            <WalletCards
              size={18}
            />
          </div>

          <div>
            <strong>
              نطاق العمل
            </strong>

            <span>
              اختر الحلقة وابحث
              عن الطالب
            </span>
          </div>
        </div>

        <div
          className="filters-grid"
        >
          <div
            className="filter-field"
          >
            <label>
              الحلقة
            </label>

            <div
              className="select-container"
            >
              <select
                value={
                  selectedHalaqa
                }
                onChange={(e) => {
                  setSelectedHalaqa(
                    e.target.value
                  );

                  setSearch("");
                }}
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
                size={16}
              />
            </div>
          </div>

          <div
            className="filter-field search-filter"
          >
            <label>
              البحث
            </label>

            <div
              className="search-container"
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
          TABS
      ================================================= */}

      <div
        className="rewards-tabs"
      >
        <button
          type="button"
          className={
            activeTab ===
            "points"
              ? "reward-tab active"
              : "reward-tab"
          }
          onClick={() =>
            setActiveTab(
              "points"
            )
          }
        >
          <Gift size={16} />

          المنح والخصومات

          <span>
            {
              filteredStudents.length
            }
          </span>
        </button>

        <button
          type="button"
          className={
            activeTab ===
            "history"
              ? "reward-tab active"
              : "reward-tab"
          }
          onClick={() =>
            setActiveTab(
              "history"
            )
          }
        >
          <History
            size={16}
          />

          سجل العمليات

          <span>
            {
              transactions.length
            }
          </span>
        </button>
      </div>

      {/* =================================================
          STUDENTS
      ================================================= */}

      {activeTab ===
        "points" && (
        <>
          {loading ? (
            <InlineLoading
              text="جارٍ تحميل طلاب الحلقة..."
            />
          ) : halaqat.length ===
            0 ? (
            <EmptyState
              icon={Users}
              title="لا توجد حلقات مرتبطة بك"
              description="يجب أن يقوم المشرف بربطك بحلقة أولًا."
            />
          ) : filteredStudents.length ===
            0 ? (
            <EmptyState
              icon={Search}
              title="لا توجد نتائج"
              description={
                search
                  ? "لا يوجد طالب مطابق للبحث الحالي."
                  : "لا يوجد طلاب حاليون في هذه الحلقة."
              }
            />
          ) : (
            <section
              className="students-points-grid"
            >
              {filteredStudents.map(
                (student) => (
                  <StudentPointsCard
                    key={
                      student.id
                    }
                    student={
                      student
                    }
                    rank={
                      rankMap.get(
                        student.id
                      )
                    }
                    maxPoints={
                      maxPoints
                    }
                    onGrant={() =>
                      openGrant(
                        student
                      )
                    }
                    onDeduction={() =>
                      openDeduction(
                        student
                      )
                    }
                    onHistory={() =>
                      openHistory(
                        student
                      )
                    }
                  />
                )
              )}
            </section>
          )}
        </>
      )}

      {/* =================================================
          HISTORY
      ================================================= */}

      {activeTab ===
        "history" && (
        <section
          className="history-section"
        >
          <div
            className="history-heading"
          >
            <div>
              <h2>
                سجل العمليات
              </h2>

              <p>
                جميع عمليات المنح
                والخصومات لطلاب
                الحلقة الحالية.
              </p>
            </div>

            <div
              className="history-scope"
            >
              <button
                type="button"
                className={
                  historyScope ===
                  "all"
                    ? "active"
                    : ""
                }
                onClick={() =>
                  setHistoryScope(
                    "all"
                  )
                }
              >
                كل السجل
              </button>

              <button
                type="button"
                className={
                  historyScope ===
                  "selected"
                    ? "active"
                    : ""
                }
                onClick={() =>
                  setHistoryScope(
                    "selected"
                  )
                }
              >
                التاريخ المحدد
              </button>
            </div>
          </div>

          {loading ? (
            <InlineLoading
              text="جارٍ تحميل السجل..."
            />
          ) : filteredTransactions.length ===
            0 ? (
            <EmptyState
              icon={History}
              title="لا توجد عمليات"
              description="لا توجد منح أو خصومات مطابقة للبحث والفترة المحددة."
            />
          ) : (
            <div
              className="transactions-list"
            >
              {filteredTransactions.map(
                (item) => (
                  <TransactionCard
                    key={
                      item.id
                    }
                    item={item}
                    deleting={
                      deletingTransactionId ===
                      item.id
                    }
                    onEdit={() =>
                      openEditTransaction(
                        item
                      )
                    }
                    onDelete={() =>
                      deleteTransaction(
                        item
                      )
                    }
                  />
                )
              )}
            </div>
          )}
        </section>
      )}

      {/* =================================================
          GRANT
      ================================================= */}

      <GrantModal
        open={
          grantOpen
        }
        student={
          selectedStudent
        }
        rewardTypes={
          rewardOptions
        }
        selectedDate={
          selectedDate
        }
        selectedHalaqa={
          selectedHalaqa
        }
        onClose={() => {
          setGrantOpen(
            false
          );

          setSelectedStudent(
            null
          );
        }}
        onSaved={
          handleSaved
        }
      />

      {/* =================================================
          DEDUCTION
      ================================================= */}

      <DeductionModal
        open={
          deductionOpen
        }
        student={
          selectedStudent
        }
        penaltyTypes={
          penaltyOptions
        }
        selectedDate={
          selectedDate
        }
        selectedHalaqa={
          selectedHalaqa
        }
        onClose={() => {
          setDeductionOpen(
            false
          );

          setSelectedStudent(
            null
          );
        }}
        onSaved={
          handleSaved
        }
      />

      {/* =================================================
          EDIT TRANSACTION
      ================================================= */}

      <EditTransactionModal
        open={
          editTransactionOpen
        }
        transaction={
          editingTransaction
        }
        onClose={() => {
          setEditTransactionOpen(
            false
          );

          setEditingTransaction(
            null
          );
        }}
        onSaved={async () => {
          setEditTransactionOpen(
            false
          );

          setEditingTransaction(
            null
          );

          await loadScopeData(
            selectedHalaqa,
            selectedDate
          );
        }}
      />
    </div>
  );
}

/* =========================================================
   Student Card
========================================================= */

function StudentPointsCard({
  student,
  rank,
  maxPoints,
  onGrant,
  onDeduction,
  onHistory,
}) {
  const attendance =
    getAttendanceInfo(
      student.attendance
    );

  const AttendanceIcon =
    attendance.icon;

  const canManage =
    canManagePoints(
      student.attendance
    );

  const percentage =
    Math.max(
      0,
      Math.min(
        100,
        (
          Math.max(
            Number(
              student.total_points ||
                0
            ),
            0
          ) /
          maxPoints
        ) *
          100
      )
    );

  return (
    <article
      className="student-points-card"
    >
      <div
        className="student-card-accent"
      />

      <div
        className="student-card-head"
      >
        <div
          className="student-identity"
        >
          <div
            className="student-points-avatar"
          >
            <UserRound
              size={21}
            />
          </div>

          <div
            style={{
              minWidth: 0,
            }}
          >
            <h3>
              {
                student.full_name
              }
            </h3>

            <span>
              {student.user_number
                ? `رقم الطالب: ${student.user_number}`
                : "طالب الحلقة"}
            </span>
          </div>
        </div>

        <div
          className={
            rank === 1
              ? "rank-badge first"
              : "rank-badge"
          }
        >
          {rank === 1 ? (
            <Medal
              size={13}
            />
          ) : (
            <span>
              #
            </span>
          )}

          {rank}
        </div>
      </div>

      {/* Attendance */}

      <div
        className={
          `student-attendance ${attendance.className}`
        }
      >
        <div>
          <AttendanceIcon
            size={15}
          />

          <span>
            حالة الحضور
          </span>
        </div>

        <strong>
          {attendance.label}
        </strong>
      </div>

      {/* Points */}

      <div
        className="student-points-display"
      >
        <div>
          <Trophy
            size={18}
          />

          <span>
            الرصيد الحالي
          </span>
        </div>

        <strong>
          {
            student.total_points
          }

          <small>
            نقطة
          </small>
        </strong>
      </div>

      {/* Progress */}

      <div
        className="student-ranking-progress"
      >
        <div>
          <span>
            مقارنة بمتصدر
            الحلقة
          </span>

          <strong>
            {Math.round(
              percentage
            )}
            %
          </strong>
        </div>

        <div
          className="ranking-track"
        >
          <div
            style={{
              width:
                `${percentage}%`,
            }}
          />
        </div>
      </div>

      {!canManage && (
        <div
          className="points-lock-note"
        >
          <ShieldCheck
            size={13}
          />

          {getAttendanceLockMessage(
            student.attendance
          )}
        </div>
      )}

      {/* Actions */}

      <div
        className="student-points-actions"
      >
        <button
          type="button"
          className="points-action grant"
          disabled={
            !canManage
          }
          onClick={
            onGrant
          }
          title={
            canManage
              ? "منح نقاط"
              : getAttendanceLockMessage(
                  student.attendance
                )
          }
        >
          <Gift
            size={15}
          />

          منح
        </button>

        <button
          type="button"
          className="points-action deduction"
          disabled={
            !canManage
          }
          onClick={
            onDeduction
          }
          title={
            canManage
              ? "خصم نقاط"
              : getAttendanceLockMessage(
                  student.attendance
                )
          }
        >
          <MinusCircle
            size={15}
          />

          خصم
        </button>

        <button
          type="button"
          className="points-action history"
          onClick={
            onHistory
          }
        >
          <History
            size={15}
          />

          السجل
        </button>
      </div>
    </article>
  );
}

/* =========================================================
   Transaction
========================================================= */

function TransactionCard({
  item,
  deleting,
  onEdit,
  onDelete,
}) {
  const grant =
    item.category ===
    "grant";

  return (
    <article
      className={
        grant
          ? "transaction-card grant"
          : "transaction-card deduction"
      }
    >
      <div
        className="transaction-icon"
      >
        {grant ? (
          <Gift
            size={18}
          />
        ) : (
          <MinusCircle
            size={18}
          />
        )}
      </div>

      <div
        className="transaction-main"
      >
        <div
          className="transaction-title-row"
        >
          <div>
            <h3>
              {
                item.student_name
              }
            </h3>

            <span>
              {grant
                ? "منح نقاط"
                : "خصم نقاط"}
            </span>
          </div>

          <strong
            className="transaction-points"
          >
            {Number(
              item.points ||
                0
            ) > 0
              ? "+"
              : ""}
            {
              item.points
            }
          </strong>
        </div>

        <div
          className="transaction-reason"
        >
          <Award
            size={12}
          />

          {item.reward_name ||
            item.reason ||
            "عملية نقاط"}
        </div>

        <div
          className="transaction-date"
        >
          <CalendarDays
            size={12}
          />

          <div>
            <strong>
              {formatHijriDate(
                item.transaction_date
              )}
            </strong>

            <span>
              {formatGregorianDate(
                item.transaction_date
              )}
            </span>
          </div>
        </div>
      </div>

      <div
        className="transaction-actions"
      >
        <button
          type="button"
          className="edit"
          onClick={
            onEdit
          }
          disabled={
            deleting
          }
          title="تعديل العملية"
        >
          <Pencil
            size={14}
          />
        </button>

        <button
          type="button"
          className="delete"
          onClick={
            onDelete
          }
          disabled={
            deleting
          }
          title="حذف العملية"
        >
          {deleting ? (
            <Loader2
              size={14}
              className="spin"
            />
          ) : (
            <Trash2
              size={14}
            />
          )}
        </button>
      </div>
    </article>
  );
}

/* =========================================================
   Stat
========================================================= */

function RewardStatCard({
  icon: Icon,
  title,
  value,
  subtitle,
  tone,
  sign,
}) {
  return (
    <div
      className={
        `reward-stat ${tone}`
      }
    >
      <div
        className="reward-stat-icon"
      >
        <Icon
          size={18}
        />
      </div>

      <div
        className="reward-stat-content"
      >
        <span>
          {title}
        </span>

        <strong>
          {sign &&
          Number(value) >
            0
            ? sign
            : ""}
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
      className="rewards-empty"
    >
      <div
        className="rewards-empty-icon"
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
   Loading
========================================================= */

function InlineLoading({
  text,
}) {
  return (
    <div
      className="inline-rewards-loading"
    >
      <Loader2
        size={24}
        className="spin"
      />

      <span>
        {text}
      </span>
    </div>
  );
}

function PageLoading() {
  return (
    <div
      className="rewards-page-loading"
    >
      <div
        className="loading-reward-icon"
      >
        <Loader2
          size={28}
          className="spin"
        />
      </div>

      <h3>
        جارٍ تجهيز مركز
        التحفيز
      </h3>

      <p>
        يتم تحميل حلقاتك
        والطلاب ونظام النقاط...
      </p>
    </div>
  );
}

/* =========================================================
   Attendance
========================================================= */

function canManagePoints(
  status
) {
  /*
    المتأخر حاضر فعليًا
    ويمكن للمعلم تقييمه.

    الغائب / المعتذر /
    غير المسجل:
    نوقف المنح والخصم.
  */

  return (
    status === "present" ||
    status === "late"
  );
}

function getAttendanceLockMessage(
  status
) {
  if (
    status === "absent"
  ) {
    return "الطالب غائب؛ لا يمكن تنفيذ منح أو خصم.";
  }

  if (
    status === "excused"
  ) {
    return "الطالب معتذر عن الحضور؛ تم إيقاف إجراءات النقاط.";
  }

  if (
    status === "unrecorded"
  ) {
    return "سجّل حضور الطالب أولًا قبل تنفيذ المنح أو الخصم.";
  }

  return "";
}

function getAttendanceInfo(
  status
) {
  switch (status) {
    case "present":
      return {
        label:
          "حاضر",

        className:
          "present",

        icon:
          CheckCircle2,
      };

    case "late":
      return {
        label:
          "متأخر",

        className:
          "late",

        icon:
          Clock3,
      };

    case "absent":
      return {
        label:
          "غائب",

        className:
          "absent",

        icon:
          XCircle,
      };

    case "excused":
      return {
        label:
          "معتذر",

        className:
          "excused",

        icon:
          CircleSlash2,
      };

    default:
      return {
        label:
          "لم يسجل",

        className:
          "unrecorded",

        icon:
          Clock3,
      };
  }
}

/* =========================================================
   CSS
========================================================= */

function RewardsStyles() {
  return (
    <style>
      {`
        .rewards-page {
          width: 100%;
          max-width: 1600px;
          margin: 0 auto;
          color: #0f172a;
        }

        .rewards-page * {
          box-sizing: border-box;
        }

        .rewards-page button,
        .rewards-page input,
        .rewards-page select {
          font-family: inherit;
        }

        /* ============================================
           HERO
        ============================================ */

        .rewards-hero {
          position: relative;
          overflow: hidden;

          display: flex;
          align-items: center;
          justify-content: space-between;

          gap: 18px;

          min-height: 128px;

          padding: 23px 24px;
          margin-bottom: 15px;

          border:
            1px solid
            rgba(15,81,50,.1);

          border-radius: 24px;

          background:
            linear-gradient(
              135deg,
              #ffffff 0%,
              #f5faf7 64%,
              #fcfaf3 100%
            );

          box-shadow:
            0 14px 38px
            rgba(15,81,50,.055);
        }

        .rewards-hero::before {
          content: "";

          position: absolute;

          width: 280px;
          height: 280px;

          left: -150px;
          top: -160px;

          border-radius: 50%;

          background:
            radial-gradient(
              circle,
              rgba(201,162,39,.15),
              transparent 69%
            );

          pointer-events: none;
        }

        .rewards-hero::after {
          content: "";

          position: absolute;

          width: 260px;
          height: 260px;

          right: 25%;
          bottom: -210px;

          border-radius: 50%;

          background:
            radial-gradient(
              circle,
              rgba(15,118,110,.055),
              transparent 70%
            );

          pointer-events: none;
        }

        .rewards-hero-main {
          position: relative;
          z-index: 2;

          display: flex;
          align-items: center;

          gap: 13px;

          min-width: 0;
        }

        .hero-symbol {
          width: 51px;
          height: 51px;

          flex: 0 0 51px;

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
            rgba(15,81,50,.19);
        }

        .hero-eyebrow {
          display: flex;
          align-items: center;

          gap: 5px;

          margin-bottom: 3px;

          color: #9a741f;

          font-size: 9px;
          font-weight: 900;
        }

        .rewards-hero h1 {
          margin: 0;

          color: #173d2b;

          font-size: 26px;
          font-weight: 950;
        }

        .rewards-hero p {
          margin: 5px 0 0;

          color: #748079;

          font-size: 11px;
          line-height: 1.75;
        }

        .hero-side {
          position: relative;
          z-index: 2;

          display: flex;
          align-items: center;

          gap: 9px;
        }

        .leader-mini {
          min-width: 185px;

          display: flex;
          align-items: center;

          gap: 8px;

          padding: 9px 11px;

          border:
            1px solid #f0e1bd;

          border-radius: 14px;

          background:
            rgba(255,250,239,.85);

          backdrop-filter:
            blur(10px);
        }

        .leader-medal {
          width: 36px;
          height: 36px;

          flex: 0 0 36px;

          border-radius: 11px;

          display: flex;
          align-items: center;
          justify-content: center;

          color: #9a741f;
          background: #ffefc4;
        }

        .leader-mini span,
        .leader-mini small {
          display: block;

          color: #9a8a64;

          font-size: 7px;
        }

        .leader-mini strong {
          display: block;

          max-width: 120px;

          margin: 1px 0;

          overflow: hidden;

          color: #5e4a1c;

          font-size: 9px;
          font-weight: 900;

          white-space: nowrap;
          text-overflow: ellipsis;
        }

        .rewards-refresh {
          height: 43px;

          padding: 0 13px;

          border:
            1px solid #dfe7e2;

          border-radius: 12px;

          display: inline-flex;
          align-items: center;
          justify-content: center;

          gap: 6px;

          color: #0f5132;
          background: #fff;

          font-size: 9px;
          font-weight: 900;

          cursor: pointer;
        }

        .rewards-refresh:disabled {
          opacity: .55;
          cursor: wait;
        }

        /* ============================================
           SCOPE NOTE
        ============================================ */

        .teacher-scope-note {
          display: flex;
          align-items: center;

          gap: 7px;

          margin-bottom: 15px;
          padding: 10px 13px;

          border:
            1px solid #dcebe3;

          border-radius: 13px;

          color: #37624c;
          background: #f4faf6;

          font-size: 9px;
          line-height: 1.7;
        }

        /* ============================================
           DATE
        ============================================ */

        .reward-date-card {
          display: grid;

          grid-template-columns:
            40px
            44px
            minmax(0,1fr)
            auto
            40px;

          align-items: center;

          gap: 9px;

          margin-bottom: 16px;
          padding: 12px 14px;

          border:
            1px solid #e4eae6;

          border-radius: 18px;

          background: #fff;

          box-shadow:
            0 6px 22px
            rgba(15,23,42,.03);
        }

        .date-navigation {
          width: 38px;
          height: 38px;

          border:
            1px solid #e0e6e2;

          border-radius: 10px;

          display: flex;
          align-items: center;
          justify-content: center;

          color: #0f5132;
          background: #fff;

          cursor: pointer;
        }

        .date-navigation:disabled {
          opacity: .3;
          cursor: not-allowed;
        }

        .reward-date-icon {
          width: 42px;
          height: 42px;

          border-radius: 12px;

          display: flex;
          align-items: center;
          justify-content: center;

          color: #0f5132;
          background: #edf7f1;
        }

        .reward-date-text {
          min-width: 0;
        }

        .reward-date-text > span {
          display: block;

          color: #939c96;

          font-size: 7px;
        }

        .reward-date-text > strong {
          display: block;

          margin-top: 1px;

          color: #173d2b;

          font-size: 11px;
          font-weight: 900;
        }

        .reward-date-text > small {
          display: block;

          margin-top: 2px;

          color: #9a741f;

          font-size: 8px;
          font-weight: 750;
        }

        .reward-date-actions {
          display: flex;
          align-items: center;

          gap: 6px;
        }

        .reward-date-actions input {
          height: 36px;

          border:
            1px solid #dce3df;

          border-radius: 9px;

          padding: 0 8px;

          color: #44534a;
          background: #fbfdfc;

          outline: none;

          font-size: 8px;
        }

        .reward-date-actions button {
          height: 36px;

          border: none;
          border-radius: 9px;

          padding: 0 11px;

          color: #fff;
          background: #0f5132;

          font-size: 8px;
          font-weight: 900;

          cursor: pointer;
        }

        /* ============================================
           STATS
        ============================================ */

        .rewards-stats {
          display: grid;

          grid-template-columns:
            repeat(
              5,
              minmax(0,1fr)
            );

          gap: 9px;

          margin-bottom: 17px;
        }

        .reward-stat {
          min-width: 0;

          display: flex;
          align-items: center;

          gap: 9px;

          padding: 13px;

          border:
            1px solid #e5ebe7;

          border-radius: 16px;

          background: #fff;

          box-shadow:
            0 6px 20px
            rgba(15,23,42,.03);
        }

        .reward-stat-icon {
          width: 37px;
          height: 37px;

          flex: 0 0 37px;

          border-radius: 11px;

          display: flex;
          align-items: center;
          justify-content: center;
        }

        .reward-stat.students
        .reward-stat-icon {
          color: #0f5132;
          background: #edf7f1;
        }

        .reward-stat.attendance
        .reward-stat-icon {
          color: #047857;
          background: #eaf8ef;
        }

        .reward-stat.grant
        .reward-stat-icon {
          color: #9a741f;
          background: #fff6dd;
        }

        .reward-stat.deduction
        .reward-stat-icon {
          color: #b42318;
          background: #fff0ef;
        }

        .reward-stat.net
        .reward-stat-icon {
          color: #0f766e;
          background: #ebf8f7;
        }

        .reward-stat-content {
          min-width: 0;
        }

        .reward-stat-content > span {
          display: block;

          color: #7e8a82;

          font-size: 8px;
          font-weight: 750;
        }

        .reward-stat-content > strong {
          display: block;

          margin-top: 1px;

          color: #173d2b;

          font-size: 19px;
          font-weight: 950;
        }

        .reward-stat-content > small {
          display: block;

          margin-top: 1px;

          color: #9da59f;

          font-size: 6px;
        }

        /* ============================================
           FILTERS
        ============================================ */

        .rewards-filters {
          margin-bottom: 16px;
          padding: 13px;

          border:
            1px solid #e4eae6;

          border-radius: 18px;

          background: #fff;

          box-shadow:
            0 6px 22px
            rgba(15,23,42,.03);
        }

        .filter-heading {
          display: flex;
          align-items: center;

          gap: 8px;

          margin-bottom: 11px;
        }

        .filter-icon {
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

        .filter-heading strong {
          display: block;

          color: #33443a;

          font-size: 10px;
        }

        .filter-heading span {
          display: block;

          margin-top: 1px;

          color: #939c96;

          font-size: 7px;
        }

        .filters-grid {
          display: grid;

          grid-template-columns:
            minmax(190px,.75fr)
            minmax(250px,1.2fr)
            minmax(200px,.8fr);

          gap: 9px;

          align-items: end;
        }

        .filter-field label {
          display: block;

          margin-bottom: 5px;

          color: #617067;

          font-size: 8px;
          font-weight: 850;
        }

        .select-container,
        .search-container {
          position: relative;
        }

        .select-container select,
        .search-container input {
          width: 100%;
          height: 40px;

          border:
            1px solid #dce4df;

          border-radius: 10px;

          outline: none;

          color: #33443a;
          background: #fbfdfc;

          font-size: 9px;
        }

        .select-container select {
          appearance: none;

          padding:
            0 9px 0 30px;
        }

        .select-container > svg {
          position: absolute;

          left: 9px;
          top: 50%;

          transform:
            translateY(-50%);

          color: #859089;

          pointer-events: none;
        }

        .search-container > svg {
          position: absolute;

          right: 11px;
          top: 50%;

          transform:
            translateY(-50%);

          color: #8c9690;

          pointer-events: none;
        }

        .search-container input {
          padding:
            0 35px 0 32px;
        }

        .search-container button {
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

          color: #657169;
          background: #edf1ef;

          cursor: pointer;
        }

        .halaqa-summary {
          min-height: 59px;

          padding: 8px 10px;

          border:
            1px solid #e7e0cd;

          border-radius: 11px;

          background:
            linear-gradient(
              135deg,
              #fffdf8,
              #fff9ea
            );
        }

        .halaqa-summary span,
        .halaqa-summary small {
          display: block;

          color: #988760;

          font-size: 6px;
        }

        .halaqa-summary strong {
          display: block;

          margin: 2px 0;

          color: #6e561d;

          font-size: 9px;
          font-weight: 900;
        }

        /* ============================================
           TABS
        ============================================ */

        .rewards-tabs {
          width: fit-content;

          display: flex;
          align-items: center;

          gap: 6px;

          margin-bottom: 15px;
          padding: 5px;

          border:
            1px solid #e4eae6;

          border-radius: 13px;

          background: #fff;
        }

        .reward-tab {
          min-height: 38px;

          padding: 0 12px;

          border:
            1px solid transparent;

          border-radius: 9px;

          display: inline-flex;
          align-items: center;
          justify-content: center;

          gap: 6px;

          color: #6a766e;
          background: transparent;

          font-size: 8px;
          font-weight: 900;

          cursor: pointer;
        }

        .reward-tab > span {
          min-width: 20px;

          padding: 2px 5px;

          border-radius: 999px;

          text-align: center;

          color: #758178;
          background: #edf1ef;

          font-size: 6px;
        }

        .reward-tab.active {
          color: #fff;

          background:
            linear-gradient(
              135deg,
              #0f5132,
              #0f766e
            );

          box-shadow:
            0 7px 18px
            rgba(15,81,50,.16);
        }

        .reward-tab.active
        > span {
          color: #0f5132;
          background: #fff;
        }

        /* ============================================
           STUDENTS
        ============================================ */

        .students-points-grid {
          display: grid;

          grid-template-columns:
            repeat(
              auto-fit,
              minmax(
                min(100%,300px),
                1fr
              )
            );

          gap: 12px;
        }

        .student-points-card {
          position: relative;
          overflow: hidden;

          min-width: 0;

          padding: 15px;

          border:
            1px solid #e4eae6;

          border-radius: 18px;

          background: #fff;

          box-shadow:
            0 7px 23px
            rgba(15,23,42,.035);

          transition:
            transform .2s ease,
            box-shadow .2s ease;
        }

        .student-points-card:hover {
          transform:
            translateY(-2px);

          box-shadow:
            0 13px 32px
            rgba(15,81,50,.07);
        }

        .student-card-accent {
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

        .student-card-head {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;

          gap: 8px;

          margin-bottom: 12px;
        }

        .student-identity {
          min-width: 0;

          display: flex;
          align-items: center;

          gap: 8px;
        }

        .student-points-avatar {
          width: 40px;
          height: 40px;

          flex: 0 0 40px;

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

          color: #28382f;

          font-size: 11px;
          font-weight: 950;

          white-space: nowrap;
          text-overflow: ellipsis;
        }

        .student-identity span {
          display: block;

          margin-top: 2px;

          color: #939c96;

          font-size: 7px;
        }

        .rank-badge {
          min-width: 34px;
          height: 27px;

          padding: 0 7px;

          border-radius: 9px;

          display: flex;
          align-items: center;
          justify-content: center;

          gap: 3px;

          color: #657169;
          background: #f1f4f2;

          font-size: 8px;
          font-weight: 900;
        }

        .rank-badge.first {
          color: #927536;
          background: #fff4d7;
        }

        /* ATTENDANCE */

        .student-attendance {
          display: flex;
          align-items: center;
          justify-content: space-between;

          gap: 8px;

          margin-bottom: 8px;
          padding: 8px 9px;

          border-radius: 10px;

          font-size: 8px;
        }

        .student-attendance > div {
          display: flex;
          align-items: center;

          gap: 5px;
        }

        .student-attendance.present {
          color: #047857;
          background: #edf9f2;
        }

        .student-attendance.late {
          color: #927536;
          background: #fff8e7;
        }

        .student-attendance.absent {
          color: #b42318;
          background: #fff1f0;
        }

        .student-attendance.excused {
          color: #64748b;
          background: #f1f5f9;
        }

        .student-attendance.unrecorded {
          color: #647168;
          background: #f3f5f4;
        }

        /* POINTS */

        .student-points-display {
          display: flex;
          align-items: center;
          justify-content: space-between;

          gap: 10px;

          padding: 10px;

          border:
            1px solid #efe2c4;

          border-radius: 11px;

          background:
            linear-gradient(
              135deg,
              #fffaf0,
              #fffdf9
            );
        }

        .student-points-display
        > div {
          display: flex;
          align-items: center;

          gap: 5px;

          color: #927536;

          font-size: 7px;
        }

        .student-points-display
        > strong {
          color: #86661a;

          font-size: 18px;
          font-weight: 950;
        }

        .student-points-display
        small {
          margin-right: 3px;

          color: #a0906d;

          font-size: 6px;
        }

        /* RANK PROGRESS */

        .student-ranking-progress {
          margin-top: 9px;
        }

        .student-ranking-progress
        > div:first-child {
          display: flex;
          justify-content: space-between;

          gap: 8px;

          margin-bottom: 5px;

          color: #88938c;

          font-size: 6px;
        }

        .student-ranking-progress
        strong {
          color: #0f5132;
        }

        .ranking-track {
          height: 5px;

          overflow: hidden;

          border-radius: 999px;

          background: #e9efeb;
        }

        .ranking-track > div {
          height: 100%;

          border-radius: 999px;

          background:
            linear-gradient(
              90deg,
              #0f5132,
              #c9a227
            );
        }

        /* LOCK */

        .points-lock-note {
          display: flex;
          align-items: flex-start;

          gap: 5px;

          margin-top: 9px;
          padding: 7px 8px;

          border-radius: 9px;

          color: #7b7160;
          background: #f8f5ee;

          font-size: 6px;
          line-height: 1.5;
        }

        /* ACTIONS */

        .student-points-actions {
          display: grid;

          grid-template-columns:
            1fr 1fr 1fr;

          gap: 5px;

          margin-top: 11px;
        }

        .points-action {
          min-height: 35px;

          border-radius: 9px;

          display: inline-flex;
          align-items: center;
          justify-content: center;

          gap: 4px;

          font-size: 7px;
          font-weight: 900;

          cursor: pointer;
        }

        .points-action.grant {
          border:
            1px solid #b7dcc4;

          color: #047857;
          background: #f0faf4;
        }

        .points-action.deduction {
          border:
            1px solid #efd0cd;

          color: #b42318;
          background: #fff5f4;
        }

        .points-action.history {
          border:
            1px solid #dce3df;

          color: #5f6c64;
          background: #fff;
        }

        .points-action:disabled {
          opacity: .35;
          cursor: not-allowed;
          filter: grayscale(.2);
        }

        /* ============================================
           HISTORY
        ============================================ */

        .history-section {
          min-width: 0;
        }

        .history-heading {
          display: flex;
          align-items: center;
          justify-content: space-between;

          gap: 10px;

          margin-bottom: 11px;
        }

        .history-heading h2 {
          margin: 0;

          color: #173d2b;

          font-size: 16px;
          font-weight: 950;
        }

        .history-heading p {
          margin: 3px 0 0;

          color: #8d9690;

          font-size: 7px;
        }

        .history-scope {
          display: flex;

          gap: 4px;

          padding: 4px;

          border:
            1px solid #e3e9e5;

          border-radius: 10px;

          background: #fff;
        }

        .history-scope button {
          min-height: 31px;

          padding: 0 9px;

          border: none;
          border-radius: 7px;

          color: #6d7971;
          background: transparent;

          font-size: 7px;
          font-weight: 850;

          cursor: pointer;
        }

        .history-scope
        button.active {
          color: #fff;
          background: #0f5132;
        }

        .transactions-list {
          display: grid;

          gap: 8px;
        }

        .transaction-card {
          display: grid;

          grid-template-columns:
            40px
            minmax(0,1fr)
            auto;

          gap: 10px;

          align-items: center;

          padding: 11px 12px;

          border:
            1px solid #e5ebe7;

          border-radius: 14px;

          background: #fff;

          box-shadow:
            0 4px 15px
            rgba(15,23,42,.025);
        }

        .transaction-card.grant {
          border-right:
            3px solid #1a8b5d;
        }

        .transaction-card.deduction {
          border-right:
            3px solid #c24134;
        }

        .transaction-icon {
          width: 38px;
          height: 38px;

          border-radius: 11px;

          display: flex;
          align-items: center;
          justify-content: center;
        }

        .transaction-card.grant
        .transaction-icon {
          color: #047857;
          background: #ecf9f2;
        }

        .transaction-card.deduction
        .transaction-icon {
          color: #b42318;
          background: #fff0ef;
        }

        .transaction-main {
          min-width: 0;
        }

        .transaction-title-row {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;

          gap: 10px;
        }

        .transaction-title-row h3 {
          margin: 0;

          color: #33443a;

          font-size: 9px;
          font-weight: 950;
        }

        .transaction-title-row span {
          display: block;

          margin-top: 1px;

          color: #949d97;

          font-size: 6px;
        }

        .transaction-points {
          font-size: 13px;
          font-weight: 950;
        }

        .transaction-card.grant
        .transaction-points {
          color: #047857;
        }

        .transaction-card.deduction
        .transaction-points {
          color: #b42318;
        }

        .transaction-reason {
          display: flex;
          align-items: center;

          gap: 4px;

          margin-top: 5px;

          color: #58665d;

          font-size: 7px;
          font-weight: 750;
        }

        .transaction-date {
          display: flex;
          align-items: flex-start;

          gap: 4px;

          margin-top: 5px;

          color: #0f5132;
        }

        .transaction-date strong {
          display: block;

          font-size: 6px;
        }

        .transaction-date span {
          display: block;

          margin-top: 1px;

          color: #9aa29d;

          font-size: 6px;
        }

        .transaction-actions {
          display: flex;

          gap: 4px;
        }

        .transaction-actions button {
          width: 31px;
          height: 31px;

          border-radius: 8px;

          display: flex;
          align-items: center;
          justify-content: center;

          cursor: pointer;
        }

        .transaction-actions
        .edit {
          border:
            1px solid #cfdcd4;

          color: #0f5132;
          background: #f6faf8;
        }

        .transaction-actions
        .delete {
          border:
            1px solid #efd1ce;

          color: #b42318;
          background: #fff5f4;
        }

        /* ============================================
           EMPTY + LOADING
        ============================================ */

        .rewards-empty {
          padding: 50px 20px;

          border:
            1px dashed #ccd7d0;

          border-radius: 18px;

          text-align: center;

          background: #fff;
        }

        .rewards-empty-icon,
        .loading-reward-icon {
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

        .rewards-empty h3,
        .rewards-page-loading h3 {
          margin: 0;

          color: #35453b;

          font-size: 13px;
        }

        .rewards-empty p,
        .rewards-page-loading p {
          margin: 4px 0 0;

          color: #8e9791;

          font-size: 8px;
        }

        .inline-rewards-loading {
          min-height: 180px;

          display: flex;
          align-items: center;
          justify-content: center;
          flex-direction: column;

          gap: 7px;

          color: #748079;

          font-size: 8px;
        }

        .rewards-page-loading {
          min-height: 60vh;

          display: flex;
          align-items: center;
          justify-content: center;
          flex-direction: column;

          text-align: center;
        }

        /* ============================================
           ANIMATION
        ============================================ */

        @keyframes rewardsSpin {
          to {
            transform:
              rotate(360deg);
          }
        }

        .spin {
          animation:
            rewardsSpin
            .8s linear infinite;
        }

        /* ============================================
           TABLET
        ============================================ */

        @media (
          max-width: 1100px
        ) {
          .rewards-stats {
            grid-template-columns:
              repeat(
                3,
                minmax(0,1fr)
              );
          }

          .filters-grid {
            grid-template-columns:
              1fr 1fr;
          }

          .halaqa-summary {
            grid-column:
              1 / -1;
          }
        }

        /* ============================================
           MOBILE
        ============================================ */

        @media (
          max-width: 720px
        ) {
          .rewards-hero {
            padding: 17px;

            border-radius: 19px;
          }

          .hero-symbol {
            width: 42px;
            height: 42px;

            flex-basis: 42px;
          }

          .rewards-hero h1 {
            font-size: 20px;
          }

          .rewards-hero p {
            display: none;
          }

          .leader-mini {
            display: none;
          }

          .rewards-refresh {
            width: 40px;
            padding: 0;
          }

          .rewards-refresh span {
            display: none;
          }

          /* DATE */

          .reward-date-card {
            grid-template-columns:
              36px
              minmax(0,1fr)
              36px;

            gap: 7px;
          }

          .reward-date-icon {
            display: none;
          }

          .reward-date-actions {
            grid-column:
              1 / -1;

            justify-content:
              center;

            border-top:
              1px solid #edf1ef;

            padding-top: 9px;
          }

          .date-navigation {
            width: 35px;
            height: 35px;
          }

          /* STATS */

          .rewards-stats {
            grid-template-columns:
              repeat(
                2,
                minmax(0,1fr)
              );

            gap: 7px;
          }

          .reward-stat {
            padding: 10px;

            gap: 7px;
          }

          .reward-stat-icon {
            width: 32px;
            height: 32px;

            flex-basis: 32px;
          }

          .reward-stat-content
          > strong {
            font-size: 16px;
          }

          /* FILTERS */

          .filters-grid {
            grid-template-columns:
              1fr;
          }

          .halaqa-summary {
            grid-column: auto;
          }

          /* TABS */

          .rewards-tabs {
            width: 100%;
          }

          .reward-tab {
            flex: 1;
          }

          /* STUDENTS */

          .student-points-card:hover {
            transform: none;
          }

          /* HISTORY */

          .history-heading {
            align-items:
              flex-start;

            flex-direction:
              column;
          }

          .history-scope {
            width: 100%;
          }

          .history-scope
          button {
            flex: 1;
          }

          .transaction-card {
            grid-template-columns:
              38px
              minmax(0,1fr);
          }

          .transaction-actions {
            grid-column:
              1 / -1;

            justify-content:
              flex-end;

            border-top:
              1px solid #edf1ef;

            padding-top: 8px;
          }
        }

        /* ============================================
           SMALL MOBILE
        ============================================ */

        @media (
          max-width: 430px
        ) {
          .rewards-hero {
            min-height: auto;

            padding: 14px;
          }

          .rewards-hero h1 {
            font-size: 18px;
          }

          .hero-eyebrow {
            font-size: 7px;
          }

          .hero-symbol {
            width: 38px;
            height: 38px;

            flex-basis: 38px;
          }

          .teacher-scope-note {
            font-size: 7px;
          }

          .reward-date-text
          > strong {
            overflow: hidden;

            white-space: nowrap;
            text-overflow: ellipsis;

            font-size: 9px;
          }

          .reward-date-text
          > small {
            font-size: 7px;
          }

          .student-points-actions {
            grid-template-columns:
              1fr 1fr;
          }

          .points-action.history {
            grid-column:
              1 / -1;
          }
        }
      `}
    </style>
  );
}
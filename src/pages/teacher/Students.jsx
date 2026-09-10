import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";

import {
  Users,
  Search,
  Plus,
  Pencil,
  Trash2,
  ArrowRight,
  CheckCircle2,
  XCircle,
  UserRound,
  BookOpen,
  Phone,
  CalendarDays,
  Trophy,
  Clock3,
  UserX,
  UserCheck,
  CircleSlash,
  GraduationCap,
  Save,
  X,
  RotateCcw,
  Video,
  BookMarked,
  Timer,
  FileText,
  ChevronDown,
  UserPlus,
} from "lucide-react";

/* =========================================================
   الثوابت
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

const EDUCATION_LEVELS = [
  { value: "primary", label: "ابتدائي" },
  { value: "middle", label: "متوسط" },
  { value: "secondary", label: "ثانوي" },
  { value: "university", label: "جامعي" },
  { value: "other", label: "غير ذلك" },
];

const MEMORIZATION_TARGETS = [
  { value: "quran", label: "القرآن الكريم" },
  { value: "noorania", label: "القاعدة النورانية" },
  { value: "both", label: "القرآن والقاعدة النورانية" },
  { value: "other", label: "غير ذلك" },
];

const RECITATION_TYPES = [
  {
    value: "regular",
    label: "منتظم",
  },
  {
    value: "remote",
    label: "عن بعد",
  },
];

/* =========================================================
   الصفحة الرئيسية
========================================================= */

export default function Students() {
  const navigate = useNavigate();

  const [students, setStudents] = useState([]);
  const [halaqat, setHalaqat] = useState([]);

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [levelFilter, setLevelFilter] = useState("all");

  const [editingId, setEditingId] = useState(null);

const [showCreateModal, setShowCreateModal] =
  useState(false);

  /* =====================================================
     بيانات الطالب
  ===================================================== */

  const [fullName, setFullName] = useState("");
  const [studentNumber, setStudentNumber] = useState("");
  const [phone, setPhone] = useState("");

  const [age, setAge] = useState("");
  const [educationLevel, setEducationLevel] =
    useState("");

  const [memorizationTarget, setMemorizationTarget] =
    useState("");

  const [recitationType, setRecitationType] =
    useState("");

  const [recitationDays, setRecitationDays] =
    useState([]);

  const [preferredRecitationTime, setPreferredRecitationTime] =
    useState("");

  const [selectedHalaqa, setSelectedHalaqa] =
    useState("");

  const [notes, setNotes] = useState("");

  /* =====================================================
     التحميل
  ===================================================== */

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setInitialLoading(true);

const {
  data: { user },
} = await supabase.auth.getUser();

const { data: teacherProfile } =
  await supabase
    .from("profiles")
    .select("id")
    .eq(
      "auth_user_id",
      user.id
    )
    .single();

const teacherId =
  teacherProfile.id;

const {
  data: teacherHalaqat,
} = await supabase
  .from("teacher_halaqat")
  .select("halaqa_id")
  .eq(
    "teacher_id",
    teacherId
  );

const halaqaIds =
  teacherHalaqat.map(
    (h) => h.halaqa_id
  );

    try {
      const [
        studentsResult,
        halaqatResult,
        assignmentsResult,
        attendanceResult,
        recitationsResult,
        transactionsResult,
      ] = await Promise.all([
        supabase
  .from("student_halaqat")
  .select(`
    student_id,
    halaqa_id,
    profiles(*)
  `)
  .in(
    "halaqa_id",
    halaqaIds
  ),

        supabase
          .from("halaqat")
          .select("*")
          .order("id"),

        supabase
          .from("student_halaqat")
          .select("*")
          .eq("is_current", true),

        supabase
          .from("attendance")
          .select("*"),

        supabase
          .from("recitations")
          .select("*"),

        supabase
          .from("points_transactions")
          .select("*"),
      ]);

      if (studentsResult.error) {
        throw new Error(
          `خطأ في تحميل الطلاب: ${studentsResult.error.message}`
        );
      }

      if (halaqatResult.error) {
        throw new Error(
          `خطأ في تحميل الحلقات: ${halaqatResult.error.message}`
        );
      }

      if (assignmentsResult.error) {
        throw new Error(
          `خطأ في تحميل ارتباط الطلاب بالحلقات: ${assignmentsResult.error.message}`
        );
      }

      if (attendanceResult.error) {
        throw new Error(
          `خطأ في تحميل الحضور: ${attendanceResult.error.message}`
        );
      }

      if (recitationsResult.error) {
        throw new Error(
          `خطأ في تحميل التسميعات: ${recitationsResult.error.message}`
        );
      }

      if (transactionsResult.error) {
        throw new Error(
          `خطأ في تحميل النقاط: ${transactionsResult.error.message}`
        );
      }

      const studentsData =
  studentsResult.data?.map(
    (s) => ({
      ...s.profiles,
      halaqa_id: s.halaqa_id,
    })
  ) || [];
      const halaqatData = halaqatResult.data || [];
      const assignmentsData =
        assignmentsResult.data || [];
      const attendanceData =
        attendanceResult.data || [];
      const recitationsData =
        recitationsResult.data || [];
      const transactionsData =
        transactionsResult.data || [];

      const preparedStudents = studentsData.map(
        (student) => {
          const assignment =
            assignmentsData.find(
              (item) =>
                Number(item.student_id) ===
                Number(student.id)
            );

          const halaqa =
            halaqatData.find(
              (item) =>
                Number(item.id) ===
                Number(assignment?.halaqa_id)
            );

          const studentAttendance =
            attendanceData.filter(
              (item) =>
                Number(item.student_id) ===
                Number(student.id)
            );

          const present =
            studentAttendance.filter(
              (item) =>
                item.status === "present"
            ).length;

          const absent =
            studentAttendance.filter(
              (item) =>
                item.status === "absent"
            ).length;

          const late =
            studentAttendance.filter(
              (item) =>
                item.status === "late"
            ).length;

          const excused =
            studentAttendance.filter(
              (item) =>
                item.status === "excused"
            ).length;

          const studentRecitations =
            recitationsData.filter(
              (item) =>
                Number(item.student_id) ===
                Number(student.id)
            );

          const recitationPoints =
            studentRecitations.reduce(
              (total, item) =>
                total +
                Number(item.points || 0),
              0
            );

          const sortedRecitations = [
            ...studentRecitations,
          ].sort(
            (a, b) =>
              new Date(
                b.recitation_date
              ) -
              new Date(
                a.recitation_date
              )
          );

          const lastRecitation =
            sortedRecitations.length > 0
              ? sortedRecitations[0]
                  .recitation_date
              : null;

          const studentTransactions =
            transactionsData.filter(
              (item) =>
                Number(item.student_id) ===
                Number(student.id)
            );

          const transactionsPoints =
            studentTransactions.reduce(
              (total, item) =>
                total +
                Number(item.points || 0),
              0
            );

          return {
            ...student,

            halaqaName:
              halaqa?.name ||
              "غير مرتبط",

            halaqaId:
              halaqa?.id || null,

            present,
            absent,
            late,
            excused,

            attendanceTotal:
              studentAttendance.length,

            recitationsCount:
              studentRecitations.length,

            lastRecitation,

            recitationPoints,
            transactionsPoints,

            totalPoints:
              recitationPoints +
              transactionsPoints,
          };
        }
      );

      setStudents(preparedStudents);
      setHalaqat(halaqatData);
    } catch (error) {
      console.error(error);
      showMessage(
        error.message ||
          "حدث خطأ أثناء تحميل البيانات"
      );
    } finally {
      setInitialLoading(false);
    }
  }

  /* =====================================================
     Toast مركزي
     
     يستخدم حدثًا عامًا حتى لا تحتاج الصفحة
     إلى معرفة تفاصيل نظام الـ Toast.
  ===================================================== */

  function showMessage(
    message,
    type = "error"
  ) {
    window.dispatchEvent(
      new CustomEvent("app:toast", {
        detail: {
          message,
          type,
        },
      })
    );
  }

  /* =====================================================
     حفظ الطالب
  ===================================================== */

  async function saveStudent() {
    if (!fullName.trim()) {
      showMessage(
        "أدخل اسم الطالب",
        "error"
      );
      return;
    }

    if (!studentNumber.trim()) {
      showMessage(
        "أدخل رقم الطالب",
        "error"
      );
      return;
    }

    if (
      age !== "" &&
      (Number(age) < 3 ||
        Number(age) > 100)
    ) {
      showMessage(
        "العمر يجب أن يكون بين 3 و100 سنة",
        "error"
      );
      return;
    }

    setLoading(true);

    try {
      const profileData = {
        role: "student",
        user_number:
          studentNumber.trim(),
        full_name:
          fullName.trim(),
        phone: phone.trim(),
        age:
          age === ""
            ? null
            : Number(age),

        education_level:
          educationLevel || null,

learning_goal:
  memorizationTarget || null,

        recitation_mode:
  recitationType || null,

        recitation_days:
          recitationDays,

        preferred_recitation_time:
          preferredRecitationTime ||
          null,

        notes: notes.trim(),

        status: "active",
      };

      let studentId = editingId;

      /* ===============================
         تعديل
      =============================== */

      if (editingId) {
        const { error } =
          await supabase
            .from("profiles")
            .update(profileData)
            .eq("id", editingId);

        if (error) {
          throw new Error(
            `تعذر تعديل الطالب: ${error.message}`
          );
        }

        showMessage(
          "تم تعديل بيانات الطالب بنجاح",
          "success"
        );
      }

      /* ===============================
         إضافة
      =============================== */

      else {
        const { data, error } =
          await supabase
            .from("profiles")
            .insert([
              {
                ...profileData,
                status: "active",
              },
            ])
            .select("id")
            .single();

        if (error) {
          throw new Error(
            `تعذر إضافة الطالب: ${error.message}`
          );
        }

        studentId = data?.id;

        showMessage(
          "تمت إضافة الطالب بنجاح",
          "success"
        );
      }

      /* ===============================
         ربط الحلقة
      =============================== */

      if (
        studentId &&
        selectedHalaqa
      ) {
        if (editingId) {
          await supabase
            .from("student_halaqat")
            .update({
              is_current: false,
            })
            .eq(
              "student_id",
              studentId
            )
            .eq(
              "is_current",
              true
            );
        }

const { data: existingAssignment } =
  await supabase
    .from("student_halaqat")
    .select("id")
    .eq("student_id", studentId)
    .eq(
      "halaqa_id",
      Number(selectedHalaqa)
    )
    .maybeSingle();

if (existingAssignment) {

  await supabase
    .from("student_halaqat")
    .update({
      is_current: true
    })
    .eq(
      "id",
      existingAssignment.id
    );

}
else {

  const {
    error: assignmentError
  } = await supabase
    .from("student_halaqat")
    .insert([
      {
        student_id: studentId,
        halaqa_id: Number(selectedHalaqa),
        is_current: true
      }
    ]);

  if (assignmentError)
    throw assignmentError;

}
      }

      clearForm();

setShowCreateModal(false);

await loadData();
    } catch (error) {
      console.error(error);

      showMessage(
        error.message ||
          "حدث خطأ أثناء حفظ الطالب",
        "error"
      );
    } finally {
      setLoading(false);
    }
  }

  /* =====================================================
     تعديل الطالب
  ===================================================== */

function editStudent(student) {

  setShowCreateModal(true);

  setEditingId(student.id);

    setFullName(
      student.full_name || ""
    );

    setStudentNumber(
      student.user_number || ""
    );

    setPhone(
      student.phone || ""
    );

    setAge(
      student.age === null ||
      student.age === undefined
        ? ""
        : String(student.age)
    );

    setEducationLevel(
      student.education_level || ""
    );

    setMemorizationTarget(
      student.memorization_target ||
        ""
    );

    setRecitationType(
      student.recitation_type ||
        ""
    );

    setRecitationDays(
      Array.isArray(
        student.recitation_days
      )
        ? student.recitation_days
        : []
    );

    setPreferredRecitationTime(
      student.preferred_recitation_time ||
        ""
    );

    setSelectedHalaqa(
      student.halaqaId
        ? String(student.halaqaId)
        : ""
    );

    setNotes(
      student.notes || ""
    );

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  /* =====================================================
     تفريغ النموذج
  ===================================================== */

  function clearForm() {

  setShowCreateModal(false);

  setEditingId(null);

    setFullName("");
    setStudentNumber("");
    setPhone("");

    setAge("");
    setEducationLevel("");

    setMemorizationTarget("");
    setRecitationType("");

    setRecitationDays([]);

    setPreferredRecitationTime("");

    setSelectedHalaqa("");

    setNotes("");
  }

  /* =====================================================
     الأيام
  ===================================================== */

  function toggleRecitationDay(day) {
    setRecitationDays(
      (current) =>
        current.includes(day)
          ? current.filter(
              (item) => item !== day
            )
          : [...current, day]
    );
  }

  function selectAllDays() {
    setRecitationDays(
      DAYS.map((day) => day.value)
    );
  }

  function clearDays() {
    setRecitationDays([]);
  }

  /* =====================================================
     حالة الطالب
  ===================================================== */

  async function toggleStatus(student) {
    const newStatus =
      student.status === "active"
        ? "inactive"
        : "active";

    try {
      const { error } =
        await supabase
          .from("profiles")
          .update({
            status: newStatus,
          })
          .eq("id", student.id);

      if (error) {
        throw error;
      }

      showMessage(
        newStatus === "active"
          ? "تم تفعيل الطالب"
          : "تم تعطيل الطالب",
        "success"
      );

      await loadData();
    } catch (error) {
      console.error(error);

      showMessage(
        error.message ||
          "تعذر تغيير حالة الطالب",
        "error"
      );
    }
  }

  async function deleteStudent(id) {

  const student =
    students.find(
      item => Number(item.id) === Number(id)
    );

  const confirmed = window.confirm(
    `هل أنت متأكد من حذف الطالب "${student?.full_name || ""}"؟\n\nسيتم حذف جميع بياناته نهائياً ولا يمكن التراجع عن العملية.`
  );

  if (!confirmed) return;

  setLoading(true);

  try {

    // الإنجازات الشهرية
    await supabase
      .from("monthly_progress")
      .delete()
      .eq("student_id", id);

    // التسميعات
    await supabase
      .from("recitations")
      .delete()
      .eq("student_id", id);

    // الحضور
    await supabase
      .from("attendance")
      .delete()
      .eq("student_id", id);

    // نقاط الطالب
    await supabase
      .from("student_points")
      .delete()
      .eq("student_id", id);

   

    // ربط الطالب بالحلقات
    await supabase
      .from("student_halaqat")
      .delete()
      .eq("student_id", id);

    // نتائج الاختبارات
    await supabase
      .from("exam_results")
      .delete()
      .eq("student_id", id);

    // ربط الطالب بالاختبارات
    await supabase
      .from("exam_students")
      .delete()
      .eq("student_id", id);

    // حذف الطالب نفسه
    const { error } = await supabase
      .from("profiles")
      .delete()
      .eq("id", id);

    if (error) throw error;

    showMessage(
      "تم حذف الطالب نهائياً",
      "success"
    );

    await loadData();

  } catch (error) {

    console.error(error);

    showMessage(
      error.message,
      "error"
    );

  } finally {

    setLoading(false);

  }

}

  /* =====================================================
     البحث والتصفية
  ===================================================== */

  const filteredStudents =
    useMemo(() => {
      const text =
        search
          .trim()
          .toLowerCase();

      return students.filter(
        (student) => {
          const matchesSearch =
            !text ||
            String(
              student.full_name || ""
            )
              .toLowerCase()
              .includes(text) ||
            String(
              student.user_number ||
                ""
            )
              .toLowerCase()
              .includes(text) ||
            String(
              student.phone || ""
            )
              .toLowerCase()
              .includes(text);

          const matchesStatus =
            statusFilter ===
              "all" ||
            (statusFilter ===
              "active" &&
              student.status ===
                "active") ||
            (statusFilter ===
              "inactive" &&
              student.status !==
                "active");

          const matchesLevel =
            levelFilter ===
              "all" ||
            student.education_level ===
              levelFilter;

          return (
            matchesSearch &&
            matchesStatus &&
            matchesLevel
          );
        }
      );
    }, [
      students,
      search,
      statusFilter,
      levelFilter,
    ]);

  /* =====================================================
     الإحصائيات
  ===================================================== */

  const activeCount =
    students.filter(
      (student) =>
        student.status === "active"
    ).length;

  const inactiveCount =
    students.length -
    activeCount;

  const remoteCount =
    students.filter(
      (student) =>
        student.recitation_type ===
        "remote"
    ).length;

  const regularCount =
    students.filter(
      (student) =>
        student.recitation_type ===
        "regular"
    ).length;

  /* =====================================================
     العرض
  ===================================================== */

  return (
    <div style={pageStyle}>
      {/* ================= HEADER ================= */}

      <header style={headerStyle}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "13px",
          }}
        >
          <div style={headerIconStyle}>
            <Users
              size={25}
              strokeWidth={1.8}
            />
          </div>

          <div>
            <h1 style={pageTitleStyle}>
              إدارة الطلاب
            </h1>

            <p style={pageSubtitleStyle}>
              إدارة بيانات الطلاب ومتابعة
              الحضور والتسميع والنقاط
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() =>
            navigate("/admin")
          }
          style={backButtonStyle}
        >
          <ArrowRight size={17} />
          العودة للوحة التحكم
        </button>
      </header>

      {/* ================= STATISTICS ================= */}

      <section style={statsGridStyle}>
        <StatCard
          title="إجمالي الطلاب"
          value={students.length}
          icon={<Users size={22} />}
        />

        <StatCard
          title="النشطون"
          value={activeCount}
          icon={<UserCheck size={22} />}
        />

        <StatCard
          title="غير النشطين"
          value={inactiveCount}
          icon={<UserX size={22} />}
        />

        <StatCard
          title="التسميع المنتظم"
          value={regularCount}
          icon={<BookMarked size={22} />}
        />

        <StatCard
          title="التسميع عن بعد"
          value={remoteCount}
          icon={<Video size={22} />}
        />
      </section>



<div
  style={{
    display: "flex",
    justifyContent: "flex-end",
    marginBottom: "28px",
  }}
>
  <button
    type="button"
    onClick={() => {
      clearForm();
      setEditingId(null);
      setShowCreateModal(true);
    }}
    style={{
      display: "flex",
      alignItems: "center",
      gap: "14px",
      padding: "16px 26px",
      border: "none",
      borderRadius: "20px",
      background:
        "linear-gradient(135deg,#0F5132 0%,#166534 55%,#15803D 100%)",
      color: "#fff",
      cursor: "pointer",
      fontWeight: "800",
      fontSize: "15px",
      boxShadow:
        "0 18px 40px rgba(15,81,50,.28)",
      transition: "all .25s ease",
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.transform =
        "translateY(-4px)";
      e.currentTarget.style.boxShadow =
        "0 25px 50px rgba(15,81,50,.35)";
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.transform =
        "translateY(0)";
      e.currentTarget.style.boxShadow =
        "0 18px 40px rgba(15,81,50,.28)";
    }}
  >
    <div
      style={{
        width: "42px",
        height: "42px",
        borderRadius: "14px",
        background:
          "rgba(255,255,255,.15)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backdropFilter: "blur(10px)",
      }}
    >
      <UserPlus size={20} />
    </div>

    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        lineHeight: 1.2,
      }}
    >
      <span>
        إنشاء طالب جديد
      </span>

      <small
        style={{
          color:
            "rgba(255,255,255,.75)",
          fontWeight: "500",
          fontSize: "11px",
        }}
      >
        تسجيل طالب وربطه بالحلقة
      </small>
    </div>
  </button>
</div>

      {/* ================= FORM ================= */}

{(showCreateModal || editingId) && (

<section style={cardStyle}>

  <div style={sectionHeaderStyle}>

    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "12px",
      }}
    >
      <div style={sectionIconStyle}>
        {editingId ? (
          <Pencil size={19} />
        ) : (
          <UserPlus size={19} />
        )}
      </div>

      <div>
        <h2 style={sectionTitleStyle}>
          {editingId
            ? "تعديل بيانات الطالب"
            : "إضافة طالب جديد"}
        </h2>

        <p style={sectionSubtitleStyle}>
          {editingId
            ? "حدّث بيانات الطالب ثم احفظ التغييرات"
            : "أدخل البيانات الأساسية والتعليمية وجدول التسميع"}
        </p>
      </div>
    </div>

    <button
  type="button"
  onClick={() => {
    clearForm();
    setShowRecitationModal(false);
  }}
  style={{
    width: "44px",
    height: "44px",
    border: "none",
    borderRadius: "14px",
    background:
      "linear-gradient(135deg,#F8FAFC,#E2E8F0)",
    color: "#334155",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow:
      "0 8px 20px rgba(15,23,42,.08)",
    transition: "all .25s ease",
  }}
  onMouseEnter={(e) => {
    e.currentTarget.style.transform =
      "translateY(-2px) rotate(90deg)";
    e.currentTarget.style.background =
      "linear-gradient(135deg,#DC2626,#EF4444)";
    e.currentTarget.style.color =
      "#FFFFFF";
  }}
  onMouseLeave={(e) => {
    e.currentTarget.style.transform =
      "translateY(0) rotate(0)";
    e.currentTarget.style.background =
      "linear-gradient(135deg,#F8FAFC,#E2E8F0)";
    e.currentTarget.style.color =
      "#334155";
  }}
>
  <X size={20} strokeWidth={2.5} />
</button>



          {editingId && (
            <button
              type="button"
              onClick={clearForm}
              style={cancelButtonStyle}
            >
              <X size={16} />
              إلغاء التعديل
            </button>
          )}
        </div>

        {/* البيانات الأساسية */}

        <FormSectionTitle
          icon={<UserRound size={17} />}
          title="البيانات الأساسية"
        />

        <div style={formGridStyle}>
          <FormField
            label="اسم الطالب"
            required
            placeholder="مثال: أحمد محمد"
            value={fullName}
            onChange={setFullName}
          />

          <FormField
            label="رقم الطالب"
            required
            placeholder="مثال: S001"
            value={studentNumber}
            onChange={setStudentNumber}
          />

          <FormField
            label="رقم الجوال"
            placeholder="05xxxxxxxx"
            value={phone}
            onChange={setPhone}
            type="tel"
          />

          <FormField
            label="العمر"
            placeholder="مثال: 12"
            value={age}
            onChange={setAge}
            type="number"
            min="3"
            max="100"
          />
        </div>

        {/* المستوى والتعليم */}

        <FormSectionTitle
          icon={<GraduationCap size={17} />}
          title="المستوى التعليمي"
        />

        <div style={formGridStyle}>
          <SelectField
            label="المرحلة الدراسية"
            value={educationLevel}
            onChange={
              setEducationLevel
            }
            options={[
              {
                value: "",
                label:
                  "اختر المرحلة الدراسية",
              },
              ...EDUCATION_LEVELS,
            ]}
          />

          <SelectField
            label="المطلوب حفظه"
            value={
              memorizationTarget
            }
            onChange={
              setMemorizationTarget
            }
            options={[
              {
                value: "",
                label:
                  "اختر المطلوب حفظه",
              },
              ...MEMORIZATION_TARGETS,
            ]}
          />

          <SelectField
            label="الحلقة"
            value={selectedHalaqa}
            onChange={
              setSelectedHalaqa
            }
            options={[
              {
                value: "",
                label:
                  "غير مرتبط بحلقة",
              },
              ...halaqat.map(
                (halaqa) => ({
                  value: String(
                    halaqa.id
                  ),
                  label:
                    halaqa.name,
                })
              ),
            ]}
          />
        </div>

        {/* التسميع */}

        <FormSectionTitle
          icon={<BookOpen size={17} />}
          title="إعدادات التسميع"
        />

        <div style={formGridStyle}>
          <div>
            <label style={labelStyle}>
              نوع التسميع
            </label>

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "1fr 1fr",
                gap: "8px",
              }}
            >
              {RECITATION_TYPES.map(
                (item) => {
                  const active =
                    recitationType ===
                    item.value;

                  return (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() =>
                        setRecitationType(
                          item.value
                        )
                      }
                      style={{
                        minHeight:
                          "48px",
                        borderRadius:
                          "10px",
                        border: active
                          ? "1px solid #0f5132"
                          : "1px solid #d9dfdb",
                        background:
                          active
                            ? "#0f5132"
                            : "#fff",
                        color: active
                          ? "#fff"
                          : "#59635d",
                        cursor:
                          "pointer",
                        fontWeight:
                          "700",
                        display:
                          "flex",
                        alignItems:
                          "center",
                        justifyContent:
                          "center",
                        gap: "7px",
                      }}
                    >
                      {item.value ===
                      "remote" ? (
                        <Video
                          size={17}
                        />
                      ) : (
                        <BookOpen
                          size={17}
                        />
                      )}

                      {item.label}
                    </button>
                  );
                }
              )}
            </div>
          </div>

          <FormField
            label="وقت التسميع المفضل"
            value={
              preferredRecitationTime
            }
            onChange={
              setPreferredRecitationTime
            }
            type="time"
          />
        </div>

        {/* أيام التسميع */}

        <div
          style={{
            marginTop: "15px",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent:
                "space-between",
              alignItems: "center",
              gap: "10px",
              flexWrap: "wrap",
              marginBottom: "9px",
            }}
          >
            <label style={labelStyle}>
              أيام التسميع
            </label>

            <div
              style={{
                display: "flex",
                gap: "6px",
              }}
            >
              <button
                type="button"
                onClick={
                  selectAllDays
                }
                style={
                  miniButtonStyle
                }
              >
                تحديد الكل
              </button>

              <button
                type="button"
                onClick={
                  clearDays
                }
                style={
                  miniButtonStyle
                }
              >
                مسح
              </button>
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(105px, 1fr))",
              gap: "8px",
            }}
          >
            {DAYS.map((day) => {
              const active =
                recitationDays.includes(
                  day.value
                );

              return (
                <button
                  key={day.value}
                  type="button"
                  onClick={() =>
                    toggleRecitationDay(
                      day.value
                    )
                  }
                  style={{
                    minHeight:
                      "45px",
                    borderRadius:
                      "10px",
                    border: active
                      ? "1px solid #0f5132"
                      : "1px solid #dfe4e0",
                    background:
                      active
                        ? "#edf5ef"
                        : "#fff",
                    color: active
                      ? "#0f5132"
                      : "#667069",
                    cursor:
                      "pointer",
                    fontWeight:
                      active
                        ? "800"
                        : "600",
                    display:
                      "flex",
                    alignItems:
                      "center",
                    justifyContent:
                      "center",
                    gap: "6px",
                  }}
                >
                  {active && (
                    <CheckCircle2
                      size={15}
                    />
                  )}

                  {day.label}
                </button>
              );
            })}
          </div>

          <div
            style={{
              marginTop: "8px",
              color: "#89918c",
              fontSize: "11px",
            }}
          >
            يمكنك اختيار أكثر من يوم.
          </div>
        </div>

        {/* الملاحظات */}

        <div style={{ marginTop: "18px" }}>
          <label style={labelStyle}>
            ملاحظات إضافية
          </label>

          <textarea
            value={notes}
            onChange={(e) =>
              setNotes(
                e.target.value
              )
            }
            placeholder="أي معلومات إضافية مهمة عن الطالب..."
            rows={4}
            style={{
              ...inputStyle,
              resize: "vertical",
              minHeight: "95px",
              lineHeight: 1.8,
            }}
          />
        </div>

        {/* الحفظ */}

        <div
          style={{
            display: "flex",
            gap: "9px",
            marginTop: "20px",
            flexWrap: "wrap",
          }}
        >
          <button
            type="button"
            onClick={saveStudent}
            disabled={loading}
            style={{
              ...primaryButtonStyle,
              opacity: loading
                ? 0.7
                : 1,
              cursor: loading
                ? "wait"
                : "pointer",
            }}
          >
            {editingId ? (
              <Save size={18} />
            ) : (
              <Plus size={18} />
            )}

            {loading
              ? "جارٍ الحفظ..."
              : editingId
              ? "حفظ التعديلات"
              : "إضافة الطالب"}
          </button>

          {editingId && (
            <button
              type="button"
              onClick={clearForm}
              style={
                secondaryButtonStyle
              }
            >
              <RotateCcw
                size={17}
              />
              إلغاء
            </button>
          )}
        </div>
      </section>

)}

      {/* ================= SEARCH ================= */}

      <section
        style={{
          ...cardStyle,
          padding: "16px",
        }}
      >
        <div style={searchGridStyle}>
          <div
            style={{
              position: "relative",
            }}
          >
            <Search
              size={19}
              style={{
                position:
                  "absolute",
                right: "14px",
                top: "50%",
                transform:
                  "translateY(-50%)",
                color: "#89918c",
              }}
            />

            <input
              value={search}
              onChange={(e) =>
                setSearch(
                  e.target.value
                )
              }
              placeholder="ابحث باسم الطالب أو رقمه أو جواله..."
              style={{
                ...inputStyle,
                paddingRight:
                  "44px",
              }}
            />

            {search && (
              <button
                type="button"
                onClick={() =>
                  setSearch("")
                }
                style={{
                  position:
                    "absolute",
                  left: "9px",
                  top: "50%",
                  transform:
                    "translateY(-50%)",
                  width: "30px",
                  height: "30px",
                  border: "none",
                  borderRadius:
                    "8px",
                  background:
                    "#f1f3f1",
                  color: "#6d766f",
                  cursor:
                    "pointer",
                  display:
                    "flex",
                  alignItems:
                    "center",
                  justifyContent:
                    "center",
                }}
              >
                <X size={15} />
              </button>
            )}
          </div>

          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(
                e.target.value
              )
            }
            style={inputStyle}
          >
            <option value="all">
              جميع الحالات
            </option>

            <option value="active">
              النشطون فقط
            </option>

            <option value="inactive">
              غير النشطين فقط
            </option>
          </select>

          <select
            value={levelFilter}
            onChange={(e) =>
              setLevelFilter(
                e.target.value
              )
            }
            style={inputStyle}
          >
            <option value="all">
              جميع المراحل
            </option>

            {EDUCATION_LEVELS.map(
              (level) => (
                <option
                  key={level.value}
                  value={
                    level.value
                  }
                >
                  {level.label}
                </option>
              )
            )}
          </select>
        </div>
      </section>

      {/* ================= LIST HEADER ================= */}

      <div
        style={{
          display: "flex",
          justifyContent:
            "space-between",
          alignItems: "center",
          gap: "10px",
          marginBottom: "15px",
        }}
      >
        <div>
          <h2
            style={{
              margin: 0,
              color: "#173d2b",
              fontSize: "21px",
            }}
          >
            قائمة الطلاب
          </h2>

          <p
            style={{
              margin:
                "4px 0 0",
              color: "#8a918d",
              fontSize: "12px",
            }}
          >
            عرض{" "}
            {filteredStudents.length}{" "}
            من {students.length}
          </p>
        </div>
      </div>

      {/* ================= LIST ================= */}

      {initialLoading ? (
        <LoadingState />
      ) : filteredStudents.length ===
        0 ? (
        <EmptyState
          search={
            search ||
            statusFilter !== "all" ||
            levelFilter !== "all"
          }
          onClear={() => {
            setSearch("");
            setStatusFilter(
              "all"
            );
            setLevelFilter("all");
          }}
        />
      ) : (
        <div style={studentsGridStyle}>
          {filteredStudents.map(
            (student) => (
              <StudentCard
                key={student.id}
                student={student}
                isActive={
                  student.status ===
                  "active"
                }
                onEdit={
                  editStudent
                }
                onToggleStatus={
                  toggleStatus
                }
                onDelete={
                  deleteStudent
                }
              />
            )
          )}
        </div>
      )}
    </div>
  );
}

/* =========================================================
   بطاقة الطالب
========================================================= */

function StudentCard({
  student,
  isActive,
  onEdit,
  onToggleStatus,
  onDelete,
}) {
  return (
    <div
      style={{
        ...studentCardStyle,
        opacity: isActive ? 1 : 0.78,
      }}
    >
      {/* الرأس */}

      <div
        style={{
          display: "flex",
          justifyContent:
            "space-between",
          alignItems: "flex-start",
          gap: "10px",
          marginBottom: "17px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "11px",
            minWidth: 0,
          }}
        >
          <div
            style={avatarStyle}
          >
            <UserRound
              size={25}
              strokeWidth={1.6}
            />
          </div>

          <div
            style={{
              minWidth: 0,
            }}
          >
            <h3
              style={{
                margin: 0,
                color: "#173d2b",
                fontSize: "17px",
                fontWeight: "800",
                whiteSpace:
                  "nowrap",
                overflow:
                  "hidden",
                textOverflow:
                  "ellipsis",
              }}
            >
              {student.full_name ||
                "بدون اسم"}
            </h3>

            <div
              style={{
                color: "#8b938e",
                fontSize: "11px",
                marginTop: "4px",
              }}
            >
              رقم الطالب:{" "}
              {student.user_number ||
                "-"}
            </div>
          </div>
        </div>

        <span
          style={
            isActive
              ? activeBadgeStyle
              : inactiveBadgeStyle
          }
        >
          {isActive
            ? "نشط"
            : "غير نشط"}
        </span>
      </div>

      {/* معلومات سريعة */}

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "1fr 1fr",
          gap: "8px",
          marginBottom: "12px",
        }}
      >
        <QuickInfo
          icon={
            <GraduationCap
              size={15}
            />
          }
          label="المرحلة"
          value={getEducationLabel(
            student.education_level
          )}
        />

        <QuickInfo
          icon={
            <UserRound size={15} />
          }
          label="العمر"
          value={
            student.age
              ? `${student.age} سنة`
              : "غير محدد"
          }
        />

        <QuickInfo
          icon={
            <BookOpen size={15} />
          }
          label="الحفظ"
          value={getMemorizationLabel(
            student.memorization_target
          )}
        />

        <QuickInfo
          icon={
            student.recitation_type ===
            "remote" ? (
              <Video size={15} />
            ) : (
              <BookOpen size={15} />
            )
          }
          label="التسميع"
          value={getRecitationTypeLabel(
            student.recitation_type
          )}
        />
      </div>

      {/* الحلقة */}

      <div
        style={{
          background: "#f8faf8",
          border:
            "1px solid #edf0ed",
          borderRadius: "11px",
          padding: "11px",
          marginBottom: "11px",
        }}
      >
        <div
          style={{
            color: "#8b938e",
            fontSize: "10px",
            marginBottom: "4px",
          }}
        >
          الحلقة الحالية
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            color: "#173d2b",
            fontSize: "13px",
            fontWeight: "700",
          }}
        >
          <BookOpen size={15} />

          {student.halaqaName}
        </div>
      </div>

      {/* جدول التسميع */}

      <div
        style={{
          background: "#fbfaf6",
          border:
            "1px solid #eeeae0",
          borderRadius: "11px",
          padding: "11px",
          marginBottom: "12px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "7px",
            color: "#76663c",
            fontSize: "11px",
            fontWeight: "700",
            marginBottom: "7px",
          }}
        >
          <CalendarDays
            size={15}
          />

          جدول التسميع
        </div>

        <div
          style={{
            color: "#5f625e",
            fontSize: "11px",
            lineHeight: 1.8,
          }}
        >
          {formatDays(
            student.recitation_days
          )}
        </div>

        {student.preferred_recitation_time && (
          <div
            style={{
              display: "flex",
              alignItems:
                "center",
              gap: "6px",
              marginTop: "6px",
              color: "#777",
              fontSize: "11px",
            }}
          >
            <Timer size={14} />

            الوقت المفضل:{" "}
            <strong>
              {student.preferred_recitation_time}
            </strong>
          </div>
        )}
      </div>

      {/* النقاط */}

      <div
        style={pointsBoxStyle}
      >
        <div
          style={{
            color: "#927536",
            fontSize: "10px",
            marginBottom: "4px",
          }}
        >
          إجمالي النقاط
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent:
              "center",
            gap: "6px",
            color: "#9a741f",
            fontSize: "27px",
            fontWeight: "800",
          }}
        >
          <Trophy size={22} />

          {student.totalPoints}
        </div>
      </div>

      {/* الحضور */}

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(4, 1fr)",
          gap: "6px",
          marginBottom: "13px",
        }}
      >
        <MiniStat
          label="حاضر"
          value={
            student.present
          }
          icon={
            <CheckCircle2
              size={13}
            />
          }
        />

        <MiniStat
          label="غائب"
          value={
            student.absent
          }
          icon={
            <XCircle
              size={13}
            />
          }
        />

        <MiniStat
          label="متأخر"
          value={
            student.late
          }
          icon={
            <Clock3
              size={13}
            />
          }
        />

        <MiniStat
          label="معتذر"
          value={
            student.excused
          }
          icon={
            <CircleSlash
              size={13}
            />
          }
        />
      </div>

      {/* آخر التسميع */}

      <div
        style={{
          borderTop:
            "1px solid #eee",
          paddingTop: "11px",
          marginBottom: "13px",
        }}
      >
        <div
          style={infoLineStyle}
        >
          <span
            style={
              infoLabelStyle
            }
          >
            <BookOpen size={14} />
            التسميعات
          </span>

          <strong
            style={{
              color: "#173d2b",
              fontSize: "12px",
            }}
          >
            {student.recitationsCount}
          </strong>
        </div>

        <div
          style={{
            ...infoLineStyle,
            marginTop: "7px",
          }}
        >
          <span
            style={
              infoLabelStyle
            }
          >
            <CalendarDays
              size={14}
            />
            آخر تسميع
          </span>

          <strong
            style={{
              color: "#555",
              fontSize: "11px",
            }}
          >
            {student.lastRecitation
              ? formatDate(
                  student.lastRecitation
                )
              : "لا يوجد"}
          </strong>
        </div>

        <div
          style={{
            ...infoLineStyle,
            marginTop: "7px",
          }}
        >
          <span
            style={
              infoLabelStyle
            }
          >
            <Phone size={14} />
            الجوال
          </span>

          <strong
            style={{
              color: "#555",
              fontSize: "11px",
            }}
          >
            {student.phone ||
              "غير مسجل"}
          </strong>
        </div>
      </div>

      {/* الإجراءات */}

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "1fr 1fr",
          gap: "7px",
        }}
      >
        <button
          type="button"
          onClick={() =>
            onEdit(student)
          }
          style={actionButtonStyle}
        >
          <Pencil size={15} />
          تعديل
        </button>

        <button
          type="button"
          onClick={() =>
            onToggleStatus(
              student
            )
          }
          style={
            actionSecondaryButtonStyle
          }
        >
          {isActive ? (
            <>
              <XCircle size={15} />
              تعطيل
            </>
          ) : (
            <>
              <CheckCircle2
                size={15}
              />
              تفعيل
            </>
          )}
        </button>

        <button
          type="button"
          onClick={() =>
            onDelete(student.id)
          }
          style={deleteButtonStyle}
        >
          <Trash2 size={15} />
          حذف الطالب
        </button>
      </div>
    </div>
  );
}

/* =========================================================
   مكونات صغيرة
========================================================= */

function FormSectionTitle({
  icon,
  title,
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "7px",
        margin:
          "23px 0 13px",
        color: "#173d2b",
        fontWeight: "800",
        fontSize: "14px",
      }}
    >
      {icon}
      {title}
    </div>
  );
}

function FormField({
  label,
  placeholder,
  value,
  onChange,
  type = "text",
  required = false,
  min,
  max,
}) {
  return (
    <div>
      <label style={labelStyle}>
        {label}

        {required && (
          <span
            style={{
              color: "#b42318",
              marginRight: "3px",
            }}
          >
            *
          </span>
        )}
      </label>

      <input
        type={type}
        min={min}
        max={max}
        value={value}
        onChange={(e) =>
          onChange(
            e.target.value
          )
        }
        placeholder={placeholder}
        style={inputStyle}
      />
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
    <div>
      <label style={labelStyle}>
        {label}
      </label>

      <div
        style={{
          position: "relative",
        }}
      >
        <select
          value={value}
          onChange={(e) =>
            onChange(
              e.target.value
            )
          }
          style={{
            ...inputStyle,
            appearance:
              "none",
            paddingLeft:
              "38px",
          }}
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
          size={17}
          style={{
            position:
              "absolute",
            left: "12px",
            top: "50%",
            transform:
              "translateY(-50%)",
            color: "#7d8780",
            pointerEvents:
              "none",
          }}
        />
      </div>
    </div>
  );
}

function QuickInfo({
  icon,
  label,
  value,
}) {
  return (
    <div
      style={{
        background: "#fafbf9",
        border:
          "1px solid #eef0ed",
        borderRadius: "9px",
        padding: "8px",
        minWidth: 0,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "5px",
          color: "#89918c",
          fontSize: "9px",
          marginBottom: "3px",
        }}
      >
        {icon}
        {label}
      </div>

      <div
        style={{
          color: "#344139",
          fontSize: "11px",
          fontWeight: "700",
          whiteSpace:
            "nowrap",
          overflow:
            "hidden",
          textOverflow:
            "ellipsis",
        }}
      >
        {value}
      </div>
    </div>
  );
}

function MiniStat({
  label,
  value,
  icon,
}) {
  return (
    <div
      style={{
        background: "#fafafa",
        borderRadius: "8px",
        padding: "7px 4px",
        textAlign: "center",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent:
            "center",
          alignItems: "center",
          gap: "3px",
          color: "#777",
          fontSize: "9px",
        }}
      >
        {icon}
        {label}
      </div>

      <strong
        style={{
          display: "block",
          marginTop: "2px",
          color: "#333",
          fontSize: "13px",
        }}
      >
        {value}
      </strong>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon,
}) {
  return (
    <div
      style={statCardStyle}
    >
      <div
        style={statIconStyle}
      >
        {icon}
      </div>

      <div>
        <div
          style={{
            color: "#7d8780",
            fontSize: "11px",
            marginBottom: "3px",
          }}
        >
          {title}
        </div>

        <strong
          style={{
            color: "#173d2b",
            fontSize: "23px",
          }}
        >
          {value}
        </strong>
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div
      style={{
        ...cardStyle,
        textAlign: "center",
        padding: "60px 20px",
        color: "#7e8781",
      }}
    >
      <div
        style={{
          width: "38px",
          height: "38px",
          margin:
            "0 auto 12px",
          border:
            "3px solid #e1e8e3",
          borderTopColor:
            "#0f5132",
          borderRadius:
            "50%",
          animation:
            "spin 0.8s linear infinite",
        }}
      />

      جاري تحميل الطلاب...
    </div>
  );
}

function EmptyState({
  search,
  onClear,
}) {
  return (
    <div
      style={{
        ...cardStyle,
        textAlign: "center",
        padding: "60px 20px",
      }}
    >
      <div
        style={{
          width: "62px",
          height: "62px",
          margin:
            "0 auto 14px",
          borderRadius: "18px",
          background:
            "#edf5ef",
          color: "#0f5132",
          display: "flex",
          alignItems:
            "center",
          justifyContent:
            "center",
        }}
      >
        <Users size={29} />
      </div>

      <h3
        style={{
          margin:
            "0 0 7px",
          color: "#354139",
        }}
      >
        {search
          ? "لا توجد نتائج"
          : "لا يوجد طلاب حتى الآن"}
      </h3>

      <p
        style={{
          margin: 0,
          color: "#929993",
          fontSize: "12px",
        }}
      >
        {search
          ? "لم نجد طالبًا مطابقًا للبحث أو الفلاتر."
          : "ابدأ بإضافة أول طالب إلى النظام."}
      </p>

      {search && (
        <button
          type="button"
          onClick={onClear}
          style={{
            ...primaryButtonStyle,
            marginTop: "15px",
          }}
        >
          مسح الفلاتر
        </button>
      )}
    </div>
  );
}

/* =========================================================
   Helpers
========================================================= */

function getEducationLabel(
  value
) {
  return (
    EDUCATION_LEVELS.find(
      (item) =>
        item.value === value
    )?.label ||
    "غير محدد"
  );
}

function getMemorizationLabel(
  value
) {
  return (
    MEMORIZATION_TARGETS.find(
      (item) =>
        item.value === value
    )?.label ||
    "غير محدد"
  );
}

function getRecitationTypeLabel(
  value
) {
  return (
    RECITATION_TYPES.find(
      (item) =>
        item.value === value
    )?.label ||
    "غير محدد"
  );
}

function formatDays(days) {
  if (!Array.isArray(days) ||
      days.length === 0) {
    return "لم يتم تحديد الأيام";
  }

  return days
    .map(
      (day) =>
        DAYS.find(
          (item) =>
            item.value === day
        )?.label || day
    )
    .join(" • ");
}

function formatDate(date) {
  if (!date) return "لا يوجد";

  try {
    return new Date(
      date
    ).toLocaleDateString(
      "ar-SA",
      {
        year: "numeric",
        month: "short",
        day: "numeric",
      }
    );
  } catch {
    return String(date);
  }
}

/* =========================================================
   Styles
   مهم: actionButtonStyle معرف قبل استخدامه
========================================================= */

const pageStyle = {
  minHeight: "100vh",
  padding: "28px",
  direction: "rtl",
  boxSizing: "border-box",
  background:
    "linear-gradient(135deg,#f7f5ef 0%,#f1f5f1 100%)",
  color: "#26332c",
};

const headerStyle = {
  display: "flex",
  justifyContent:
    "space-between",
  alignItems: "center",
  gap: "15px",
  flexWrap: "wrap",
  marginBottom: "25px",
};

const headerIconStyle = {
  width: "49px",
  height: "49px",
  borderRadius: "15px",
  background: "#0f5132",
  color: "#fff",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  boxShadow:
    "0 7px 18px rgba(15,81,50,0.16)",
};

const pageTitleStyle = {
  margin: 0,
  color: "#173d2b",
  fontSize: "29px",
  fontWeight: "800",
};

const pageSubtitleStyle = {
  margin:
    "5px 0 0",
  color: "#7d8780",
  fontSize: "13px",
};

const backButtonStyle = {
  display: "inline-flex",
  alignItems: "center",
  gap: "7px",
  padding: "10px 15px",
  borderRadius: "10px",
  border:
    "1px solid #d9dfdb",
  background: "#fff",
  color: "#173d2b",
  cursor: "pointer",
  fontWeight: "700",
};

const statsGridStyle = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit,minmax(180px,1fr))",
  gap: "13px",
  marginBottom: "22px",
};

const statCardStyle = {
  background: "#fff",
  borderRadius: "16px",
  padding: "17px",
  display: "flex",
  alignItems: "center",
  gap: "12px",
  border:
    "1px solid #e5e9e5",
  boxShadow:
    "0 4px 15px rgba(0,0,0,0.035)",
};

const statIconStyle = {
  width: "44px",
  height: "44px",
  flexShrink: 0,
  borderRadius: "12px",
  background: "#edf5ef",
  color: "#0f5132",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const cardStyle = {
  background: "#fff",
  borderRadius: "18px",
  padding: "22px",
  marginBottom: "22px",
  border:
    "1px solid #e4e9e5",
  boxShadow:
    "0 5px 20px rgba(0,0,0,0.035)",
};

const sectionHeaderStyle = {
  display: "flex",
  justifyContent:
    "space-between",
  alignItems: "center",
  gap: "12px",
  flexWrap: "wrap",
};

const sectionIconStyle = {
  width: "41px",
  height: "41px",
  borderRadius: "12px",
  background: "#edf5ef",
  color: "#0f5132",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const sectionTitleStyle = {
  margin: 0,
  color: "#173d2b",
  fontSize: "18px",
};

const sectionSubtitleStyle = {
  margin:
    "4px 0 0",
  color: "#8a918d",
  fontSize: "11px",
};

const formGridStyle = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit,minmax(210px,1fr))",
  gap: "14px",
};

const searchGridStyle = {
  display: "grid",
  gridTemplateColumns:
    "minmax(250px,1fr) 210px 210px",
  gap: "10px",
};

const studentsGridStyle = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit,minmax(300px,1fr))",
  gap: "16px",
};

const studentCardStyle = {
  background: "#fff",
  borderRadius: "18px",
  padding: "18px",
  border:
    "1px solid #e3e8e4",
  boxShadow:
    "0 5px 20px rgba(0,0,0,0.045)",
};

const avatarStyle = {
  width: "50px",
  height: "50px",
  flexShrink: 0,
  borderRadius: "50%",
  background:
    "linear-gradient(145deg,#eaf3ed,#dfeae3)",
  color: "#0f5132",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const activeBadgeStyle = {
  padding:
    "5px 9px",
  borderRadius: "20px",
  background: "#e7f5ec",
  color: "#0f5132",
  fontSize: "10px",
  fontWeight: "800",
};

const inactiveBadgeStyle = {
  padding:
    "5px 9px",
  borderRadius: "20px",
  background: "#f1f1f1",
  color: "#777",
  fontSize: "10px",
  fontWeight: "800",
};

const pointsBoxStyle = {
  background: "#fffaf0",
  border:
    "1px solid #f0e4c8",
  borderRadius: "12px",
  padding: "11px",
  textAlign: "center",
  marginBottom: "12px",
};

const inputStyle = {
  width: "100%",
  minHeight: "45px",
  padding:
    "10px 12px",
  border:
    "1px solid #d8dfda",
  borderRadius: "10px",
  fontSize: "13px",
  boxSizing: "border-box",
  background: "#fff",
  color: "#26332c",
  outline: "none",
  direction: "rtl",
};

const labelStyle = {
  display: "block",
  marginBottom: "7px",
  color: "#465149",
  fontSize: "12px",
  fontWeight: "800",
};

const primaryButtonStyle = {
  border: "none",
  background: "#0f5132",
  color: "#fff",
  padding:
    "11px 21px",
  borderRadius: "10px",
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "7px",
  fontSize: "13px",
  fontWeight: "800",
};

const secondaryButtonStyle = {
  border:
    "1px solid #d8dfda",
  background: "#fff",
  color: "#59635d",
  padding:
    "11px 18px",
  borderRadius: "10px",
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "7px",
  fontSize: "13px",
  fontWeight: "700",
};

const cancelButtonStyle = {
  ...secondaryButtonStyle,
  padding:
    "8px 13px",
  fontSize: "11px",
};

const miniButtonStyle = {
  border:
    "1px solid #dce2de",
  background: "#fff",
  color: "#59635d",
  borderRadius: "7px",
  padding:
    "5px 9px",
  cursor: "pointer",
  fontSize: "10px",
  fontWeight: "700",
};

/* =========================================================
   مهم:
   تعريف actionButtonStyle قبل StudentCard
========================================================= */

const actionButtonStyle = {
  padding: "9px",
  borderRadius: "9px",
  border:
    "1px solid #0f5132",
  background: "#fff",
  color: "#0f5132",
  cursor: "pointer",
  fontWeight: "800",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "6px",
  fontSize: "11px",
};

const actionSecondaryButtonStyle = {
  padding: "9px",
  borderRadius: "9px",
  border:
    "1px solid #d9dedb",
  background: "#fff",
  color: "#59635d",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "6px",
  fontWeight: "700",
  fontSize: "11px",
};

const deleteButtonStyle = {
  gridColumn: "1 / -1",
  padding: "9px",
  borderRadius: "9px",
  border: "none",
  background: "#b42318",
  color: "#fff",
  cursor: "pointer",
  fontWeight: "800",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "6px",
  fontSize: "11px",
};

const infoLineStyle = {
  display: "flex",
  justifyContent:
    "space-between",
  alignItems: "center",
};

const infoLabelStyle = {
  display: "flex",
  alignItems: "center",
  gap: "6px",
  color: "#7b847e",
  fontSize: "11px",
};
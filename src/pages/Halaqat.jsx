import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";
import { useNavigate } from "react-router-dom";
import { useToast } from "../components/Toast";

import {
  HALAQA_PERIODS,
} from "../data/halaqaPeriods";

import {
  BookOpen,
  Building2,
  Users,
  UserRound,
  Plus,
  Search,
  Pencil,
  Trash2,
  Power,
  GraduationCap,
  ArrowRight,
  X,
  CheckCircle2,
  CircleOff,
  RefreshCw,
  Loader2,
  UsersRound,
} from "lucide-react";

export default function Halaqat() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [halaqat, setHalaqat] = useState([]);

  const [mosques, setMosques] = useState([]);

  const [teachers, setTeachers] = useState([]);

const [halaqaPeriod, setHalaqaPeriod] =
  useState("");

  const [
    studentAssignments,
    setStudentAssignments,
  ] = useState([]);

  const [
    teacherAssignments,
    setTeacherAssignments,
  ] = useState([]);

  const [name, setName] = useState("");

  const [capacity, setCapacity] = useState("");

  const [mosqueId, setMosqueId] = useState("");

  const [search, setSearch] = useState("");

  const [statusFilter, setStatusFilter] =
    useState("all");

  const [mosqueFilter, setMosqueFilter] =
    useState("all");

  const [editingId, setEditingId] =
    useState(null);

  const [showForm, setShowForm] =
    useState(false);

  const [loading, setLoading] =
    useState(false);

  const [initialLoading, setInitialLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [mainTeacherId, setMainTeacherId] =
    useState("");

  const [
    assistantTeacherId,
    setAssistantTeacherId,
  ] = useState("");

  // ==========================================
  // تحميل البيانات عند فتح الصفحة
  // ==========================================

  useEffect(() => {
    loadData();
  }, []);

  // ==========================================
  // تحميل البيانات
  // ==========================================

 async function loadData(options = {}) {
  const silent = options.silent === true;

  if (!silent) {
    setInitialLoading(true);
  }

  const [
    halaqatResult,
    mosquesResult,
    studentAssignmentsResult,
    teacherAssignmentsResult,
    teachersResult,
  ] = await Promise.all([
    supabase
      .from("halaqat")
      .select("*")
      .order("id", {
        ascending: true,
      }),

    supabase
      .from("mosques")
      .select("*")
      .order("id", {
        ascending: true,
      }),

    supabase
      .from("student_halaqat")
      .select("*")
      .eq("is_current", true),

    supabase
      .from("teacher_halaqat")
      .select("*"),

    supabase
      .from("profiles")
      .select("id, full_name")
      .eq("role", "teacher")
      .order("full_name"),
  ]);

  if (halaqatResult.error) {
    console.error("halaqat:", halaqatResult.error);
    setInitialLoading(false);
    return false;
  }

  if (mosquesResult.error) {
    console.error("mosques:", mosquesResult.error);
    setInitialLoading(false);
    return false;
  }

  if (studentAssignmentsResult.error) {
    console.error(
      "student_halaqat:",
      studentAssignmentsResult.error
    );
    setInitialLoading(false);
    return false;
  }

  if (teacherAssignmentsResult.error) {
    console.error(
      "teacher_halaqat:",
      teacherAssignmentsResult.error
    );
    setInitialLoading(false);
    return false;
  }

  if (teachersResult.error) {
    console.error(
      "teachers:",
      teachersResult.error
    );
    setInitialLoading(false);
    return false;
  }

  setHalaqat(
    halaqatResult.data || []
  );

  setMosques(
    mosquesResult.data || []
  );

  setStudentAssignments(
    studentAssignmentsResult.data || []
  );

  setTeacherAssignments(
    teacherAssignmentsResult.data || []
  );

  setTeachers(
    teachersResult.data || []
  );

  setInitialLoading(false);

  return true;
}

function onStudents(halaqaId) {
  navigate(
    `/admin/halaqa-students/${halaqaId}`
  );
}

function onTeachers(halaqaId) {
  navigate(
    `/admin/halaqa-teachers/${halaqaId}`
  );
}

  // ==========================================
  // تحديث يدوي
  // ==========================================

  async function refreshData() {
    if (refreshing) return;

    setRefreshing(true);

    const success = await loadData({
      silent: true,
    });

    if (success) {
      showToast(
        "تم تحديث بيانات الحلقات",
        "success"
      );
    }

    setRefreshing(false);
  }

  // ==========================================
  // حفظ الحلقة
  // ==========================================

  async function saveHalaqa() {
    const cleanName = name.trim();

    if (!cleanName) {
      showToast(
        "أدخل اسم الحلقة أولًا",
        "error"
      );
      return;
    }

    if (!mosqueId) {
      showToast(
        "اختر المسجد أولًا",
        "error"
      );
      return;
    }

    const numericCapacity = Number(capacity);

    if (
      capacity &&
      (!Number.isFinite(numericCapacity) ||
        numericCapacity < 1)
    ) {
      showToast(
        "أدخل سعة صحيحة للحلقة",
        "error"
      );
      return;
    }

    // منع تكرار اسم الحلقة داخل نفس المسجد
    const duplicate = halaqat.some(
      (halaqa) =>
        Number(halaqa.id) !==
          Number(editingId) &&
        Number(halaqa.mosque_id) ===
          Number(mosqueId) &&
        String(halaqa.name || "")
          .trim()
          .toLowerCase() ===
          cleanName.toLowerCase()
    );

    if (duplicate) {
      showToast(
        "توجد حلقة بنفس الاسم في هذا المسجد",
        "error"
      );
      return;
    }

    setLoading(true);

    try {
     const payload = {
  name: name.trim(),

  mosque_id: Number(mosqueId),

  capacity: capacity
    ? Number(capacity)
    : 20,

  main_teacher_id:
    mainTeacherId || null,

  assistant_teacher_id:
    assistantTeacherId || null,

halaqa_period:
  halaqaPeriod || null,

  status: "active",
};

      // ========================================
      // تعديل
      // ========================================

      if (editingId !== null) {
        const { error } = await supabase
          .from("halaqat")
          .update(payload)
          .eq("id", editingId);

        if (error) {
          console.error(
            "update halaqa:",
            error
          );


          showToast(
            `تعذر تعديل الحلقة: ${error.message}`,
            "error"
          );

          return;
        }

        showToast(
          "تم تعديل بيانات الحلقة بنجاح",
          "success"
        );
      }

      // ========================================
      // إضافة
      // ========================================

      else {
        const { error } = await supabase
          .from("halaqat")
          .insert([
            {
              ...payload,
              status: "active",
            },
          ]);

        if (error) {
          console.error(
            "insert halaqa:",
            error
          );

          showToast(
            `تعذر إضافة الحلقة: ${error.message}`,
            "error"
          );

          return;
        }

        showToast(
          "تمت إضافة الحلقة بنجاح",
          "success"
        );
      }

      clearForm();

      await loadData({
        silent: true,
      });
    } catch (error) {
      console.error(
        "saveHalaqa:",
        error
      );

      showToast(
        "حدث خطأ غير متوقع أثناء حفظ الحلقة",
        "error"
      );
    } finally {
      setLoading(false);
    }
  }

  // ==========================================
  // تعديل الحلقة
  // ==========================================

  function editHalaqa(halaqa) {
    setEditingId(halaqa.id);

    setName(halaqa.name || "");

    setCapacity(
      halaqa.capacity || ""
    );

    setMosqueId(
      halaqa.mosque_id
        ? String(halaqa.mosque_id)
        : ""
    );

setHalaqaPeriod(
  halaqa.halaqa_period || ""
);

    setShowForm(true);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });

    showToast(
      `جارٍ تعديل ${halaqa.name || "الحلقة"}`,
      "info"
    );
  }

  // ==========================================
  // تنظيف النموذج
  // ==========================================

  function clearForm() {
    setEditingId(null);
    setName("");
    setCapacity("");
    setMosqueId("");
setHalaqaPeriod("");
    setShowForm(false);
  }

  // ==========================================
  // تغيير حالة الحلقة
  // ==========================================

  async function toggleStatus(halaqa) {
    const isActive =
      halaqa.status === "active";

    const newStatus = isActive
      ? "inactive"
      : "active";

    const confirmed = window.confirm(
      isActive
        ? `هل تريد تعطيل حلقة "${halaqa.name}"؟`
        : `هل تريد تفعيل حلقة "${halaqa.name}"؟`
    );

    if (!confirmed) return;

    setLoading(true);

    try {
      const { error } = await supabase
        .from("halaqat")
        .update({
          status: newStatus,
        })
        .eq("id", halaqa.id);

      if (error) {
        console.error(
          "toggle status:",
          error
        );

        showToast(
          `تعذر تغيير حالة الحلقة: ${error.message}`,
          "error"
        );

        return;
      }

      showToast(
        isActive
          ? "تم تعطيل الحلقة بنجاح"
          : "تم تفعيل الحلقة بنجاح",
        "success"
      );

      await loadData({
        silent: true,
      });
    } finally {
      setLoading(false);
    }
  }

  // ==========================================
  // حذف الحلقة
  // ==========================================

  async function deleteHalaqa(halaqa) {
    const studentCount =
      getStudentCount(halaqa.id);

    const teacherCount =
      getTeacherCount(halaqa);

    const relationMessage =
      studentCount > 0 ||
      teacherCount > 0
        ? `\n\nالحلقة مرتبطة حاليًا بـ ${studentCount} طالب و${teacherCount} معلم. يفضل تعطيلها بدل حذفها.`
        : "";

    const confirmed = window.confirm(
      `هل أنت متأكد من حذف حلقة "${halaqa.name}"؟${relationMessage}`
    );

    if (!confirmed) return;

    setLoading(true);

    try {
      const { error } = await supabase
        .from("halaqat")
        .delete()
        .eq("id", halaqa.id);

      if (error) {
        console.error(
          "delete halaqa:",
          error
        );

        showToast(
          `تعذر حذف الحلقة: ${error.message}`,
          "error"
        );

        return;
      }

      if (
        editingId !== null &&
        Number(editingId) ===
          Number(halaqa.id)
      ) {
        clearForm();
      }

      showToast(
        `تم حذف حلقة "${halaqa.name}" بنجاح`,
        "success"
      );

      await loadData({
        silent: true,
      });
    } finally {
      setLoading(false);
    }
  }

  // ==========================================
  // اسم المسجد
  // ==========================================

  function getMosqueName(mosqueId) {
    return (
      mosques.find(
        (mosque) =>
          Number(mosque.id) ===
          Number(mosqueId)
      )?.name || "غير محدد"
    );
  }

  // ==========================================
  // عدد الطلاب
  // ==========================================

  function getStudentCount(halaqaId) {
  return studentAssignments.filter(
    (item) =>
      Number(item.halaqa_id) === Number(halaqaId) &&
      item.is_current === true
  ).length;
}

  // ==========================================
  // عدد المعلمين
  // ==========================================

function getTeacherCount(halaqa) {
  let count = 0;

  if (halaqa.main_teacher_id) {
    count++;
  }

  if (halaqa.assistant_teacher_id) {
    count++;
  }

  return count;
}

  // ==========================================
  // الفلترة
  // ==========================================

  const filteredHalaqat = useMemo(() => {
    const text =
      search.trim().toLowerCase();

    return halaqat.filter((halaqa) => {
      const mosqueName =
        getMosqueName(
          halaqa.mosque_id
        );

      const halaqaName = String(
        halaqa.name || ""
      ).toLowerCase();

      const mosqueText = String(
        mosqueName || ""
      ).toLowerCase();

      const matchesSearch =
        !text ||
        halaqaName.includes(text) ||
        mosqueText.includes(text) ||
        String(halaqa.id).includes(text);

      const matchesStatus =
        statusFilter === "all" ||
        halaqa.status === statusFilter;

      const matchesMosque =
        mosqueFilter === "all" ||
        Number(halaqa.mosque_id) ===
          Number(mosqueFilter);

      return (
        matchesSearch &&
        matchesStatus &&
        matchesMosque
      );
    });
  }, [
    halaqat,
    search,
    statusFilter,
    mosqueFilter,
    mosques,
  ]);

  // ==========================================
  // الإحصائيات
  // ==========================================

  const activeCount =
    halaqat.filter(
      (halaqa) =>
        halaqa.status === "active"
    ).length;

  const inactiveCount =
    halaqat.length - activeCount;

  const totalStudents =
    studentAssignments.length;

  const totalTeachers =
  halaqat.reduce((total, halaqa) => {
    let count = 0;

    if (halaqa.main_teacher_id) count++;
    if (halaqa.assistant_teacher_id) count++;

    return total + count;
  }, 0);

  const totalCapacity =
    halaqat.reduce(
      (total, halaqa) =>
        total +
        Number(halaqa.capacity || 0),
      0
    );

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f7f5ef",
        padding: "25px 30px",
        direction: "rtl",
        boxSizing: "border-box",
        color: "#26332c",
      }}
    >
      {/* زخرفة */}

      <div
        style={{
          position: "fixed",
          inset: 0,
          pointerEvents: "none",
          opacity: 0.045,
          backgroundImage: `
            linear-gradient(
              45deg,
              transparent 42%,
              #0f5132 43%,
              #0f5132 57%,
              transparent 58%
            ),
            linear-gradient(
              -45deg,
              transparent 42%,
              #0f5132 43%,
              #0f5132 57%,
              transparent 58%
            )
          `,
          backgroundSize: "90px 90px",
          zIndex: 0,
        }}
      />

      <div
        style={{
          position: "relative",
          zIndex: 1,
          maxWidth: "1500px",
          margin: "0 auto",
        }}
      >
        {/* ================================= */}
        {/* الرأس */}
        {/* ================================= */}

        <header
          style={{
            display: "flex",
            justifyContent:
              "space-between",
            alignItems: "center",
            gap: "15px",
            flexWrap: "wrap",
            marginBottom: "25px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "13px",
            }}
          >
            <button
              type="button"
              onClick={() =>
                navigate("/admin")
              }
              style={backButtonStyle}
            >
              <ArrowRight
                size={20}
                strokeWidth={1.8}
              />
            </button>

            <div style={pageIconStyle}>
              <BookOpen
                size={25}
                strokeWidth={1.7}
              />
            </div>

            <div>
              <h1 style={pageTitleStyle}>
                إدارة الحلقات
              </h1>

              <p
                style={{
                  margin: "5px 0 0",
                  color: "#818983",
                  fontSize: "13px",
                }}
              >
                إدارة حلقات التحفيظ ومتابعة
                الطلاب والمعلمين
              </p>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "9px",
            }}
          >
            <button
              type="button"
              onClick={refreshData}
              disabled={
                refreshing || loading
              }
              style={{
                ...headerButtonStyle,
                opacity:
                  refreshing || loading
                    ? 0.6
                    : 1,
              }}
            >
              {refreshing ? (
                <Loader2
                  size={17}
                  className="spin"
                />
              ) : (
                <RefreshCw
                  size={17}
                  strokeWidth={1.8}
                />
              )}

              تحديث
            </button>

            <div style={countBadgeStyle}>
              <BookOpen
                size={17}
                color="#0f5132"
              />

              {halaqat.length} حلقة
            </div>
          </div>
        </header>

        {/* ================================= */}
        {/* الإحصائيات */}
        {/* ================================= */}

        <section
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(180px, 1fr))",
            gap: "14px",
            marginBottom: "22px",
          }}
        >
          <StatCard
            icon={
              <BookOpen
                size={22}
                strokeWidth={1.7}
              />
            }
            title="إجمالي الحلقات"
            value={halaqat.length}
          />

          <StatCard
            icon={
              <CheckCircle2
                size={22}
                strokeWidth={1.7}
              />
            }
            title="الحلقات النشطة"
            value={activeCount}
          />

          <StatCard
            icon={
              <Users
                size={22}
                strokeWidth={1.7}
              />
            }
            title="إجمالي الطلاب"
            value={totalStudents}
          />

          <StatCard
            icon={
              <GraduationCap
                size={22}
                strokeWidth={1.7}
              />
            }
            title="إجمالي المعلمين"
            value={totalTeachers}
          />

          <StatCard
            icon={
              <UsersRound
                size={22}
                strokeWidth={1.7}
              />
            }
            title="السعة الإجمالية"
            value={totalCapacity}
          />
        </section>

        {/* ================================= */}
        {/* زر الإضافة */}
        {/* ================================= */}

        {!showForm && (
          <button
  type="button"
  onClick={() => setShowForm(true)}
  style={{
    background:"#FFFFFF",
    border:"1px solid #E2E8F0",
    borderRadius:"20px",
    padding:"14px 22px",
    display:"flex",
    alignItems:"center",
    gap:"14px",
    cursor:"pointer",
    boxShadow:
      "0 8px 24px rgba(15,23,42,.05)",
    marginBottom:"24px"
  }}
>
  <div
    style={{
      width:"42px",
      height:"42px",
      borderRadius:"14px",
      background:
        "linear-gradient(135deg,#0F766E,#115E59)",
      display:"flex",
      alignItems:"center",
      justifyContent:"center",
      color:"#fff"
    }}
  >
    <Plus size={20}/>
  </div>

  <div
    style={{
      display:"flex",
      flexDirection:"column",
      alignItems:"flex-start"
    }}
  >
    <span
      style={{
        fontWeight:"800",
        color:"#0F172A",
        fontSize:"15px"
      }}
    >
      إضافة حلقة جديدة
    </span>

    <span
      style={{
        fontSize:"12px",
        color:"#64748B"
      }}
    >
      إنشاء حلقة وربط الطلاب والمعلم
    </span>
  </div>
</button>
        )}

        {/* ================================= */}
        {/* نموذج الإضافة */}
        {/* ================================= */}

        {showForm && (
          <section style={cardStyle}>
            <div
              style={{
                display: "flex",
                justifyContent:
                  "space-between",
                alignItems: "center",
                gap: "10px",
                flexWrap: "wrap",
                marginBottom: "18px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                }}
              >
                <div style={formIconStyle}>
                  {editingId !== null ? (
                    <Pencil size={19} />
                  ) : (
                    <Plus size={20} />
                  )}
                </div>

                <div>
                  <h2
                    style={
                      sectionTitleStyle
                    }
                  >
                    {editingId !== null
                      ? "تعديل بيانات الحلقة"
                      : "إضافة حلقة جديدة"}
                  </h2>

                  <p
                    style={
                      sectionSubtitleStyle
                    }
                  >
                    أدخل البيانات الأساسية
                    للحلقة
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={clearForm}
                disabled={loading}
                style={cancelButtonStyle}
              >
                <X size={15} />

                إلغاء
              </button>
            </div>

            <form
              onSubmit={(event) => {
                event.preventDefault();
                saveHalaqa();
              }}
            >
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(auto-fit, minmax(230px, 1fr))",
                  gap: "14px",
                }}
              >
                <FormField
                  label="اسم الحلقة"
                  value={name}
                  onChange={setName}
                  placeholder="مثال: حلقة أبو بكر"
                  disabled={loading}
                />

                <div>
                  <label style={labelStyle}>
                    المسجد
                  </label>

                  <select
                    value={mosqueId}
                    onChange={(event) =>
                      setMosqueId(
                        event.target.value
                      )
                    }
                    disabled={loading}
                    style={{
                      ...inputStyle,
                      opacity: loading
                        ? 0.7
                        : 1,
                    }}
                  >
                    <option value="">
                      اختر المسجد
                    </option>

                    {mosques.map(
                      (mosque) => (
                        <option
                          key={mosque.id}
                          value={mosque.id}
                        >
                          {mosque.name}
                        </option>
                      )
                    )}
                  </select>
                </div>

                <div>
                  <label style={labelStyle}>
                    سعة الحلقة
                  </label>

                  <input
                    type="number"
                    min="1"
                    value={capacity}
                    onChange={(event) =>
                      setCapacity(
                        event.target.value
                      )
                    }
                    placeholder="30"
                    disabled={loading}
                    style={{
                      ...inputStyle,
                      opacity: loading
                        ? 0.7
                        : 1,
                    }}
                  />
                </div>
              </div>

<div
  style={{
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  }}
>
  <label
    style={{
      fontSize: "14px",
      fontWeight: "800",
      color: "#334155",
    }}
  >
    موعد الحلقة
  </label>

  <select
    value={halaqaPeriod}
    onChange={(e) =>
      setHalaqaPeriod(e.target.value)
    }
    style={{
      width: "100%",
      height: "48px",
      borderRadius: "14px",
      border: "1px solid #DCE5E1",
      background: "#FFFFFF",
      padding: "0 14px",
      fontSize: "14px",
      fontWeight: "700",
      color: "#0F172A",
      outline: "none",
      cursor: "pointer",
    }}
  >
    <option value="">
      اختر موعد الحلقة
    </option>

    {HALAQA_PERIODS.map(
      (period) => (
        <option
          key={period.value}
          value={period.value}
        >
          {period.label}
        </option>
      )
    )}
  </select>
</div>

              <div
                style={{
                  display: "flex",
                  gap: "9px",
                  flexWrap: "wrap",
                  marginTop: "17px",
                }}
              >
                <button
                  type="submit"
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
                  {loading ? (
                    <Loader2
                      size={17}
                      className="spin"
                    />
                  ) : editingId !== null ? (
                    <CheckCircle2 size={17} />
                  ) : (
                    <Plus size={18} />
                  )}

                  {loading
                    ? "جارٍ الحفظ..."
                    : editingId !== null
                    ? "حفظ التعديلات"
                    : "إضافة الحلقة"}
                </button>

                <button
                  type="button"
                  onClick={clearForm}
                  disabled={loading}
                  style={
                    secondaryButtonStyle
                  }
                >
                  إلغاء
                </button>
              </div>
            </form>
          </section>
        )}

        {/* ================================= */}
        {/* البحث */}
        {/* ================================= */}

        <section
          style={{
            ...cardStyle,
            padding: "15px",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "minmax(250px, 1fr) 220px 190px",
              gap: "12px",
            }}
          >
            <div
              style={{
                position: "relative",
              }}
            >
              <Search
                size={19}
                color="#89918b"
                strokeWidth={1.8}
                style={{
                  position:
                    "absolute",
                  right: "14px",
                  top: "50%",
                  transform:
                    "translateY(-50%)",
                  pointerEvents:
                    "none",
                }}
              />

              <input
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value
                  )
                }
                placeholder="ابحث باسم الحلقة أو المسجد..."
                style={{
                  ...inputStyle,
                  paddingRight: "44px",
                  paddingLeft: search
                    ? "44px"
                    : "12px",
                }}
              />

              {search && (
                <button
                  type="button"
                  onClick={() =>
                    setSearch("")
                  }
                  style={
                    clearSearchButtonStyle
                  }
                >
                  <X size={15} />
                </button>
              )}
            </div>

            <select
              value={mosqueFilter}
              onChange={(event) =>
                setMosqueFilter(
                  event.target.value
                )
              }
              style={inputStyle}
            >
              <option value="all">
                جميع المساجد
              </option>

              {mosques.map(
                (mosque) => (
                  <option
                    key={mosque.id}
                    value={mosque.id}
                  >
                    {mosque.name}
                  </option>
                )
              )}
            </select>

            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(
                  event.target.value
                )
              }
              style={inputStyle}
            >
              <option value="all">
                جميع الحالات
              </option>

              <option value="active">
                النشطة
              </option>

              <option value="inactive">
                غير النشطة
              </option>
            </select>
          </div>
        </section>

        {/* ================================= */}
        {/* عنوان القائمة */}
        {/* ================================= */}

        <div
          style={{
            display: "flex",
            justifyContent:
              "space-between",
            alignItems: "center",
            marginBottom: "14px",
          }}
        >
          <div>
            <h2
              style={{
                margin: 0,
                color: "#173d2b",
                fontSize: "20px",
                fontWeight: "800",
              }}
            >
              الحلقات المسجلة
            </h2>

            <p
              style={{
                margin: "4px 0 0",
                color: "#8a918d",
                fontSize: "12px",
              }}
            >
              عرض{" "}
              {filteredHalaqat.length}{" "}
              من {halaqat.length} حلقة
            </p>
          </div>
        </div>

        {/* ================================= */}
        {/* التحميل */}
        {/* ================================= */}

        {initialLoading ? (
          <LoadingState />
        ) : filteredHalaqat.length ===
          0 ? (
          <EmptyState
            search={search}
            onClear={() => {
              setSearch("");
              setStatusFilter("all");
              setMosqueFilter("all");
            }}
          />
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(310px, 1fr))",
              gap: "16px",
            }}
          >
            {filteredHalaqat.map(
  (halaqa) => (
    <HalaqaCard
      key={halaqa.id}
      halaqa={halaqa}
      mosqueName={getMosqueName(
        halaqa.mosque_id
      )}
      studentCount={getStudentCount(
        halaqa.id
      )}
      teacherCount={getTeacherCount(
        halaqa.id
      )}
      onEdit={editHalaqa}
      onToggleStatus={toggleStatus}
      onDelete={deleteHalaqa}
      onStudents={onStudents}
      onTeachers={onTeachers}
      loading={loading}
    />
  )
)}
          </div>
        )}
      </div>
    </div>
  );
}

// ==========================================
// بطاقة الحلقة
// ==========================================

function HalaqaCard({
  halaqa,
  mosqueName,
  studentCount,
  teacherCount,
  onEdit,
  onToggleStatus,
  onDelete,
  onStudents,
  onTeachers,
  loading,
}) {
  const isActive =
    halaqa.status === "active";

  const capacity = Number(
    halaqa.capacity || 0
  );

  const occupancy =
    capacity > 0
      ? Math.min(
          Math.round(
            (studentCount / capacity) *
              100
          ),
          100
        )
      : 0;

  return (
    <div
      style={{
        background: "#fff",
        border:
          "1px solid #e4e8e4",
        borderRadius: "18px",
        padding: "18px",
        boxShadow:
          "0 5px 18px rgba(0,0,0,0.04)",
      }}
    >
      {/* الرأس */}

      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent:
            "space-between",
          gap: "10px",
          marginBottom: "17px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            minWidth: 0,
          }}
        >
          <div
            style={{
              width: "50px",
              height: "50px",
              flexShrink: 0,
              borderRadius: "14px",
              background:
                "linear-gradient(145deg,#edf5ef,#e2eee7)",
              color: "#0f5132",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <BookOpen
              size={25}
              strokeWidth={1.7}
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
                overflow: "hidden",
                textOverflow:
                  "ellipsis",
                whiteSpace:
                  "nowrap",
              }}
            >
              {halaqa.name}
            </h3>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "5px",
                marginTop: "5px",
                color: "#8b938d",
                fontSize: "11px",
              }}
            >
              <Building2 size={14} />

              {mosqueName}
            </div>
          </div>
        </div>

        <span
          style={{
            flexShrink: 0,
            display: "inline-flex",
            alignItems: "center",
            gap: "5px",
            padding: "5px 8px",
            borderRadius: "20px",
            background: isActive
              ? "#eaf6ee"
              : "#f2f2f2",
            color: isActive
              ? "#0f5132"
              : "#777",
            fontSize: "10px",
            fontWeight: "700",
          }}
        >
          {isActive ? (
            <CheckCircle2 size={13} />
          ) : (
            <CircleOff size={13} />
          )}

          {isActive
            ? "نشطة"
            : "غير نشطة"}
        </span>
      </div>

      {/* الإحصائيات */}

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "1fr 1fr",
          gap: "8px",
          marginBottom: "14px",
        }}
      >
        <MiniStat
          icon={<Users size={17} />}
          label="الطلاب"
          value={studentCount}
        />

        <MiniStat
          icon={
            <UserRound size={17} />
          }
          label="المعلمين"
          value={teacherCount}
        />
      </div>

      {/* السعة */}

      <div
        style={{
          background: "#fafbf9",
          border:
            "1px solid #eef0ed",
          borderRadius: "12px",
          padding: "13px",
          marginBottom: "14px",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent:
              "space-between",
            alignItems: "center",
            marginBottom: "8px",
          }}
        >
          <span
            style={{
              color: "#777",
              fontSize: "11px",
            }}
          >
            إشغال الحلقة
          </span>

          <strong
            style={{
              color: "#173d2b",
              fontSize: "12px",
            }}
          >
            {studentCount} / {capacity}
          </strong>
        </div>

        <div
          style={{
            height: "7px",
            background: "#e8ebe8",
            borderRadius: "20px",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: `${occupancy}%`,
              height: "100%",
              background:
                occupancy >= 90
                  ? "#b42318"
                  : "#0f5132",
              borderRadius: "20px",
              transition:
                "width .3s ease",
            }}
          />
        </div>

        <div
          style={{
            marginTop: "7px",
            textAlign: "left",
            color:
              occupancy >= 90
                ? "#b42318"
                : "#89918b",
            fontSize: "10px",
          }}
        >
          {occupancy}% من السعة
        </div>
      </div>

      {/* الوصول السريع */}

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "1fr 1fr",
          gap: "8px",
          marginBottom: "14px",
        }}
      >
       <QuickButton
  icon={<Users size={17} />}
  text="طلاب الحلقة"
  onClick={() => onStudents(halaqa.id)}
/>

<QuickButton
  icon={<GraduationCap size={17} />}
  text="معلمو الحلقة"
  onClick={() => onTeachers(halaqa.id)}
/>
      </div>

      {/* الإجراءات */}

      <div
        style={{
          borderTop:
            "1px solid #eef0ed",
          paddingTop: "14px",
          display: "grid",
          gridTemplateColumns:
            "1fr 1fr 1fr",
          gap: "7px",
        }}
      >
        <ActionButton
          icon={<Pencil size={15} />}
          text="تعديل"
          onClick={() =>
            onEdit(halaqa)
          }
          disabled={loading}
        />

        <ActionButton
          icon={<Power size={15} />}
          text={
            isActive
              ? "تعطيل"
              : "تفعيل"
          }
          onClick={() =>
            onToggleStatus(halaqa)
          }
          disabled={loading}
        />

        <ActionButton
          danger
          icon={<Trash2 size={15} />}
          text="حذف"
          onClick={() =>
            onDelete(halaqa)
          }
          disabled={loading}
        />
      </div>
    </div>
  );
}

// ==========================================
// حقل النموذج
// ==========================================

function FormField({
  label,
  value,
  onChange,
  placeholder,
  disabled,
}) {
  return (
    <div>
      <label style={labelStyle}>
        {label}
      </label>

      <input
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        placeholder={placeholder}
        disabled={disabled}
        style={{
          ...inputStyle,
          opacity: disabled ? 0.7 : 1,
        }}
      />
    </div>
  );
}

// ==========================================
// Stat
// ==========================================

function StatCard({
  icon,
  title,
  value,
}) {
  return (
    <div
      style={{
        background: "#fff",
        border:
          "1px solid #e6e9e5",
        borderRadius: "16px",
        padding: "18px",
        display: "flex",
        alignItems: "center",
        gap: "13px",
        boxShadow:
          "0 3px 12px rgba(0,0,0,0.03)",
      }}
    >
      <div
        style={{
          width: "46px",
          height: "46px",
          flexShrink: 0,
          borderRadius: "13px",
          background: "#edf5ef",
          color: "#0f5132",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {icon}
      </div>

      <div>
        <div
          style={{
            color: "#7e8781",
            fontSize: "11px",
            marginBottom: "3px",
          }}
        >
          {title}
        </div>

        <div
          style={{
            color: "#173d2b",
            fontSize: "24px",
            fontWeight: "800",
          }}
        >
          {value}
        </div>
      </div>
    </div>
  );
}

// ==========================================
// Mini Stat
// ==========================================

function MiniStat({
  icon,
  label,
  value,
}) {
  return (
    <div
      style={{
        background: "#fafafa",
        borderRadius: "11px",
        padding: "11px",
        display: "flex",
        alignItems: "center",
        justifyContent:
          "space-between",
      }}
    >
      <span
        style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
          color: "#777",
          fontSize: "11px",
        }}
      >
        {icon}

        {label}
      </span>

      <strong
        style={{
          color: "#173d2b",
          fontSize: "13px",
        }}
      >
        {value}
      </strong>
    </div>
  );
}

// ==========================================
// Quick Button
// ==========================================

function QuickButton({
  icon,
  text,
  onClick,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "7px",
        padding: "10px",
        borderRadius: "9px",
        border:
          "1px solid #dce5df",
        background: "#f4f8f5",
        color: "#0f5132",
        cursor: "pointer",
        fontWeight: "700",
        fontSize: "11px",
      }}
    >
      {icon}

      {text}
    </button>
  );
}

// ==========================================
// Action Button
// ==========================================

function ActionButton({
  icon,
  text,
  onClick,
  danger = false,
  disabled = false,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "5px",
        padding: "9px 5px",
        borderRadius: "8px",
        border: `1px solid ${
          danger
            ? "#f0d8d5"
            : "#dfe3df"
        }`,
        background: danger
          ? "#fff8f7"
          : "#fff",
        color: danger
          ? "#b42318"
          : "#555",
        cursor: disabled
          ? "not-allowed"
          : "pointer",
        opacity: disabled
          ? 0.55
          : 1,
        fontSize: "11px",
        fontWeight: "700",
      }}
    >
      {icon}

      {text}
    </button>
  );
}

// ==========================================
// Empty State
// ==========================================

function EmptyState({
  search,
  onClear,
}) {
  return (
    <div
      style={{
        background: "#fff",
        border:
          "1px solid #e5e8e4",
        borderRadius: "18px",
        padding: "55px 20px",
        textAlign: "center",
      }}
    >
      <div
        style={{
          width: "64px",
          height: "64px",
          margin: "0 auto 14px",
          borderRadius: "18px",
          background: "#edf5ef",
          color: "#0f5132",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {search ? (
          <Search size={28} />
        ) : (
          <BookOpen size={28} />
        )}
      </div>

      <h3
        style={{
          margin: "0 0 7px",
          color: "#354139",
          fontSize: "17px",
        }}
      >
        {search
          ? "لا توجد نتائج"
          : "لا توجد حلقات حتى الآن"}
      </h3>

      <p
        style={{
          margin: 0,
          color: "#929993",
          fontSize: "12px",
        }}
      >
        {search
          ? "لم نجد حلقة مطابقة لخيارات البحث."
          : "ابدأ بإضافة أول حلقة إلى النظام."}
      </p>

      {search && (
        <button
          type="button"
          onClick={onClear}
          style={{
            marginTop: "15px",
            border: "none",
            background: "#0f5132",
            color: "#fff",
            padding: "9px 16px",
            borderRadius: "9px",
            cursor: "pointer",
            fontSize: "12px",
            fontWeight: "700",
          }}
        >
          مسح الفلاتر
        </button>
      )}
    </div>
  );
}

// ==========================================
// Loading
// ==========================================

function LoadingState() {
  return (
    <div
      style={{
        background: "#fff",
        border:
          "1px solid #e5e8e4",
        borderRadius: "18px",
        padding: "55px 20px",
        textAlign: "center",
        color: "#7f8781",
      }}
    >
      <div
        style={{
          width: "40px",
          height: "40px",
          margin: "0 auto 13px",
          border:
            "3px solid #e1e8e3",
          borderTopColor:
            "#0f5132",
          borderRadius: "50%",
          animation:
            "spin 0.8s linear infinite",
        }}
      />

      جاري تحميل الحلقات...
    </div>
  );
}

// ==========================================
// Styles
// ==========================================

const cardStyle = {
  background: "#fff",
  border:
    "1px solid #e5e8e4",
  borderRadius: "18px",
  padding: "22px",
  marginBottom: "22px",
  boxShadow:
    "0 4px 15px rgba(0,0,0,0.035)",
};

const pageTitleStyle = {
  margin: 0,
  color: "#173d2b",
  fontSize: "28px",
  fontWeight: "800",
};

const pageIconStyle = {
  width: "48px",
  height: "48px",
  borderRadius: "14px",
  background: "#eaf3ed",
  color: "#0f5132",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const backButtonStyle = {
  width: "43px",
  height: "43px",
  border:
    "1px solid #e0e4df",
  background: "#fff",
  color: "#173d2b",
  borderRadius: "11px",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const headerButtonStyle = {
  border:
    "1px solid #dfe4e0",
  background: "#fff",
  color: "#173d2b",
  borderRadius: "10px",
  padding: "9px 13px",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "7px",
  fontSize: "12px",
  fontWeight: "700",
  cursor: "pointer",
};

const countBadgeStyle = {
  background: "#fff",
  border:
    "1px solid #e4e7e3",
  borderRadius: "11px",
  padding: "9px 13px",
  display: "flex",
  alignItems: "center",
  gap: "8px",
  color: "#707872",
  fontSize: "12px",
  fontWeight: "600",
};

const formIconStyle = {
  width: "40px",
  height: "40px",
  borderRadius: "11px",
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
  fontWeight: "800",
};

const sectionSubtitleStyle = {
  margin: "4px 0 0",
  color: "#8a918d",
  fontSize: "11px",
};

const labelStyle = {
  display: "block",
  marginBottom: "7px",
  color: "#465149",
  fontSize: "12px",
  fontWeight: "700",
};

const inputStyle = {
  width: "100%",
  height: "46px",
  padding: "0 12px",
  border:
    "1px solid #d9ded9",
  borderRadius: "10px",
  outline: "none",
  fontSize: "13px",
  boxSizing: "border-box",
  background: "#fff",
  color: "#26332c",
};

const primaryButtonStyle = {
  border: "none",
  background: "#0f5132",
  color: "#fff",
  borderRadius: "10px",
  padding: "11px 21px",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "8px",
  fontSize: "13px",
  fontWeight: "700",
  cursor: "pointer",
};

const secondaryButtonStyle = {
  border:
    "1px solid #dfe3df",
  background: "#fff",
  color: "#59625c",
  borderRadius: "10px",
  padding: "10px 18px",
  cursor: "pointer",
  fontSize: "13px",
  fontWeight: "700",
};

const cancelButtonStyle = {
  border:
    "1px solid #ddd",
  background: "#fff",
  color: "#666",
  borderRadius: "9px",
  padding: "8px 13px",
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  gap: "6px",
  fontSize: "12px",
  fontWeight: "600",
};

const clearSearchButtonStyle = {
  position: "absolute",
  left: "9px",
  top: "50%",
  transform:
    "translateY(-50%)",
  width: "30px",
  height: "30px",
  border: "none",
  borderRadius: "8px",
  background: "#f1f3f1",
  color: "#707872",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};
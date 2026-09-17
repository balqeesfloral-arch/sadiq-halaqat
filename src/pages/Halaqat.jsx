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
  ShieldCheck,
  AlertTriangle,
  SlidersHorizontal,
  Activity,
  Target,
  ChevronLeft,
  Clock3,
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

    setMainTeacherId(
      halaqa.main_teacher_id ? String(halaqa.main_teacher_id) : ""
    );

    setAssistantTeacherId(
      halaqa.assistant_teacher_id ? String(halaqa.assistant_teacher_id) : ""
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
    setMainTeacherId("");
    setAssistantTeacherId("");
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

  const occupancyRate =
    totalCapacity > 0
      ? Math.round((totalStudents / totalCapacity) * 100)
      : 0;

  const halaqatWithoutTeacher = halaqat.filter(
    (halaqa) => !halaqa.main_teacher_id
  ).length;

  const nearlyFullHalaqat = halaqat.filter((halaqa) => {
    const cap = Number(halaqa.capacity || 0);
    const count = getStudentCount(halaqa.id);
    return cap > 0 && count / cap >= 0.85;
  }).length;

  const hasActiveFilters =
    Boolean(search) || statusFilter !== "all" || mosqueFilter !== "all";

  function openCreateModal() {
    setEditingId(null);
    setName("");
    setCapacity("");
    setMosqueId("");
    setHalaqaPeriod("");
    setMainTeacherId("");
    setAssistantTeacherId("");
    setShowForm(true);
  }

  return (
    <div className="hq-page" dir="rtl">
      <main className="hq-shell">
        <section className="hq-hero">
          <div className="hq-pattern" />
          <div className="hq-hero-main">
            <div>
              <div className="hq-kicker">
                <ShieldCheck size={15} />
                بوابة المشرف · مركز إدارة الحلقات
              </div>

              <div className="hq-title-line">
                <button
                  type="button"
                  className="hq-back"
                  onClick={() => navigate("/admin")}
                  aria-label="العودة"
                >
                  <ArrowRight size={20} />
                </button>

                <div className="hq-title-icon">
                  <BookOpen size={26} />
                </div>

                <div>
                  <h1>إدارة الحلقات</h1>
                  <p>
                    لوحة تشغيل موحدة لمتابعة الحلقات والسعة والطلاب والتكليف التعليمي.
                  </p>
                </div>
              </div>
            </div>

            <div className="hq-hero-actions">
              <button
                type="button"
                className="hq-refresh"
                onClick={refreshData}
                disabled={refreshing || loading}
              >
                {refreshing ? (
                  <Loader2 size={17} className="spin" />
                ) : (
                  <RefreshCw size={17} />
                )}
                تحديث
              </button>

              <button type="button" className="hq-create" onClick={openCreateModal}>
                <span className="hq-create-icon"><Plus size={19} /></span>
                <span>
                  <strong>إنشاء حلقة</strong>
                  <small>إضافة ملف حلقة جديد</small>
                </span>
              </button>
            </div>
          </div>

          <div className="hq-hero-strip">
            <div>
              <span>تغطية السعة</span>
              <strong>{occupancyRate}%</strong>
              <small>{totalStudents} طالب من {totalCapacity || 0} مقعد</small>
            </div>
            <div>
              <span>تحتاج معلمًا رئيسيًا</span>
              <strong>{halaqatWithoutTeacher}</strong>
              <small>حلقة تحتاج استكمال التكليف</small>
            </div>
            <div>
              <span>قريبة من الامتلاء</span>
              <strong>{nearlyFullHalaqat}</strong>
              <small>إشغال 85٪ فأكثر</small>
            </div>
          </div>
        </section>

        <section className="hq-stats">
          <StatCard icon={<BookOpen size={18} />} title="إجمالي الحلقات" value={halaqat.length} note={`${activeCount} نشطة`} />
          <StatCard icon={<CheckCircle2 size={18} />} title="الحلقات النشطة" value={activeCount} note={`${inactiveCount} غير نشطة`} />
          <StatCard icon={<Users size={18} />} title="إجمالي الطلاب" value={totalStudents} note="مرتبطون بالحلقات" />
          <StatCard icon={<GraduationCap size={18} />} title="تكليفات المعلمين" value={totalTeachers} note="رئيسي ومساعد" />
          <StatCard icon={<Target size={18} />} title="السعة الإجمالية" value={totalCapacity} note={`${occupancyRate}% إشغال`} />
        </section>

        <section className="hq-command">
          <div className="hq-command-head">
            <div>
              <span className="hq-command-kicker"><Activity size={14} /> مركز المتابعة الذكي</span>
              <h2>حالات تحتاج انتباه المشرف</h2>
              <p>مؤشرات تشغيلية محسوبة من البيانات الموجودة حاليًا دون استعلامات إضافية.</p>
            </div>
            <div className="hq-score">
              <span>نسبة الحلقات النشطة</span>
              <strong>
                {halaqat.length ? Math.round((activeCount / halaqat.length) * 100) : 0}%
              </strong>
            </div>
          </div>

          <div className="hq-insights">
            <Insight icon={<AlertTriangle size={16} />} label="بلا معلم رئيسي" value={halaqatWithoutTeacher} hint="تحتاج تكليفًا" />
            <Insight icon={<UsersRound size={16} />} label="قريبة من الامتلاء" value={nearlyFullHalaqat} hint="85٪ فأكثر" />
            <Insight icon={<CircleOff size={16} />} label="غير النشطة" value={inactiveCount} hint="موقوفة حاليًا" />
          </div>
        </section>

        <section className="hq-filter-box">
          <div className="hq-filter-head">
            <div><SlidersHorizontal size={17} /> البحث والتصفية</div>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setStatusFilter("all");
                  setMosqueFilter("all");
                }}
              >
                إعادة الضبط
              </button>
            )}
          </div>

          <div className="hq-filters">
            <div className="hq-search">
              <Search size={18} />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="ابحث باسم الحلقة أو المسجد أو الرقم..."
              />
              {search && (
                <button type="button" onClick={() => setSearch("")}>
                  <X size={14} />
                </button>
              )}
            </div>

            <select value={mosqueFilter} onChange={(event) => setMosqueFilter(event.target.value)}>
              <option value="all">جميع المساجد</option>
              {mosques.map((mosque) => (
                <option key={mosque.id} value={mosque.id}>{mosque.name}</option>
              ))}
            </select>

            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
              <option value="all">جميع الحالات</option>
              <option value="active">النشطة</option>
              <option value="inactive">غير النشطة</option>
            </select>
          </div>
        </section>

        <div className="hq-list-head">
          <div>
            <span>دليل الحلقات</span>
            <h2>الحلقات المسجلة</h2>
            <p>عرض {filteredHalaqat.length} من {halaqat.length} حلقة</p>
          </div>
          <div className="hq-count"><BookOpen size={15} /> {filteredHalaqat.length}</div>
        </div>

        {initialLoading ? (
          <LoadingState />
        ) : filteredHalaqat.length === 0 ? (
          <EmptyState
            search={search}
            onClear={() => {
              setSearch("");
              setStatusFilter("all");
              setMosqueFilter("all");
            }}
          />
        ) : (
          <div className="hq-grid">
            {filteredHalaqat.map((halaqa) => (
              <HalaqaCard
                key={halaqa.id}
                halaqa={halaqa}
                mosqueName={getMosqueName(halaqa.mosque_id)}
                studentCount={getStudentCount(halaqa.id)}
                teacherCount={getTeacherCount(halaqa)}
                onEdit={editHalaqa}
                onToggleStatus={toggleStatus}
                onDelete={deleteHalaqa}
                onStudents={onStudents}
                onTeachers={onTeachers}
                loading={loading}
              />
            ))}
          </div>
        )}
      </main>

      {showForm && (
        <div
          className="hq-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !loading) clearForm();
          }}
        >
          <section className="hq-modal" role="dialog" aria-modal="true">
            <div className="hq-modal-hero">
              <button
                type="button"
                className="hq-modal-close"
                onClick={clearForm}
                disabled={loading}
                aria-label="إغلاق"
              >
                <X size={18} />
              </button>

              <div className="hq-modal-title">
                <div className="hq-modal-icon">
                  {editingId !== null ? <Pencil size={21} /> : <BookOpen size={22} />}
                </div>
                <div>
                  <span>ملف الحلقة · إدارة تشغيلية</span>
                  <h2>{editingId !== null ? "تعديل بيانات الحلقة" : "إنشاء حلقة جديدة"}</h2>
                  <p>
                    {editingId !== null
                      ? "حدّث بيانات الحلقة والتكليف التعليمي من نافذة واحدة."
                      : "أنشئ الحلقة وحدد المسجد والموعد والسعة والتكليف التعليمي."}
                  </p>
                </div>
              </div>

              <div className="hq-steps">
                <span className="active">01 البيانات الأساسية</span>
                <span>02 التشغيل والسعة</span>
                <span>03 التكليف التعليمي</span>
              </div>
            </div>

            <form
              onSubmit={(event) => {
                event.preventDefault();
                saveHalaqa();
              }}
            >
              <div className="hq-modal-body">
                <FormSection
                  icon={<BookOpen size={17} />}
                  title="البيانات الأساسية"
                  subtitle="هوية الحلقة والمسجد التابعة له"
                >
                  <div className="hq-form-grid">
                    <Field label="اسم الحلقة" required>
                      <input
                        value={name}
                        onChange={(event) => setName(event.target.value)}
                        placeholder="مثال: حلقة أبي بن كعب رضي الله عنه"
                        disabled={loading}
                      />
                    </Field>
                    <Field label="المسجد" required>
                      <select value={mosqueId} onChange={(event) => setMosqueId(event.target.value)} disabled={loading}>
                        <option value="">اختر المسجد</option>
                        {mosques.map((mosque) => (
                          <option key={mosque.id} value={mosque.id}>{mosque.name}</option>
                        ))}
                      </select>
                    </Field>
                  </div>
                </FormSection>

                <FormSection
                  icon={<Clock3 size={17} />}
                  title="التشغيل والسعة"
                  subtitle="موعد الحلقة والطاقة الاستيعابية"
                  gold
                >
                  <div className="hq-form-grid">
                    <Field label="موعد الحلقة">
                      <select value={halaqaPeriod} onChange={(event) => setHalaqaPeriod(event.target.value)} disabled={loading}>
                        <option value="">اختر موعد الحلقة</option>
                        {HALAQA_PERIODS.map((period) => (
                          <option key={period.value} value={period.value}>{period.label}</option>
                        ))}
                      </select>
                    </Field>
                    <Field label="سعة الحلقة">
                      <input
                        type="number"
                        min="1"
                        value={capacity}
                        onChange={(event) => setCapacity(event.target.value)}
                        placeholder="20"
                        disabled={loading}
                      />
                    </Field>
                  </div>
                </FormSection>

                <FormSection
                  icon={<GraduationCap size={17} />}
                  title="التكليف التعليمي"
                  subtitle="اختيار المعلم الرئيسي والمساعد"
                >
                  <div className="hq-form-grid">
                    <Field label="المعلم الرئيسي">
                      <select value={mainTeacherId} onChange={(event) => setMainTeacherId(event.target.value)} disabled={loading}>
                        <option value="">غير محدد</option>
                        {teachers.map((teacher) => (
                          <option key={teacher.id} value={teacher.id}>{teacher.full_name}</option>
                        ))}
                      </select>
                    </Field>
                    <Field label="المعلم المساعد">
                      <select value={assistantTeacherId} onChange={(event) => setAssistantTeacherId(event.target.value)} disabled={loading}>
                        <option value="">غير محدد</option>
                        {teachers.map((teacher) => (
                          <option key={teacher.id} value={teacher.id}>{teacher.full_name}</option>
                        ))}
                      </select>
                    </Field>
                  </div>
                </FormSection>
              </div>

              <div className="hq-modal-footer">
                <div className="hq-save-note"><ShieldCheck size={14} /> سيتم حفظ بيانات الحلقة وربطها مباشرة بالنظام.</div>
                <div className="hq-modal-actions">
                  <button type="button" className="hq-cancel" onClick={clearForm} disabled={loading}>إلغاء</button>
                  <button type="submit" className="hq-save" disabled={loading}>
                    {loading ? <Loader2 size={16} className="spin" /> : editingId !== null ? <CheckCircle2 size={16} /> : <Plus size={17} />}
                    {loading ? "جارٍ الحفظ..." : editingId !== null ? "حفظ التعديلات" : "إنشاء الحلقة"}
                  </button>
                </div>
              </div>
            </form>
          </section>
        </div>
      )}

      <style>{`
        *{box-sizing:border-box}
        .hq-page{min-height:100vh;width:100%;overflow-x:hidden;background:radial-gradient(circle at 8% 5%,rgba(190,151,49,.07),transparent 25%),radial-gradient(circle at 93% 14%,rgba(10,104,78,.07),transparent 27%),#f5f7f4;color:#173b31;padding:22px clamp(14px,2vw,32px) 42px;font-family:inherit}
        .hq-shell{width:100%;max-width:1680px;margin:0 auto}
        .hq-hero{position:relative;overflow:hidden;border-radius:26px;background:linear-gradient(135deg,#073d33,#0a5b49 58%,#09483c);color:#fff;border:1px solid rgba(204,168,68,.38);box-shadow:0 18px 45px rgba(7,62,52,.13);margin-bottom:14px}
        .hq-pattern{position:absolute;inset:0;opacity:.13;pointer-events:none;background-image:linear-gradient(45deg,transparent 47%,rgba(255,255,255,.2) 48%,transparent 50%),linear-gradient(-45deg,transparent 47%,rgba(225,190,83,.28) 48%,transparent 50%);background-size:62px 62px;mask-image:linear-gradient(to left,#000,transparent 72%)}
        .hq-hero-main{position:relative;z-index:1;display:flex;align-items:center;justify-content:space-between;gap:22px;padding:24px 26px 20px}
        .hq-kicker,.hq-command-kicker{display:inline-flex;align-items:center;gap:6px;color:#e6c768;font-size:10px;font-weight:900;margin-bottom:10px}
        .hq-title-line{display:flex;align-items:center;gap:11px}
        .hq-title-line h1{margin:0;font-size:clamp(23px,2vw,33px);font-weight:950;line-height:1.1}
        .hq-title-line p{margin:6px 0 0;color:rgba(255,255,255,.7);font-size:11px}
        .hq-back,.hq-title-icon{width:43px;height:43px;flex:0 0 43px;border-radius:13px;display:grid;place-items:center;border:1px solid rgba(255,255,255,.15);background:rgba(255,255,255,.08);color:#fff}
        .hq-back{cursor:pointer}.hq-title-icon{color:#f0d477}
        .hq-hero-actions{display:flex;gap:8px;align-items:stretch}
        .hq-refresh,.hq-create{font-family:inherit;cursor:pointer}
        .hq-refresh{min-height:50px;padding:0 14px;border-radius:14px;border:1px solid rgba(255,255,255,.16);background:rgba(255,255,255,.09);color:#fff;display:flex;align-items:center;gap:7px;font-weight:800}
        .hq-create{min-width:184px;border:0;border-radius:15px;background:#fff;color:#0a4e40;padding:7px 10px;display:flex;align-items:center;gap:9px;box-shadow:0 10px 24px rgba(0,0,0,.12)}
        .hq-create-icon{width:37px;height:37px;border-radius:11px;display:grid;place-items:center;background:linear-gradient(145deg,#b88918,#d0aa43);color:#fff}
        .hq-create>span:last-child{display:flex;flex-direction:column;align-items:flex-start}.hq-create strong{font-size:12px}.hq-create small{font-size:8px;color:#829088;margin-top:2px}
        .hq-hero-strip{position:relative;z-index:1;display:grid;grid-template-columns:repeat(3,1fr);background:rgba(0,0,0,.08);border-top:1px solid rgba(255,255,255,.1)}
        .hq-hero-strip>div{padding:11px 18px;border-inline-start:1px solid rgba(255,255,255,.1)}.hq-hero-strip>div:first-child{border-inline-start:0}
        .hq-hero-strip span,.hq-hero-strip small{display:block;color:rgba(255,255,255,.62);font-size:8px}.hq-hero-strip strong{display:block;color:#f2d675;font-size:18px;margin:2px 0}
        .hq-stats{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:9px;margin-bottom:14px}
        .hq-stat{min-width:0;min-height:84px;background:rgba(255,255,255,.94);border:1px solid #dfe7e2;border-radius:17px;padding:12px 13px;box-shadow:0 6px 20px rgba(18,55,44,.04);position:relative;overflow:hidden}
        .hq-stat:before{content:"";position:absolute;top:0;right:0;left:0;height:2px;background:linear-gradient(90deg,#0b765b,#c69b2d)}
        .hq-stat-top{display:flex;align-items:center;justify-content:space-between;gap:7px}.hq-stat-icon{width:31px;height:31px;border-radius:10px;display:grid;place-items:center;color:#0b6b54;background:#edf7f2}
        .hq-stat span{color:#7d8a84;font-size:9px;font-weight:800}.hq-stat strong{display:block;margin-top:5px;color:#0d513f;font-size:21px;line-height:1}.hq-stat small{display:block;margin-top:4px;color:#99a39e;font-size:7px}
        .hq-command{border-radius:21px;padding:17px 19px;margin-bottom:14px;background:linear-gradient(135deg,#0b5948,#094b3f);color:#fff;border:1px solid rgba(201,164,62,.25);box-shadow:0 11px 27px rgba(7,72,59,.09)}
        .hq-command-head{display:flex;align-items:center;justify-content:space-between;gap:16px}.hq-command h2{margin:3px 0;font-size:17px}.hq-command p{margin:0;color:rgba(255,255,255,.6);font-size:9px}
        .hq-score{min-width:105px;text-align:center;padding:8px 12px;border-radius:13px;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.1)}.hq-score span{display:block;font-size:8px;color:rgba(255,255,255,.62)}.hq-score strong{display:block;margin-top:2px;color:#f0d16c;font-size:20px}
        .hq-insights{display:grid;grid-template-columns:repeat(3,1fr);gap:7px;margin-top:12px}.hq-insight{display:flex;align-items:center;gap:9px;padding:9px 10px;border-radius:12px;background:rgba(255,255,255,.065);border:1px solid rgba(255,255,255,.085)}
        .hq-insight-icon{width:29px;height:29px;border-radius:9px;display:grid;place-items:center;background:rgba(255,255,255,.08);color:#e9cf77}.hq-insight-copy{flex:1;min-width:0}.hq-insight-copy span{display:block;color:rgba(255,255,255,.7);font-size:8px}.hq-insight-copy small{display:block;margin-top:2px;color:rgba(255,255,255,.45);font-size:7px}.hq-insight strong{font-size:17px}
        .hq-filter-box{background:#fff;border:1px solid #dfe7e2;border-radius:18px;padding:11px;margin-bottom:18px;box-shadow:0 6px 19px rgba(18,55,44,.035)}
        .hq-filter-head{display:flex;align-items:center;justify-content:space-between;padding:0 3px 8px}.hq-filter-head>div{display:flex;align-items:center;gap:6px;font-size:10px;font-weight:900}.hq-filter-head button{border:0;background:transparent;color:#987319;font:800 8px inherit;cursor:pointer}
        .hq-filters{display:grid;grid-template-columns:minmax(250px,1fr) 210px 175px;gap:8px}.hq-search{position:relative}.hq-search>svg{position:absolute;right:12px;top:50%;transform:translateY(-50%);color:#8c9892}.hq-search button{position:absolute;left:8px;top:50%;transform:translateY(-50%);width:26px;height:26px;border:0;border-radius:8px;background:#f1f5f2;color:#65736c;display:grid;place-items:center;cursor:pointer}
        .hq-filters input,.hq-filters select,.hq-modal input,.hq-modal select{width:100%;height:42px;border:1px solid #d8e2dc;border-radius:11px;background:#fff;color:#263d35;outline:none;font:700 10px inherit;padding:0 11px}.hq-search input{padding-right:39px;padding-left:38px}
        .hq-filters input:focus,.hq-filters select:focus,.hq-modal input:focus,.hq-modal select:focus{border-color:#4f9b83;box-shadow:0 0 0 3px rgba(15,111,85,.08)}
        .hq-list-head{display:flex;align-items:flex-end;justify-content:space-between;gap:10px;margin:0 2px 11px}.hq-list-head span{color:#9a761b;font-size:9px;font-weight:900}.hq-list-head h2{margin:2px 0 0;font-size:18px}.hq-list-head p{margin:3px 0 0;color:#8b9690;font-size:9px}.hq-count{min-width:45px;height:35px;padding:0 10px;border-radius:11px;display:flex;align-items:center;justify-content:center;gap:5px;background:#eaf5ef;color:#0d654e;font-size:11px;font-weight:900}
        .hq-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}
        .hq-card{min-width:0;background:#fff;border:1px solid #dde6e0;border-radius:19px;padding:14px;box-shadow:0 7px 21px rgba(15,60,46,.04);transition:.2s ease}.hq-card:hover{transform:translateY(-3px);border-color:#c6d9cf;box-shadow:0 15px 32px rgba(15,60,46,.08)}
        .hq-card-head{display:flex;align-items:flex-start;justify-content:space-between;gap:9px}.hq-card-id{display:flex;align-items:center;gap:9px;min-width:0}.hq-card-icon{width:40px;height:40px;flex:0 0 40px;border-radius:12px;display:grid;place-items:center;color:#0b654f;background:linear-gradient(145deg,#edf7f2,#e2f0e8)}
        .hq-card h3{margin:0;color:#123f31;font-size:13px;font-weight:950;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.hq-mosque{margin-top:3px;display:flex;align-items:center;gap:4px;color:#87938d;font-size:8px}
        .hq-status{display:inline-flex;align-items:center;gap:4px;flex:0 0 auto;padding:4px 7px;border-radius:999px;font-size:7px;font-weight:900}.hq-status.active{color:#0a684e;background:#e9f7ef}.hq-status.inactive{color:#7d8581;background:#f0f2f1}
        .hq-card-metrics{display:grid;grid-template-columns:repeat(3,1fr);gap:5px;margin:10px 0}.hq-metric{padding:7px;border-radius:10px;background:#f8faf8;border:1px solid #edf1ee}.hq-metric span{display:block;color:#8c9892;font-size:7px}.hq-metric strong{display:block;margin-top:2px;color:#174839;font-size:13px}
        .hq-occupancy{padding:9px;border-radius:11px;background:#fbfcfa;border:1px solid #edf1ee}.hq-occ-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;font-size:8px;color:#7f8b85}.hq-occ-head strong{color:#214a3d;font-size:9px}.hq-progress{height:5px;border-radius:99px;background:#e7ece9;overflow:hidden}.hq-progress>div{height:100%;border-radius:99px}
        .hq-card-alert{display:flex;align-items:center;gap:5px;margin-top:8px;padding:6px 8px;border-radius:9px;color:#8b6510;background:#fff9e9;border:1px solid #f2dfaa;font-size:7px;font-weight:800}
        .hq-quick{display:grid;grid-template-columns:1fr 1fr;gap:5px;margin-top:9px}.hq-quick button{min-height:33px;border:1px solid #dfe8e3;border-radius:10px;background:#f7fbf8;color:#175744;font:800 8px inherit;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:4px}
        .hq-actions{display:grid;grid-template-columns:repeat(3,1fr);gap:5px;margin-top:9px;padding-top:9px;border-top:1px solid #edf1ee}.hq-actions button{min-height:31px;border-radius:9px;border:1px solid #e0e7e3;background:#fff;color:#4b5e56;font:800 7px inherit;display:flex;align-items:center;justify-content:center;gap:3px;cursor:pointer}.hq-actions .edit{color:#0a6a50;background:#eff8f3;border-color:#d9eee4}.hq-actions .danger{color:#ad392d;background:#fff2ef;border-color:#f7ded8}
        .hq-modal-backdrop{position:fixed;inset:0;z-index:100000;display:flex;align-items:center;justify-content:center;padding:104px 24px 24px;background:rgba(4,30,25,.67);backdrop-filter:blur(9px);overflow:hidden}
        .hq-modal{width:min(660px,calc(100vw - 90px));max-height:calc(100dvh - 142px);overflow-y:auto;overflow-x:hidden;background:#fbfcfa;border:1px solid rgba(204,169,70,.55);border-radius:23px;box-shadow:0 35px 100px rgba(0,30,24,.38)}
        .hq-modal-hero{position:relative;overflow:hidden;padding:18px 19px 15px;background:linear-gradient(135deg,#073f34,#0a5a48);color:#fff}.hq-modal-close{position:absolute;top:12px;left:12px;width:32px;height:32px;display:grid;place-items:center;border-radius:9px;border:1px solid rgba(255,255,255,.18);background:rgba(255,255,255,.08);color:#fff;cursor:pointer}
        .hq-modal-title{display:flex;align-items:center;gap:10px;padding-left:42px}.hq-modal-icon{width:41px;height:41px;flex:0 0 41px;display:grid;place-items:center;border-radius:12px;background:rgba(255,255,255,.1);border:1px solid rgba(224,192,92,.45);color:#f1d475}.hq-modal-title span{color:#e5c663;font-size:8px;font-weight:900}.hq-modal-title h2{margin:2px 0;font-size:18px}.hq-modal-title p{margin:0;color:rgba(255,255,255,.64);font-size:8px}
        .hq-steps{display:flex;gap:5px;margin-top:12px;padding-right:50px}.hq-steps span{padding:4px 8px;border-radius:999px;border:1px solid rgba(255,255,255,.14);color:rgba(255,255,255,.62);font-size:7px;font-weight:800}.hq-steps .active{color:#f4d97a;border-color:rgba(225,192,84,.45);background:rgba(218,181,64,.08)}
        .hq-modal-body{padding:15px 18px}.hq-form-section+.hq-form-section{margin-top:15px;padding-top:14px;border-top:1px solid #e8eeea}.hq-section-title{display:flex;align-items:center;gap:7px;margin-bottom:9px}.hq-section-icon{width:30px;height:30px;border-radius:9px;display:grid;place-items:center;color:#0b6b54;background:#eaf6f0}.hq-form-section.gold .hq-section-icon{color:#997316;background:#fbf3d9}.hq-section-title h3{margin:0;color:#173f32;font-size:11px}.hq-section-title p{margin:1px 0 0;color:#94a09a;font-size:7px}.hq-form-grid{display:grid;grid-template-columns:1fr 1fr;gap:9px}.hq-field label{display:flex;align-items:center;gap:2px;margin-bottom:4px;color:#445a51;font-size:8px;font-weight:900}.hq-field label b{color:#b38a22}
        .hq-modal-footer{position:sticky;bottom:0;display:flex;align-items:center;justify-content:space-between;gap:10px;padding:9px 18px;background:rgba(255,255,255,.97);border-top:1px solid #e4ebe7;backdrop-filter:blur(8px)}.hq-save-note{display:flex;align-items:center;gap:4px;color:#7c8983;font-size:7px}.hq-save-note svg{color:#ad8520}.hq-modal-actions{display:flex;gap:6px}.hq-cancel,.hq-save{min-height:36px;padding:0 14px;border-radius:10px;font:900 9px inherit;cursor:pointer}.hq-cancel{border:1px solid #dce4df;background:#fff;color:#5e6d66}.hq-save{border:0;background:linear-gradient(135deg,#087158,#075846);color:#fff;display:flex;align-items:center;gap:5px;box-shadow:0 8px 18px rgba(8,113,88,.18)}
        .spin{animation:hqSpin .8s linear infinite}@keyframes hqSpin{to{transform:rotate(360deg)}}

        @media(max-width:1180px){.hq-stats{grid-template-columns:repeat(3,minmax(0,1fr))}.hq-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
        @media(max-width:820px){
          .hq-page{padding:14px 11px 30px}.hq-hero-main{align-items:flex-start;flex-direction:column;padding:19px}.hq-hero-actions{width:100%}.hq-create{flex:1}.hq-stats{grid-template-columns:repeat(2,minmax(0,1fr))}.hq-filters{grid-template-columns:1fr 1fr}.hq-search{grid-column:1/-1}.hq-grid{grid-template-columns:1fr}.hq-modal-backdrop{padding:86px 17px 17px}.hq-modal{width:min(620px,calc(100vw - 34px));max-height:calc(100dvh - 110px)}
        }
        @media(max-width:520px){
          .hq-page{padding:9px 7px 22px}.hq-hero{border-radius:19px}.hq-hero-main{padding:15px 13px 13px;gap:13px}.hq-kicker{font-size:8px}.hq-title-line{gap:7px}.hq-back,.hq-title-icon{width:35px;height:35px;flex-basis:35px;border-radius:10px}.hq-title-line h1{font-size:20px}.hq-title-line p{font-size:8px;line-height:1.6}.hq-hero-actions{display:grid;grid-template-columns:78px 1fr}.hq-refresh{justify-content:center;padding:0 6px;min-height:44px;font-size:9px}.hq-create{min-width:0;min-height:44px;padding:5px 7px}.hq-create-icon{width:32px;height:32px}.hq-create strong{font-size:10px}.hq-create small{font-size:6px}
          .hq-hero-strip>div{padding:8px 5px}.hq-hero-strip span{font-size:6px}.hq-hero-strip strong{font-size:14px}.hq-hero-strip small{display:none}
          .hq-stats{gap:5px;margin-bottom:9px}.hq-stat{min-height:66px;padding:8px 9px;border-radius:12px}.hq-stat-icon{width:26px;height:26px;border-radius:8px}.hq-stat span{font-size:7px}.hq-stat strong{margin-top:3px;font-size:16px}.hq-stat small{font-size:6px;margin-top:2px}
          .hq-command{padding:12px;border-radius:16px}.hq-command-head{gap:7px}.hq-command h2{font-size:13px}.hq-command p{font-size:7px;line-height:1.5}.hq-score{min-width:70px;padding:6px}.hq-score span{font-size:6px}.hq-score strong{font-size:15px}.hq-insights{gap:4px}.hq-insight{padding:6px;gap:4px}.hq-insight-icon{width:23px;height:23px;border-radius:7px}.hq-insight-copy span{font-size:6px}.hq-insight-copy small{display:none}.hq-insight strong{font-size:12px}
          .hq-filter-box{padding:8px;border-radius:14px}.hq-filters{grid-template-columns:1fr;gap:6px}.hq-search{grid-column:auto}.hq-filters input,.hq-filters select{height:38px;font-size:9px}
          .hq-card{padding:11px;border-radius:15px}.hq-card-icon{width:35px;height:35px;flex-basis:35px}.hq-card h3{font-size:11px}.hq-card-metrics{gap:4px}.hq-metric{padding:6px}.hq-quick button{min-height:31px}.hq-actions button{min-height:30px}
          .hq-modal-backdrop{align-items:center;justify-content:center;padding:78px max(11px,env(safe-area-inset-right)) max(11px,env(safe-area-inset-bottom)) max(11px,env(safe-area-inset-left))}
          .hq-modal{width:calc(100vw - 26px);max-width:425px;max-height:calc(100dvh - 100px);border-radius:17px}.hq-modal-hero{padding:14px 13px 12px}.hq-modal-title{padding-left:35px;gap:7px}.hq-modal-icon{width:35px;height:35px;flex-basis:35px}.hq-modal-title h2{font-size:15px}.hq-modal-title p{font-size:6px}.hq-steps{padding-right:42px;overflow-x:auto;flex-wrap:nowrap;scrollbar-width:none}.hq-steps::-webkit-scrollbar{display:none}.hq-steps span{flex:0 0 auto;white-space:nowrap}
          .hq-modal-body{padding:12px 13px}.hq-form-grid{grid-template-columns:1fr;gap:7px}.hq-modal input,.hq-modal select{height:39px}.hq-modal-footer{padding:8px 13px max(8px,env(safe-area-inset-bottom))}.hq-save-note{display:none}.hq-modal-actions{width:100%;display:grid;grid-template-columns:.7fr 1.4fr}.hq-cancel,.hq-save{width:100%;justify-content:center}
        }
        @media(max-width:370px){.hq-command .hq-insights{grid-template-columns:1fr}.hq-modal-backdrop{padding:72px 7px 7px}.hq-modal{width:calc(100vw - 14px);max-height:calc(100dvh - 86px)}}
      `}</style>
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
  const isActive = halaqa.status === "active";
  const capacity = Number(halaqa.capacity || 0);
  const occupancy =
    capacity > 0 ? Math.min(Math.round((studentCount / capacity) * 100), 100) : 0;
  const needsTeacher = !halaqa.main_teacher_id;
  const nearlyFull = capacity > 0 && occupancy >= 85;

  return (
    <article className="hq-card">
      <div className="hq-card-head">
        <div className="hq-card-id">
          <div className="hq-card-icon"><BookOpen size={20} /></div>
          <div style={{ minWidth: 0 }}>
            <h3 title={halaqa.name}>{halaqa.name}</h3>
            <div className="hq-mosque"><Building2 size={11} />{mosqueName}</div>
          </div>
        </div>
        <span className={`hq-status ${isActive ? "active" : "inactive"}`}>
          {isActive ? <CheckCircle2 size={10} /> : <CircleOff size={10} />}
          {isActive ? "نشطة" : "غير نشطة"}
        </span>
      </div>

      <div className="hq-card-metrics">
        <div className="hq-metric"><span>الطلاب</span><strong>{studentCount}</strong></div>
        <div className="hq-metric"><span>المعلمون</span><strong>{teacherCount}</strong></div>
        <div className="hq-metric"><span>السعة</span><strong>{capacity || "—"}</strong></div>
      </div>

      <div className="hq-occupancy">
        <div className="hq-occ-head">
          <span>إشغال الحلقة</span>
          <strong>{studentCount} / {capacity || 0} · {occupancy}%</strong>
        </div>
        <div className="hq-progress">
          <div
            style={{
              width: `${occupancy}%`,
              background: occupancy >= 95 ? "#b94739" : occupancy >= 85 ? "#bd8e20" : "#168064",
            }}
          />
        </div>
      </div>

      {(needsTeacher || nearlyFull) && (
        <div className="hq-card-alert">
          <AlertTriangle size={12} />
          {needsTeacher ? "الحلقة تحتاج تعيين معلم رئيسي" : "الحلقة قريبة من بلوغ السعة"}
        </div>
      )}

      <div className="hq-quick">
        <button type="button" onClick={() => onStudents(halaqa.id)}>
          <Users size={13} /> الطلاب <ChevronLeft size={11} />
        </button>
        <button type="button" onClick={() => onTeachers(halaqa.id)}>
          <GraduationCap size={13} /> المعلمون <ChevronLeft size={11} />
        </button>
      </div>

      <div className="hq-actions">
        <button type="button" className="edit" onClick={() => onEdit(halaqa)} disabled={loading}>
          <Pencil size={12} /> تعديل
        </button>
        <button type="button" onClick={() => onToggleStatus(halaqa)} disabled={loading}>
          <Power size={12} /> {isActive ? "تعطيل" : "تفعيل"}
        </button>
        <button type="button" className="danger" onClick={() => onDelete(halaqa)} disabled={loading}>
          <Trash2 size={12} /> حذف
        </button>
      </div>
    </article>
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

function StatCard({ icon, title, value, note }) {
  return (
    <div className="hq-stat">
      <div className="hq-stat-top">
        <span>{title}</span>
        <div className="hq-stat-icon">{icon}</div>
      </div>
      <strong>{value}</strong>
      <small>{note}</small>
    </div>
  );
}

function Insight({ icon, label, value, hint }) {
  return (
    <div className="hq-insight">
      <div className="hq-insight-icon">{icon}</div>
      <div className="hq-insight-copy">
        <span>{label}</span>
        <small>{hint}</small>
      </div>
      <strong>{value}</strong>
    </div>
  );
}

function FormSection({ icon, title, subtitle, gold = false, children }) {
  return (
    <section className={`hq-form-section ${gold ? "gold" : ""}`}>
      <div className="hq-section-title">
        <div className="hq-section-icon">{icon}</div>
        <div>
          <h3>{title}</h3>
          <p>{subtitle}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

function Field({ label, required = false, children }) {
  return (
    <div className="hq-field">
      <label>{label}{required && <b>*</b>}</label>
      {children}
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
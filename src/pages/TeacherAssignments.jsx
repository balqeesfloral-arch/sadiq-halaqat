import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useToast } from "../components/Toast";

import {
  Users,
  BookOpen,
  UserRound,
  Plus,
  Trash2,
  ArrowRight,
  Search,
  RefreshCw,
  Link2,
  CheckCircle2,
  X,
  ShieldCheck,
} from "lucide-react";

export default function TeacherAssignments() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [teachers, setTeachers] = useState([]);
  const [halaqat, setHalaqat] = useState([]);
  const [assignments, setAssignments] = useState([]);

  const [teacherId, setTeacherId] = useState("");
  const [halaqaId, setHalaqaId] = useState("");
  const [assignmentRole, setAssignmentRole] =
    useState("main");

  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  // ==========================================
  // تحميل البيانات
  // ==========================================

  async function loadData() {
    setLoading(true);

    try {
      const [
        teachersResult,
        halaqatResult,
        assignmentsResult,
      ] = await Promise.all([
        supabase
          .from("profiles")
          .select(
            "id, full_name, user_number, phone, status"
          )
          .eq("role", "teacher")
          .order("full_name"),

        supabase
          .from("halaqat")
          .select("id, name, mosque_id")
          .order("name"),

        supabase
          .from("teacher_halaqat")
          .select(
            "id, teacher_id, halaqa_id, role, created_at"
          )
          .order("id", {
            ascending: false,
          }),
      ]);

      if (teachersResult.error) {
        throw new Error(
          `تعذر تحميل المعلمين: ${teachersResult.error.message}`
        );
      }

      if (halaqatResult.error) {
        throw new Error(
          `تعذر تحميل الحلقات: ${halaqatResult.error.message}`
        );
      }

      if (assignmentsResult.error) {
        throw new Error(
          `تعذر تحميل روابط المعلمين: ${assignmentsResult.error.message}`
        );
      }

      setTeachers(
        teachersResult.data || []
      );

      setHalaqat(
        halaqatResult.data || []
      );

      setAssignments(
        assignmentsResult.data || []
      );
    } catch (error) {
      console.error(error);

      showToast(
        error.message ||
          "حدث خطأ أثناء تحميل البيانات",
        "error"
      );
    } finally {
      setLoading(false);
    }
  }

  // ==========================================
  // ربط المعلم
  // ==========================================

  async function assignTeacher() {
    if (!teacherId) {
      showToast(
        "اختر المعلم أولًا",
        "error"
      );
      return;
    }

    if (!halaqaId) {
      showToast(
        "اختر الحلقة أولًا",
        "error"
      );
      return;
    }

    const teacherNumber =
      Number(teacherId);

    const halaqaNumber =
      Number(halaqaId);

    // منع الربط المكرر
    const alreadyAssigned =
      assignments.some(
        (item) =>
          Number(item.teacher_id) ===
            teacherNumber &&
          Number(item.halaqa_id) ===
            halaqaNumber
      );

    if (alreadyAssigned) {
      showToast(
        "هذا المعلم مرتبط بهذه الحلقة بالفعل",
        "info"
      );
      return;
    }

    setSaving(true);

    try {
      const { error } =
        await supabase
          .from("teacher_halaqat")
          .insert([
            {
              teacher_id:
                teacherNumber,

              halaqa_id:
                halaqaNumber,

              role:
                assignmentRole,
            },
          ]);

      if (error) {
        throw error;
      }

      const teacher =
        teachers.find(
          (item) =>
            Number(item.id) ===
            teacherNumber
        );

      const halaqa =
        halaqat.find(
          (item) =>
            Number(item.id) ===
            halaqaNumber
        );

      showToast(
        `تم ربط ${teacher?.full_name || "المعلم"} بحلقة ${halaqa?.name || ""}`,
        "success"
      );

      setTeacherId("");
      setHalaqaId("");
      setAssignmentRole("main");

      await loadData();
    } catch (error) {
      console.error(error);

      showToast(
        error.message ||
          "تعذر ربط المعلم بالحلقة",
        "error"
      );
    } finally {
      setSaving(false);
    }
  }

  // ==========================================
  // حذف الربط
  // ==========================================

  async function deleteAssignment(
    assignment
  ) {
    const teacher =
      teachers.find(
        (item) =>
          Number(item.id) ===
          Number(
            assignment.teacher_id
          )
      );

    const halaqa =
      halaqat.find(
        (item) =>
          Number(item.id) ===
          Number(
            assignment.halaqa_id
          )
      );

    const confirmed =
      window.confirm(
        `هل تريد حذف ربط المعلم "${teacher?.full_name || ""}" بحلقة "${halaqa?.name || ""}"؟`
      );

    if (!confirmed) return;

    setDeletingId(
      assignment.id
    );

    try {
      const { error } =
        await supabase
          .from("teacher_halaqat")
          .delete()
          .eq(
            "id",
            assignment.id
          );

      if (error) {
        throw error;
      }

      showToast(
        "تم حذف الربط بنجاح",
        "success"
      );

      await loadData();
    } catch (error) {
      console.error(error);

      showToast(
        error.message ||
          "تعذر حذف الربط",
        "error"
      );
    } finally {
      setDeletingId(null);
    }
  }

  // ==========================================
  // أسماء
  // ==========================================

  function teacherName(id) {
    return (
      teachers.find(
        (teacher) =>
          Number(teacher.id) ===
          Number(id)
      )?.full_name ||
      "معلم غير معروف"
    );
  }

  function teacherNumber(id) {
    return (
      teachers.find(
        (teacher) =>
          Number(teacher.id) ===
          Number(id)
      )?.user_number || ""
    );
  }

  function halaqaName(id) {
    return (
      halaqat.find(
        (halaqa) =>
          Number(halaqa.id) ===
          Number(id)
      )?.name ||
      "حلقة غير معروفة"
    );
  }

  // ==========================================
  // فلترة البحث
  // ==========================================

  const filteredAssignments =
    useMemo(() => {
      const text =
        search
          .trim()
          .toLowerCase();

      if (!text) {
        return assignments;
      }

      return assignments.filter(
        (assignment) => {
          const teacher =
            teacherName(
              assignment.teacher_id
            ).toLowerCase();

          const halaqa =
            halaqaName(
              assignment.halaqa_id
            ).toLowerCase();

          const number =
            teacherNumber(
              assignment.teacher_id
            ).toLowerCase();

          return (
            teacher.includes(text) ||
            halaqa.includes(text) ||
            number.includes(text)
          );
        }
      );
    }, [
      assignments,
      teachers,
      halaqat,
      search,
    ]);

  // ==========================================
  // إحصائيات
  // ==========================================

  const totalTeachers =
    teachers.length;

  const totalHalaqat =
    halaqat.length;

  const totalAssignments =
    assignments.length;

  const mainAssignments =
    assignments.filter(
      (item) =>
        item.role === "main"
    ).length;

  // ==========================================
  // العرض
  // ==========================================

  return (
    <div
      dir="rtl"
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(135deg,#f7f5ef 0%,#eef5f0 50%,#f8f6f0 100%)",
        padding: "28px",
        boxSizing: "border-box",
        color: "#26332c",
      }}
    >
      {/* ================================= */}
      {/* HEADER */}
      {/* ================================= */}

      <header
        style={{
          maxWidth: "1250px",
          margin: "0 auto 25px",
          display: "flex",
          justifyContent:
            "space-between",
          alignItems: "center",
          gap: "15px",
          flexWrap: "wrap",
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
            style={iconButton}
            title="العودة للوحة المشرف"
          >
            <ArrowRight
              size={20}
            />
          </button>

          <div
            style={{
              width: "50px",
              height: "50px",
              borderRadius: "15px",
              background: "#0f5132",
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent:
                "center",
              boxShadow:
                "0 8px 20px rgba(15,81,50,.15)",
            }}
          >
            <Link2
              size={25}
              strokeWidth={1.8}
            />
          </div>

          <div>
            <h1
              style={{
                margin: 0,
                color: "#173d2b",
                fontSize: "29px",
                fontWeight: "850",
              }}
            >
              ربط المعلمين بالحلقات
            </h1>

            <p
              style={{
                margin:
                  "5px 0 0",
                color: "#7b847e",
                fontSize: "13px",
              }}
            >
              إدارة توزيع المعلمين على الحلقات
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={loadData}
          disabled={loading}
          style={{
            ...secondaryButton,
            opacity:
              loading ? 0.6 : 1,
          }}
        >
          <RefreshCw
            size={16}
            className={
              loading
                ? "spin"
                : ""
            }
          />

          تحديث البيانات
        </button>
      </header>

      <main
        style={{
          maxWidth: "1250px",
          margin: "0 auto",
        }}
      >
        {/* ================================= */}
        {/* STATS */}
        {/* ================================= */}

        <section
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit,minmax(210px,1fr))",
            gap: "14px",
            marginBottom: "22px",
          }}
        >
          <StatCard
            icon={<Users size={22} />}
            title="المعلمون"
            value={totalTeachers}
          />

          <StatCard
            icon={
              <BookOpen size={22} />
            }
            title="الحلقات"
            value={totalHalaqat}
          />

          <StatCard
            icon={
              <Link2 size={22} />
            }
            title="إجمالي الروابط"
            value={
              totalAssignments
            }
          />

          <StatCard
            icon={
              <ShieldCheck
                size={22}
              />
            }
            title="المعلمون الأساسيون"
            value={mainAssignments}
          />
        </section>

        {/* ================================= */}
        {/* ADD */}
        {/* ================================= */}

        <section
          style={{
            ...cardStyle,
            marginBottom: "22px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              marginBottom: "18px",
            }}
          >
            <div
              style={sectionIcon}
            >
              <Plus size={19} />
            </div>

            <div>
              <h2
                style={{
                  margin: 0,
                  color: "#173d2b",
                  fontSize: "19px",
                }}
              >
                إضافة ربط جديد
              </h2>

              <p
                style={{
                  margin:
                    "4px 0 0",
                  color: "#89918b",
                  fontSize: "12px",
                }}
              >
                اختر المعلم والحلقة وحدد نوع التكليف
              </p>
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit,minmax(230px,1fr))",
              gap: "13px",
            }}
          >
            {/* المعلم */}

            <SelectField
              label="المعلم"
              icon={
                <UserRound
                  size={17}
                />
              }
              value={teacherId}
              onChange={
                setTeacherId
              }
            >
              <option value="">
                اختر المعلم
              </option>

              {teachers.map(
                (teacher) => (
                  <option
                    key={
                      teacher.id
                    }
                    value={
                      teacher.id
                    }
                  >
                    {teacher.full_name}
                    {teacher.user_number
                      ? ` — ${teacher.user_number}`
                      : ""}
                  </option>
                )
              )}
            </SelectField>

            {/* الحلقة */}

            <SelectField
              label="الحلقة"
              icon={
                <BookOpen
                  size={17}
                />
              }
              value={halaqaId}
              onChange={
                setHalaqaId
              }
            >
              <option value="">
                اختر الحلقة
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
            </SelectField>

            {/* النوع */}

            <SelectField
              label="نوع التكليف"
              icon={
                <ShieldCheck
                  size={17}
                />
              }
              value={
                assignmentRole
              }
              onChange={
                setAssignmentRole
              }
            >
              <option value="main">
                معلم أساسي
              </option>

              <option value="assistant">
                معلم مساعد
              </option>
            </SelectField>
          </div>

          <button
            type="button"
            onClick={
              assignTeacher
            }
            disabled={saving}
            style={{
              marginTop: "17px",
              width: "100%",
              minHeight: "48px",
              border: "none",
              borderRadius: "11px",
              background:
                saving
                  ? "#6d8d7c"
                  : "#0f5132",
              color: "#fff",
              cursor:
                saving
                  ? "wait"
                  : "pointer",
              fontSize: "14px",
              fontWeight: "800",
              display: "flex",
              alignItems:
                "center",
              justifyContent:
                "center",
              gap: "8px",
              boxShadow:
                "0 8px 20px rgba(15,81,50,.13)",
            }}
          >
            <Plus size={18} />

            {saving
              ? "جارٍ إنشاء الربط..."
              : "ربط المعلم بالحَلقة"}
          </button>
        </section>

        {/* ================================= */}
        {/* SEARCH */}
        {/* ================================= */}

        <section
          style={{
            ...cardStyle,
            marginBottom: "20px",
          }}
        >
          <div
            style={{
              position: "relative",
            }}
          >
            <Search
              size={18}
              style={{
                position:
                  "absolute",
                right: "14px",
                top: "50%",
                transform:
                  "translateY(-50%)",
                color: "#89918b",
              }}
            />

            <input
              value={search}
              onChange={(e) =>
                setSearch(
                  e.target.value
                )
              }
              placeholder="ابحث باسم المعلم أو رقمه أو الحلقة..."
              style={{
                ...inputStyle,
                paddingRight:
                  "43px",
                paddingLeft:
                  search
                    ? "45px"
                    : "12px",
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
                  color: "#707872",
                  cursor:
                    "pointer",
                  display: "flex",
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
        </section>

        {/* ================================= */}
        {/* LIST HEADER */}
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
              }}
            >
              الروابط الحالية
            </h2>

            <p
              style={{
                margin:
                  "4px 0 0",
                color: "#8a918c",
                fontSize: "11px",
              }}
            >
              عرض{" "}
              {
                filteredAssignments.length
              }{" "}
              من{" "}
              {
                assignments.length
              }{" "}
              ربط
            </p>
          </div>
        </div>

        {/* ================================= */}
        {/* LOADING */}
        {/* ================================= */}

        {loading ? (
          <LoadingState />
        ) : filteredAssignments.length ===
          0 ? (
          <EmptyState
            search={search}
            onClear={() =>
              setSearch("")
            }
          />
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit,minmax(300px,1fr))",
              gap: "16px",
            }}
          >
            {filteredAssignments.map(
              (assignment) => (
                <AssignmentCard
                  key={
                    assignment.id
                  }
                  assignment={
                    assignment
                  }
                  teacherName={
                    teacherName(
                      assignment.teacher_id
                    )
                  }
                  teacherNumber={
                    teacherNumber(
                      assignment.teacher_id
                    )
                  }
                  halaqaName={
                    halaqaName(
                      assignment.halaqa_id
                    )
                  }
                  deleting={
                    deletingId ===
                    assignment.id
                  }
                  onDelete={() =>
                    deleteAssignment(
                      assignment
                    )
                  }
                />
              )
            )}
          </div>
        )}
      </main>
    </div>
  );
}

// ==========================================
// بطاقة إحصائية
// ==========================================

function StatCard({
  icon,
  title,
  value,
}) {
  return (
    <div
      style={{
        ...cardStyle,
        marginBottom: 0,
        display: "flex",
        alignItems: "center",
        gap: "13px",
        padding: "18px",
      }}
    >
      <div
        style={{
          width: "46px",
          height: "46px",
          borderRadius: "13px",
          background: "#edf5ef",
          color: "#0f5132",
          display: "flex",
          alignItems:
            "center",
          justifyContent:
            "center",
          flexShrink: 0,
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
            fontWeight: "850",
          }}
        >
          {value}
        </div>
      </div>
    </div>
  );
}

// ==========================================
// بطاقة الربط
// ==========================================

function AssignmentCard({
  assignment,
  teacherName,
  teacherNumber,
  halaqaName,
  deleting,
  onDelete,
}) {
  const isMain =
    assignment.role === "main";

  return (
    <div
      style={{
        background: "#fff",
        borderRadius: "18px",
        border:
          "1px solid #e3e8e4",
        padding: "18px",
        boxShadow:
          "0 5px 18px rgba(0,0,0,.045)",
      }}
    >
      {/* المعلم */}

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          marginBottom: "17px",
        }}
      >
        <div
          style={{
            width: "50px",
            height: "50px",
            borderRadius: "15px",
            background:
              "linear-gradient(145deg,#edf5ef,#e2eee6)",
            color: "#0f5132",
            display: "flex",
            alignItems:
              "center",
            justifyContent:
              "center",
          }}
        >
          <UserRound
            size={25}
            strokeWidth={1.7}
          />
        </div>

        <div
          style={{
            minWidth: 0,
            flex: 1,
          }}
        >
          <h3
            style={{
              margin: 0,
              color: "#173d2b",
              fontSize: "16px",
              fontWeight: "800",
              whiteSpace:
                "nowrap",
              overflow:
                "hidden",
              textOverflow:
                "ellipsis",
            }}
          >
            {teacherName}
          </h3>

          {teacherNumber && (
            <div
              style={{
                marginTop: "4px",
                color: "#8b938d",
                fontSize: "11px",
              }}
            >
              رقم المعلم:{" "}
              {teacherNumber}
            </div>
          )}
        </div>

        <span
          style={{
            flexShrink: 0,
            padding:
              "5px 9px",
            borderRadius:
              "20px",
            background:
              isMain
                ? "#e8f6ed"
                : "#f2f3f3",
            color:
              isMain
                ? "#0f5132"
                : "#666",
            fontSize: "10px",
            fontWeight: "800",
          }}
        >
          {isMain
            ? "أساسي"
            : "مساعد"}
        </span>
      </div>

      {/* الخط */}

      <div
        style={{
          height: "1px",
          background: "#eef0ee",
          marginBottom: "15px",
        }}
      />

      {/* الحلقة */}

      <div
        style={{
          background: "#fafbf9",
          border:
            "1px solid #edf0ed",
          borderRadius: "13px",
          padding: "13px",
          marginBottom: "15px",
          display: "flex",
          alignItems:
            "center",
          gap: "10px",
        }}
      >
        <div
          style={{
            width: "38px",
            height: "38px",
            borderRadius: "11px",
            background: "#eef5f0",
            color: "#0f5132",
            display: "flex",
            alignItems:
              "center",
            justifyContent:
              "center",
            flexShrink: 0,
          }}
        >
          <BookOpen
            size={19}
          />
        </div>

        <div
          style={{
            minWidth: 0,
          }}
        >
          <div
            style={{
              color: "#929a94",
              fontSize: "10px",
              marginBottom:
                "3px",
            }}
          >
            الحلقة
          </div>

          <div
            style={{
              color: "#26332c",
              fontSize: "14px",
              fontWeight: "800",
            }}
          >
            {halaqaName}
          </div>
        </div>
      </div>

      {/* التاريخ */}

      {assignment.created_at && (
        <div
          style={{
            color: "#929993",
            fontSize: "10px",
            marginBottom: "14px",
          }}
        >
          تم إنشاء الربط:{" "}
          {formatDate(
            assignment.created_at
          )}
        </div>
      )}

      {/* حذف */}

      <button
        type="button"
        onClick={onDelete}
        disabled={deleting}
        style={{
          width: "100%",
          border:
            "1px solid #f0d6d3",
          background:
            deleting
              ? "#faf0ef"
              : "#fff8f7",
          color: "#b42318",
          borderRadius: "10px",
          minHeight: "42px",
          cursor:
            deleting
              ? "wait"
              : "pointer",
          display: "flex",
          alignItems:
            "center",
          justifyContent:
            "center",
          gap: "7px",
          fontWeight: "800",
          fontSize: "12px",
        }}
      >
        <Trash2 size={16} />

        {deleting
          ? "جارٍ الحذف..."
          : "إزالة الربط"}
      </button>
    </div>
  );
}

// ==========================================
// Select
// ==========================================

function SelectField({
  label,
  icon,
  value,
  onChange,
  children,
}) {
  return (
    <div>
      <label
        style={{
          display: "block",
          marginBottom: "7px",
          color: "#465149",
          fontSize: "12px",
          fontWeight: "800",
        }}
      >
        {label}
      </label>

      <div
        style={{
          position: "relative",
        }}
      >
        <span
          style={{
            position: "absolute",
            right: "12px",
            top: "50%",
            transform:
              "translateY(-50%)",
            color: "#718078",
            pointerEvents:
              "none",
          }}
        >
          {icon}
        </span>

        <select
          value={value}
          onChange={(e) =>
            onChange(
              e.target.value
            )
          }
          style={{
            ...inputStyle,
            paddingRight:
              "40px",
            cursor:
              "pointer",
          }}
        >
          {children}
        </select>
      </div>
    </div>
  );
}

// ==========================================
// Empty
// ==========================================

function EmptyState({
  search,
  onClear,
}) {
  return (
    <div
      style={{
        ...cardStyle,
        padding: "55px 20px",
        textAlign: "center",
      }}
    >
      <div
        style={{
          width: "65px",
          height: "65px",
          margin:
            "0 auto 15px",
          borderRadius: "18px",
          background: "#edf5ef",
          color: "#0f5132",
          display: "flex",
          alignItems:
            "center",
          justifyContent:
            "center",
        }}
      >
        {search ? (
          <Search size={27} />
        ) : (
          <Link2 size={27} />
        )}
      </div>

      <h3
        style={{
          margin:
            "0 0 7px",
          color: "#354139",
          fontSize: "17px",
        }}
      >
        {search
          ? "لا توجد نتائج"
          : "لا توجد روابط حتى الآن"}
      </h3>

      <p
        style={{
          margin: 0,
          color: "#929993",
          fontSize: "12px",
        }}
      >
        {search
          ? "لم نجد رابطًا مطابقًا للبحث."
          : "ابدأ بربط أول معلم بحلقة."}
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
            borderRadius: "9px",
            padding:
              "9px 17px",
            cursor: "pointer",
            fontSize: "12px",
            fontWeight: "700",
          }}
        >
          مسح البحث
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
        ...cardStyle,
        padding: "55px 20px",
        textAlign: "center",
        color: "#7f8781",
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
          borderRadius: "50%",
          animation:
            "spin .8s linear infinite",
        }}
      />

      جاري تحميل البيانات...
    </div>
  );
}

// ==========================================
// Date
// ==========================================

function formatDate(date) {
  try {
    return new Intl.DateTimeFormat(
      "ar-SA",
      {
        year: "numeric",
        month: "long",
        day: "numeric",
      }
    ).format(new Date(date));
  } catch {
    return "";
  }
}

// ==========================================
// Styles
// ==========================================

const cardStyle = {
  background: "#fff",
  border:
    "1px solid #e4e8e4",
  borderRadius: "18px",
  padding: "20px",
  boxShadow:
    "0 5px 18px rgba(0,0,0,.04)",
};

const inputStyle = {
  width: "100%",
  minHeight: "48px",
  padding: "0 12px",
  border:
    "1px solid #d8ded9",
  borderRadius: "11px",
  outline: "none",
  background: "#fff",
  color: "#26332c",
  fontSize: "13px",
  boxSizing: "border-box",
  direction: "rtl",
};

const iconButton = {
  width: "43px",
  height: "43px",
  border:
    "1px solid #dce1dd",
  background: "#fff",
  color: "#173d2b",
  borderRadius: "11px",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const secondaryButton = {
  border:
    "1px solid #d9dfdb",
  background: "#fff",
  color: "#173d2b",
  borderRadius: "10px",
  padding:
    "10px 14px",
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  gap: "7px",
  fontSize: "12px",
  fontWeight: "700",
};

const sectionIcon = {
  width: "40px",
  height: "40px",
  borderRadius: "11px",
  background: "#edf5ef",
  color: "#0f5132",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};
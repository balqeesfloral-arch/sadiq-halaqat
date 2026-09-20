import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useToast } from "../components/Toast";

import {
  Building2,
  MapPin,
  Plus,
  Search,
  Pencil,
  Trash2,
  ArrowRight,
  MapPinned,
  Landmark,
  X,
  Save,
  RefreshCw,
  Loader2,
} from "lucide-react";

export default function Mosques() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [mosques, setMosques] = useState([]);

  const [name, setName] = useState("");
  const [address, setAddress] = useState("");

  const [search, setSearch] = useState("");

  const [editingId, setEditingId] = useState(null);

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadMosques();
  }, []);

  // ==========================================
  // تحميل المساجد
  // ==========================================

  async function loadMosques(options = {}) {
    const silent = options.silent === true;

    if (!silent) {
      setInitialLoading(true);
    }

const { data, error } = await supabase
  .from("mosques")
  .select(`
    *,
    halaqat (
      id,
      name,
      status
    )
  `)
  .order("name", {
    foreignTable: "halaqat",
    ascending: true,
  })
  .order("id", { ascending: true });

    if (error) {
      console.error("loadMosques:", error);

      showToast(
        `تعذر تحميل المساجد: ${error.message}`,
        "error"
      );

      setInitialLoading(false);
      return false;
    }

    setMosques(data || []);
    setInitialLoading(false);

    return true;
  }

  // ==========================================
  // تحديث البيانات
  // ==========================================

  async function refreshMosques() {
    if (refreshing) return;

    setRefreshing(true);

    const success = await loadMosques({
      silent: true,
    });

    if (success) {
      showToast("تم تحديث قائمة المساجد", "success");
    }

    setRefreshing(false);
  }

  // ==========================================
  // إضافة / تعديل مسجد
  // ==========================================

  async function saveMosque() {
    const cleanName = name.trim();
    const cleanAddress = address.trim();

    if (!cleanName) {
      showToast("أدخل اسم المسجد أولًا", "error");
      return;
    }

    // منع التكرار محليًا قبل الإرسال
    const duplicate = mosques.some(
      (mosque) =>
        String(mosque.name || "")
          .trim()
          .toLowerCase() ===
          cleanName.toLowerCase() &&
        Number(mosque.id) !== Number(editingId)
    );

    if (duplicate) {
      showToast(
        "يوجد مسجد مسجل بنفس الاسم بالفعل",
        "error"
      );
      return;
    }

    setLoading(true);

    try {
      // ========================================
      // تعديل
      // ========================================

      if (editingId !== null) {
        const { error } = await supabase
          .from("mosques")
          .update({
            name: cleanName,
            address: cleanAddress || null,
          })
          .eq("id", editingId);

        if (error) {
          console.error("update mosque:", error);

          showToast(
            `تعذر تعديل المسجد: ${error.message}`,
            "error"
          );

          return;
        }

        showToast(
          "تم تعديل بيانات المسجد بنجاح",
          "success"
        );
      }

      // ========================================
      // إضافة
      // ========================================

      else {
        const { error } = await supabase
          .from("mosques")
          .insert([
            {
              name: cleanName,
              address: cleanAddress || null,
            },
          ]);

        if (error) {
          console.error("insert mosque:", error);

          showToast(
            `تعذر إضافة المسجد: ${error.message}`,
            "error"
          );

          return;
        }

        showToast(
          "تمت إضافة المسجد بنجاح",
          "success"
        );
      }

      clearForm();

      await loadMosques({
        silent: true,
      });
    } catch (error) {
      console.error("saveMosque:", error);

      showToast(
        "حدث خطأ غير متوقع أثناء حفظ البيانات",
        "error"
      );
    } finally {
      setLoading(false);
    }
  }

  // ==========================================
  // تعديل مسجد
  // ==========================================

  function editMosque(mosque) {
    setEditingId(mosque.id);

    setName(mosque.name || "");
    setAddress(mosque.address || "");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });

    showToast(
      `جارٍ تعديل بيانات ${mosque.name || "المسجد"}`,
      "info"
    );
  }

  // ==========================================
  // تنظيف النموذج
  // ==========================================

  function clearForm() {
    setEditingId(null);
    setName("");
    setAddress("");
  }

  // ==========================================
  // حذف مسجد
  // ==========================================

  async function deleteMosque(id) {
    const mosque = mosques.find(
      (item) => Number(item.id) === Number(id)
    );

    if (!mosque) {
      showToast("تعذر العثور على المسجد", "error");
      return;
    }

if (
  mosque.halaqat &&
  mosque.halaqat.length > 0
) {
  showToast(
    "لا يمكن حذف مسجد مرتبط بحلقات",
    "error"
  );

  return;
}

    const confirmed = window.confirm(
      `هل أنت متأكد من حذف مسجد "${mosque.name}"؟\n\nإذا كان المسجد مرتبطًا بحلقات، قد يمنع نظام قاعدة البيانات عملية الحذف.`
    );

    if (!confirmed) return;

    setLoading(true);

    try {
      const { error } = await supabase
        .from("mosques")
        .delete()
        .eq("id", id);

      if (error) {
        console.error("delete mosque:", error);

        showToast(
          `تعذر حذف المسجد: ${error.message}`,
          "error"
        );

        return;
      }

      if (
        editingId !== null &&
        Number(editingId) === Number(id)
      ) {
        clearForm();
      }

      showToast(
        `تم حذف مسجد ${mosque.name} بنجاح`,
        "success"
      );

      await loadMosques({
        silent: true,
      });
    } catch (error) {
      console.error("deleteMosque:", error);

      showToast(
        "حدث خطأ غير متوقع أثناء حذف المسجد",
        "error"
      );
    } finally {
      setLoading(false);
    }
  }

  // ==========================================
  // البحث
  // ==========================================

  const filteredMosques = useMemo(() => {
    const text = search.trim().toLowerCase();

    if (!text) {
      return mosques;
    }

    return mosques.filter((mosque) => {
      const mosqueName = String(
        mosque.name || ""
      ).toLowerCase();

      const mosqueAddress = String(
        mosque.address || ""
      ).toLowerCase();

      return (
        mosqueName.includes(text) ||
        mosqueAddress.includes(text) ||
        String(mosque.id).includes(text)
      );
    });
  }, [mosques, search]);

  // ==========================================
  // الإحصائيات
  // ==========================================

  const totalMosques = mosques.length;

const activeMosques =
  mosques.filter(
    (m) =>
      (m.halaqat || []).some(
        (h) => h.status === "active"
      )
  ).length;

const totalHalaqat =
  mosques.reduce(
    (sum, mosque) =>
      sum +
      (mosque.halaqat || [])
        .length,
    0
  );

  const mosquesWithAddress = mosques.filter(
    (mosque) =>
      String(mosque.address || "").trim()
        .length > 0
  ).length;

  const mosquesWithoutAddress =
    totalMosques - mosquesWithAddress;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f7f5ef",
        direction: "rtl",
        color: "#26332c",
        position: "relative",
        overflowX: "hidden",
        padding: "calc(25px * var(--app-density,1)) calc(30px * var(--app-density,1))",
        boxSizing: "border-box",
      }}
    >
      {/* ================================= */}
      {/* زخرفة الخلفية */}
      {/* ================================= */}

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
              var(--app-color-0f5132,#0f5132) 43%,
              var(--app-color-0f5132,#0f5132) 57%,
              transparent 58%
            ),
            linear-gradient(
              -45deg,
              transparent 42%,
              var(--app-color-0f5132,#0f5132) 43%,
              var(--app-color-0f5132,#0f5132) 57%,
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
        {/* رأس الصفحة */}
        {/* ================================= */}

        <header
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "calc(15px * var(--app-density,1))",
            flexWrap: "wrap",
            marginBottom: "25px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "calc(13px * var(--app-density,1))",
            }}
          >
            <button
              type="button"
              onClick={() => navigate("/admin")}
              style={backButtonStyle}
              title="العودة للوحة المشرف"
            >
              <ArrowRight
                size={20}
                strokeWidth={1.8}
              />
            </button>

            <div style={pageIconStyle}>
              <Building2
                size={25}
                strokeWidth={1.7}
              />
            </div>

            <div>
              <h1 style={pageTitleStyle}>
                إدارة المساجد
              </h1>

              <p style={pageSubtitleStyle}>
                إدارة المساجد المسجلة ومواقعها
                وبياناتها الأساسية
              </p>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "calc(9px * var(--app-density,1))",
              flexWrap: "wrap",
            }}
          >
            <button
              type="button"
              onClick={refreshMosques}
              disabled={refreshing || loading}
              style={{
                ...headerButtonStyle,
                opacity:
                  refreshing || loading
                    ? 0.65
                    : 1,
                cursor:
                  refreshing || loading
                    ? "wait"
                    : "pointer",
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
              <Landmark
                size={17}
                color="#0f5132"
                strokeWidth={1.8}
              />

              {totalMosques} مسجد مسجل
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
              "repeat(auto-fit, minmax(190px, 1fr))",
            gap: "calc(14px * var(--app-density,1))",
            marginBottom: "22px",
          }}
        >
          <StatCard
            icon={Building2}
            title="إجمالي المساجد"
            value={totalMosques}
          />

<StatCard
  icon={Landmark}
  title="مساجد نشطة"
  value={activeMosques}
/>

<StatCard
  icon={Building2}
  title="إجمالي الحلقات"
  value={totalHalaqat}
/>

          <StatCard
            icon={MapPinned}
            title="مساجد لها عنوان"
            value={mosquesWithAddress}
          />

          <StatCard
            icon={MapPin}
            title="بدون عنوان"
            value={mosquesWithoutAddress}
          />
        </section>

        {/* ================================= */}
        {/* نموذج الإضافة / التعديل */}
        {/* ================================= */}

        <section style={cardStyle}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "calc(10px * var(--app-density,1))",
              flexWrap: "wrap",
              marginBottom: "18px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "calc(10px * var(--app-density,1))",
              }}
            >
              <div style={formIconStyle}>
                {editingId !== null ? (
                  <Pencil
                    size={19}
                    strokeWidth={1.8}
                  />
                ) : (
                  <Plus
                    size={20}
                    strokeWidth={1.9}
                  />
                )}
              </div>

              <div>
                <h2 style={sectionTitleStyle}>
                  {editingId !== null
                    ? "تعديل بيانات المسجد"
                    : "إضافة مسجد جديد"}
                </h2>

                <p style={sectionSubtitleStyle}>
                  {editingId !== null
                    ? "حدّث بيانات المسجد ثم احفظ التغييرات"
                    : "أدخل بيانات المسجد الأساسية لإضافته للنظام"}
                </p>
              </div>
            </div>

            {editingId !== null && (
              <button
                type="button"
                onClick={clearForm}
                disabled={loading}
                style={{
                  ...cancelButtonStyle,
                  opacity: loading ? 0.6 : 1,
                }}
              >
                <X size={15} />
                إلغاء التعديل
              </button>
            )}
          </div>

          <form
            onSubmit={(event) => {
              event.preventDefault();
              saveMosque();
            }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(260px, 1fr))",
                gap: "calc(14px * var(--app-density,1))",
              }}
            >
              <FormField
                label="اسم المسجد"
                icon={Building2}
                placeholder="مثال: مسجد الصديق"
                value={name}
                onChange={setName}
                disabled={loading}
              />

              <FormField
                label="العنوان"
                icon={MapPin}
                placeholder="مثال: حي النور، شارع الملك..."
                value={address}
                onChange={setAddress}
                disabled={loading}
              />
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "calc(9px * var(--app-density,1))",
                flexWrap: "wrap",
                marginTop: "17px",
              }}
            >
              <button
  type="submit"
  disabled={loading}
  style={{
    background:
      "linear-gradient(135deg,var(--app-color-0f766e,#0F766E),#0B5E57)",
    color:"#fff",
    border:"none",
    height:"56px",
    padding:"0 calc(24px * var(--app-density,1))",
    borderRadius:"calc(18px * var(--app-radius-scale,1))",
    display:"flex",
    alignItems:"center",
    justifyContent:"center",
    gap:"calc(12px * var(--app-density,1))",
    fontSize:"calc(15px * var(--app-font-scale,1))",
    fontWeight:"800",
    cursor:
      loading ? "wait" : "pointer",
    boxShadow:
      "0 12px 30px color-mix(in srgb,var(--app-color-0f766e,#0f766e) 25%,transparent)",
    transition:"all .25s ease",
    opacity: loading ? .8 : 1
  }}
>
  <div
    style={{
      width:"34px",
      height:"34px",
      borderRadius:"calc(12px * var(--app-radius-scale,1))",
      background:"rgba(255,255,255,.18)",
      display:"flex",
      alignItems:"center",
      justifyContent:"center"
    }}
  >
    {loading ? (
      <Loader2
        size={18}
        className="spin"
      />
    ) : editingId ? (
      <Save size={18}/>
    ) : (
      <Plus size={18}/>
    )}
  </div>

  <span>
    {loading
      ? "جاري الحفظ..."
      : editingId
      ? "حفظ التعديلات"
      : "إضافة مسجد جديد"}
  </span>
</button>

              {editingId !== null && (
                <button
                  type="button"
                  onClick={clearForm}
                  disabled={loading}
                  style={secondaryButtonStyle}
                >
                  إلغاء
                </button>
              )}
            </div>
          </form>
        </section>

        {/* ================================= */}
        {/* البحث */}
        {/* ================================= */}

        <section
          style={{
            ...cardStyle,
            padding: "calc(15px * var(--app-density,1))",
            marginBottom: "20px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "calc(12px * var(--app-density,1))",
            }}
          >
            <div
              style={{
                position: "relative",
                flex: 1,
              }}
            >
              <Search
                size={19}
                color="#89918b"
                strokeWidth={1.8}
                style={{
                  position: "absolute",
                  right: "14px",
                  top: "50%",
                  transform:
                    "translateY(-50%)",
                  pointerEvents: "none",
                }}
              />

              <input
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="ابحث باسم المسجد أو العنوان أو رقم المسجد..."
                style={{
                  ...inputStyle,
                  paddingRight: "calc(44px * var(--app-density,1))",
                  paddingLeft: (search) ? ("calc(45px * var(--app-density,1))") : ("calc(12px * var(--app-density,1))"),
                }}
              />

              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  style={clearSearchButtonStyle}
                  title="مسح البحث"
                >
                  <X size={15} />
                </button>
              )}
            </div>
          </div>
        </section>

        {/* ================================= */}
        {/* عنوان القائمة */}
        {/* ================================= */}

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "calc(10px * var(--app-density,1))",
            marginBottom: "14px",
          }}
        >
          <div>
            <h2
              style={{
                margin: 0,
                color: "var(--app-color-173d2b,#173d2b)",
                fontSize: "calc(20px * var(--app-font-scale,1))",
                fontWeight: "800",
              }}
            >
              المساجد المسجلة
            </h2>

            <p
              style={{
                margin: "4px 0 0",
                color: "#8a918d",
                fontSize: "calc(12px * var(--app-font-scale,1))",
              }}
            >
              عرض {filteredMosques.length} من{" "}
              {mosques.length} مسجد
            </p>
          </div>
        </div>

        {/* ================================= */}
        {/* المحتوى */}
        {/* ================================= */}

        {initialLoading ? (
          <LoadingState />
        ) : filteredMosques.length === 0 ? (
          <EmptyState
            search={search}
            onClear={() => setSearch("")}
          />
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(290px, 1fr))",
              gap: "calc(16px * var(--app-density,1))",
            }}
          >
            {filteredMosques.map((mosque) => (
              <MosqueCard
                key={mosque.id}
                mosque={mosque}
                onEdit={editMosque}
                onDelete={deleteMosque}
                loading={loading}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ==========================================
// حقل النموذج
// ==========================================

function FormField({
  label,
  icon: Icon,
  placeholder,
  value,
  onChange,
  disabled,
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
        <Icon
          size={18}
          color="#89918b"
          strokeWidth={1.7}
          style={{
            position: "absolute",
            right: "13px",
            top: "50%",
            transform:
              "translateY(-50%)",
            pointerEvents: "none",
          }}
        />

        <input
          value={value}
          disabled={disabled}
          onChange={(event) =>
            onChange(event.target.value)
          }
          placeholder={placeholder}
          style={{
            ...inputStyle,
            paddingRight: "calc(42px * var(--app-density,1))",
            opacity: disabled ? 0.7 : 1,
          }}
        />
      </div>
    </div>
  );
}

// ==========================================
// بطاقة المسجد
// ==========================================

function MosqueCard({
  mosque,
  onEdit,
  onDelete,
  loading,
}) {
  const hasAddress = Boolean(
    String(mosque.address || "").trim()
  );

  return (
    <div
      style={{
        background: "#fff",
        border:
          "1px solid #e4e8e4",
        borderRadius: "calc(18px * var(--app-radius-scale,1))",
        padding: "calc(18px * var(--app-density,1))",
        boxShadow:
          "0 5px 18px rgba(0,0,0,0.04)",
        transition:
          "transform .2s ease, box-shadow .2s ease",
      }}
    >
<div
  style={{
    display: "flex",
    gap: "calc(8px * var(--app-density,1))",
    marginTop: 8,
    flexWrap: "wrap",
  }}
>
  <span
    style={{
      background: "#f4f8f5",
      padding: "calc(4px * var(--app-density,1)) calc(10px * var(--app-density,1))",
      borderRadius: "calc(20px * var(--app-radius-scale,1))",
      fontSize: "calc(11px * var(--app-font-scale,1))",
      fontWeight: 700,
      color: "var(--app-color-0f5132,#0f5132)",
    }}
  >
    {(mosque.halaqat || []).length} حلقة
  </span>
</div>
      {/* رأس البطاقة */}

      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: "calc(12px * var(--app-density,1))",
          marginBottom: "17px",
        }}
      >
        <div
          style={{
            width: "50px",
            height: "50px",
            flexShrink: 0,
            borderRadius: "calc(14px * var(--app-radius-scale,1))",
            background:
              "linear-gradient(145deg,var(--app-color-edf5ef,#edf5ef),#e2eee7)",
            color: "var(--app-color-0f5132,#0f5132)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Building2
            size={25}
            strokeWidth={1.7}
          />
        </div>

        <div
          style={{
            flex: 1,
            minWidth: 0,
          }}
        >
          <h3
            style={{
              margin: 0,
              color: "var(--app-color-173d2b,#173d2b)",
              fontSize: "calc(17px * var(--app-font-scale,1))",
              fontWeight: "800",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {mosque.name || "بدون اسم"}
          </h3>

          <div
            style={{
              marginTop: "5px",
              color: "#969d98",
              fontSize: "calc(10px * var(--app-font-scale,1))",
            }}
          >
            معرف المسجد: {mosque.id}
          </div>
        </div>

<div
  style={{
    marginTop: 6,
    fontSize: "calc(11px * var(--app-font-scale,1))",
    color: "var(--app-color-0f5132,#0f5132)",
    fontWeight: "700",
  }}
>
  عدد الحلقات:
  {" "}
  {(mosque.halaqat || [])
    .length}
</div>
        <span
          style={{
            flexShrink: 0,
            display: "inline-flex",
            alignItems: "center",
            gap: "calc(5px * var(--app-density,1))",
            padding: "calc(5px * var(--app-density,1)) calc(8px * var(--app-density,1))",
            borderRadius: "calc(20px * var(--app-radius-scale,1))",
            background: hasAddress
              ? "#eaf6ee"
              : "#f4f4f4",
            color: hasAddress
              ? "var(--app-color-0f5132,#0f5132)"
              : "#777",
            fontSize: "calc(10px * var(--app-font-scale,1))",
            fontWeight: "700",
          }}
        >
          <span
            style={{
              width: "6px",
              height: "6px",
              borderRadius: "50%",
              background: hasAddress
                ? "#2b9a58"
                : "#999",
            }}
          />

          {hasAddress
            ? "مكتمل"
            : "ناقص العنوان"}
        </span>
      </div>

      {/* العنوان */}

      <div
        style={{
          background: "#fafbf9",
          border:
            "1px solid #eef0ed",
          borderRadius: "calc(12px * var(--app-radius-scale,1))",
          padding: "calc(12px * var(--app-density,1))",
          minHeight: "48px",
          display: "flex",
          alignItems: "flex-start",
          gap: "calc(9px * var(--app-density,1))",
          marginBottom: "17px",
        }}
      >
        <MapPin
          size={18}
          color={
            hasAddress
              ? "#0f5132"
              : "#8d958f"
          }
          strokeWidth={1.7}
          style={{
            flexShrink: 0,
            marginTop: "1px",
          }}
        />

        <span
          style={{
            color: hasAddress
              ? "#59635d"
              : "#9da39f",
            fontSize: "calc(12px * var(--app-font-scale,1))",
            lineHeight: 1.7,
          }}
        >
          {hasAddress
            ? mosque.address
            : "لم يتم تسجيل عنوان المسجد"}
        </span>
      </div>
{mosque.halaqat?.length > 0 && (
  <div
    style={{
      marginBottom: 16,
      display: "flex",
      flexWrap: "wrap",
      gap: "calc(6px * var(--app-density,1))",
    }}
  >
    {mosque.halaqat.map(
      (halaqa) => (
        <span
          key={halaqa.id}
          style={{
            background:
              "#edf8f1",
            color:
              "var(--app-color-0f5132,#0f5132)",
            borderRadius:
              "calc(20px * var(--app-radius-scale,1))",
            padding:
              "calc(4px * var(--app-density,1)) calc(10px * var(--app-density,1))",
            fontSize:
              "calc(11px * var(--app-font-scale,1))",
            fontWeight:
              "700",
          }}
        >
          {halaqa.name}
        </span>
      )
    )}
  </div>
)}

      {/* الأزرار */}

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "1fr 1fr",
          gap: "calc(8px * var(--app-density,1))",
        }}
      >
        <button
          type="button"
          disabled={loading}
          onClick={() => onEdit(mosque)}
          style={{
            ...editButtonStyle,
            opacity: loading ? 0.6 : 1,
            cursor: loading
              ? "not-allowed"
              : "pointer",
          }}
        >
          <Pencil
            size={16}
            strokeWidth={1.8}
          />

          تعديل
        </button>

        <button
          type="button"
          disabled={loading}
          onClick={() =>
            onDelete(mosque.id)
          }
          style={{
            ...deleteButtonStyle,
            opacity: loading ? 0.6 : 1,
            cursor: loading
              ? "not-allowed"
              : "pointer",
          }}
        >
          <Trash2
            size={16}
            strokeWidth={1.8}
          />

          حذف
        </button>
      </div>
    </div>
  );
}

// ==========================================
// بطاقة الإحصائية
// ==========================================

function StatCard({
  icon: Icon,
  title,
  value,
}) {
  return (
    <div
      style={{
        background: "#fff",
        border:
          "1px solid #e6e9e5",
        borderRadius: "calc(16px * var(--app-radius-scale,1))",
        padding: "calc(18px * var(--app-density,1))",
        display: "flex",
        alignItems: "center",
        gap: "calc(13px * var(--app-density,1))",
        boxShadow:
          "0 3px 12px rgba(0,0,0,0.03)",
      }}
    >
      <div
        style={{
          width: "46px",
          height: "46px",
          flexShrink: 0,
          borderRadius: "calc(13px * var(--app-radius-scale,1))",
          background: "var(--app-color-edf5ef,#edf5ef)",
          color: "var(--app-color-0f5132,#0f5132)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Icon
          size={22}
          strokeWidth={1.7}
        />
      </div>

      <div>
        <div
          style={{
            color: "#7e8781",
            fontSize: "calc(11px * var(--app-font-scale,1))",
            marginBottom: "3px",
          }}
        >
          {title}
        </div>

        <div
          style={{
            color: "var(--app-color-173d2b,#173d2b)",
            fontSize: "calc(24px * var(--app-font-scale,1))",
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
// حالة فارغة
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
        borderRadius: "calc(18px * var(--app-radius-scale,1))",
        padding: "calc(55px * var(--app-density,1)) calc(20px * var(--app-density,1))",
        textAlign: "center",
      }}
    >
      <div
        style={{
          width: "64px",
          height: "64px",
          margin: "0 auto 14px",
          borderRadius: "calc(18px * var(--app-radius-scale,1))",
          background: "var(--app-color-edf5ef,#edf5ef)",
          color: "var(--app-color-0f5132,#0f5132)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {search ? (
          <Search
            size={28}
            strokeWidth={1.6}
          />
        ) : (
          <Building2
            size={28}
            strokeWidth={1.6}
          />
        )}
      </div>

      <h3
        style={{
          margin: "0 0 7px",
          color: "#354139",
          fontSize: "calc(17px * var(--app-font-scale,1))",
        }}
      >
        {search
          ? "لا توجد نتائج"
          : "لا توجد مساجد حتى الآن"}
      </h3>

      <p
        style={{
          margin: 0,
          color: "#929993",
          fontSize: "calc(12px * var(--app-font-scale,1))",
        }}
      >
        {search
          ? "لم نجد مسجدًا مطابقًا لبحثك."
          : "ابدأ بإضافة أول مسجد إلى النظام."}
      </p>

      {search && (
        <button
          type="button"
          onClick={onClear}
          style={{
            marginTop: "15px",
            border: "none",
            background: "var(--app-color-0f5132,#0f5132)",
            color: "#fff",
            padding: "calc(9px * var(--app-density,1)) calc(16px * var(--app-density,1))",
            borderRadius: "calc(9px * var(--app-radius-scale,1))",
            cursor: "pointer",
            fontSize: "calc(12px * var(--app-font-scale,1))",
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
// حالة التحميل
// ==========================================

function LoadingState() {
  return (
    <div
      style={{
        background: "#fff",
        border:
          "1px solid #e5e8e4",
        borderRadius: "calc(18px * var(--app-radius-scale,1))",
        padding: "calc(55px * var(--app-density,1)) calc(20px * var(--app-density,1))",
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
          borderTopColor: "#0f5132",
          borderRadius: "50%",
          animation:
            "spin 0.8s linear infinite",
        }}
      />

      جاري تحميل المساجد...
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
  borderRadius: "calc(18px * var(--app-radius-scale,1))",
  padding: "calc(22px * var(--app-density,1))",
  marginBottom: "22px",
  boxShadow:
    "0 4px 15px rgba(0,0,0,0.035)",
};

const pageTitleStyle = {
  margin: 0,
  color: "var(--app-color-173d2b,#173d2b)",
  fontSize: "calc(28px * var(--app-font-scale,1))",
  fontWeight: "800",
};

const pageSubtitleStyle = {
  margin: "5px 0 0",
  color: "#818983",
  fontSize: "calc(13px * var(--app-font-scale,1))",
};

const pageIconStyle = {
  width: "48px",
  height: "48px",
  borderRadius: "calc(14px * var(--app-radius-scale,1))",
  background: "#eaf3ed",
  color: "var(--app-color-0f5132,#0f5132)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const backButtonStyle = {
  width: "43px",
  height: "43px",
  border: "1px solid #e0e4df",
  background: "#fff",
  color: "var(--app-color-173d2b,#173d2b)",
  borderRadius: "calc(11px * var(--app-radius-scale,1))",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const headerButtonStyle = {
  border: "1px solid #dfe4e0",
  background: "#fff",
  color: "var(--app-color-173d2b,#173d2b)",
  borderRadius: "calc(10px * var(--app-radius-scale,1))",
  padding: "calc(9px * var(--app-density,1)) calc(13px * var(--app-density,1))",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "calc(7px * var(--app-density,1))",
  fontSize: "calc(12px * var(--app-font-scale,1))",
  fontWeight: "700",
};

const countBadgeStyle = {
  background: "#fff",
  border: "1px solid #e4e7e3",
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
  borderRadius: "calc(11px * var(--app-radius-scale,1))",
  background: "var(--app-color-edf5ef,#edf5ef)",
  color: "var(--app-color-0f5132,#0f5132)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const sectionTitleStyle = {
  margin: 0,
  color: "var(--app-color-173d2b,#173d2b)",
  fontSize: "calc(18px * var(--app-font-scale,1))",
  fontWeight: "800",
};

const sectionSubtitleStyle = {
  margin: "4px 0 0",
  color: "#8a918d",
  fontSize: "calc(11px * var(--app-font-scale,1))",
};

const labelStyle = {
  display: "block",
  marginBottom: "7px",
  color: "#465149",
  fontSize: "calc(12px * var(--app-font-scale,1))",
  fontWeight: "700",
};

const inputStyle = {
  width: "100%",
  height: "46px",
  padding: "0 calc(12px * var(--app-density,1))",
  border: "1px solid #d9ded9",
  borderRadius: "calc(10px * var(--app-radius-scale,1))",
  outline: "none",
  fontSize: "calc(13px * var(--app-font-scale,1))",
  boxSizing: "border-box",
  background: "#fff",
  color: "#26332c",
};

const primaryButtonStyle = {
  border:"none",
  background:
    "linear-gradient(135deg,var(--app-color-0f766e,#0F766E),var(--app-color-115e59,#115E59))",
  color:"#fff",
  borderRadius:"calc(18px * var(--app-radius-scale,1))",
  padding:"calc(14px * var(--app-density,1)) calc(24px * var(--app-density,1))",
  minHeight:"52px",
  display:"inline-flex",
  alignItems:"center",
  justifyContent:"center",
  gap:"calc(10px * var(--app-density,1))",
  fontSize:"calc(14px * var(--app-font-scale,1))",
  fontWeight:"800",
  boxShadow:
    "0 10px 25px color-mix(in srgb,var(--app-color-0f766e,#0f766e) 22%,transparent)",
  transition:"all .25s ease"
};
const secondaryButtonStyle = {
  border:"1px solid #DCE3E8",
  background:"#FFFFFF",
  color:"#334155",
  borderRadius:"calc(18px * var(--app-radius-scale,1))",
  padding:"calc(14px * var(--app-density,1)) calc(22px * var(--app-density,1))",
  minHeight:"52px",
  cursor:"pointer",
  fontSize:"calc(14px * var(--app-font-scale,1))",
  fontWeight:"700",
  boxShadow:
    "0 4px 14px rgba(15,23,42,.04)"
};

const cancelButtonStyle = {
  border:"1px solid #E2E8F0",
  background:"#FFFFFF",
  color:"#64748B",
  borderRadius:"calc(16px * var(--app-radius-scale,1))",
  padding:"calc(12px * var(--app-density,1)) calc(18px * var(--app-density,1))",
  minHeight:"48px",
  cursor:"pointer",
  display:"inline-flex",
  alignItems:"center",
  gap:"calc(8px * var(--app-density,1))",
  fontSize:"calc(13px * var(--app-font-scale,1))",
  fontWeight:"700"
};

const clearSearchButtonStyle = {
  position:"absolute",
  left:"10px",
  top:"50%",
  transform:"translateY(-50%)",
  width:"34px",
  height:"34px",
  border:"none",
  borderRadius:"calc(10px * var(--app-radius-scale,1))",
  background:"#F8FAFC",
  color:"#64748B",
  cursor:"pointer",
  display:"flex",
  alignItems:"center",
  justifyContent:"center"
};

const editButtonStyle = {
  border:"1px solid #BFDBFE",
  background:"#EFF6FF",
  color:"#2563EB",
  borderRadius:"calc(14px * var(--app-radius-scale,1))",
  width:"42px",
  height:"42px",
  display:"flex",
  alignItems:"center",
  justifyContent:"center",
  cursor:"pointer",
  transition:"all .2s"
};

const deleteButtonStyle = {
  border:"1px solid #FECACA",
  background:"#FEF2F2",
  color:"#DC2626",
  borderRadius:"calc(14px * var(--app-radius-scale,1))",
  width:"42px",
  height:"42px",
  display:"flex",
  alignItems:"center",
  justifyContent:"center",
  cursor:"pointer",
  transition:"all .2s"
};
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

import {
  UserRound,
  Mail,
  Phone,
  ShieldCheck,
  CalendarDays,
  Building2,
  BookOpen,
  GraduationCap,
  Users,
  Camera,
  Save,
  LockKeyhole,
  LogOut,
  CheckCircle2,
  RefreshCw,
} from "lucide-react";

import PageHeader from "../components/PageHeader";
import StatCard from "../components/StatCard";
import FormField from "../components/FormField";
import LoadingState from "../components/LoadingState";
import { useToast } from "../components/Toast";
import { useConfirm } from "../context/ConfirmContext";

export default function Profile() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { confirm } = useConfirm();

  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);

  const [fullName, setFullName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [phone, setPhone] = useState("");

  const [avatarUrl, setAvatarUrl] = useState("");

  const [stats, setStats] = useState({
    mosques: 0,
    halaqat: 0,
    teachers: 0,
    students: 0,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    setLoading(true);

    try {
      const {
        data: authData,
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) {
        throw authError;
      }

      const authUser = authData?.user;

      if (!authUser) {
        navigate("/login", {
          replace: true,
        });
        return;
      }

      setUser(authUser);

      const {
        data: profileData,
        error: profileError,
      } = await supabase
        .from("profiles")
        .select(`
          id,
          role,
          user_number,
          full_name,
          phone,
          status,
          created_at,
          display_name,
          avatar_url,
          auth_user_id
        `)
        .eq(
          "auth_user_id",
          authUser.id
        )
        .maybeSingle();

      if (profileError) {
        throw profileError;
      }

      if (!profileData) {
        showToast(
          "لم يتم العثور على ملف الحساب.",
          "error"
        );
        return;
      }

      setProfile(profileData);

      setFullName(
        profileData.full_name || ""
      );

      setDisplayName(
        profileData.display_name || ""
      );

      setPhone(
        profileData.phone || ""
      );

      setAvatarUrl(
        profileData.avatar_url || ""
      );

      await loadStats();
    } catch (error) {
      console.error(error);

      showToast(
        "تعذر تحميل بيانات الملف الشخصي.",
        "error"
      );
    } finally {
      setLoading(false);
    }
  }

  async function loadStats() {
    const [
      mosquesResult,
      halaqatResult,
      teachersResult,
      studentsResult,
    ] = await Promise.all([
      supabase
        .from("mosques")
        .select("id", {
          count: "exact",
          head: true,
        }),

      supabase
        .from("halaqat")
        .select("id", {
          count: "exact",
          head: true,
        }),

      supabase
        .from("profiles")
        .select("id", {
          count: "exact",
          head: true,
        })
        .eq("role", "teacher"),

      supabase
        .from("profiles")
        .select("id", {
          count: "exact",
          head: true,
        })
        .eq("role", "student"),
    ]);

    if (mosquesResult.error) {
      console.error(
        "mosques:",
        mosquesResult.error
      );
    }

    if (halaqatResult.error) {
      console.error(
        "halaqat:",
        halaqatResult.error
      );
    }

    if (teachersResult.error) {
      console.error(
        "teachers:",
        teachersResult.error
      );
    }

    if (studentsResult.error) {
      console.error(
        "students:",
        studentsResult.error
      );
    }

    setStats({
      mosques:
        mosquesResult.count || 0,

      halaqat:
        halaqatResult.count || 0,

      teachers:
        teachersResult.count || 0,

      students:
        studentsResult.count || 0,
    });
  }

  async function saveProfile() {
    if (!fullName.trim()) {
      showToast(
        "أدخل الاسم الكامل.",
        "error"
      );
      return;
    }

    setSaving(true);

    try {
      const {
        data,
        error,
      } = await supabase
        .from("profiles")
        .update({
          full_name:
            fullName.trim(),

          display_name:
            displayName.trim() ||
            null,

          phone:
            phone.trim() ||
            null,

          avatar_url:
            avatarUrl.trim() ||
            null,
        })
        .eq(
          "id",
          profile.id
        )
        .select()
        .single();

      if (error) {
        throw error;
      }

      setProfile(data);

      showToast(
        "تم حفظ بيانات الملف الشخصي بنجاح.",
        "success"
      );
    } catch (error) {
      console.error(error);

      showToast(
        "تعذر حفظ التغييرات.",
        "error"
      );
    } finally {
      setSaving(false);
    }
  }

  async function changePassword() {
    if (!user?.email) {
      showToast(
        "تعذر تحديد البريد الإلكتروني للحساب.",
        "error"
      );
      return;
    }

    const confirmed =
      await confirm({
        title:
          "تغيير كلمة المرور",

        message:
          "سيتم إرسال رابط إلى بريدك الإلكتروني لتعيين كلمة مرور جديدة.",

        confirmText:
          "إرسال الرابط",

        cancelText:
          "إلغاء",

        type: "info",
      });

    if (!confirmed) {
      return;
    }

    try {
      const {
        error,
      } =
        await supabase.auth.resetPasswordForEmail(
          user.email
        );

      if (error) {
        throw error;
      }

      showToast(
        "تم إرسال رابط تغيير كلمة المرور إلى بريدك الإلكتروني.",
        "success"
      );
    } catch (error) {
      console.error(error);

      showToast(
        "تعذر إرسال رابط تغيير كلمة المرور.",
        "error"
      );
    }
  }

  async function handleLogout() {
    const confirmed =
      await confirm({
        title:
          "تسجيل الخروج",

        message:
          "هل أنت متأكد من تسجيل الخروج من حساب المشرف؟",

        confirmText:
          "تسجيل الخروج",

        cancelText:
          "البقاء",

        type: "danger",
      });

    if (!confirmed) {
      return;
    }

    setSigningOut(true);

    try {
      const {
        error,
      } =
        await supabase.auth.signOut();

      if (error) {
        throw error;
      }

      navigate("/login", {
        replace: true,
      });
    } catch (error) {
      console.error(error);

      showToast(
        "تعذر تسجيل الخروج.",
        "error"
      );

      setSigningOut(false);
    }
  }

  function formatDate(date) {
    if (!date) {
      return "-";
    }

    try {
      return new Date(
        date
      ).toLocaleDateString(
        "ar-SA",
        {
          year: "numeric",
          month: "long",
          day: "numeric",
        }
      );
    } catch {
      return "-";
    }
  }

  if (loading) {
    return (
      <LoadingState
        message="جاري تحميل الملف الشخصي..."
        minHeight="400px"
      />
    );
  }

  return (
    <div
      style={{
        width: "100%",
      }}
    >
      <PageHeader
        icon={UserRound}
        title="الملف الشخصي"
        description="إدارة بيانات حساب المشرف وإعداداته الشخصية"
      />

      {/* =====================================
          بطاقة الهوية
      ===================================== */}

      <section
        style={{
          background: "#fff",
          border:
            "1px solid #e4e9e5",
          borderRadius: "20px",
          padding: "24px",
          marginBottom: "20px",
          boxShadow:
            "0 4px 18px rgba(0,0,0,0.035)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "18px",
            flexWrap: "wrap",
          }}
        >
          {/* الصورة */}

          <div
            style={{
              position: "relative",
              flexShrink: 0,
            }}
          >
            <div
              style={{
                width: "92px",
                height: "92px",
                borderRadius: "26px",
                overflow: "hidden",
                background:
                  "linear-gradient(145deg,#eaf3ed,#dfeae3)",
                border:
                  "1px solid #dce8df",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#0f5132",
              }}
            >
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt="صورة الحساب"
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit:
                      "cover",
                  }}
                />
              ) : (
                <UserRound
                  size={42}
                  strokeWidth={1.5}
                />
              )}
            </div>

            <div
              style={{
                position: "absolute",
                left: "-5px",
                bottom: "-5px",
                width: "30px",
                height: "30px",
                borderRadius: "9px",
                background: "#0f5132",
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border:
                  "3px solid #fff",
              }}
            >
              <Camera size={14} />
            </div>
          </div>

          {/* المعلومات */}

          <div
            style={{
              minWidth: 0,
              flex: 1,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                flexWrap: "wrap",
              }}
            >
              <h2
                style={{
                  margin: 0,
                  color: "#173d2b",
                  fontSize: "23px",
                  fontWeight: "800",
                }}
              >
                {profile?.full_name ||
                  "المشرف"}
              </h2>

              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "5px",
                  padding:
                    "5px 9px",
                  borderRadius: "20px",
                  background:
                    "#eaf6ee",
                  color:
                    "#0f5132",
                  fontSize: "10px",
                  fontWeight: "800",
                }}
              >
                <CheckCircle2
                  size={13}
                />

                {profile?.status ===
                "active"
                  ? "نشط"
                  : "غير نشط"}
              </span>
            </div>

            <div
              style={{
                marginTop: "6px",
                color: "#737d76",
                fontSize: "13px",
              }}
            >
              مشرف نظام الصديق
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                marginTop: "9px",
                color: "#929a95",
                fontSize: "11px",
              }}
            >
              <ShieldCheck
                size={15}
                color="#0f5132"
              />

              رقم المستخدم:
              {" "}
              {profile?.user_number ||
                "-"}
            </div>
          </div>
        </div>
      </section>

      {/* =====================================
          الإحصائيات
      ===================================== */}

      <section
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit,minmax(190px,1fr))",
          gap: "14px",
          marginBottom: "20px",
        }}
      >
        <StatCard
          icon={Building2}
          title="المساجد"
          value={stats.mosques}
        />

        <StatCard
          icon={BookOpen}
          title="الحلقات"
          value={stats.halaqat}
        />

        <StatCard
          icon={GraduationCap}
          title="المعلمون"
          value={stats.teachers}
        />

        <StatCard
          icon={Users}
          title="الطلاب"
          value={stats.students}
        />
      </section>

      {/* =====================================
          المعلومات الشخصية
      ===================================== */}

      <section
        style={{
          background: "#fff",
          border:
            "1px solid #e4e9e5",
          borderRadius: "20px",
          padding: "24px",
          marginBottom: "20px",
          boxShadow:
            "0 4px 18px rgba(0,0,0,0.035)",
        }}
      >
        <div
          style={{
            marginBottom: "20px",
          }}
        >
          <h2
            style={{
              margin: 0,
              color: "#173d2b",
              fontSize: "19px",
              fontWeight: "800",
            }}
          >
            معلومات الحساب
          </h2>

          <p
            style={{
              margin:
                "5px 0 0",
              color: "#8a928d",
              fontSize: "11px",
            }}
          >
            يمكنك تحديث بياناتك الشخصية من هنا.
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit,minmax(230px,1fr))",
            gap: "16px",
          }}
        >
          <FormField
            label="الاسم الكامل"
            value={fullName}
            onChange={setFullName}
            placeholder="أدخل الاسم الكامل"
            required
            icon={UserRound}
          />

          <FormField
            label="الاسم الظاهر"
            value={displayName}
            onChange={setDisplayName}
            placeholder="الاسم الذي يظهر داخل النظام"
            icon={UserRound}
          />

          <FormField
            label="رقم الجوال"
            value={phone}
            onChange={setPhone}
            placeholder="05xxxxxxxx"
            icon={Phone}
          />

          <FormField
            label="البريد الإلكتروني"
            value={user?.email || ""}
            onChange={() => {}}
            disabled
            icon={Mail}
          />
        </div>

        <div
          style={{
            marginTop: "16px",
          }}
        >
          <FormField
            label="رابط الصورة الشخصية"
            value={avatarUrl}
            onChange={setAvatarUrl}
            placeholder="https://..."
            icon={Camera}
          />
        </div>

        <button
          type="button"
          onClick={saveProfile}
          disabled={saving}
          style={{
            marginTop: "18px",
            minHeight: "46px",
            padding:
              "0 20px",
            border: "none",
            borderRadius: "11px",
            background:
              saving
                ? "#6f8d7e"
                : "#0f5132",
            color: "#fff",
            cursor:
              saving
                ? "wait"
                : "pointer",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            fontSize: "13px",
            fontWeight: "800",
          }}
        >
          {saving ? (
            <>
              <RefreshCw
                size={17}
                style={{
                  animation:
                    "profileSpin .8s linear infinite",
                }}
              />

              جارٍ الحفظ...
            </>
          ) : (
            <>
              <Save size={17} />

              حفظ التغييرات
            </>
          )}
        </button>
      </section>

      {/* =====================================
          معلومات النظام
      ===================================== */}

      <section
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit,minmax(230px,1fr))",
          gap: "14px",
          marginBottom: "20px",
        }}
      >
        <InfoCard
          icon={Mail}
          title="البريد الإلكتروني"
          value={
            user?.email || "-"
          }
        />

        <InfoCard
          icon={CalendarDays}
          title="تاريخ إنشاء الحساب"
          value={formatDate(
            profile?.created_at
          )}
        />

        <InfoCard
          icon={ShieldCheck}
          title="نوع الحساب"
          value="مشرف النظام"
        />
      </section>

      {/* =====================================
          الأمان
      ===================================== */}

      <section
        style={{
          background: "#fff",
          border:
            "1px solid #e4e9e5",
          borderRadius: "20px",
          padding: "24px",
          marginBottom: "20px",
          boxShadow:
            "0 4px 18px rgba(0,0,0,0.035)",
        }}
      >
        <div
          style={{
            marginBottom: "18px",
          }}
        >
          <h2
            style={{
              margin: 0,
              color: "#173d2b",
              fontSize: "19px",
              fontWeight: "800",
            }}
          >
            الأمان والحساب
          </h2>

          <p
            style={{
              margin:
                "5px 0 0",
              color: "#8a928d",
              fontSize: "11px",
            }}
          >
            إدارة كلمة المرور وتسجيل الخروج.
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit,minmax(240px,1fr))",
            gap: "10px",
          }}
        >
          <button
            type="button"
            onClick={changePassword}
            style={securityButton}
          >
            <LockKeyhole size={18} />

            <span>
              <strong>
                تغيير كلمة المرور
              </strong>

              <small>
                إرسال رابط إعادة تعيين كلمة المرور
              </small>
            </span>
          </button>

          <button
            type="button"
            onClick={handleLogout}
            disabled={signingOut}
            style={{
              ...securityButton,
              color: "#b42318",
              borderColor:
                "#f0d8d5",
              background:
                "#fff9f8",
            }}
          >
            <LogOut size={18} />

            <span>
              <strong>
                {signingOut
                  ? "جارٍ تسجيل الخروج..."
                  : "تسجيل الخروج"}
              </strong>

              <small>
                الخروج من حساب المشرف
              </small>
            </span>
          </button>
        </div>
      </section>

      <style>
        {`
          @keyframes profileSpin {
            to {
              transform: rotate(360deg);
            }
          }
        `}
      </style>
    </div>
  );
}

function InfoCard({
  icon: Icon,
  title,
  value,
}) {
  return (
    <div
      style={{
        background: "#fff",
        border:
          "1px solid #e4e9e5",
        borderRadius: "16px",
        padding: "16px",
        display: "flex",
        alignItems: "center",
        gap: "12px",
      }}
    >
      <div
        style={{
          width: "42px",
          height: "42px",
          flexShrink: 0,
          borderRadius: "12px",
          background: "#edf5ef",
          color: "#0f5132",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Icon
          size={19}
          strokeWidth={1.7}
        />
      </div>

      <div
        style={{
          minWidth: 0,
        }}
      >
        <div
          style={{
            color: "#8a928d",
            fontSize: "10px",
            marginBottom: "3px",
          }}
        >
          {title}
        </div>

        <div
          style={{
            color: "#354139",
            fontSize: "12px",
            fontWeight: "700",
            overflowWrap: "anywhere",
          }}
        >
          {value}
        </div>
      </div>
    </div>
  );
}

const securityButton = {
  minHeight: "64px",
  border: "1px solid #dfe5e1",
  borderRadius: "13px",
  background: "#fbfcfb",
  color: "#0f5132",
  cursor: "pointer",
  padding: "11px 13px",
  display: "flex",
  alignItems: "center",
  gap: "11px",
  textAlign: "right",
};
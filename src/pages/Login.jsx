import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useToast } from "../components/Toast";

import {
  ShieldCheck,
  GraduationCap,
  UserRound,
  LockKeyhole,
  Mail,
  Eye,
  EyeOff,
  LogIn,
  ArrowLeft,
  Sparkles,
  Loader2,
  AlertCircle,
} from "lucide-react";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();
const [loginMode, setLoginMode] =
  useState("staff");
  
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  /*
  =====================================================
  الأدعية
  =====================================================
  */

  const duas = [
    "﴿وَقُلْ رَبِّ زِدْنِي عِلْمًا﴾",

    "اللهم انفعني بما علمتني، وعلّمني ما ينفعني، وزدني علمًا.",

    "اللهم افتح لي أبواب الفهم والعلم، وبارك لي فيما تعلمت.",

    "﴿رَبِّ اشْرَحْ لِي صَدْرِي ۝ وَيَسِّرْ لِي أَمْرِي﴾",

    "اللهم اجعل القرآن ربيع قلوبنا ونور صدورنا.",

    "اللهم ارزقنا علمًا نافعًا وعملًا صالحًا.",
  ];

  const [dua] = useState(
    () =>
      duas[
        Math.floor(
          Math.random() * duas.length
        )
      ]
  );

  /*
  =====================================================
  بيانات الأدوار
  =====================================================
  */

 
  /*
  =====================================================
  تسجيل الدخول
  =====================================================
  */

  async function handleLogin() {
    if (loading) return;

    setErrorMessage("");

    const identifier = username.trim();

    if (!identifier) {
      setErrorMessage(
        `يرجى إدخال ${currentRole.user}`
      );

      return;
    }

    if (!password) {
      setErrorMessage(
        "يرجى إدخال كلمة المرور"
      );

      return;
    }

    setLoading(true);

    try {
      /*
      =================================================
      1. تحديد البريد المستخدم في Auth
      =================================================
      */

      let email = identifier;

      /*
      المشرف:
      البريد يدخل مباشرة.

      المعلم / الطالب:
      الرقم يبحث عنه في profiles.
      */

    
      /*
      =================================================
      2. تسجيل الدخول في Supabase Auth
      =================================================
      */

      const {
        data: authData,
        error: authError,
      } =
        await supabase.auth.signInWithPassword({
          email,
          password,
        });

      if (authError) {
        console.error(
          "Supabase Auth Error:",
          authError
        );

        setErrorMessage(
          "بيانات الدخول غير صحيحة. تحقق من البريد الإلكتروني وكلمة المرور."
        );

        setLoading(false);
        return;
      }

      const authUser =
        authData?.user;

      if (!authUser) {
        await supabase.auth.signOut();

        setErrorMessage(
          "تعذر التحقق من الحساب."
        );

        setLoading(false);
        return;
      }

      /*
      =================================================
      3. تحميل Profile
      =================================================
      */

      const {
        data: profile,
        error: profileError,
      } =
        await supabase
          .from("profiles")
          .select(
            `
              id,
              role,
              user_number,
              full_name,
              phone,
              status,
              auth_user_id
            `
          )
          .eq(
            "auth_user_id",
            authUser.id
          )
          .maybeSingle();

      if (profileError) {
        console.error(
          "Profile Error:",
          profileError
        );

        await supabase.auth.signOut();

        setErrorMessage(
          "حدث خطأ أثناء تحميل بيانات الحساب."
        );

        setLoading(false);
        return;
      }

      /*
      =================================================
      4. لا يوجد Profile
      =================================================
      */

      if (!profile) {
        await supabase.auth.signOut();

        setErrorMessage(
          "الحساب موجود في Supabase Auth لكنه غير مرتبط بملف مستخدم في نظام الصديق."
        );

        setLoading(false);
        return;
      }

      /*
      =================================================
      5. التحقق من الدور
      =================================================
      */

    
      /*
      =================================================
      6. التحقق من حالة الحساب
      =================================================
      */

      if (profile.status !== "active") {
        await supabase.auth.signOut();

        setErrorMessage(
          "هذا الحساب غير نشط حاليًا. يرجى التواصل مع المشرف."
        );

        setLoading(false);
        return;
      }

      /*
      =================================================
      7. رسالة نجاح
      =================================================
      */

      showToast(
        `مرحبًا بك ${
          profile.full_name ||
          getRoleName(profile.role)
        }`,
        "success"
      );

      /*
      =================================================
      8. التوجيه
      =================================================
      */

      const destination =
        getDestination(profile.role);

      navigate(destination, {
        replace: true,
        state: {
          welcome: true,
          name:
            profile.full_name ||
            getRoleName(profile.role),

          role: profile.role,

          from:
            location.pathname,
        },
      });
    } catch (error) {
      console.error(
        "Unexpected Login Error:",
        error
      );

      setErrorMessage(
        "حدث خطأ غير متوقع أثناء تسجيل الدخول."
      );

      setLoading(false);
    }
  }

  /*
  =====================================================
  واجهة الصفحة
  =====================================================
  */

  return (
    <div
      style={{
        minHeight: "100vh",
        position: "relative",
        overflow: "hidden",
        direction: "rtl",

        background:
          "linear-gradient(135deg,#f7f5ef 0%,#eef5f0 50%,#f8f6f0 100%)",

        display: "flex",
        alignItems: "center",
        justifyContent: "center",

        padding: "25px",
        boxSizing: "border-box",
      }}
    >
      {/* الخلفية */}

      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          opacity: 0.07,

          backgroundImage: `
            linear-gradient(
              45deg,
              transparent 46%,
              #0f5132 47%,
              #0f5132 53%,
              transparent 54%
            ),
            linear-gradient(
              -45deg,
              transparent 46%,
              #0f5132 47%,
              #0f5132 53%,
              transparent 54%
            )
          `,

          backgroundSize: "90px 90px",
          transform: "scale(1.5)",
        }}
      />

      <div
        style={{
          position: "absolute",
          width: "430px",
          height: "430px",
          borderRadius: "50%",
          border:
            "1px solid rgba(15,81,50,0.10)",
          top: "-200px",
          right: "-130px",
        }}
      />

      <div
        style={{
          position: "absolute",
          width: "320px",
          height: "320px",
          borderRadius: "50%",
          border:
            "1px solid rgba(15,81,50,0.08)",
          bottom: "-150px",
          left: "-120px",
        }}
      />

      {/* البطاقة */}

      <div
        style={{
          position: "relative",
          zIndex: 2,

          width: "100%",
          maxWidth: "480px",

          background:
            "rgba(255,255,255,0.97)",

          border:
            "1px solid rgba(15,81,50,0.10)",

          borderRadius: "28px",

          padding: "38px",

          boxSizing: "border-box",

          boxShadow:
            "0 28px 80px rgba(22,55,39,0.14)",

          backdropFilter: "blur(14px)",
        }}
      >
        {/* الشعار */}

        <div
          style={{
            textAlign: "center",
            marginBottom: "24px",
          }}
        >
          <div
            style={{
              width: "94px",
              height: "94px",
              margin: "0 auto 14px",

              borderRadius: "25px",

              background:
                "linear-gradient(145deg,#f1f6f2,#ffffff)",

              border:
                "1px solid rgba(15,81,50,0.10)",

              display: "flex",
              alignItems: "center",
              justifyContent: "center",

              boxShadow:
                "0 12px 32px rgba(15,81,50,0.09)",
            }}
          >
            <img
              src="/logo.png"
              alt="الصديق"
              style={{
                width: "140px",
                height: "74px",
                objectFit: "contain",
              }}
            />
          </div>

          <h1
            style={{
              margin: 0,
              color: "#173d2b",
              fontSize: "29px",
              fontWeight: "800",
            }}
          >
            نظام الصديق
          </h1>

          <p
            style={{
              margin: "8px 0 0",
              color: "#7b817d",
              fontSize: "13px",
            }}
          >
            نظام إدارة حلقات تحفيظ القرآن الكريم
          </p>
        </div>

        {/* الدعاء */}

        <div
          style={{
            background:
              "linear-gradient(135deg,#f4f8f5,#faf9f4)",

            border:
              "1px solid #e5ebe6",

            borderRadius: "16px",

            padding: "15px 18px",

            marginBottom: "23px",

            textAlign: "center",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: "7px",

              color: "#0f5132",

              fontSize: "11px",
              fontWeight: "800",

              marginBottom: "7px",
            }}
          >
            <Sparkles size={14} />
            دعاء اليوم
          </div>

          <div
            style={{
              color: "#425248",
              fontSize: "13px",
              fontWeight: "700",
              lineHeight: 1.9,
            }}
          >
            {dua}
          </div>
        </div>

     <div
  style={{
    display: "flex",
    gap: "12px",
    marginBottom: "24px",
  }}
>
  <button
    type="button"
    onClick={() => setLoginMode("staff")}
    style={{
      flex: 1,
      height: "54px",
      border: "none",
      borderRadius: "14px",
      fontWeight: "800",
      cursor: "pointer",
      background:
        loginMode === "staff"
          ? "#0f5132"
          : "#edf2ee",
      color:
        loginMode === "staff"
          ? "#fff"
          : "#0f5132",
    }}
  >
    دخول الإدارة
  </button>

  <button
    type="button"
    onClick={() => setLoginMode("student")}
    style={{
      flex: 1,
      height: "54px",
      border: "none",
      borderRadius: "14px",
      fontWeight: "800",
      cursor: "pointer",
      background:
        loginMode === "student"
          ? "#0f5132"
          : "#edf2ee",
      color:
        loginMode === "student"
          ? "#fff"
          : "#0f5132",
    }}
  >
    دخول الطالب
  </button>
</div>
        {/* النموذج */}

        <form
          onSubmit={(event) => {
            event.preventDefault();
            handleLogin();
          }}
        >
         <FormInput
  label={
    loginMode === "staff"
      ? "البريد الإلكتروني"
      : "اسم الطالب"
  }
  placeholder={
    loginMode === "staff"
      ? "أدخل البريد الإلكتروني"
      : "أدخل اسم الطالب"
  }
  value={username}
  onChange={setUsername}
  icon={
    loginMode === "staff"
      ? Mail
      : UserRound
  }
/>
    

          {/* كلمة المرور */}

          <div
            style={{
              marginBottom: "18px",
            }}
          >
            <label style={labelStyle}>
              كلمة المرور
            </label>

            <div
              style={{
                position: "relative",
              }}
            >
              <LockKeyhole
                size={18}
                color="#84908a"
                style={{
                  position: "absolute",
                  right: "13px",
                  top: "50%",
                  transform:
                    "translateY(-50%)",
                }}
              />

              <input
                type={
                  showPassword
                    ? "text"
                    : "password"
                }
                value={password}
                onChange={(event) =>
                  setPassword(
                    event.target.value
                  )
                }
                placeholder="أدخل كلمة المرور"
                autoComplete="current-password"
                style={{
                  ...inputStyle,
                  paddingRight: "44px",
                  paddingLeft: "45px",
                }}
              />

              <button
                type="button"
                onClick={() =>
                  setShowPassword(
                    (value) => !value
                  )
                }
                aria-label={
                  showPassword
                    ? "إخفاء كلمة المرور"
                    : "إظهار كلمة المرور"
                }
                style={{
                  position: "absolute",
                  left: "8px",
                  top: "50%",
                  transform:
                    "translateY(-50%)",

                  width: "34px",
                  height: "34px",

                  border: "none",
                  background: "transparent",

                  color: "#7c8780",

                  cursor: "pointer",

                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {showPassword ? (
                  <EyeOff size={18} />
                ) : (
                  <Eye size={18} />
                )}
              </button>
            </div>
          </div>

          {/* زر الدخول */}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              height: "53px",

              border: "none",
              borderRadius: "13px",

              background: loading
                ? "#6c8c7c"
                : "linear-gradient(135deg,#0f5132,#174f37)",

              color: "#fff",

              fontSize: "15px",
              fontWeight: "800",

              cursor: loading
                ? "wait"
                : "pointer",

              display: "flex",
              alignItems: "center",
              justifyContent: "center",

              gap: "9px",

              boxShadow:
                "0 9px 22px rgba(15,81,50,0.20)",
            }}
          >
            {loading ? (
              <>
                <Loader2
                  size={19}
                  style={{
                    animation:
                      "loginSpin 1s linear infinite",
                  }}
                />

                جارٍ التحقق...
              </>
            ) : (
              <>
                تسجيل الدخول
                <LogIn size={19} />
              </>
            )}
          </button>
        </form>

        {/* نسيت كلمة المرور */}

        <div
          style={{
            textAlign: "center",
            marginTop: "16px",
          }}
        >
          <button
            type="button"
            onClick={() =>
              showToast(
                "استعادة كلمة المرور سيتم تفعيلها قريبًا.",
                "info"
              )
            }
            style={{
              border: "none",
              background: "transparent",

              color: "#0f5132",

              fontSize: "13px",
              fontWeight: "700",

              cursor: "pointer",

              display: "inline-flex",
              alignItems: "center",

              gap: "5px",
            }}
          >
            نسيت كلمة المرور؟
            <ArrowLeft size={15} />
          </button>
        </div>

        {/* الفوتر */}

        <div
          style={{
            marginTop: "21px",

            paddingTop: "16px",

            borderTop:
              "1px solid #edf0ed",

            textAlign: "center",

            color: "#9da39f",

            fontSize: "10px",
          }}
        >
          نظام الصديق لإدارة حلقات تحفيظ القرآن الكريم
        </div>
      </div>

      <style>
        {`
          @keyframes loginSpin {
            from {
              transform: rotate(0deg);
            }

            to {
              transform: rotate(360deg);
            }
          }
        `}
      </style>
    </div>
  );
}

/*
=========================================================
حقل الإدخال
=========================================================
*/

function FormInput({
  label,
  placeholder,
  value,
  onChange,
  icon: Icon,
}) {
  return (
    <div
      style={{
        marginBottom: "15px",
      }}
    >
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
          color="#84908a"
          style={{
            position: "absolute",
            right: "13px",
            top: "50%",
            transform:
              "translateY(-50%)",
          }}
        />

        <input
          value={value}
          onChange={(event) =>
            onChange(
              event.target.value
            )
          }
          placeholder={placeholder}
          autoComplete="username"
          style={inputStyle}
        />
      </div>
    </div>
  );
}

/*
=========================================================
زر الدور
=========================================================
*/

function RoleButton({
  active,
  onClick,
  icon: Icon,
  label,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        minHeight: "72px",

        borderRadius: "13px",

        border: active
          ? "1px solid #0f5132"
          : "1px solid #e1e5e2",

        background: active
          ? "#0f5132"
          : "#fff",

        color: active
          ? "#fff"
          : "#5f6963",

        cursor: "pointer",

        display: "flex",
        flexDirection: "column",

        alignItems: "center",
        justifyContent: "center",

        gap: "5px",

        transition:
          "all 0.18s ease",
      }}
    >
      <Icon
        size={20}
        strokeWidth={1.8}
      />

      <span
        style={{
          fontSize: "12px",
          fontWeight: "700",
        }}
      >
        {label}
      </span>
    </button>
  );
}

/*
=========================================================
أسماء الأدوار
=========================================================
*/

function getRoleName(role){

  switch(role){

    case "admin":
      return "مدير النظام";

    case "supervisor":
      return "مشرف المسجد";

    case "teacher":
      return "المعلم";

    case "student":
      return "الطالب";

    default:
      return role;
  }

}
/*
=========================================================
مسارات النظام
=========================================================
*/

function getDestination(role) {

  if (role === "admin") {
    return "/system-admin";
  }

  if (role === "supervisor") {
    return "/admin";
  }

  if (role === "teacher") {
    return "/teacher";
  }

  if (role === "student") {
    return "/student";
  }

  return "/login";
}

/*
=========================================================
التنسيقات
=========================================================
*/

const inputStyle = {
  width: "100%",
  height: "50px",

  padding: "0 44px 0 14px",

  boxSizing: "border-box",

  border:
    "1px solid #d9dfdb",

  borderRadius: "12px",

  outline: "none",

  fontSize: "14px",

  color: "#26332c",

  background: "#fff",

  direction: "rtl",
};

const labelStyle = {
  display: "block",

  marginBottom: "7px",

  color: "#3f4943",

  fontSize: "13px",

  fontWeight: "700",
};
import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useToast } from "../components/Toast";
import {
  ArrowLeft,
  BookOpenCheck,
  Eye,
  EyeOff,
  GraduationCap,
  Loader2,
  LockKeyhole,
  LogIn,
  Mail,
  ShieldCheck,
  Sparkles,
  UserRound,
  UserRoundPlus,
} from "lucide-react";
import "./Login.css";

const DUAS = [
  "﴿وَقُلْ رَبِّ زِدْنِي عِلْمًا﴾",
  "اللهم انفعني بما علمتني، وعلّمني ما ينفعني، وزدني علمًا.",
  "﴿رَبِّ اشْرَحْ لِي صَدْرِي ۝ وَيَسِّرْ لِي أَمْرِي﴾",
  "اللهم اجعل القرآن ربيع قلوبنا ونور صدورنا.",
];

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();

  const [loginMode, setLoginMode] = useState("staff");
  const [identifier, setIdentifier] = useState("");
  const [studentNumber, setStudentNumber] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const dua = useMemo(
    () => DUAS[Math.floor(Math.random() * DUAS.length)],
    []
  );

  function switchMode(mode) {
    setLoginMode(mode);
    setIdentifier("");
    setStudentNumber("");
    setPassword("");
    setErrorMessage("");
    setShowPassword(false);
  }

  async function loadProfile(authUserId) {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, role, user_number, full_name, phone, status, auth_user_id")
      .eq("auth_user_id", authUserId)
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  async function handleStaffLogin() {
    const email = identifier.trim().toLowerCase();

    if (!email) throw new Error("يرجى إدخال البريد الإلكتروني.");
    if (!password) throw new Error("يرجى إدخال كلمة المرور.");

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw new Error("بيانات الدخول غير صحيحة.");

    const authUser = data?.user;
    if (!authUser) throw new Error("تعذر التحقق من الحساب.");

    const profile = await loadProfile(authUser.id);

    if (!profile) {
      await supabase.auth.signOut();
      throw new Error("الحساب غير مرتبط بملف مستخدم داخل نظام الصديق.");
    }

    if (profile.status !== "active") {
      await supabase.auth.signOut();
      throw new Error("هذا الحساب غير نشط حاليًا.");
    }

    if (profile.role === "student") {
      await supabase.auth.signOut();
      throw new Error("هذا حساب طالب. استخدم خيار «دخول الطالب».");
    }

    let destination = getDestination(profile.role);

    if (profile.role === "supervisor") {
      const {
        data: onboardingRows,
        error: onboardingError,
      } = await supabase.rpc("get_my_supervisor_onboarding");

      if (onboardingError) {
        console.error(
          "Supervisor onboarding check error:",
          onboardingError
        );

        await supabase.auth.signOut();

        throw new Error(
          "تعذر التحقق من إعداد حساب المشرف. حاول مرة أخرى."
        );
      }

      const onboarding = Array.isArray(onboardingRows)
        ? onboardingRows[0]
        : null;

      if (!onboarding) {
        await supabase.auth.signOut();

        throw new Error(
          "تعذر تحديد حالة ربط حساب المشرف بالمسجد."
        );
      }

      if (onboarding.has_mosque) {
        destination = "/admin";
      } else if (
        onboarding.needs_setup &&
        onboarding.can_create_mosque
      ) {
        destination = "/supervisor/setup";
      } else {
        await supabase.auth.signOut();

        throw new Error(
          "حساب المشرف غير مرتبط بمسجد ولا يملك صلاحية إنشاء مسجد. تواصل مع مدير النظام."
        );
      }
    }

    showToast(`مرحبًا بك ${profile.full_name}`, "success");

    navigate(destination, {
      replace: true,
      state: {
        welcome: true,
        name: profile.full_name,
        role: profile.role,
        from: location.pathname,
      },
    });
  }

  async function handleStudentLogin() {
    const fullName = identifier.trim();
    const userNumber = studentNumber.trim().toUpperCase();

    if (!fullName) throw new Error("يرجى إدخال اسم الطالب.");
    if (!userNumber) throw new Error("يرجى إدخال رقم الطالب.");

    const { data, error } = await supabase.functions.invoke(
      "student-login",
      {
        body: {
          full_name: fullName,
          user_number: userNumber,
        },
      }
    );

    if (error) {
      console.error("student-login invoke error:", error);
      throw new Error(
        "تعذر الوصول إلى خدمة دخول الطالب. تأكد من نشر Edge Function."
      );
    }

    if (!data?.ok || !data?.access_token || !data?.refresh_token) {
      throw new Error(
        data?.message || "اسم الطالب أو رقم الطالب غير صحيح."
      );
    }

    const { error: sessionError } = await supabase.auth.setSession({
      access_token: data.access_token,
      refresh_token: data.refresh_token,
    });

    if (sessionError) throw sessionError;

    showToast(
      `مرحبًا بك ${data?.profile?.full_name || fullName}`,
      "success"
    );

    navigate("/student", {
      replace: true,
      state: {
        welcome: true,
        name: data?.profile?.full_name || fullName,
        role: "student",
      },
    });
  }

  async function handleLogin(event) {
    event.preventDefault();
    if (loading) return;

    setErrorMessage("");
    setLoading(true);

    try {
      if (loginMode === "staff") {
        await handleStaffLogin();
      } else {
        await handleStudentLogin();
      }
    } catch (error) {
      console.error("Login error:", error);
      setErrorMessage(error?.message || "حدث خطأ غير متوقع أثناء تسجيل الدخول.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="login-pro-page">
      <div className="login-pro-orb login-pro-orb-one" />
      <div className="login-pro-orb login-pro-orb-two" />

      <section className="login-pro-shell">
        <aside className="login-pro-showcase">
          <div className="login-pro-showcase-inner">
            <div className="login-pro-logo-box">
              <img src="/icon-512.png" alt="الصديق" />
            </div>

            <div className="login-pro-kicker">
              <Sparkles />
              منظومة لإدارة الحلقات وصناعة الأثر
            </div>

            <h1>
              الصِّديق
              <span>إدارة للحلقة، وعناية بمسيرة الطالب</span>
            </h1>

            <p>
              متابعة الحضور والتسميع والخطط والإنجاز والتحفيز والعناية
              بالطالب من مكان واحد.
            </p>

            <div className="login-pro-features">
              <div><ShieldCheck /> صلاحيات ومسارات واضحة</div>
              <div><BookOpenCheck /> متابعة تعليمية مترابطة</div>
              <div><GraduationCap /> تجربة مناسبة لكل دور</div>
            </div>

            <div className="login-pro-dua">
              <span>وقفة اليوم</span>
              <strong>{dua}</strong>
            </div>
          </div>
        </aside>

        <section className="login-pro-card">
          <div className="login-pro-mobile-brand">
            <img src="/icon-512.png" alt="الصديق" />
            <div>
              <strong>الصِّديق</strong>
              <span>مرحبًا بعودتك</span>
            </div>
          </div>

          <header className="login-pro-heading">
            <div className="login-pro-eyebrow"><LogIn /> تسجيل الدخول</div>
            <h2>مرحبًا بعودتك</h2>
            <p>اختر طريقة الدخول المناسبة لحسابك.</p>
          </header>

          <div className="login-pro-switch">
            <button
              type="button"
              className={loginMode === "staff" ? "active" : ""}
              onClick={() => switchMode("staff")}
            >
              <ShieldCheck />
              <span>
                <strong>دخول الإدارة</strong>
                <small>مدير النظام • المشرف • المعلم</small>
              </span>
            </button>

            <button
              type="button"
              className={loginMode === "student" ? "active" : ""}
              onClick={() => switchMode("student")}
            >
              <UserRound />
              <span>
                <strong>دخول الطالب</strong>
                <small>الاسم + رقم الطالب</small>
              </span>
            </button>
          </div>

          <form className="login-pro-form" onSubmit={handleLogin}>
            <FormInput
              label={loginMode === "staff" ? "البريد الإلكتروني" : "اسم الطالب"}
              type={loginMode === "staff" ? "email" : "text"}
              value={identifier}
              onChange={setIdentifier}
              placeholder={loginMode === "staff" ? "name@example.com" : "أدخل اسم الطالب"}
              icon={loginMode === "staff" ? Mail : UserRound}
            />

            {loginMode === "staff" ? (
              <div className="login-pro-field">
                <label>كلمة المرور</label>
                <div className="login-pro-input-wrap">
                  <LockKeyhole className="login-pro-input-icon" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="أدخل كلمة المرور"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className="login-pro-eye"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
                  >
                    {showPassword ? <EyeOff /> : <Eye />}
                  </button>
                </div>
              </div>
            ) : (
              <FormInput
                label="رقم الطالب"
                value={studentNumber}
                onChange={(value) => setStudentNumber(value.toUpperCase())}
                placeholder="مثال: ST-7K4M92"
                icon={GraduationCap}
                dir="ltr"
              />
            )}

            {errorMessage && <div className="login-pro-error">{errorMessage}</div>}

            <button className="login-pro-primary" type="submit" disabled={loading}>
              {loading ? (
                <><Loader2 className="login-pro-spin" /> جارٍ التحقق…</>
              ) : (
                <><LogIn /> {loginMode === "staff" ? "تسجيل الدخول" : "دخول الطالب"}</>
              )}
            </button>
          </form>

          {loginMode === "staff" && (
            <button
              type="button"
              className="login-pro-link"
              onClick={() => showToast("سنفعّل استعادة كلمة المرور في مرحلة لاحقة.", "info")}
            >
              نسيت كلمة المرور؟ <ArrowLeft />
            </button>
          )}

          <div className="login-pro-register">
            <div>
              <strong>ليس لديك حساب؟</strong>
              <span>أنشئ حساب مشرف أو معلم أو طالب.</span>
            </div>
            <button type="button" onClick={() => navigate("/register")}>
              <UserRoundPlus /> إنشاء حساب
            </button>
          </div>

          <div className="login-pro-security">
            <ShieldCheck /> الصلاحية يحددها الحساب نفسه، وليس اختيارًا من صفحة الدخول.
          </div>
        </section>
      </section>
    </main>
  );
}

function FormInput({ label, type = "text", value, onChange, placeholder, icon: Icon, dir = "rtl" }) {
  return (
    <div className="login-pro-field">
      <label>{label}</label>
      <div className="login-pro-input-wrap">
        <Icon className="login-pro-input-icon" />
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={type === "email" ? "email" : "off"}
          dir={dir}
        />
      </div>
    </div>
  );
}

function getDestination(role) {
  if (role === "admin") return "/system-admin";
  if (role === "supervisor") return "/admin";
  if (role === "teacher") return "/teacher";
  if (role === "student") return "/student";
  return "/login";
}

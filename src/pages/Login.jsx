import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useToast } from "../components/Toast";
import {
  ArrowLeft,
  BookOpenCheck,
  Eye,
  EyeOff,
  GraduationCap,
  House,
  Loader2,
  LockKeyhole,
  LogIn,
  Zap,
  CheckCircle2,
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
  const [rememberLogin, setRememberLogin] = useState(true);
  const [quickAccounts, setQuickAccounts] = useState([]);

  const dua = useMemo(
    () => DUAS[Math.floor(Math.random() * DUAS.length)],
    []
  );

  useEffect(() => {
    try {
      const remembered = localStorage.getItem("sadiq_remember_login");
      if (remembered) {
        const parsed = JSON.parse(remembered);
        setRememberLogin(parsed.enabled !== false);
        if (parsed.mode === "staff" && parsed.identifier) {
          setLoginMode("staff");
          setIdentifier(parsed.identifier);
        } else if (parsed.mode === "student" && parsed.identifier) {
          setLoginMode("student");
          setIdentifier(parsed.identifier);
          setStudentNumber(parsed.studentNumber || "");
        }
      }

      const accounts = JSON.parse(localStorage.getItem("sadiq_quick_accounts") || "[]");
      if (Array.isArray(accounts)) setQuickAccounts(accounts.slice(0, 4));
    } catch (error) {
      console.warn("Could not read saved login preferences:", error);
    }
  }, []);

  function rememberSuccessfulLogin(account) {
    try {
      if (!rememberLogin) {
        localStorage.removeItem("sadiq_remember_login");
        return;
      }

      localStorage.setItem("sadiq_remember_login", JSON.stringify({
        enabled: true,
        mode: account.mode,
        identifier: account.identifier,
        studentNumber: account.studentNumber || "",
      }));

      const existing = JSON.parse(localStorage.getItem("sadiq_quick_accounts") || "[]");
      const next = [
        account,
        ...(Array.isArray(existing) ? existing : []).filter(
          (item) => !(item.mode === account.mode && item.identifier === account.identifier)
        ),
      ].slice(0, 4);
      localStorage.setItem("sadiq_quick_accounts", JSON.stringify(next));
      setQuickAccounts(next);
    } catch (error) {
      console.warn("Could not save login preference:", error);
    }
  }

  async function chooseQuickAccount(account) {
    if (loading) return;

    setLoginMode(account.mode);
    setIdentifier(account.identifier || "");
    setStudentNumber(account.studentNumber || "");
    setPassword(account.password || "");
    setErrorMessage("");

    if (account.mode === "staff" && !account.password) {
      setErrorMessage("هذا الحساب محفوظ من إصدار سابق. أدخل كلمة المرور مرة واحدة ليتم تفعيل الدخول السريع.");
      return;
    }

    setLoading(true);
    try {
      if (account.mode === "staff") {
        await handleStaffLogin(account.identifier, account.password);
      } else {
        await handleStudentLogin(account.identifier, account.studentNumber);
      }
    } catch (error) {
      console.error("Quick login error:", error);
      setErrorMessage(error?.message || "تعذر تسجيل الدخول السريع.");
    } finally {
      setLoading(false);
    }
  }

  function removeQuickAccount(event, account) {
    event.stopPropagation();
    const next = quickAccounts.filter(
      (item) => !(item.mode === account.mode && item.identifier === account.identifier)
    );
    setQuickAccounts(next);
    localStorage.setItem("sadiq_quick_accounts", JSON.stringify(next));
  }

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

  async function handleStaffLogin(emailOverride, passwordOverride) {
    const email = (emailOverride ?? identifier).trim().toLowerCase();
    const loginPassword = passwordOverride ?? password;

    if (!email) throw new Error("يرجى إدخال البريد الإلكتروني.");
    if (!loginPassword) throw new Error("يرجى إدخال كلمة المرور.");

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: loginPassword,
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

    rememberSuccessfulLogin({
      mode: "staff",
      identifier: email,
      password: loginPassword,
      label: profile.full_name || email,
      role: profile.role,
    });

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

  async function handleStudentLogin(nameOverride, studentNumberOverride) {
    const fullName = (nameOverride ?? identifier).trim();
    const userNumber = (studentNumberOverride ?? studentNumber).trim().toUpperCase();

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

  let serverMessage = "";
  let status = error?.context?.status || "";

  try {
    if (error?.context) {
      const responseText = await error.context.clone().text();

      console.log(
        "student-login status:",
        error.context.status
      );

      console.log(
        "student-login response:",
        responseText
      );

      try {
        const parsed = JSON.parse(responseText);

        serverMessage =
          parsed?.message ||
          parsed?.error ||
          parsed?.details ||
          "";
      } catch {
        serverMessage = responseText;
      }
    }
  } catch (readError) {
    console.error(
      "Failed to read student-login response:",
      readError
    );
  }

  throw new Error(
    serverMessage ||
      `تعذر تسجيل دخول الطالب${
        status ? ` — رمز الخطأ ${status}` : ""
      }`
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

    rememberSuccessfulLogin({
      mode: "student",
      identifier: fullName,
      studentNumber: userNumber,
      label: data?.profile?.full_name || fullName,
      role: "student",
    });

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
      <button
        type="button"
        className="login-pro-home"
        onClick={() => navigate("/")}
        aria-label="العودة للصفحة الرئيسية"
        title="العودة للصفحة الرئيسية"
      >
        <House />
      </button>

      <div className="login-pro-geometry login-pro-geometry-top" aria-hidden="true">
        <IslamicLoginOrnament />
      </div>

      <div className="login-pro-geometry login-pro-geometry-bottom" aria-hidden="true">
        <IslamicLoginOrnament compact />
      </div>

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

          {quickAccounts.length > 0 && (
            <section className="login-quick-access">
              <div className="login-quick-head">
                <div>
                  <span><Zap size={14}/> الوصول السريع</span>
                  <small>اختر حسابًا استخدمته سابقًا على هذا الجهاز</small>
                </div>
                <span className="login-quick-local"><ShieldCheck size={13}/> محفوظ على هذا الجهاز</span>
              </div>
              <div className="login-quick-list">
                {quickAccounts.map((account, index) => (
                  <button
                    type="button"
                    className={`login-quick-account ${loginMode === account.mode && identifier === account.identifier ? "selected" : ""}`}
                    key={`${account.mode}-${account.identifier}-${index}`}
                    onClick={() => chooseQuickAccount(account)}
                  >
                    <span className="login-quick-avatar">
                      {account.mode === "student" ? <GraduationCap size={17}/> : <UserRound size={17}/>}
                    </span>
                    <span className="login-quick-copy">
                      <strong>{account.label || account.identifier}</strong>
                      <small>{account.mode === "student" ? `طالب • ${account.studentNumber || ""}` : account.identifier}</small>
                    </span>
                    <span className="login-quick-check"><CheckCircle2 size={16}/></span>
                    <span
                      role="button"
                      tabIndex={0}
                      className="login-quick-remove"
                      title="إزالة من الوصول السريع"
                      onClick={(event) => removeQuickAccount(event, account)}
                    >×</span>
                  </button>
                ))}
              </div>
            </section>
          )}

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

            <label className="login-remember-row">
              <input
                type="checkbox"
                checked={rememberLogin}
                onChange={(e) => {
                  setRememberLogin(e.target.checked);
                  if (!e.target.checked) localStorage.removeItem("sadiq_remember_login");
                }}
              />
              <span className="login-remember-toggle"><i /></span>
              <span className="login-remember-copy">
                <strong>حفظ تسجيل الدخول</strong>
                <small>يحفظ بيانات الدخول على هذا الجهاز لتفعيل الدخول المباشر من «الوصول السريع».</small>
              </span>
            </label>

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

function IslamicLoginOrnament({ compact = false }) {
  return (
    <svg
      viewBox="0 0 220 220"
      className={compact ? "login-pro-geometry-svg compact" : "login-pro-geometry-svg"}
      aria-hidden="true"
    >
      <g
        fill="none"
        stroke="currentColor"
        strokeWidth={compact ? "1.5" : "1.25"}
        vectorEffect="non-scaling-stroke"
      >
        <circle cx="110" cy="110" r="92" />
        <circle cx="110" cy="110" r="70" />
        <polygon points="110,18 128,76 186,58 144,100 202,118 144,136 186,178 128,160 110,202 92,160 34,178 76,136 18,118 76,100 34,58 92,76" />
        <polygon points="110,42 132,88 178,110 132,132 110,178 88,132 42,110 88,88" />
        <polygon points="110,64 126,94 156,110 126,126 110,156 94,126 64,110 94,94" />
        <circle cx="110" cy="110" r="18" />
      </g>
      <g fill="currentColor" opacity="0.15">
        <circle cx="110" cy="18" r="3.2" />
        <circle cx="202" cy="118" r="3.2" />
        <circle cx="110" cy="202" r="3.2" />
        <circle cx="18" cy="118" r="3.2" />
      </g>
    </svg>
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

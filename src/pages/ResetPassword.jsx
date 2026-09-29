import { OrnamentScene } from "../components/ornaments/Ornament";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Check,
  CheckCircle2,
  Eye,
  EyeOff,
  House,
  KeyRound,
  Loader2,
  LockKeyhole,
  RefreshCcw,
  ShieldCheck,
  Sparkles,
  XCircle,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import "./AuthRecovery.css";

function recoveryMarkerExists() {
  const url = new URL(window.location.href);
  const hash = window.location.hash || "";

  return (
    url.searchParams.get("type") === "recovery" ||
    hash.includes("type=recovery") ||
    url.searchParams.has("code")
  );
}

function passwordScore(password) {
  const value = String(password || "");
  let score = 0;

  if (value.length >= 8) score += 1;
  if (value.length >= 12) score += 1;
  if (/[A-Za-z\u0600-\u06FF]/.test(value) && /\d/.test(value)) score += 1;
  if (/[^A-Za-z0-9\u0600-\u06FF]/.test(value)) score += 1;

  return Math.min(4, score);
}

export default function ResetPassword() {
  const navigate = useNavigate();
  const [status, setStatus] = useState("checking");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const strength = useMemo(() => passwordScore(password), [password]);
  const strengthLabel = ["", "مقبولة", "جيدة", "قوية", "قوية جدًا"][strength] || "";

  useEffect(() => {
    let mounted = true;
    let recoveryEventSeen = false;

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!mounted) return;

        if (event === "PASSWORD_RECOVERY" && session) {
          recoveryEventSeen = true;
          setStatus("ready");
          setErrorMessage("");
        }
      }
    );

    async function verifyRecoverySession() {
      try {
        const url = new URL(window.location.href);
        const code = url.searchParams.get("code");

        if (code) {
          const { data, error } = await supabase.auth.exchangeCodeForSession(code);

          if (!mounted) return;

          if (!error && data?.session) {
            recoveryEventSeen = true;
            setStatus("ready");
            window.history.replaceState({}, document.title, "/reset-password");
            return;
          }
        }

        const { data, error } = await supabase.auth.getSession();
        if (!mounted) return;

        if (error) throw error;

        if (data?.session && (recoveryMarkerExists() || recoveryEventSeen)) {
          setStatus("ready");
          return;
        }

        window.setTimeout(() => {
          if (mounted && !recoveryEventSeen) {
            setStatus((current) => current === "ready" ? current : "invalid");
          }
        }, 900);
      } catch (error) {
        console.error("Recovery session verification error:", error);
        if (mounted) setStatus("invalid");
      }
    }

    verifyRecoverySession();

    return () => {
      mounted = false;
      authListener?.subscription?.unsubscribe?.();
    };
  }, []);

  function validatePassword() {
    if (password.length < 8) {
      return "استخدم كلمة مرور لا تقل عن 8 أحرف.";
    }

    if (password !== confirmPassword) {
      return "تأكيد كلمة المرور غير مطابق.";
    }

    return "";
  }

  async function handleReset(event) {
    event.preventDefault();
    if (loading || status !== "ready") return;

    const validationMessage = validatePassword();
    if (validationMessage) {
      setErrorMessage(validationMessage);
      return;
    }

    setLoading(true);
    setErrorMessage("");

    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        if (/same password/i.test(error.message || "")) {
          throw new Error("اختر كلمة مرور جديدة تختلف عن كلمة المرور السابقة.");
        }

        throw new Error("تعذر تحديث كلمة المرور. اطلب رابط استعادة جديد وحاول مرة أخرى.");
      }

      try {
        await supabase.auth.signOut({ scope: "global" });
      } catch (signOutError) {
        console.warn("Could not revoke all sessions after recovery:", signOutError);
      }

      setStatus("success");
      setPassword("");
      setConfirmPassword("");
    } catch (error) {
      console.error("Password update error:", error);
      setErrorMessage(error?.message || "تعذر تعيين كلمة المرور الجديدة.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="recovery-page">
      <button
        type="button"
        className="recovery-home"
        onClick={() => navigate("/")}
        aria-label="العودة إلى الصفحة الرئيسية"
        title="العودة إلى الصفحة الرئيسية"
      >
        <House />
      </button>

      <OrnamentScene variant="public" palette="emerald" interactive={false} />

      <section className="recovery-shell">
        <aside className="recovery-showcase">
          <OrnamentScene variant="auth" primary="02-shams" pattern="06-naseej" />

          <div className="recovery-showcase-inner">
            <div className="recovery-logo-box">
              <img src="/icon-512.png" alt="الصديق" />
            </div>

            <div className="recovery-kicker">
              <Sparkles />
              حماية الحساب تبدأ بكلمة مرور قوية
            </div>

            <h1>
              كلمة مرور جديدة
              <span>خطوة أخيرة للعودة إلى حسابك بأمان</span>
            </h1>

            <p>
              اختر كلمة مرور خاصة بهذا الحساب ولا تستخدمها في خدمات أخرى.
              بعد الحفظ سننهي جلسات الدخول السابقة كإجراء أمني إضافي.
            </p>

            <div className="recovery-feature-list">
              <div><ShieldCheck /> حماية جلسات الحساب السابقة</div>
              <div><LockKeyhole /> كلمة المرور لا تُخزن داخل واجهة الصديق</div>
              <div><KeyRound /> دخول جديد بكلمة المرور التي تختارها</div>
            </div>

            <div className="recovery-security-note">
              <ShieldCheck />
              <div>
                <span>أفضل ممارسة</span>
                <strong>استخدم كلمة مرور طويلة وفريدة وتجنب البيانات الشخصية.</strong>
              </div>
            </div>
          </div>
        </aside>

        <section className="recovery-card">
          <div className="recovery-mobile-brand">
            <img src="/icon-512.png" alt="الصديق" />
            <div>
              <strong>الصِّدّيق</strong>
              <span>تعيين كلمة مرور جديدة</span>
            </div>
          </div>

          {status === "checking" && (
            <div className="recovery-state-center" aria-live="polite">
              <div className="recovery-checking-icon"><Loader2 className="recovery-spin" /></div>
              <h2>جارٍ التحقق من رابط الاستعادة</h2>
              <p>نتأكد من صلاحية الرابط والجلسة الآمنة قبل إظهار نموذج كلمة المرور.</p>
            </div>
          )}

          {status === "invalid" && (
            <div className="recovery-state-center" aria-live="polite">
              <div className="recovery-invalid-icon"><XCircle /></div>
              <div className="recovery-eyebrow"><KeyRound /> الرابط غير صالح</div>
              <h2>انتهت صلاحية رابط الاستعادة</h2>
              <p>
                قد يكون الرابط قديمًا أو تم استخدامه سابقًا. اطلب رابطًا جديدًا
                من صفحة استعادة كلمة المرور.
              </p>
              <button
                type="button"
                className="recovery-primary"
                onClick={() => navigate("/forgot-password", { replace: true })}
              >
                <RefreshCcw /> طلب رابط جديد
              </button>
            </div>
          )}

          {status === "ready" && (
            <>
              <header className="recovery-heading">
                <div className="recovery-eyebrow"><KeyRound /> رابط الاستعادة صالح</div>
                <h2>أنشئ كلمة المرور الجديدة</h2>
                <p>
                  اجعلها طويلة وفريدة. بعد الحفظ استخدمها عند دخول الإدارة.
                </p>
              </header>

              <form className="recovery-form" onSubmit={handleReset}>
                <label className="recovery-field">
                  <span>كلمة المرور الجديدة</span>
                  <div className="recovery-input-wrap">
                    <LockKeyhole className="recovery-input-icon" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(event) => {
                        setPassword(event.target.value);
                        if (errorMessage) setErrorMessage("");
                      }}
                      placeholder="8 أحرف على الأقل"
                      autoComplete="new-password"
                      autoFocus
                    />
                    <button
                      type="button"
                      className="recovery-eye"
                      onClick={() => setShowPassword((value) => !value)}
                      aria-label={showPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
                    >
                      {showPassword ? <EyeOff /> : <Eye />}
                    </button>
                  </div>
                </label>

                <div className="recovery-strength" data-score={strength}>
                  <div className="recovery-strength-bars">
                    {[1, 2, 3, 4].map((item) => (
                      <span key={item} className={strength >= item ? "active" : ""} />
                    ))}
                  </div>
                  <div className="recovery-strength-copy">
                    <span>قوة كلمة المرور</span>
                    <strong>{password ? strengthLabel : "ابدأ بالكتابة"}</strong>
                  </div>
                </div>

                <div className="recovery-requirements">
                  <div className={password.length >= 8 ? "done" : ""}>
                    <Check /> 8 أحرف على الأقل
                  </div>
                  <div className={/[A-Za-z\u0600-\u06FF]/.test(password) && /\d/.test(password) ? "done" : ""}>
                    <Check /> حروف وأرقام
                  </div>
                  <div className={/[^A-Za-z0-9\u0600-\u06FF]/.test(password) ? "done" : ""}>
                    <Check /> رمز خاص لزيادة القوة
                  </div>
                </div>

                <label className="recovery-field">
                  <span>تأكيد كلمة المرور</span>
                  <div className="recovery-input-wrap">
                    <LockKeyhole className="recovery-input-icon" />
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(event) => {
                        setConfirmPassword(event.target.value);
                        if (errorMessage) setErrorMessage("");
                      }}
                      placeholder="أعد كتابة كلمة المرور"
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      className="recovery-eye"
                      onClick={() => setShowConfirmPassword((value) => !value)}
                      aria-label={showConfirmPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
                    >
                      {showConfirmPassword ? <EyeOff /> : <Eye />}
                    </button>
                  </div>
                </label>

                {confirmPassword && password === confirmPassword && (
                  <div className="recovery-match"><CheckCircle2 /> كلمتا المرور متطابقتان</div>
                )}

                {errorMessage && (
                  <div className="recovery-error" role="alert">{errorMessage}</div>
                )}

                <button
                  className="recovery-primary"
                  type="submit"
                  disabled={loading}
                >
                  {loading ? (
                    <><Loader2 className="recovery-spin" /> جارٍ تأمين الحساب…</>
                  ) : (
                    <><ShieldCheck /> حفظ كلمة المرور الجديدة</>
                  )}
                </button>
              </form>
            </>
          )}

          {status === "success" && (
            <div className="recovery-success" aria-live="polite">
              <div className="recovery-success-icon"><CheckCircle2 /></div>
              <div className="recovery-eyebrow"><ShieldCheck /> تم تأمين الحساب</div>
              <h2>تم تغيير كلمة المرور بنجاح</h2>
              <p>
                تم حفظ كلمة المرور الجديدة وإنهاء جلسات الدخول السابقة للحساب.
                يمكنك الآن تسجيل الدخول من جديد بأمان.
              </p>
              <button
                type="button"
                className="recovery-primary"
                onClick={() => navigate("/login", { replace: true })}
              >
                <KeyRound /> تسجيل الدخول الآن
              </button>
            </div>
          )}

          {status !== "success" && status !== "checking" && (
            <button
              type="button"
              className="recovery-back"
              onClick={() => navigate("/login")}
            >
              <ArrowRight /> العودة إلى تسجيل الدخول
            </button>
          )}
        </section>
      </section>
    </main>
  );
}

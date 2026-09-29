import { OrnamentScene } from "../components/ornaments/Ornament";
import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle2,
  Clock3,
  House,
  Loader2,
  LockKeyhole,
  Mail,
  Send,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import "./AuthRecovery.css";

const RESEND_SECONDS = 45;

function maskEmail(value) {
  const email = String(value || "").trim();
  const [name, domain] = email.split("@");
  if (!name || !domain) return email;

  if (name.length <= 2) {
    return `${name[0] || ""}***@${domain}`;
  }

  return `${name.slice(0, 2)}${"•".repeat(Math.min(5, name.length - 2))}@${domain}`;
}

function getRecoveryRedirectUrl() {
  const configuredUrl = String(import.meta.env.VITE_PUBLIC_SITE_URL || "").trim();
  const base = (configuredUrl || window.location.origin).replace(/\/$/, "");
  return `${base}/reset-password`;
}

export default function ForgotPassword() {
  const navigate = useNavigate();
  const location = useLocation();

  const initialEmail = useMemo(
    () => String(location.state?.email || "").trim().toLowerCase(),
    [location.state]
  );

  const [email, setEmail] = useState(initialEmail);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (!cooldown) return undefined;

    const timer = window.setInterval(() => {
      setCooldown((value) => Math.max(0, value - 1));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [cooldown]);

  async function sendRecoveryEmail(event) {
    event?.preventDefault?.();
    if (loading || cooldown > 0) return;

    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      setErrorMessage("أدخل البريد الإلكتروني المرتبط بحساب الإدارة.");
      return;
    }

    if (!/^\S+@\S+\.\S+$/.test(normalizedEmail)) {
      setErrorMessage("تأكد من كتابة البريد الإلكتروني بصيغة صحيحة.");
      return;
    }

    setLoading(true);
    setErrorMessage("");

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(
        normalizedEmail,
        {
          redirectTo: getRecoveryRedirectUrl(),
        }
      );

      if (error) {
        if (error.status === 429 || /rate|limit|too many/i.test(error.message || "")) {
          throw new Error("تم إرسال طلب استعادة مؤخرًا. انتظر قليلًا ثم أعد المحاولة.");
        }

        throw new Error("تعذر إرسال رابط الاستعادة الآن. حاول مرة أخرى بعد قليل.");
      }

      setEmail(normalizedEmail);
      setSent(true);
      setCooldown(RESEND_SECONDS);
    } catch (error) {
      console.error("Password recovery email error:", error);
      setErrorMessage(
        error?.message || "تعذر إرسال رابط الاستعادة الآن. حاول مرة أخرى."
      );
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
          <OrnamentScene variant="auth" primary="04-madar" pattern="06-naseej" />

          <div className="recovery-showcase-inner">
            <div className="recovery-logo-box">
              <img src="/icon-512.png" alt="الصديق" />
            </div>

            <div className="recovery-kicker">
              <Sparkles />
              استعادة آمنة وسريعة
            </div>

            <h1>
              استعد حسابك
              <span>بخطوات واضحة، ومن دون المساس ببياناتك</span>
            </h1>

            <p>
              نرسل رابطًا آمنًا إلى البريد المرتبط بالحساب. الرابط مخصص
              لتعيين كلمة مرور جديدة، ولا نطلب منك إرسال كلمة المرور لأي شخص.
            </p>

            <div className="recovery-feature-list">
              <div><ShieldCheck /> رابط استعادة آمن</div>
              <div><LockKeyhole /> كلمة المرور الجديدة لا تظهر للإدارة</div>
              <div><Clock3 /> الرابط مخصص للاستخدام خلال مدة محدودة</div>
            </div>

            <div className="recovery-security-note">
              <ShieldCheck />
              <div>
                <span>تنبيه أمني</span>
                <strong>فريق الصديق لن يطلب منك كلمة المرور أو رمز التحقق.</strong>
              </div>
            </div>
          </div>
        </aside>

        <section className="recovery-card">
          <div className="recovery-mobile-brand">
            <img src="/icon-512.png" alt="الصديق" />
            <div>
              <strong>الصِّدّيق</strong>
              <span>استعادة كلمة المرور</span>
            </div>
          </div>

          {!sent ? (
            <>
              <header className="recovery-heading">
                <div className="recovery-eyebrow"><LockKeyhole /> استعادة الحساب</div>
                <h2>نسيت كلمة المرور؟</h2>
                <p>
                  أدخل البريد الإلكتروني المستخدم في حساب مدير النظام أو المشرف
                  أو المعلم، وسنرسل إليه رابط الاستعادة.
                </p>
              </header>

              <form className="recovery-form" onSubmit={sendRecoveryEmail}>
                <label className="recovery-field">
                  <span>البريد الإلكتروني</span>
                  <div className="recovery-input-wrap">
                    <Mail className="recovery-input-icon" />
                    <input
                      type="email"
                      value={email}
                      onChange={(event) => {
                        setEmail(event.target.value);
                        if (errorMessage) setErrorMessage("");
                      }}
                      placeholder="name@example.com"
                      autoComplete="email"
                      inputMode="email"
                      dir="ltr"
                      autoFocus
                    />
                  </div>
                </label>

                {errorMessage && (
                  <div className="recovery-error" role="alert">
                    {errorMessage}
                  </div>
                )}

                <button
                  className="recovery-primary"
                  type="submit"
                  disabled={loading}
                >
                  {loading ? (
                    <><Loader2 className="recovery-spin" /> جارٍ تجهيز رابط الاستعادة…</>
                  ) : (
                    <><Send /> إرسال رابط الاستعادة</>
                  )}
                </button>
              </form>

              <div className="recovery-privacy-card">
                <ShieldCheck />
                <p>
                  للحفاظ على الخصوصية، لن نؤكد ما إذا كان البريد مسجلًا في النظام.
                  إذا كان مرتبطًا بحساب صالح فسيصلك رابط الاستعادة.
                </p>
              </div>
            </>
          ) : (
            <div className="recovery-success" aria-live="polite">
              <div className="recovery-success-icon">
                <CheckCircle2 />
              </div>

              <div className="recovery-eyebrow"><Mail /> تم إرسال الطلب</div>
              <h2>تحقق من بريدك الإلكتروني</h2>
              <p>
                إذا كان الحساب مرتبطًا بالبريد التالي، فستصلك رسالة تتضمن رابطًا
                آمنًا لتعيين كلمة مرور جديدة.
              </p>

              <div className="recovery-email-pill" dir="ltr">
                <Mail />
                <strong>{maskEmail(email)}</strong>
              </div>

              <div className="recovery-steps">
                <div><span>1</span><p>افتح رسالة الاستعادة من بريدك.</p></div>
                <div><span>2</span><p>اضغط رابط تعيين كلمة المرور الجديدة.</p></div>
                <div><span>3</span><p>أنشئ كلمة مرور قوية ثم سجّل الدخول من جديد.</p></div>
              </div>

              <button
                type="button"
                className="recovery-secondary"
                onClick={sendRecoveryEmail}
                disabled={loading || cooldown > 0}
              >
                {loading ? (
                  <><Loader2 className="recovery-spin" /> جارٍ الإرسال…</>
                ) : cooldown > 0 ? (
                  <><Clock3 /> إعادة الإرسال بعد {cooldown}ث</>
                ) : (
                  <><Mail /> إعادة إرسال الرابط</>
                )}
              </button>
            </div>
          )}

          <button
            type="button"
            className="recovery-back"
            onClick={() => navigate("/login", { replace: false })}
          >
            <ArrowLeft /> العودة إلى تسجيل الدخول
          </button>
        </section>
      </section>
    </main>
  );
}

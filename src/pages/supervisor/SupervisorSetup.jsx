import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  Loader2,
  LogOut,
  MapPin,
  NotebookPen,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { supabase } from "../../lib/supabase";
import "./SupervisorSetup.css";

export default function SupervisorSetup() {
  const navigate = useNavigate();

  const [checking, setChecking] = useState(true);
  const [saving, setSaving] = useState(false);
  const [blocked, setBlocked] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const [supervisorNumber, setSupervisorNumber] = useState("");
  const [mosqueName, setMosqueName] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");

  const canSubmit = useMemo(
    () =>
      mosqueName.trim().length >= 3 &&
      address.trim().length >= 3 &&
      !saving,
    [mosqueName, address, saving]
  );

  useEffect(() => {
    let cancelled = false;

    async function checkOnboarding() {
      try {
        setChecking(true);
        setBlocked("");
        setErrorMessage("");

        const {
          data: authData,
          error: authError,
        } = await supabase.auth.getUser();

        if (authError || !authData?.user) {
          navigate("/login", { replace: true });
          return;
        }

        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("role, status, is_active")
          .eq("auth_user_id", authData.user.id)
          .maybeSingle();

        if (
          profileError ||
          !profile ||
          profile.role !== "supervisor" ||
          profile.status !== "active" ||
          profile.is_active === false
        ) {
          navigate("/login", { replace: true });
          return;
        }

        const {
          data,
          error,
        } = await supabase.rpc(
          "get_my_supervisor_onboarding"
        );

        if (error) throw error;

        const row = Array.isArray(data) ? data[0] : null;

        if (!row) {
          throw new Error(
            "تعذر قراءة حالة إعداد حساب المشرف."
          );
        }

        if (cancelled) return;

        setSupervisorNumber(row.supervisor_number || "");

        if (row.has_mosque) {
          navigate("/admin", { replace: true });
          return;
        }

        if (!row.needs_setup || !row.can_create_mosque) {
          setBlocked(
            "هذا الحساب لا يملك صلاحية إنشاء مسجد جديد. إذا كان يجب ربطك بمسجد قائم فتواصل مع مدير النظام."
          );
        }
      } catch (error) {
        console.error(
          "Supervisor setup check error:",
          error
        );

        if (!cancelled) {
          setErrorMessage(
            "تعذر التحقق من حالة حساب المشرف."
          );
        }
      } finally {
        if (!cancelled) setChecking(false);
      }
    }

    checkOnboarding();

    return () => {
      cancelled = true;
    };
  }, [navigate]);

  async function handleCreateMosque(event) {
    event.preventDefault();

    if (!canSubmit) return;

    setSaving(true);
    setErrorMessage("");

    try {
      const {
        data,
        error,
      } = await supabase.rpc(
        "create_my_supervisor_mosque",
        {
          p_name: mosqueName.trim(),
          p_address: address.trim(),
          p_notes: notes.trim() || null,
        }
      );

      if (error) {
        console.error(
          "Create supervisor mosque error:",
          error
        );

        const message = String(error.message || "");

        if (message.includes("MOSQUE_ALREADY_EXISTS")) {
          throw new Error(
            "يوجد مسجد مطابق لهذا الاسم والعنوان بالفعل. لن ننشئ نسخة مكررة."
          );
        }

        if (
          message.includes(
            "SUPERVISOR_ALREADY_HAS_MOSQUE"
          )
        ) {
          navigate("/admin", { replace: true });
          return;
        }

        if (
          message.includes(
            "SUPERVISOR_NOT_ALLOWED_TO_CREATE_MOSQUE"
          )
        ) {
          throw new Error(
            "رمز حسابك لا يسمح بإنشاء مسجد جديد."
          );
        }

        throw new Error(
          "تعذر إنشاء المسجد. تحقق من البيانات وحاول مرة أخرى."
        );
      }

      const mosque = Array.isArray(data) ? data[0] : null;

      if (!mosque?.mosque_id) {
        throw new Error(
          "تم تنفيذ الطلب لكن لم تصل بيانات المسجد الجديدة."
        );
      }

      navigate("/admin", {
        replace: true,
        state: {
          onboardingCompleted: true,
          mosqueId: mosque.mosque_id,
          mosqueName: mosque.mosque_name,
        },
      });
    } catch (error) {
      console.error(
        "Supervisor onboarding submit error:",
        error
      );

      setErrorMessage(
        error?.message ||
          "حدث خطأ غير متوقع أثناء إنشاء المسجد."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    navigate("/login", { replace: true });
  }

  if (checking) {
    return (
      <main className="supervisor-setup-page">
        <section className="supervisor-setup-loading">
          <Loader2 />
          <strong>جاري تجهيز حساب المشرف…</strong>
          <span>
            نتحقق من صلاحية الحساب وربطه بالمسجد.
          </span>
        </section>
      </main>
    );
  }

  return (
    <main className="supervisor-setup-page">
      <div className="supervisor-setup-orb one" />
      <div className="supervisor-setup-orb two" />

      <section className="supervisor-setup-shell">
        <aside className="supervisor-setup-side">
          <div className="supervisor-setup-logo">
            <img src="/icon-512.png" alt="الصديق" />
          </div>

          <div className="supervisor-setup-kicker">
            <Sparkles />
            البداية الصحيحة تصنع إدارة أقوى
          </div>

          <h1>
            لنُعِد مسجدك
            <span>ثم تبدأ لوحة الإشراف الحقيقية</span>
          </h1>

          <p>
            هذه الخطوة تظهر فقط للمشرف المؤسس الذي يملك
            رمز تفعيل يسمح بإنشاء مسجد جديد.
          </p>

          <div className="supervisor-setup-steps">
            <div className="done">
              <CheckCircle2 />
              <span>
                <strong>الحساب جاهز</strong>
                <small>
                  رقم المشرف {supervisorNumber || "—"}
                </small>
              </span>
            </div>

            <div className="active">
              <Building2 />
              <span>
                <strong>إعداد المسجد</strong>
                <small>الاسم والعنوان والبيانات الأساسية</small>
              </span>
            </div>

            <div>
              <ShieldCheck />
              <span>
                <strong>الربط التلقائي</strong>
                <small>
                  سيتم ربط حسابك بالمسجد فور الإنشاء
                </small>
              </span>
            </div>
          </div>
        </aside>

        <section className="supervisor-setup-card">
          <header>
            <div className="supervisor-setup-eyebrow">
              <Building2 />
              إعداد المسجد
            </div>

            <h2>بيانات المسجد الأساسية</h2>

            <p>
              اكتب الاسم والعنوان بدقة. النظام يمنع إنشاء
              مسجد مطابق لنفس الاسم والعنوان.
            </p>
          </header>

          {blocked ? (
            <div className="supervisor-setup-blocked">
              <ShieldCheck />
              <strong>لا يمكن إنشاء مسجد من هذا الحساب</strong>
              <p>{blocked}</p>

              <button
                type="button"
                onClick={handleSignOut}
              >
                <LogOut />
                تسجيل الخروج
              </button>
            </div>
          ) : (
            <form onSubmit={handleCreateMosque}>
              <SetupField
                label="اسم المسجد"
                value={mosqueName}
                onChange={setMosqueName}
                placeholder="مثال: مسجد النور"
                icon={Building2}
                required
              />

              <SetupField
                label="العنوان"
                value={address}
                onChange={setAddress}
                placeholder="المدينة، الحي، الشارع"
                icon={MapPin}
                required
              />

              <div className="supervisor-setup-field">
                <label>ملاحظات — اختياري</label>

                <div className="supervisor-setup-textarea-wrap">
                  <NotebookPen />

                  <textarea
                    value={notes}
                    onChange={(event) =>
                      setNotes(event.target.value)
                    }
                    placeholder="أي معلومات إضافية تساعد في تعريف المسجد…"
                    maxLength={500}
                  />
                </div>

                <span className="supervisor-setup-counter">
                  {notes.length}/500
                </span>
              </div>

              <div className="supervisor-setup-notice">
                <ShieldCheck />
                <span>
                  سيتم التحقق من صلاحية حسابك لإنشاء المسجد قبل الحفظ.
                </span>
              </div>

              {errorMessage && (
                <div
                  className="supervisor-setup-error"
                  role="alert"
                >
                  {errorMessage}
                </div>
              )}

              <button
                type="submit"
                className="supervisor-setup-submit"
                disabled={!canSubmit}
              >
                {saving ? (
                  <>
                    <Loader2 className="spin" />
                    جارٍ إنشاء المسجد وربط الحساب…
                  </>
                ) : (
                  <>
                    إنشاء المسجد والمتابعة
                    <ArrowLeft />
                  </>
                )}
              </button>

              <button
                type="button"
                className="supervisor-setup-signout"
                onClick={handleSignOut}
                disabled={saving}
              >
                <LogOut />
                تسجيل الخروج
              </button>
            </form>
          )}
        </section>
      </section>
    </main>
  );
}

function SetupField({
  label,
  value,
  onChange,
  placeholder,
  icon: Icon,
  required = false,
}) {
  return (
    <div className="supervisor-setup-field">
      <label>
        {label}
        {required && <span> *</span>}
      </label>

      <div className="supervisor-setup-input-wrap">
        <Icon />

        <input
          value={value}
          onChange={(event) =>
            onChange(event.target.value)
          }
          placeholder={placeholder}
          autoComplete="off"
        />
      </div>
    </div>
  );
}

import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ClipboardCopy,
  Eye,
  EyeOff,
  GraduationCap,
  Loader2,
  LockKeyhole,
  Mail,
  Phone,
  ShieldCheck,
  Sparkles,
  UserRound,
  UserRoundPlus,
  UsersRound,
} from "lucide-react";
import "./Register.css";

const ROLE_OPTIONS = [
  {
    value: "supervisor",
    title: "مشرف",
    description: "إدارة مسجد ومتابعة الحلقات والمعلمين والطلبات.",
    icon: ShieldCheck,
    badge: "يتطلب رمز تفعيل",
  },
  {
    value: "teacher",
    title: "معلم",
    description: "إنشاء حساب ثم طلب الانضمام إلى مسجد وحلقة.",
    icon: UsersRound,
    badge: "بريد + كلمة مرور",
  },
  {
    value: "student",
    title: "طالب",
    description: "الحصول على رقم طالب ثم اختيار المسجد والحلقة.",
    icon: GraduationCap,
    badge: "الاسم + رقم الطالب",
  },
];

const STEPS = [
  { value: 1, label: "نوع الحساب" },
  { value: 2, label: "البيانات" },
  { value: 3, label: "المراجعة" },
];

export default function Register() {
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [role, setRole] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [acceptedAccuracy, setAcceptedAccuracy] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [result, setResult] = useState(null);

  const selectedRole = useMemo(
    () => ROLE_OPTIONS.find((item) => item.value === role),
    [role]
  );

  function clearError() {
    if (errorMessage) setErrorMessage("");
  }

  function validateStepOne() {
    if (!role) {
      setErrorMessage("اختر نوع الحساب للمتابعة.");
      return false;
    }

    setErrorMessage("");
    return true;
  }

  function validateStepTwo() {
    const name = fullName.trim();

    if (name.length < 3) {
      setErrorMessage("اكتب الاسم الكامل كما سيظهر داخل النظام.");
      return false;
    }

    if (role !== "student") {
      const normalizedEmail = email.trim().toLowerCase();

      if (!normalizedEmail || !normalizedEmail.includes("@")) {
        setErrorMessage("اكتب بريدًا إلكترونيًا صحيحًا.");
        return false;
      }

      if (password.length < 8) {
        setErrorMessage("كلمة المرور يجب أن تكون 8 أحرف على الأقل.");
        return false;
      }

      if (password !== passwordConfirm) {
        setErrorMessage("تأكيد كلمة المرور غير مطابق.");
        return false;
      }
    }

    if (role === "supervisor" && !inviteCode.trim()) {
      setErrorMessage("حساب المشرف يحتاج إلى رمز تفعيل صالح.");
      return false;
    }

    setErrorMessage("");
    return true;
  }

  function nextStep() {
    if (step === 1 && validateStepOne()) {
      setStep(2);
      return;
    }

    if (step === 2 && validateStepTwo()) {
      setStep(3);
    }
  }

  function previousStep() {
    setErrorMessage("");
    setStep((current) => Math.max(1, current - 1));
  }

  async function createAccount() {
    if (loading) return;

    if (!validateStepTwo()) return;

    if (!acceptedAccuracy) {
      setErrorMessage("أكد صحة البيانات قبل إنشاء الحساب.");
      return;
    }

    setLoading(true);
    setErrorMessage("");

    try {
      const { data, error } = await supabase.functions.invoke(
        "register-account",
        {
          body: {
            role,
            full_name: fullName.trim(),
            phone: phone.trim() || null,
            email:
              role === "student"
                ? null
                : email.trim().toLowerCase(),
            password: role === "student" ? null : password,
            invite_code:
              role === "supervisor"
                ? inviteCode.trim().toUpperCase()
                : null,
          },
        }
      );

      if (error) {
        console.error("register-account invoke error:", error);
        throw new Error(
          "تعذر الوصول إلى خدمة إنشاء الحساب. تأكد من نشر Edge Function."
        );
      }

      if (!data?.ok) {
        throw new Error(data?.message || "تعذر إنشاء الحساب.");
      }

      setResult(data);
    } catch (error) {
      console.error("Register error:", error);
      setErrorMessage(
        error?.message || "حدث خطأ غير متوقع أثناء إنشاء الحساب."
      );
    } finally {
      setLoading(false);
    }
  }

  async function copyNumber() {
    if (!result?.user_number) return;

    try {
      await navigator.clipboard.writeText(result.user_number);
    } catch (error) {
      console.warn("Clipboard error:", error);
    }
  }

  if (result) {
    return (
      <main className="register-pro-page">
        <div className="register-pro-orb register-pro-orb-one" />
        <div className="register-pro-orb register-pro-orb-two" />

        <section className="register-pro-success-shell">
          <div className="register-pro-success-icon">
            <CheckCircle2 />
          </div>

          <div className="register-pro-success-kicker">
            <Sparkles />
            تم إنشاء الحساب
          </div>

          <h1>مرحبًا بك في الصِّديق</h1>

          <p>
            تم إنشاء حساب {result.full_name} بنجاح. احتفظ برقمك
            التعريفي داخل النظام.
          </p>

          <div className="register-pro-number-card">
            <span>
              {result.role === "student"
                ? "رقم الطالب — ستحتاجه لتسجيل الدخول"
                : "الرقم التعريفي داخل الصديق"}
            </span>

            <strong>{result.user_number}</strong>

            <button type="button" onClick={copyNumber}>
              <ClipboardCopy />
              نسخ الرقم
            </button>
          </div>

          {result.role === "student" && (
            <div className="register-pro-success-note">
              دخول الطالب سيكون بواسطة <b>الاسم + رقم الطالب</b> فقط.
              لا تشارك رقم الطالب في صفحات عامة.
            </div>
          )}

          {result.role === "teacher" && (
            <div className="register-pro-success-note">
              بعد الدخول بحساب المعلم سنبني لك خطوة اختيار المسجد
              والحلقة وإرسال طلب الانضمام.
            </div>
          )}

          {result.role === "supervisor" && (
            <div className="register-pro-success-note">
              تم التحقق من رمز المشرف. في المرحلة التالية سنربط
              حسابك بمسجد موجود أو مسار إنشاء مسجد حسب نوع الرمز.
            </div>
          )}

          <div className="register-pro-success-actions">
            <button
              type="button"
              className="register-pro-secondary"
              onClick={() => navigate("/")}
            >
              العودة للرئيسية
            </button>

            <button
              type="button"
              className="register-pro-primary"
              onClick={() => navigate("/login")}
            >
              تسجيل الدخول
              <ArrowLeft />
            </button>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="register-pro-page">
      <div className="register-pro-orb register-pro-orb-one" />
      <div className="register-pro-orb register-pro-orb-two" />

      <section className="register-pro-shell">
        <header className="register-pro-header">
          <button
            type="button"
            className="register-pro-back-login"
            onClick={() => navigate("/login")}
          >
            <ArrowRight />
            تسجيل الدخول
          </button>

          <div className="register-pro-brand">
            <img src="/icon-512.png" alt="الصديق" />
            <div>
              <strong>الصِّديق</strong>
              <span>إنشاء حساب جديد</span>
            </div>
          </div>
        </header>

        <div className="register-pro-body">
          <aside className="register-pro-side">
            <div className="register-pro-side-kicker">
              <Sparkles />
              بداية الرحلة
            </div>

            <h1>
              حسابك هو أول خطوة
              <span>نحو تجربة مصممة لدورك</span>
            </h1>

            <p>
              اختر نوع الحساب بدقة؛ لأن الصديق سيحدد بعد ذلك
              مسار الإعداد والصلاحيات وطلبات الانضمام تلقائيًا.
            </p>

            <div className="register-pro-steps">
              {STEPS.map((item) => (
                <div
                  key={item.value}
                  className={`register-pro-step ${
                    step === item.value ? "active" : ""
                  } ${step > item.value ? "done" : ""}`}
                >
                  <div className="register-pro-step-number">
                    {step > item.value ? (
                      <CheckCircle2 />
                    ) : (
                      item.value
                    )}
                  </div>

                  <div>
                    <strong>{item.label}</strong>
                    <span>
                      {item.value === 1 && "حدد دورك داخل المنظومة"}
                      {item.value === 2 && "أدخل البيانات المطلوبة"}
                      {item.value === 3 && "راجع ثم أنشئ الحساب"}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="register-pro-security">
              <ShieldCheck />
              <div>
                <strong>تسجيل محمي</strong>
                <span>
                  لا يمكن إنشاء مدير نظام من التسجيل العام، وحساب
                  المشرف يحتاج إلى رمز تفعيل صالح.
                </span>
              </div>
            </div>
          </aside>

          <section className="register-pro-card">
            {step === 1 && (
              <div className="register-pro-stage">
                <div className="register-pro-stage-heading">
                  <span>الخطوة ١ من ٣</span>
                  <h2>كيف ستستخدم الصديق؟</h2>
                  <p>
                    اختر نوع الحساب. هذا الاختيار يحدد رحلة المستخدم
                    بعد التسجيل.
                  </p>
                </div>

                <div className="register-pro-role-grid">
                  {ROLE_OPTIONS.map((item) => {
                    const Icon = item.icon;

                    return (
                      <button
                        key={item.value}
                        type="button"
                        className={`register-pro-role ${
                          role === item.value ? "active" : ""
                        }`}
                        onClick={() => {
                          setRole(item.value);
                          clearError();
                        }}
                      >
                        <div className="register-pro-role-top">
                          <div className="register-pro-role-icon">
                            <Icon />
                          </div>

                          <span className="register-pro-role-badge">
                            {item.badge}
                          </span>
                        </div>

                        <strong>{item.title}</strong>
                        <p>{item.description}</p>

                        <div className="register-pro-role-check">
                          <CheckCircle2 />
                          {role === item.value ? "تم الاختيار" : "اختيار"}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="register-pro-stage">
                <div className="register-pro-stage-heading">
                  <span>الخطوة ٢ من ٣</span>
                  <h2>بيانات {selectedRole?.title}</h2>
                  <p>
                    أدخل البيانات الأساسية. الرقم التعريفي سيولده
                    النظام تلقائيًا؛ لا تحتاج إلى اختياره بنفسك.
                  </p>
                </div>

                <div className="register-pro-fields">
                  <RegisterInput
                    label="الاسم الكامل"
                    value={fullName}
                    onChange={(value) => {
                      setFullName(value);
                      clearError();
                    }}
                    placeholder="الاسم كما سيظهر داخل الصديق"
                    icon={UserRound}
                  />

                  <RegisterInput
                    label="رقم الجوال — اختياري"
                    value={phone}
                    onChange={setPhone}
                    placeholder="05xxxxxxxx"
                    icon={Phone}
                    dir="ltr"
                  />

                  {role !== "student" && (
                    <>
                      <RegisterInput
                        label="البريد الإلكتروني"
                        type="email"
                        value={email}
                        onChange={(value) => {
                          setEmail(value);
                          clearError();
                        }}
                        placeholder="name@example.com"
                        icon={Mail}
                        dir="ltr"
                        autoComplete="email"
                      />

                      <div className="register-pro-password-grid">
                        <PasswordInput
                          label="كلمة المرور"
                          value={password}
                          onChange={(value) => {
                            setPassword(value);
                            clearError();
                          }}
                          show={showPassword}
                          onToggle={() =>
                            setShowPassword((value) => !value)
                          }
                        />

                        <PasswordInput
                          label="تأكيد كلمة المرور"
                          value={passwordConfirm}
                          onChange={(value) => {
                            setPasswordConfirm(value);
                            clearError();
                          }}
                          show={showPassword}
                          onToggle={() =>
                            setShowPassword((value) => !value)
                          }
                        />
                      </div>

                      <div className="register-pro-helper">
                        استخدم 8 أحرف على الأقل واختر كلمة مرور قوية.
                      </div>
                    </>
                  )}

                  {role === "supervisor" && (
                    <>
                      <RegisterInput
                        label="رمز تفعيل المشرف"
                        value={inviteCode}
                        onChange={(value) => {
                          setInviteCode(value.toUpperCase());
                          clearError();
                        }}
                        placeholder="SUP-XXXX-XXXX"
                        icon={ShieldCheck}
                        dir="ltr"
                      />

                      <div className="register-pro-info gold">
                        <ShieldCheck />
                        <div>
                          <strong>لماذا يوجد رمز تفعيل؟</strong>
                          <span>
                            حتى لا يستطيع أي شخص إنشاء حساب مشرف أو
                            مسجد من تلقاء نفسه. الرمز يستخدم مرة واحدة.
                          </span>
                        </div>
                      </div>
                    </>
                  )}

                  {role === "teacher" && (
                    <div className="register-pro-info">
                      <UsersRound />
                      <div>
                        <strong>بعد إنشاء الحساب</strong>
                        <span>
                          سيدخل المعلم بالبريد وكلمة المرور، ثم تظهر له
                          المساجد والحلقات النشطة لإرسال طلب الانضمام.
                        </span>
                      </div>
                    </div>
                  )}

                  {role === "student" && (
                    <div className="register-pro-info">
                      <GraduationCap />
                      <div>
                        <strong>لا يحتاج الطالب بريدًا أو كلمة مرور</strong>
                        <span>
                          سيولد النظام رقم طالب عشوائيًا. تسجيل الدخول
                          سيكون بالاسم + رقم الطالب، ثم اختيار المسجد
                          والحلقة.
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="register-pro-stage">
                <div className="register-pro-stage-heading">
                  <span>الخطوة ٣ من ٣</span>
                  <h2>راجع بيانات الحساب</h2>
                  <p>
                    تأكد من صحة البيانات قبل إنشاء الحساب النهائي.
                  </p>
                </div>

                <div className="register-pro-review">
                  <ReviewRow label="نوع الحساب" value={selectedRole?.title} />
                  <ReviewRow label="الاسم" value={fullName.trim()} />

                  {phone.trim() && (
                    <ReviewRow label="الجوال" value={phone.trim()} />
                  )}

                  {role !== "student" && (
                    <ReviewRow
                      label="البريد الإلكتروني"
                      value={email.trim().toLowerCase()}
                    />
                  )}

                  {role === "supervisor" && (
                    <ReviewRow
                      label="رمز التفعيل"
                      value={inviteCode.trim().toUpperCase()}
                    />
                  )}

                  <ReviewRow
                    label="الرقم التعريفي"
                    value="سيولده النظام تلقائيًا"
                  />
                </div>

                <label className="register-pro-confirm">
                  <input
                    type="checkbox"
                    checked={acceptedAccuracy}
                    onChange={(event) => {
                      setAcceptedAccuracy(event.target.checked);
                      clearError();
                    }}
                  />

                  <span>
                    أؤكد أن البيانات المدخلة صحيحة وأفهم أن نوع الحساب
                    يحدد مسار المستخدم وصلاحياته.
                  </span>
                </label>
              </div>
            )}

            {errorMessage && (
              <div className="register-pro-error" role="alert">
                {errorMessage}
              </div>
            )}

            <div className="register-pro-actions">
              {step > 1 ? (
                <button
                  type="button"
                  className="register-pro-secondary"
                  onClick={previousStep}
                  disabled={loading}
                >
                  <ArrowRight />
                  السابق
                </button>
              ) : (
                <span />
              )}

              {step < 3 ? (
                <button
                  type="button"
                  className="register-pro-primary"
                  onClick={nextStep}
                >
                  التالي
                  <ArrowLeft />
                </button>
              ) : (
                <button
                  type="button"
                  className="register-pro-primary"
                  onClick={createAccount}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="register-pro-spin" />
                      جارٍ إنشاء الحساب…
                    </>
                  ) : (
                    <>
                      <UserRoundPlus />
                      إنشاء الحساب
                    </>
                  )}
                </button>
              )}
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}

function RegisterInput({
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  icon: Icon,
  dir = "rtl",
  autoComplete = "off",
}) {
  return (
    <div className="register-pro-field">
      <label>{label}</label>

      <div className="register-pro-input-wrap">
        <Icon className="register-pro-input-icon" />

        <input
          type={type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          dir={dir}
          autoComplete={autoComplete}
        />
      </div>
    </div>
  );
}

function PasswordInput({
  label,
  value,
  onChange,
  show,
  onToggle,
}) {
  return (
    <div className="register-pro-field">
      <label>{label}</label>

      <div className="register-pro-input-wrap">
        <LockKeyhole className="register-pro-input-icon" />

        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="••••••••"
          autoComplete="new-password"
        />

        <button
          type="button"
          className="register-pro-eye"
          onClick={onToggle}
          aria-label={show ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
        >
          {show ? <EyeOff /> : <Eye />}
        </button>
      </div>
    </div>
  );
}

function ReviewRow({ label, value }) {
  return (
    <div className="register-pro-review-row">
      <span>{label}</span>
      <strong>{value || "—"}</strong>
    </div>
  );
}

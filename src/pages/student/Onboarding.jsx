import { useNavigate } from "react-router-dom";
import {
  CheckCircle2,
  GraduationCap,
  Landmark,
  LogOut,
} from "lucide-react";
import { supabase } from "../../lib/supabase";
import "../Register.css";

export default function StudentOnboarding() {
  const navigate = useNavigate();

  async function signOut() {
    await supabase.auth.signOut();
    navigate("/login", { replace: true });
  }

  return (
    <main className="register-pro-page">
      <section className="register-pro-success-shell">
        <div className="register-pro-success-icon">
          <GraduationCap />
        </div>

        <div className="register-pro-success-kicker">
          <CheckCircle2 />
          حساب الطالب جاهز
        </div>

        <h1>أهلًا بك في رحلة الصديق</h1>

        <p>
          تم تسجيل دخولك بنجاح. في المرحلة التالية سنبني مستكشف
          المساجد والحلقات وإرسال طلب الالتحاق للمعلم والمشرف.
        </p>

        <div className="register-pro-number-card">
          <span>الخطوة التالية</span>
          <strong style={{ direction: "rtl", fontSize: 20 }}>
            اختيار المسجد والحلقة
          </strong>
        </div>

        <div className="register-pro-success-actions">
          <button
            type="button"
            className="register-pro-secondary"
            onClick={signOut}
          >
            <LogOut />
            تسجيل الخروج
          </button>

          <button
            type="button"
            className="register-pro-primary"
            disabled
            title="سنفعله في المرحلة التالية"
          >
            <Landmark />
            استكشاف المساجد والحلقات
          </button>
        </div>
      </section>
    </main>
  );
}

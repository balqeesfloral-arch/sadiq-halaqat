import { useEffect, useState } from "react";
import { BookOpen, CalendarDays, CalendarRange, Layers3, RefreshCw, Target } from "lucide-react";
import StudentPage from "../../components/student/StudentPage";
import { useStudentPortal } from "../../context/StudentPortalContext";
import { supabase } from "../../lib/supabase";
import { facesToPretty, formatDailyAmount, getHijriParts, recitationDaysLabel } from "../../lib/studentPortalUtils";
import "./StudentPortal.css";

export default function StudentMonthlyPlan() {
  const { profile, halaqa } = useStudentPortal();
  const [loading, setLoading] = useState(true);
  const [plan, setPlan] = useState(null);

  useEffect(() => { load(); }, [profile?.id, halaqa?.id]);

  async function load() {
    if (!profile?.id || !halaqa?.id) { setLoading(false); return; }
    try {
      setLoading(true);
      const hijri = getHijriParts();
      const { data, error } = await supabase
        .from("monthly_plans").select("*")
        .eq("student_id", profile.id).eq("halaqa_id", halaqa.id)
        .eq("hijri_year", hijri.year).eq("hijri_month", hijri.month).maybeSingle();
      if (error) throw error;
      setPlan(data || null);
    } catch (error) {
      console.error("Student monthly plan:", error);
    } finally { setLoading(false); }
  }

  const goal = profile?.learning_goal || "quran";
  const hasQuran = ["quran", "noorania_quran", "other", ""].includes(goal);
  const hasNoorania = ["noorania", "noorania_quran"].includes(goal);

  return (
    <StudentPage
      eyebrow="ماذا أحتاج هذا الشهر؟"
      title="خطتي الشهرية"
      description="الخطة المطلوبة منك بصورة مختصرة وواضحة، بدون تفاصيل معقدة."
      icon={CalendarRange}
    >
      {loading ? (
        <div className="student-loading">جارٍ تحميل خطتك…</div>
      ) : !plan ? (
        <section className="student-panel">
          <div className="student-empty">
            <CalendarRange size={31}/>
            <strong>لم تُعتمد لك خطة لهذا الشهر بعد</strong>
            <span>عند إعداد المعلم للخطة ستظهر هنا تلقائيًا.</span>
          </div>
        </section>
      ) : (
        <>
          <section className="student-metrics">
            <Metric icon={CalendarDays} label="أيام التسميع" value={plan.planned_sessions || 0} note="جلسة مخططة هذا الشهر" />
            <Metric icon={Target} label="هدف الحفظ" value={facesToPretty(plan.memorization_target_faces)} note="الإجمالي المطلوب" />
            <Metric icon={RefreshCw} label="هدف المراجعة" value={facesToPretty(plan.revision_target_faces)} note="الإجمالي المطلوب" />
            <Metric icon={Layers3} label="حالة الخطة" value={plan.status === "approved" ? "معتمدة" : plan.status === "submitted" ? "بانتظار الاعتماد" : "مسودة"} note="حالة خطة هذا الشهر" />
          </section>

          <section className="student-grid student-grid-2">
            {hasQuran && (
              <article className="student-panel">
                <div className="student-panel-head">
                  <div className="student-panel-title">
                    <div className="student-panel-title-icon"><BookOpen size={19}/></div>
                    <div><span>القرآن الكريم</span><h3>خطة القرآن</h3></div>
                  </div>
                </div>
                <div className="student-grid student-grid-2">
                  <PlanCard label="الحفظ اليومي" value={formatDailyAmount(plan.memorization_daily_amount, plan.memorization_daily_unit)} target={facesToPretty(plan.memorization_target_faces)} />
                  <PlanCard label="المراجعة اليومية" value={formatDailyAmount(plan.revision_daily_amount, plan.revision_daily_unit)} target={facesToPretty(plan.revision_target_faces)} />
                </div>
              </article>
            )}

            {hasNoorania && (
              <article className="student-panel">
                <div className="student-panel-head">
                  <div className="student-panel-title">
                    <div className="student-panel-title-icon"><Layers3 size={19}/></div>
                    <div><span>القاعدة النورانية</span><h3>خطة القاعدة</h3></div>
                  </div>
                </div>
                <div className="student-grid student-grid-2">
                  <PlanCard
                    label="الدرس اليومي"
                    value={formatDailyAmount(plan.noorania_lesson_daily_amount, plan.noorania_lesson_daily_unit)}
                    target={plan.noorania_lesson_daily_amount ? `${plan.noorania_lesson_daily_amount * Number(plan.planned_sessions || 0)} ${plan.noorania_lesson_daily_unit === "lesson" ? "درس" : plan.noorania_lesson_daily_unit === "lines" ? "سطر" : "صفحة"}` : "غير محدد"}
                  />
                  <PlanCard
                    label="المراجعة اليومية"
                    value={formatDailyAmount(plan.noorania_revision_daily_amount, plan.noorania_revision_daily_unit)}
                    target={plan.noorania_revision_daily_amount ? `${plan.noorania_revision_daily_amount * Number(plan.planned_sessions || 0)} ${plan.noorania_revision_daily_unit === "lines" ? "سطر" : "صفحة"}` : "غير محدد"}
                  />
                </div>
              </article>
            )}
          </section>

          <section className="student-panel">
            <div className="student-panel-title">
              <div className="student-panel-title-icon"><CalendarDays size={19}/></div>
              <div>
                <span>إيقاع الخطة</span>
                <h3>أيام تسميعك في هذه الخطة</h3>
                <p>{recitationDaysLabel(plan.recitation_days_snapshot || profile?.recitation_days)}</p>
              </div>
            </div>
          </section>
        </>
      )}
    </StudentPage>
  );
}

function PlanCard({ label, value, target }) {
  return <article className="student-feature-card"><div className="icon"><Target size={20}/></div><span>{label}</span><strong>{value}</strong><p>الهدف الشهري: {target}</p></article>;
}
function Metric({ icon: Icon, label, value, note }) {
  return <article className="student-metric"><div className="student-metric-icon"><Icon size={20}/></div><div><span>{label}</span><strong>{value}</strong><small>{note}</small></div></article>;
}

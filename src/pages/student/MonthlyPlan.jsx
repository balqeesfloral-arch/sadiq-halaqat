import { useEffect, useState } from "react";
import { BookOpen, CalendarDays, CalendarRange, Layers3, RefreshCw, Route, Target } from "lucide-react";
import StudentPage from "../../components/student/StudentPage";
import { useStudentPortal } from "../../context/StudentPortalContext";
import { supabase } from "../../lib/supabase";
import { facesToPretty, formatDailyAmount, getHijriParts, recitationDaysLabel } from "../../lib/studentPortalUtils";
import "./StudentPortal.css";

function quranRange(fromSurah, fromAyah, toSurah, toAyah) {
  if (!fromSurah || !fromAyah || !toSurah || !toAyah) return "المسار لم يُحدد كاملًا بعد";
  if (fromSurah === toSurah) return `${fromSurah} ${fromAyah} ← ${toAyah}`;
  return `${fromSurah} ${fromAyah} ← ${toSurah} ${toAyah}`;
}

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
    } finally {
      setLoading(false);
    }
  }

  const goal = profile?.learning_goal || "quran";
  const hasQuran = ["quran", "noorania_quran", "other", ""].includes(goal);
  const hasNoorania = ["noorania", "noorania_quran"].includes(goal);

  return (
    <StudentPage
      eyebrow="ماذا أحتاج هذا الشهر؟"
      title="خطتي الشهرية"
      description="ترى مسار الحفظ والمراجعة كاملًا، والسرعة اليومية التي تتحرك بها داخل هذا المسار."
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
            <Metric icon={Target} label="هدف الحفظ" value={facesToPretty(plan.memorization_target_faces)} note="محسوب من المسار القرآني" />
            <Metric icon={RefreshCw} label="هدف المراجعة" value={facesToPretty(plan.revision_target_faces)} note="محسوب من المسار القرآني" />
            <Metric icon={Layers3} label="حالة الخطة" value={plan.status === "approved" ? "معتمدة" : plan.status === "submitted" ? "بانتظار الاعتماد" : "مسودة"} note="حالة خطة هذا الشهر" />
          </section>

          {hasQuran && (
            <section className="student-panel">
              <div className="student-panel-head">
                <div className="student-panel-title">
                  <div className="student-panel-title-icon"><BookOpen size={19}/></div>
                  <div><span>القرآن الكريم</span><h3>مساري هذا الشهر</h3></div>
                </div>
              </div>

              <div className="student-grid student-grid-2">
                <QuranPlanCard
                  title="مسار الحفظ"
                  range={quranRange(
                    plan.memorization_from_surah,
                    plan.memorization_from_ayah,
                    plan.memorization_to_surah,
                    plan.memorization_to_ayah
                  )}
                  daily={formatDailyAmount(plan.memorization_daily_amount, plan.memorization_daily_unit)}
                  target={facesToPretty(plan.memorization_target_faces)}
                  icon={BookOpen}
                />

                <QuranPlanCard
                  title="مسار المراجعة"
                  range={quranRange(
                    plan.revision_from_surah,
                    plan.revision_from_ayah,
                    plan.revision_to_surah,
                    plan.revision_to_ayah
                  )}
                  daily={formatDailyAmount(plan.revision_daily_amount, plan.revision_daily_unit)}
                  target={facesToPretty(plan.revision_target_faces)}
                  icon={RefreshCw}
                />
              </div>

              <div style={{ marginTop: 12, padding: "12px 14px", borderRadius: 13, background: "rgba(15,76,69,.055)", color: "#526a61", lineHeight: 1.8 }}>
                <strong style={{ color: "#173e36" }}>كيف أقرأ خطتي؟</strong>
                <div>المسار يحدد من أين تبدأ وإلى أين تصل هذا الشهر، أما المقدار اليومي فهو سرعة الحركة داخل هذا المسار. المطلوب الفعلي لكل جلسة يولده الصديق تلقائيًا.</div>
              </div>
            </section>
          )}

          {hasNoorania && (
            <section className="student-panel">
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
            </section>
          )}

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

function QuranPlanCard({ title, range, daily, target, icon: Icon }) {
  return (
    <article className="student-feature-card" style={{ display: "grid", gap: 8 }}>
      <div className="icon"><Icon size={20}/></div>
      <span>{title}</span>
      <strong style={{ fontSize: 16, lineHeight: 1.7 }}>{range}</strong>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2,minmax(0,1fr))", gap: 8, marginTop: 4 }}>
        <div style={{ padding: 9, borderRadius: 10, background: "rgba(255,255,255,.7)" }}>
          <small style={{ display: "block", color: "#70817a" }}>سرعة الجلسة</small>
          <b style={{ color: "#183f37" }}>{daily || "غير محدد"}</b>
        </div>
        <div style={{ padding: 9, borderRadius: 10, background: "rgba(255,255,255,.7)" }}>
          <small style={{ display: "block", color: "#70817a" }}>حجم المسار</small>
          <b style={{ color: "#183f37" }}>{target || "غير محدد"}</b>
        </div>
      </div>
    </article>
  );
}

function PlanCard({ label, value, target }) {
  return <article className="student-feature-card"><div className="icon"><Route size={20}/></div><span>{label}</span><strong>{value}</strong><p>الهدف الشهري: {target}</p></article>;
}

function Metric({ icon: Icon, label, value, note }) {
  return <article className="student-metric"><div className="student-metric-icon"><Icon size={20}/></div><div><span>{label}</span><strong>{value}</strong><small>{note}</small></div></article>;
}

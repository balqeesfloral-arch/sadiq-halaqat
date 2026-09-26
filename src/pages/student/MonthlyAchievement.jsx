import { useEffect, useMemo, useState } from "react";
import { BookOpen, Flag, Layers3, Route, Sparkles, Target } from "lucide-react";
import StudentPage from "../../components/student/StudentPage";
import { useStudentPortal } from "../../context/StudentPortalContext";
import { supabase } from "../../lib/supabase";
import { clampPercent, facesToPretty, getHijriMonthRange, getHijriParts, scheduledProgressInfo } from "../../lib/studentPortalUtils";
import "./StudentPortal.css";

function accepted(value) {
  const text = String(value || "").trim().toLowerCase();
  return !["إعادة", "اعادة", "repeat"].includes(text);
}

function acceptedSegment(status) {
  return !["repeat", "skipped"].includes(String(status || "").trim().toLowerCase());
}

export default function StudentMonthlyAchievement() {
  const { profile, halaqa } = useStudentPortal();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    plan: null,
    progress: null,
    memDone: 0,
    revDone: 0,
    sideDone: 0,
    recitations: 0,
    segmentSessions: 0,
    period: null,
  });

  

  async function load() {
    if (!profile?.id || !halaqa?.id) { setLoading(false); return; }

    try {
      setLoading(true);
      const hijri = getHijriParts();
      const period = getHijriMonthRange(hijri.year, hijri.month);

      const [planResult, progressResult, recitationsResult] = await Promise.all([
        supabase.from("monthly_plans").select("*")
          .eq("student_id", profile.id).eq("halaqa_id", halaqa.id)
          .eq("hijri_year", hijri.year).eq("hijri_month", hijri.month).maybeSingle(),
        supabase.from("monthly_progress").select("*")
          .eq("student_id", profile.id).eq("halaqa_id", halaqa.id)
          .eq("hijri_year", hijri.year).eq("hijri_month", hijri.month).maybeSingle(),
        supabase.from("recitations")
          .select("id, recitation_date, lesson_faces_manual, lesson_faces, lesson_evaluation, review_faces, review_evaluation")
          .eq("student_id", profile.id).eq("halaqa_id", halaqa.id)
          .gte("recitation_date", period.start).lte("recitation_date", period.end),
      ]);

      if (planResult.error) throw planResult.error;
      if (progressResult.error) throw progressResult.error;
      if (recitationsResult.error) throw recitationsResult.error;

      const plan = planResult.data || null;
      const progress = progressResult.data || null;
      const recitations = recitationsResult.data || [];
      const recitationIds = recitations.map((row) => row.id);

      let segments = [];
      if (recitationIds.length) {
        const { data: segmentRows, error } = await supabase
          .from("recitation_segments")
          .select("id, recitation_id, segment_type, actual_faces, actual_quran_lines, evaluation, completion_status")
          .in("recitation_id", recitationIds);
        if (error) throw error;
        segments = segmentRows || [];
      }

      const lessonSegmentIds = new Set(
        segments.filter((row) => row.segment_type === "lesson").map((row) => Number(row.recitation_id))
      );
      const revisionSegmentIds = new Set(
        segments.filter((row) => row.segment_type === "revision").map((row) => Number(row.recitation_id))
      );

      const engineMem = segments
        .filter((row) => row.segment_type === "lesson" && acceptedSegment(row.completion_status))
        .reduce((sum, row) => sum + Number(row.actual_faces || 0), 0);

      const engineRev = segments
        .filter((row) => row.segment_type === "revision" && acceptedSegment(row.completion_status))
        .reduce((sum, row) => sum + Number(row.actual_faces || 0), 0);

      const engineSide = segments
        .filter((row) => row.segment_type === "side_lesson" && acceptedSegment(row.completion_status))
        .reduce((sum, row) => sum + Number(row.actual_faces || 0), 0);

      const legacyMem = recitations.reduce((sum, row) => {
        if (lessonSegmentIds.has(Number(row.id))) return sum;
        return accepted(row.lesson_evaluation)
          ? sum + Number(row.lesson_faces_manual ?? row.lesson_faces ?? 0)
          : sum;
      }, 0);

      const legacyRev = recitations.reduce((sum, row) => {
        if (revisionSegmentIds.has(Number(row.id))) return sum;
        return accepted(row.review_evaluation)
          ? sum + Number(row.review_faces || 0)
          : sum;
      }, 0);

      const manualMem = Number(progress?.manual_memorization_faces || 0);
      const manualRev = Number(progress?.manual_revision_faces || 0);
      const segmentSessions = new Set(segments.map((row) => Number(row.recitation_id))).size;

      setData({
        plan,
        progress,
        memDone: engineMem + legacyMem + manualMem,
        revDone: engineRev + legacyRev + manualRev,
        sideDone: engineSide,
        recitations: recitations.length,
        segmentSessions,
        period,
      });
    } catch (error) {
      console.error("Student monthly achievement:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [profile?.id, halaqa?.id]);

  const summary = useMemo(() => {
    const memTarget = Number(data.plan?.memorization_target_faces || 0);
    const revTarget = Number(data.plan?.revision_target_faces || 0);
    const memPercent = memTarget ? clampPercent((data.memDone / memTarget) * 100) : 0;
    const revPercent = revTarget ? clampPercent((data.revDone / revTarget) * 100) : 0;

    const schedule = scheduledProgressInfo({
      days: data.plan?.recitation_days_snapshot || profile?.recitation_days || [],
      period: data.period,
      plannedSessions: data.plan?.planned_sessions,
    });

    const parts = [memTarget ? memPercent : null, revTarget ? revPercent : null].filter((value) => value !== null);
    const overall = parts.length ? Math.round(parts.reduce((a, b) => a + b, 0) / parts.length) : 0;
    const completed = (!memTarget || data.memDone >= memTarget)
      && (!revTarget || data.revDone >= revTarget)
      && Boolean(memTarget || revTarget);

    const gap = overall - Number(schedule.expectedPercent || 0);
    let journeyMessage = "رحلتك مستمرة";
    if (completed) journeyMessage = "أكملت هدف الشهر";
    else if (gap >= 12) journeyMessage = "متقدم على المسار";
    else if (gap >= -8) journeyMessage = "أنت قريب من المسار المتوقع";
    else journeyMessage = "تحتاج دفعة إضافية للحاق بالمسار";

    return { memTarget, revTarget, memPercent, revPercent, schedule, overall, completed, journeyMessage };
  }, [data, profile?.recitation_days]);

  return (
    <StudentPage
      eyebrow="رحلة هذا الشهر"
      title="إنجازي الشهري"
      description="الإنجاز هنا مبني على ما سمعته فعليًا، مع فصل الحفظ الجديد والمراجعة وجنب الدرس."
      icon={Route}
    >
      {loading ? (
        <div className="student-loading">جارٍ بناء رحلة إنجازك…</div>
      ) : !data.plan ? (
        <section className="student-panel"><div className="student-empty"><Route size={30}/><strong>لا توجد خطة شهرية لقياس الإنجاز</strong><span>عندما يحدد المعلم الخطة ستبدأ رحلة الإنجاز تلقائيًا.</span></div></section>
      ) : (
        <>
          <section className="student-metrics">
            <Metric icon={Target} label="الإنجاز العام" value={`${summary.overall}%`} note={summary.journeyMessage} />
            <Metric icon={BookOpen} label="الحفظ المنجز" value={facesToPretty(data.memDone)} note={`من ${facesToPretty(summary.memTarget)}`} />
            <Metric icon={Sparkles} label="المراجعة المنجزة" value={facesToPretty(data.revDone)} note={`من ${facesToPretty(summary.revTarget)}`} />
            <Metric icon={Layers3} label="جنب الدرس" value={facesToPretty(data.sideDone)} note="مؤشر مستقل ولا يُحسب حفظًا جديدًا" />
          </section>

          <section className="student-grid student-grid-2">
            <ProgressCard title="رحلة الحفظ" done={data.memDone} target={summary.memTarget} percent={summary.memPercent} expected={summary.schedule.expectedPercent} />
            <ProgressCard title="رحلة المراجعة" done={data.revDone} target={summary.revTarget} percent={summary.revPercent} expected={summary.schedule.expectedPercent} />
          </section>

          <section className="student-panel">
            <div className="student-panel-head">
              <div className="student-panel-title">
                <div className="student-panel-title-icon"><Flag size={19}/></div>
                <div>
                  <span>حالتك الآن</span>
                  <h3>{summary.completed ? "أحسنت! حققت الخطة" : summary.journeyMessage}</h3>
                  <p>تم تسجيل {data.recitations} جلسة هذا الشهر.</p>
                </div>
              </div>
              <span className="student-soft-badge">{summary.completed ? "منجز" : "مستمر"}</span>
            </div>
          </section>
        </>
      )}
    </StudentPage>
  );
}

function ProgressCard({ title, done, target, percent, expected }) {
  return (
    <article className="student-panel">
      <div className="student-progress-card">
        <div className="student-progress-head">
          <div><span>{title}</span><strong>{facesToPretty(done)} / {facesToPretty(target)}</strong></div>
          <div className="student-progress-value">{percent}%</div>
        </div>
        <div className="student-progress-track">
          <div style={{ width: `${percent}%` }} />
          <i className="student-progress-expected" style={{ right: `${expected}%` }} />
        </div>
        <div className="student-progress-foot"><span>إنجازك {percent}%</span><span>المتوقع حتى اليوم {expected}%</span></div>
      </div>
    </article>
  );
}

function Metric({ icon: Icon, label, value, note }) {
  return <article className="student-metric"><div className="student-metric-icon"><Icon size={20}/></div><div><span>{label}</span><strong>{value}</strong><small>{note}</small></div></article>;
}

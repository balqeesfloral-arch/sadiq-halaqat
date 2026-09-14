import { useEffect, useState } from "react";
import { BookOpen, CalendarDays, RefreshCw, Sparkles, Star, UserRoundSearch } from "lucide-react";
import StudentPage from "../../components/student/StudentPage";
import { useStudentPortal } from "../../context/StudentPortalContext";
import { supabase } from "../../lib/supabase";
import {
  evaluationTone, facesToPretty, formatDailyAmount,
  formatGregorianDate, formatHijriDate, formatNumber,
} from "../../lib/studentPortalUtils";
import "./StudentPortal.css";

export default function MyRecitations() {
  const { profile } = useStudentPortal();
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState([]);

  useEffect(() => { load(); }, [profile?.id]);

  async function load() {
    if (!profile?.id) return;
    try {
      setLoading(true);
      const [quranResult, nooraniaResult] = await Promise.all([
        supabase.from("recitations")
          .select("id, student_id, recitation_date, lesson_amount_value, lesson_amount_unit, lesson_faces_manual, lesson_faces, lesson_evaluation, review_faces, review_evaluation, next_surah, next2_surah, points, notes")
          .eq("student_id", profile.id).order("recitation_date", { ascending: false }).limit(80),
        supabase.from("noorania_recitations")
          .select("id, student_id, recitation_date, lesson, lesson_evaluation, lesson_faces, side_lesson, side_lesson_evaluation, revision, revision_evaluation, revision_faces, points, notes")
          .eq("student_id", profile.id).order("recitation_date", { ascending: false }).limit(80),
      ]);

      const quran = (quranResult.data || []).map((row) => ({ ...row, kind: "quran" }));
      const noorania = (nooraniaResult.data || []).map((row) => ({ ...row, kind: "noorania" }));
      setRecords([...quran, ...noorania].sort((a,b)=>new Date(b.recitation_date)-new Date(a.recitation_date)));
    } catch (error) {
      console.error("Student recitations:", error);
    } finally { setLoading(false); }
  }

  const totalPoints = records.reduce((sum, row) => sum + Number(row.points || 0), 0);

  return (
    <StudentPage
      eyebrow="يومي مع القرآن"
      title="تسميعي"
      description="سجل يومي واضح لما تم تسميعه وتقييمه ونقاط كل جلسة."
      icon={UserRoundSearch}
    >
      <section className="student-metrics">
        <Metric icon={BookOpen} label="الجلسات المعروضة" value={formatNumber(records.length)} note="آخر سجلات التسميع" />
        <Metric icon={Star} label="نقاط التسميع" value={formatNumber(totalPoints)} note="ضمن السجلات المعروضة" />
        <Metric icon={Sparkles} label="آخر تقييم" value={records[0]?.lesson_evaluation || records[0]?.review_evaluation || "—"} note="أحدث جلسة" />
        <Metric icon={CalendarDays} label="آخر تسميع" value={records[0]?.recitation_date ? formatHijriDate(records[0].recitation_date) : "—"} note={records[0]?.recitation_date ? formatGregorianDate(records[0].recitation_date) : "لا يوجد"} />
      </section>

      <section className="student-panel">
        <div className="student-panel-head">
          <div className="student-panel-title">
            <div className="student-panel-title-icon"><BookOpen size={19}/></div>
            <div><span>الخط الزمني</span><h3>جلسات التسميع</h3></div>
          </div>
        </div>

        {loading ? (
          <div className="student-loading">جارٍ تحميل سجلاتك…</div>
        ) : !records.length ? (
          <div className="student-empty"><BookOpen size={29}/><strong>لا توجد جلسات تسميع بعد</strong><span>عندما يسجل المعلم تسميعك ستظهر الجلسة هنا.</span></div>
        ) : (
          <div className="student-journey">
            {records.map((record) => <RecitationItem record={record} key={`${record.kind}-${record.id}`} />)}
          </div>
        )}
      </section>
    </StudentPage>
  );
}

function RecitationItem({ record }) {
  const quran = record.kind === "quran";
  const lessonAmount = quran
    ? record.lesson_amount_value
      ? formatDailyAmount(record.lesson_amount_value, record.lesson_amount_unit)
      : facesToPretty(record.lesson_faces_manual ?? record.lesson_faces ?? 0)
    : record.lesson || facesToPretty(record.lesson_faces);

  const reviewAmount = quran
    ? facesToPretty(record.review_faces)
    : record.revision || facesToPretty(record.revision_faces);

  const evaluation = record.lesson_evaluation || record.review_evaluation || record.revision_evaluation || "غير محدد";

  return (
    <article className="student-journey-item">
      <div className="student-journey-dot">{quran ? <BookOpen size={16}/> : <RefreshCw size={16}/>}</div>
      <div className="student-journey-copy">
        <div className="student-panel-head" style={{ marginBottom: 0 }}>
          <div>
            <strong>{quran ? "القرآن الكريم" : "القاعدة النورانية"}</strong>
            <p>{formatHijriDate(record.recitation_date)} • {formatGregorianDate(record.recitation_date)}</p>
          </div>
          <span className={`student-eval-badge ${evaluationTone(evaluation)}`}>{evaluation}</span>
        </div>
        <p>
          الدرس: {lessonAmount || "—"} • المراجعة: {reviewAmount || "—"}
          {record.side_lesson || record.next_surah ? ` • جنب الدرس: ${record.side_lesson || record.next_surah}` : ""}
        </p>
        {record.points ? <p>نقاط الجلسة: <strong>{formatNumber(record.points)}</strong></p> : null}
      </div>
    </article>
  );
}

function Metric({ icon: Icon, label, value, note }) {
  return <article className="student-metric"><div className="student-metric-icon"><Icon size={20}/></div><div><span>{label}</span><strong>{value}</strong><small>{note}</small></div></article>;
}

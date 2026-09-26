import { useEffect, useMemo, useState } from "react";
import { Crown, Medal, Sparkles, Trophy, Users } from "lucide-react";
import StudentPage from "../../components/student/StudentPage";
import { useStudentPortal } from "../../context/StudentPortalContext";
import { supabase } from "../../lib/supabase";
import { clampPercent, facesToPretty, getHijriParts, formatNumber } from "../../lib/studentPortalUtils";
import "./StudentPortal.css";

export default function Classmates() {
  const { profile, halaqa } = useStudentPortal();
  const [loading, setLoading] = useState(true);
  const [classmates, setClassmates] = useState([]);

  

  async function load() {
    if (!halaqa?.id) { setLoading(false); return; }

    try {
      setLoading(true);

      const { data: links, error: linksError } = await supabase
        .from("student_halaqat").select("student_id")
        .eq("halaqa_id", halaqa.id).eq("is_current", true);
      if (linksError) throw linksError;

      const ids = [...new Set((links || []).map((item) => Number(item.student_id)).filter(Boolean))];
      if (!ids.length) { setClassmates([]); return; }

      const hijri = getHijriParts();
      const [profilesResult, plansResult, progressResult] = await Promise.all([
        supabase.from("profiles").select("id, full_name, total_points, status").in("id", ids).eq("role", "student"),
        supabase.from("monthly_plans")
          .select("student_id, memorization_target_faces, revision_target_faces")
          .eq("halaqa_id", halaqa.id).eq("hijri_year", hijri.year).eq("hijri_month", hijri.month).in("student_id", ids),
        supabase.from("monthly_progress")
          .select("student_id, final_memorization_faces, final_revision_faces, auto_memorization_faces, auto_revision_faces, manual_memorization_faces, manual_revision_faces")
          .eq("halaqa_id", halaqa.id).eq("hijri_year", hijri.year).eq("hijri_month", hijri.month).in("student_id", ids),
      ]);

      if (profilesResult.error) throw profilesResult.error;

      const planMap = new Map((plansResult.data || []).map((row) => [Number(row.student_id), row]));
      const progressMap = new Map((progressResult.data || []).map((row) => [Number(row.student_id), row]));

      const result = (profilesResult.data || [])
        .filter((student) => student.status !== "archived")
        .map((student) => {
          const plan = planMap.get(Number(student.id));
          const progress = progressMap.get(Number(student.id));

          const memDone = Number(progress?.final_memorization_faces ?? (Number(progress?.auto_memorization_faces || 0) + Number(progress?.manual_memorization_faces || 0)));
          const revDone = Number(progress?.final_revision_faces ?? (Number(progress?.auto_revision_faces || 0) + Number(progress?.manual_revision_faces || 0)));
          const memTarget = Number(plan?.memorization_target_faces || 0);
          const revTarget = Number(plan?.revision_target_faces || 0);

          const memPercent = memTarget ? clampPercent((memDone / memTarget) * 100) : 0;
          const revPercent = revTarget ? clampPercent((revDone / revTarget) * 100) : 0;
          const parts = [memTarget ? memPercent : null, revTarget ? revPercent : null].filter((v) => v !== null);

          return {
            ...student,
            memDone,
            progressPercent: parts.length ? Math.round(parts.reduce((a,b)=>a+b,0)/parts.length) : 0,
          };
        })
        .sort((a, b) => Number(b.total_points || 0) - Number(a.total_points || 0));

      setClassmates(result);
    } catch (error) {
      console.error("Student classmates:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [profile?.id, halaqa?.id]);

  const myRank = useMemo(
    () => classmates.findIndex((student) => Number(student.id) === Number(profile?.id)) + 1,
    [classmates, profile?.id]
  );

  return (
    <StudentPage
      eyebrow="منافسة جميلة"
      title="زملائي"
      description="شاهد تقدم زملائك في الحلقة واجعل المنافسة دافعًا للاستمرار والاجتهاد."
      icon={Users}
    >
      {loading ? (
        <div className="student-loading">جارٍ تجهيز إنجازات الحلقة…</div>
      ) : (
        <>
          <section className="student-metrics">
            <Metric icon={Users} label="طلاب الحلقة" value={formatNumber(classmates.length)} note="ضمن الحلقة الحالية" />
            <Metric icon={Trophy} label="ترتيبك بالنقاط" value={myRank ? `#${myRank}` : "—"} note="بين زملائك" />
            <Metric icon={Sparkles} label="نقاطك" value={formatNumber(profile?.total_points)} note="استمر في جمعها" />
            <Metric icon={Crown} label="المتصدر" value={classmates[0]?.full_name || "—"} note={`${formatNumber(classmates[0]?.total_points)} نقطة`} />
          </section>

          <section className="student-panel">
            <div className="student-panel-head">
              <div className="student-panel-title">
                <div className="student-panel-title-icon"><Trophy size={19} /></div>
                <div><span>ترتيب الحلقة</span><h3>إنجازات زملائي</h3><p>معلومات تحفيزية مختصرة فقط.</p></div>
              </div>
            </div>

            {!classmates.length ? (
              <div className="student-empty"><Users size={28} /><strong>لا يوجد زملاء لعرضهم الآن</strong></div>
            ) : (
              <div className="student-ranking-card">
                {classmates.map((student, index) => (
                  <div className="student-ranking-row" key={student.id}>
                    <div className={`student-rank ${index < 3 ? `top-${index + 1}` : ""}`}>
                      {index === 0 ? <Crown size={17} /> : index < 3 ? <Medal size={17} /> : index + 1}
                    </div>
                    <div className="student-ranking-main">
                      <strong>{student.full_name}{Number(student.id) === Number(profile?.id) ? " — أنت" : ""}</strong>
                      <span>إنجاز الخطة: {student.progressPercent}% • الحفظ {facesToPretty(student.memDone)}</span>
                    </div>
                    <div className="student-ranking-score"><strong>{formatNumber(student.total_points)}</strong><span>نقطة</span></div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </StudentPage>
  );
}

function Metric({ icon: Icon, label, value, note }) {
  return <article className="student-metric"><div className="student-metric-icon"><Icon size={20}/></div><div><span>{label}</span><strong>{value}</strong><small>{note}</small></div></article>;
}

import { useEffect, useState } from "react";
import { Award, CheckCircle2, GraduationCap, Target } from "lucide-react";
import StudentPage from "../../components/student/StudentPage";
import { useStudentPortal } from "../../context/StudentPortalContext";
import { supabase } from "../../lib/supabase";
import { examMessage, formatGregorianDate, formatHijriDate, formatNumber } from "../../lib/studentPortalUtils";
import "./StudentPortal.css";

export default function StudentExams(){
  const {profile}=useStudentPortal();
  const [loading,setLoading]=useState(true);
  const [rows,setRows]=useState([]);

  useEffect(()=>{load();},[profile?.id]);

  async function load(){
    if(!profile?.id)return;
    try{
      setLoading(true);
      const {data:results,error:resultsError}=await supabase.from("exam_results")
        .select("id, exam_id, score, is_passed, notes, updated_at")
        .eq("student_id",profile.id).order("id",{ascending:false});
      if(resultsError)throw resultsError;

      const examIds=[...new Set((results||[]).map(r=>r.exam_id).filter(Boolean))];
      if(!examIds.length){setRows([]);return}

      const {data:exams,error:examsError}=await supabase.from("exams")
        .select("id, title, exam_type, exam_date, total_score, passing_score, status, notes, from_surah, to_surah")
        .in("id",examIds);
      if(examsError)throw examsError;

      const map=new Map((exams||[]).map(exam=>[exam.id,exam]));
      setRows((results||[]).map(result=>{
        const exam=map.get(result.exam_id);
        const total=Number(exam?.total_score||100);
        const percent=total?Math.round((Number(result.score||0)/total)*100):0;
        return{...result,exam,percent,message:examMessage(percent)};
      }).sort((a,b)=>new Date(b.exam?.exam_date||0)-new Date(a.exam?.exam_date||0)));
    }catch(error){console.error("Student exams:",error)}
    finally{setLoading(false)}
  }

  const average=rows.length?Math.round(rows.reduce((s,r)=>s+Number(r.percent||0),0)/rows.length):0;
  const passed=rows.filter(r=>r.is_passed).length;

  return(
    <StudentPage
      eyebrow="اختبر نفسك وتقدم"
      title="اختباراتي"
      description="نتائج اختباراتك بصورة واضحة، مع رسالة تحفيزية تناسب نتيجتك."
      icon={GraduationCap}
    >
      <section className="student-metrics">
        <Metric icon={GraduationCap} label="الاختبارات" value={formatNumber(rows.length)} note="اختبار مسجل"/>
        <Metric icon={Target} label="المتوسط" value={`${average}%`} note="متوسط نتائجك"/>
        <Metric icon={CheckCircle2} label="المجتازة" value={formatNumber(passed)} note="اختبار ناجح"/>
        <Metric icon={Award} label="أفضل نتيجة" value={`${rows.length?Math.max(...rows.map(r=>r.percent)):0}%`} note="أعلى نسبة"/>
      </section>

      {loading?(
        <div className="student-loading">جارٍ تحميل الاختبارات…</div>
      ):!rows.length?(
        <section className="student-panel"><div className="student-empty"><GraduationCap size={30}/><strong>لا توجد نتائج اختبارات بعد</strong></div></section>
      ):(
        <section className="student-grid student-grid-3">
          {rows.map(row=>(
            <article className="student-exam-card" key={row.id}>
              <div className="student-exam-score">{row.percent}%</div>
              <h3>{row.exam?.title||"اختبار"}</h3>
              <span>
                {row.exam?.exam_type||"اختبار"} • {row.exam?.exam_date?`${formatHijriDate(row.exam.exam_date)} • ${formatGregorianDate(row.exam.exam_date)}`:"بدون تاريخ"}
              </span>
              <div className="student-exam-message">
                <strong>{row.message.title}</strong>
                <p>{row.message.body}</p>
              </div>
            </article>
          ))}
        </section>
      )}
    </StudentPage>
  );
}
function Metric({icon:Icon,label,value,note}){return <article className="student-metric"><div className="student-metric-icon"><Icon size={20}/></div><div><span>{label}</span><strong>{value}</strong><small>{note}</small></div></article>}

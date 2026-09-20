import { useEffect, useMemo, useState } from "react";
import { Crown, Medal, Sparkles, Star, Trophy } from "lucide-react";
import StudentPage from "../../components/student/StudentPage";
import { useStudentPortal } from "../../context/StudentPortalContext";
import { supabase } from "../../lib/supabase";
import { formatDateTime, formatNumber } from "../../lib/studentPortalUtils";
import "./StudentPortal.css";

export default function StudentPoints() {
  const { profile, mosque } = useStudentPortal();
  const [loading,setLoading]=useState(true);
  const [ranking,setRanking]=useState([]);
  const [transactions,setTransactions]=useState([]);

  useEffect(()=>{load();},[profile?.id,mosque?.id]);

  async function load(){
    if(!profile?.id)return;
    try{
      setLoading(true);

      const tx=await supabase.from("points_transactions")
        .select("id, points, reason, transaction_date, notes, category, halaqa_id, teacher_id")
        .eq("student_id",profile.id).order("transaction_date",{ascending:false}).limit(100);
      setTransactions(tx.data||[]);

      if(!mosque?.id){setRanking([]);return}

      const {data:halaqatRows,error:halaqatError}=await supabase.from("halaqat")
        .select("id").eq("mosque_id",mosque.id).neq("status","archived");
      if(halaqatError)throw halaqatError;

      const halaqaIds=(halaqatRows||[]).map(r=>r.id);
      if(!halaqaIds.length){setRanking([]);return}

      const {data:links,error:linksError}=await supabase.from("student_halaqat")
        .select("student_id").in("halaqa_id",halaqaIds).eq("is_current",true);
      if(linksError)throw linksError;

      const ids=[...new Set((links||[]).map(r=>r.student_id))];
      if(!ids.length){setRanking([]);return}

      const {data:profiles,error:profilesError}=await supabase.from("profiles")
        .select("id, full_name, total_points, status").in("id",ids).eq("role","student");
      if(profilesError)throw profilesError;

      setRanking((profiles||[]).filter(s=>s.status!=="archived")
        .sort((a,b)=>Number(b.total_points||0)-Number(a.total_points||0)).slice(0,10));
    }catch(error){console.error("Student points:",error)}
    finally{setLoading(false)}
  }

  const myRank=useMemo(
    ()=>ranking.findIndex(s=>Number(s.id)===Number(profile?.id))+1,
    [ranking,profile?.id]
  );

  const earned=transactions.filter(r=>Number(r.points||0)>0)
    .reduce((sum,r)=>sum+Number(r.points||0),0);

  return(
    <StudentPage
      eyebrow="تنافس مع نفسك أولًا"
      title="نقاطي"
      description="اجمع نقاطك واعرف مركزك بين طلاب مسجدك، ثم شاهد سبب كل نقطة حصلت عليها."
      icon={Trophy}
    >
      <section className="student-metrics">
        <Metric icon={Star} label="إجمالي نقاطي" value={formatNumber(profile?.total_points)} note="رصيدك الحالي"/>
        <Metric icon={Trophy} label="مركزي في المسجد" value={myRank?`#${myRank}`:"—"} note="ضمن أول 10 إذا ظهرت"/>
        <Metric icon={Sparkles} label="نقاط مكتسبة" value={formatNumber(earned)} note="ضمن سجل العمليات"/>
        <Metric icon={Crown} label="المتصدر" value={ranking[0]?.full_name||"—"} note={`${formatNumber(ranking[0]?.total_points)} نقطة`}/>
      </section>

      <section className="student-grid student-grid-2">
        <article className="student-panel">
          <div className="student-panel-head">
            <div className="student-panel-title">
              <div className="student-panel-title-icon"><Trophy size={19}/></div>
              <div><span>لوحة الشرف</span><h3>أفضل 10 في المسجد</h3><p>{mosque?.name||"مسجدك الحالي"}</p></div>
            </div>
          </div>
          {loading?(
            <div className="student-loading">جارٍ تجهيز الترتيب…</div>
          ):(
            <div className="student-ranking-card">
              {ranking.map((student,index)=>(
                <div className="student-ranking-row" key={student.id}>
                  <div className={`student-rank ${index<3?`top-${index+1}`:""}`}>
                    {index===0?<Crown size={17}/>:index<3?<Medal size={17}/>:index+1}
                  </div>
                  <div className="student-ranking-main">
                    <strong>{student.full_name}{Number(student.id)===Number(profile?.id)?" — أنت":""}</strong>
                    <span>الترتيب #{index+1}</span>
                  </div>
                  <div className="student-ranking-score"><strong>{formatNumber(student.total_points)}</strong><span>نقطة</span></div>
                </div>
              ))}
            </div>
          )}
        </article>

        <article className="student-panel">
          <div className="student-panel-head">
            <div className="student-panel-title">
              <div className="student-panel-title-icon"><Star size={19}/></div>
              <div><span>كيف حصلت عليها؟</span><h3>سجل نقاطي</h3></div>
            </div>
          </div>

          {!transactions.length?(
            <div className="student-empty"><Star size={28}/><strong>لا توجد عمليات نقاط بعد</strong></div>
          ):(
            <div className="student-list">
              {transactions.map(row=>(
                <div className="student-list-row" key={row.id}>
                  <div className="student-list-avatar"><Star size={15}/></div>
                  <div className="student-list-copy">
                    <strong>{row.reason||row.category||"نقاط"}</strong>
                    <span>{row.notes||"بدون ملاحظات"} • {formatDateTime(row.transaction_date)}</span>
                  </div>
                  <strong style={{color:Number(row.points||0)>=0?"var(--app-color-147a5e,#147a5e)":"#b6483d"}}>
                    {Number(row.points||0)>=0?"+":""}{row.points}
                  </strong>
                </div>
              ))}
            </div>
          )}
        </article>
      </section>
    </StudentPage>
  );
}
function Metric({icon:Icon,label,value,note}){return <article className="student-metric"><div className="student-metric-icon"><Icon size={20}/></div><div><span>{label}</span><strong>{value}</strong><small>{note}</small></div></article>}

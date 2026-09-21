import { useEffect, useMemo, useState } from "react";
import { BellRing, BookOpen, CheckCircle2, GraduationCap, Heart, MessageCircle, Send, Sparkles, UserX } from "lucide-react";
import StudentPage from "../../components/student/StudentPage";
import { useStudentPortal } from "../../context/StudentPortalContext";
import { supabase } from "../../lib/supabase";
import { examMessage, formatDateTime, formatGregorianDate, getRiyadhDateKey } from "../../lib/studentPortalUtils";
import "./StudentPortal.css";

function daysAgo(days){const d=new Date();d.setDate(d.getDate()-days);return getRiyadhDateKey(d)}
function isRepeat(value){return["إعادة","اعادة","repeat"].includes(String(value||"").trim().toLowerCase())}

export default function StudentNotifications(){
  const {profile}=useStudentPortal();
  const [loading,setLoading]=useState(true);
  const [manual,setManual]=useState([]);
  const [smart,setSmart]=useState([]);
  const [contacts,setContacts]=useState([]);
  const [recipientId,setRecipientId]=useState("");
  const [messageSubject,setMessageSubject]=useState("");
  const [messageBody,setMessageBody]=useState("");
  const [sendingMessage,setSendingMessage]=useState(false);
  const [messageStatus,setMessageStatus]=useState("");

  useEffect(()=>{load();},[profile?.id]);

  async function load(){
    if(!profile?.id)return;
    try{
      setLoading(true);

      const [manualResult,contactsResult]=await Promise.all([
        supabase.from("student_notifications")
          .select("id, title, body, kind, action_path, created_at, read_at, sender_id")
          .eq("student_id",profile.id).order("created_at",{ascending:false}).limit(60),
        supabase.rpc("get_student_communication_contacts"),
      ]);

      if(!manualResult.error)setManual(manualResult.data||[]);

      if(contactsResult.error)throw contactsResult.error;

      const contactMap=new Map();
      (contactsResult.data||[]).forEach(row=>{
        const id=Number(row.profile_id);
        if(!id)return;

        if(!contactMap.has(id)){
          contactMap.set(id,{
            id,
            name:row.full_name||(
              row.role==="teacher"?"المعلم":"مشرف المسجد"
            ),
            role:row.role,
            role_label:row.role_label||(
              row.role==="teacher"?"المعلم":"مشرف المسجد"
            ),
            contexts:[],
          });
        }

        contactMap.get(id).contexts.push({
          mosque_id:row.mosque_id,
          mosque_name:row.mosque_name,
          halaqa_id:row.halaqa_id,
          halaqa_name:row.halaqa_name,
        });
      });

      const linkedContacts=[...contactMap.values()];
      setContacts(linkedContacts);

      setRecipientId(current=>{
        if(current&&linkedContacts.some(item=>String(item.id)===String(current))){
          return current;
        }

        const teacher=linkedContacts.find(item=>item.role==="teacher");
        return teacher?String(teacher.id):(linkedContacts[0]?String(linkedContacts[0].id):"");
      });

      const from35=daysAgo(35);
      const [quranResult,nooraniaResult,attendanceResult,examResult,progressResult]=await Promise.all([
        supabase.from("recitations").select("id, recitation_date, lesson_evaluation, review_evaluation, points")
          .eq("student_id",profile.id).gte("recitation_date",from35).order("recitation_date",{ascending:false}).limit(50),
        supabase.from("noorania_recitations").select("id, recitation_date, lesson_evaluation, revision_evaluation, points")
          .eq("student_id",profile.id).gte("recitation_date",from35).order("recitation_date",{ascending:false}).limit(50),
        supabase.from("attendance").select("id, attendance_date, status").eq("student_id",profile.id).gte("attendance_date",from35).order("attendance_date",{ascending:false}),
        supabase.from("exam_results").select("id, exam_id, score, is_passed, updated_at").eq("student_id",profile.id).order("id",{ascending:false}).limit(10),
        supabase.from("monthly_progress").select("id, updated_at, approved").eq("student_id",profile.id).order("updated_at",{ascending:false}).limit(2),
      ]);

      const derived=[];
      const recs=[
        ...(quranResult.data||[]).map(r=>({...r,type:"quran"})),
        ...(nooraniaResult.data||[]).map(r=>({...r,type:"noorania"})),
      ].sort((a,b)=>new Date(b.recitation_date)-new Date(a.recitation_date));

      if(recs[0])derived.push({
        id:`rec-${recs[0].type}-${recs[0].id}`,kind:"recitation",
        title:"تم تسجيل تسميعك",
        body:`آخر جلسة تسميع لك بتاريخ ${formatGregorianDate(recs[0].recitation_date)}. واصل تقدمك.`,
        created_at:`${recs[0].recitation_date}T12:00:00`,
      });

      const repeats=recs.filter(r=>isRepeat(r.lesson_evaluation)||isRepeat(r.review_evaluation)||isRepeat(r.revision_evaluation)).length;
      if(repeats>=3)derived.push({
        id:"repeat-motivation",kind:"motivation",title:"الإعادة ليست نهاية المحاولة",
        body:"ظهرت عدة إعادات مؤخرًا. ركّز على مقدار أقل بإتقان، وسترى الفرق سريعًا بإذن الله.",
        created_at:new Date().toISOString(),
      });
      else if(recs.length>=5&&repeats===0)derived.push({
        id:"recitation-excellent",kind:"success",title:"أداء تسميع جميل",
        body:"آخر جلساتك بلا إعادة. حافظ على هذا الثبات والإتقان.",
        created_at:new Date().toISOString(),
      });

      const attendance=attendanceResult.data||[];
      const recent7=attendance.filter(r=>r.attendance_date>=daysAgo(7));
      const absences=recent7.filter(r=>r.status==="absent"||r.status==="excused");
      if(absences.length)derived.push({
        id:"attendance-reminder",kind:"attendance",title:"احرص على الحضور",
        body:`سُجل لك ${absences.length} غياب/عذر خلال آخر 7 أيام. حضورك المنتظم يساعدك على الثبات في الخطة.`,
        created_at:new Date().toISOString(),
      });
      else if(recent7.length>=3)derived.push({
        id:"attendance-streak",kind:"success",title:"أسبوع جميل بلا غياب",
        body:"استمرارك في الحضور إنجاز بحد ذاته. واصل هذه العادة الممتازة.",
        created_at:new Date().toISOString(),
      });

      if((progressResult.data||[])[0]){
        const row=progressResult.data[0];
        derived.push({
          id:`progress-${row.id}`,kind:"progress",
          title:row.approved?"تم اعتماد إنجازك الشهري":"تم تحديث إنجازك الشهري",
          body:row.approved?"إنجازك الشهري أصبح معتمدًا. افتح رحلة الإنجاز وشاهد تقدمك.":"تم تحديث بيانات الإنجاز؛ راقب رحلتك وواصل نحو الهدف.",
          created_at:row.updated_at||new Date().toISOString(),
        });
      }

      const examRows=examResult.data||[];
      const examIds=[...new Set(examRows.map(r=>r.exam_id).filter(Boolean))];
      if(examIds.length){
        const {data:exams}=await supabase.from("exams").select("id, title, total_score, exam_date").in("id",examIds);
        const map=new Map((exams||[]).map(e=>[e.id,e]));
        examRows.slice(0,3).forEach(result=>{
          const exam=map.get(result.exam_id);
          const total=Number(exam?.total_score||100);
          const percent=total?Math.round((Number(result.score||0)/total)*100):0;
          const msg=examMessage(percent);
          derived.push({
            id:`exam-${result.id}`,kind:"exam",
            title:`${msg.title} — ${exam?.title||"اختبارك"}`,
            body:`نتيجتك ${percent}%. ${msg.body}`,
            created_at:result.updated_at||exam?.exam_date||new Date().toISOString(),
          });
        });
      }

      setSmart(derived);
    }catch(error){console.error("Student smart notifications:",error)}
    finally{setLoading(false)}
  }

  async function markRead(id){
    const {error}=await supabase.from("student_notifications")
      .update({read_at:new Date().toISOString()}).eq("id",id).eq("student_id",profile.id);
    if(!error)setManual(current=>current.map(item=>item.id===id?{...item,read_at:new Date().toISOString()}:item));
  }

  const contactById=useMemo(
    ()=>new Map(contacts.map(item=>[Number(item.id),item])),
    [contacts]
  );

  const notifications=useMemo(()=>[
    ...manual.map(item=>({
      ...item,
      source:"manual",
      sender:contactById.get(Number(item.sender_id))||null,
    })),
    ...smart.map(item=>({...item,source:"smart",read_at:true})),
  ].sort((a,b)=>new Date(b.created_at||0)-new Date(a.created_at||0)),[manual,smart,contactById]);

  const unread=manual.filter(item=>!item.read_at).length;

  async function sendMessage(event){
    event.preventDefault();

    if(!profile?.id||!recipientId||!messageBody.trim())return;

    try{
      setSendingMessage(true);
      setMessageStatus("");

      const {error}=await supabase.rpc("send_internal_message",{
        p_recipient_id:Number(recipientId),
        p_subject:messageSubject.trim()||"رسالة من الطالب",
        p_body:messageBody.trim(),
        p_message_type:"general",
        p_priority:"normal",
        p_student_context_id:Number(profile.id),
        p_reply_to_id:null,
      });

      if(error)throw error;

      const recipient=contacts.find(item=>Number(item.id)===Number(recipientId));

      setMessageBody("");
      setMessageSubject("");
      setMessageStatus(
        recipient?.role==="supervisor"
          ?"تم إرسال الرسالة إلى مشرف المسجد"
          :"تم إرسال الرسالة إلى المعلم"
      );
    }catch(error){
      console.error("Student message:",error);
      setMessageStatus("تعذر إرسال الرسالة. حاول مرة أخرى.");
    }finally{
      setSendingMessage(false);
    }
  }

  return(
    <StudentPage
      eyebrow="الصديق يتابع معك"
      title="الإشعارات"
      description="تنبيهات ذكية وتحفيزية من نشاطك، بالإضافة إلى رسائل المعلم أو المشرف."
      icon={BellRing}
    >
      <section className="student-metrics">
        <Metric icon={BellRing} label="غير مقروء" value={unread} note="رسالة مباشرة"/>
        <Metric icon={Sparkles} label="تنبيهات ذكية" value={smart.length} note="مبنية على نشاطك"/>
        <Metric icon={Heart} label="التحفيز" value="مستمر" note="في النجاح والتعثر"/>
        <Metric icon={CheckCircle2} label="الهدف" value="تقدمك" note="وليس كثرة الإشعارات"/>
      </section>

      <section className="student-panel">
        <div className="student-panel-head">
          <div className="student-panel-title">
            <div className="student-panel-title-icon"><MessageCircle size={19}/></div>
            <div><span>التواصل</span><h3>المعلم والمشرف</h3></div>
          </div>
        </div>

        {!contacts.length?(
          <div className="student-empty">
            <MessageCircle size={29}/>
            <strong>لا توجد جهة تواصل مرتبطة بحسابك حاليًا</strong>
          </div>
        ):(
          <form
            onSubmit={sendMessage}
            style={{
              display:"grid",
              gap:12,
              padding:"14px 16px 18px",
            }}
          >
            <div
              style={{
                display:"grid",
                gridTemplateColumns:"repeat(auto-fit,minmax(190px,1fr))",
                gap:10,
              }}
            >
              <label style={{display:"grid",gap:6}}>
                <span style={{fontSize:12,fontWeight:800,color:"#53665f"}}>إلى</span>
                <select
                  value={recipientId}
                  onChange={event=>{
                    setRecipientId(event.target.value);
                    setMessageStatus("");
                  }}
                  style={{
                    width:"100%",
                    minHeight:42,
                    border:"1px solid #dce7e2",
                    borderRadius:12,
                    padding:"0 10px",
                    background:"#fff",
                    color:"#354a41",
                    font:"inherit",
                    outline:"none",
                  }}
                >
                  {contacts.map(contact=>{
                    const context=contact.contexts?.[0];
                    const role=contact.role==="teacher"?"المعلم":"مشرف المسجد";
                    const place=context?.halaqa_name||context?.mosque_name||"";
                    return(
                      <option key={contact.id} value={contact.id}>
                        {role} — {contact.name}{place?` • ${place}`:""}
                      </option>
                    );
                  })}
                </select>
              </label>

              <label style={{display:"grid",gap:6}}>
                <span style={{fontSize:12,fontWeight:800,color:"#53665f"}}>الموضوع</span>
                <input
                  value={messageSubject}
                  onChange={event=>setMessageSubject(event.target.value)}
                  maxLength={160}
                  placeholder="موضوع الرسالة"
                  style={{
                    width:"100%",
                    minHeight:42,
                    border:"1px solid #dce7e2",
                    borderRadius:12,
                    padding:"0 11px",
                    background:"#fff",
                    color:"#354a41",
                    font:"inherit",
                    outline:"none",
                  }}
                />
              </label>
            </div>

            <label style={{display:"grid",gap:6}}>
              <span style={{fontSize:12,fontWeight:800,color:"#53665f"}}>الرسالة</span>
              <textarea
                value={messageBody}
                onChange={event=>{
                  setMessageBody(event.target.value);
                  setMessageStatus("");
                }}
                required
                maxLength={5000}
                rows={4}
                placeholder="اكتب رسالتك هنا…"
                style={{
                  width:"100%",
                  minHeight:105,
                  resize:"vertical",
                  border:"1px solid #dce7e2",
                  borderRadius:12,
                  padding:11,
                  background:"#fff",
                  color:"#354a41",
                  font:"inherit",
                  lineHeight:1.7,
                  outline:"none",
                }}
              />
            </label>

            <div
              style={{
                display:"flex",
                alignItems:"center",
                justifyContent:"space-between",
                gap:10,
                flexWrap:"wrap",
              }}
            >
              <span
                style={{
                  minHeight:20,
                  color:messageStatus.startsWith("تم ")?"#0f6f52":"#9b453e",
                  fontSize:12,
                  fontWeight:800,
                }}
              >
                {messageStatus}
              </span>

              <button
                type="submit"
                disabled={sendingMessage||!recipientId||!messageBody.trim()}
                style={{
                  minHeight:40,
                  display:"inline-flex",
                  alignItems:"center",
                  justifyContent:"center",
                  gap:7,
                  padding:"0 14px",
                  border:0,
                  borderRadius:11,
                  color:"#fff",
                  background:"#0f4c45",
                  font:"inherit",
                  fontWeight:900,
                  cursor:sendingMessage?"wait":"pointer",
                  opacity:sendingMessage||!recipientId||!messageBody.trim()?0.55:1,
                }}
              >
                <Send size={16}/>
                {sendingMessage?"جارٍ الإرسال…":"إرسال"}
              </button>
            </div>
          </form>
        )}
      </section>

      <section className="student-panel">
        <div className="student-panel-head">
          <div className="student-panel-title">
            <div className="student-panel-title-icon"><BellRing size={19}/></div>
            <div><span>مركز الإشعارات</span><h3>ما يحتاج انتباهك</h3></div>
          </div>
        </div>

        {loading?(
          <div className="student-loading">جارٍ تجهيز إشعاراتك…</div>
        ):!notifications.length?(
          <div className="student-empty"><BellRing size={29}/><strong>لا توجد إشعارات جديدة</strong></div>
        ):(
          <div className="student-list">
            {notifications.map(item=><NotificationItem item={item} key={`${item.source}-${item.id}`} onRead={markRead}/>)}
          </div>
        )}
      </section>
    </StudentPage>
  );
}

function NotificationItem({item,onRead}){
  const Icon=item.kind==="attendance"?UserX:item.kind==="exam"?GraduationCap:item.kind==="recitation"?BookOpen:item.kind==="success"?CheckCircle2:Sparkles;
  return(
    <article className={`student-notification ${item.source==="manual"&&!item.read_at?"unread":""}`}>
      <div className="student-notification-icon"><Icon size={18}/></div>
      <div className="student-notification-copy">
        <strong>{item.title}</strong>
        {item.sender&&(
          <span style={{display:"block",marginTop:3,fontWeight:800,color:"#5f746c"}}>
            {item.sender.role==="teacher"?"المعلم":"مشرف المسجد"}: {item.sender.name}
          </span>
        )}
        <p>{item.body}</p>
        <span>{formatDateTime(item.created_at)}</span>
      </div>
      {item.source==="manual"&&!item.read_at&&<button type="button" onClick={()=>onRead(item.id)}>تم الاطلاع</button>}
    </article>
  );
}
function Metric({icon:Icon,label,value,note}){return <article className="student-metric"><div className="student-metric-icon"><Icon size={20}/></div><div><span>{label}</span><strong>{value}</strong><small>{note}</small></div></article>}

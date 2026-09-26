import { useEffect, useState } from "react";
import { Info, Users, GraduationCap, BookOpen, Landmark, Database, CheckCircle2, RefreshCw } from "lucide-react";
import { supabase } from "../../lib/supabase";

export default function AboutSystem(){
 const [stats,setStats]=useState({students:0,teachers:0,halaqat:0,mosques:0}),[loading,setLoading]=useState(true),[healthy,setHealthy]=useState(true);
 async function load(){setLoading(true);const results=await Promise.all([
  supabase.from("profiles").select("id",{count:"exact",head:true}).eq("role","student"),
  supabase.from("profiles").select("id",{count:"exact",head:true}).eq("role","teacher"),
  supabase.from("halaqat").select("id",{count:"exact",head:true}),
  supabase.from("mosques").select("id",{count:"exact",head:true})
 ]);setHealthy(results.every(x=>!x.error));setStats({students:results[0].count||0,teachers:results[1].count||0,halaqat:results[2].count||0,mosques:results[3].count||0});setLoading(false)}
 useEffect(()=>{load()},[]);
 const items=[[Users,"الطلاب",stats.students],[GraduationCap,"المعلمون",stats.teachers],[BookOpen,"الحلقات",stats.halaqat],[Landmark,"المساجد",stats.mosques]];
 return <div>
  <section className="settings-panel-intro"><span className="settings-panel-intro__icon"><Info size={21}/></span><div><small>الصِّدّيق</small><h3>معلومات النظام</h3><p>نظرة سريعة على البيانات الحالية.</p></div><span className="real-badge">{healthy?<CheckCircle2 size={13}/>:<Database size={13}/>} {healthy?"متصل":"تحقق من الاتصال"}</span></section>
  <section className="settings-real-card"><div className="settings-real-card__head"><div><Database size={17}/><span><strong>الإحصاءات الحالية</strong><small>بيانات محدثة</small></span></div><button type="button" className="btn-secondary" onClick={load}><RefreshCw size={13} className={loading?"settings-spin":""}/> تحديث</button></div>
   <div className="system-stats-pro">{items.map(([Icon,label,value])=><div className="system-stat-pro" key={label}><Icon size={17}/><span>{label}</span><strong>{loading?"—":value}</strong></div>)}</div>
  </section>
 </div>
}
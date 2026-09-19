import { useEffect, useMemo, useState } from "react";
import { Tv, Timer, Users, Trophy, Quote, Save, RefreshCw, CheckCircle2 } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { showToast } from "../../components/Toast";

const DEFAULTS={tv_page_duration:"25",tv_first_page_count:"10",tv_other_pages_count:"20",tv_show_podium:"true",tv_show_quotes:"true"};
export default function TVSettings(){
 const [form,setForm]=useState(DEFAULTS),[saved,setSaved]=useState(DEFAULTS),[loading,setLoading]=useState(true),[saving,setSaving]=useState(false);
 const dirty=useMemo(()=>JSON.stringify(form)!==JSON.stringify(saved),[form,saved]);
 useEffect(()=>{load()},[]);
 async function load(){try{setLoading(true);const {data,error}=await supabase.from("system_settings").select("setting_key,setting_value").in("setting_key",Object.keys(DEFAULTS));if(error)throw error;const n={...DEFAULTS};(data||[]).forEach(x=>n[x.setting_key]=String(x.setting_value??DEFAULTS[x.setting_key]));setForm(n);setSaved(n)}catch(e){console.error(e);showToast("تعذر تحميل إعدادات شاشة العرض")}finally{setLoading(false)}}
 async function save(){try{setSaving(true);for(const [key,value] of Object.entries(form)){const {error}=await supabase.from("system_settings").upsert({setting_key:key,setting_value:String(value)},{onConflict:"setting_key"});if(error)throw error}setSaved(form);showToast("تم حفظ إعدادات شاشة العرض")}catch(e){console.error(e);showToast("تعذر حفظ إعدادات شاشة العرض")}finally{setSaving(false)}}
 const set=(k,v)=>setForm(p=>({...p,[k]:v}));
 if(loading)return <div className="general-settings-state"><RefreshCw className="settings-spin" size={20}/><div><strong>جاري تحميل شاشة العرض</strong><span>قراءة الإعدادات من قاعدة البيانات</span></div></div>;
 return <div>
  <section className="settings-panel-intro"><span className="settings-panel-intro__icon"><Tv size={21}/></span><div><small>لوحة الشرف</small><h3>إعدادات شاشة العرض</h3><p>تتحكم هذه القيم مباشرة في التنقل والتقسيم والعناصر الظاهرة في شاشة التلفزيون.</p></div><span className="real-badge"><CheckCircle2 size={13}/> مرتبط بالشاشة</span></section>
  <section className="settings-real-card"><div className="settings-real-card__head"><div><Timer size={17}/><span><strong>التنقل وتقسيم الطلاب</strong><small>مدة كل صفحة وعدد الطلاب في الصفحات</small></span></div></div>
   <div className="settings-real-grid">
    <label className="settings-field"><span><Timer size={13}/> مدة الصفحة بالثواني</span><input type="number" min="5" max="300" value={form.tv_page_duration} onChange={e=>set("tv_page_duration",e.target.value)}/></label>
    <label className="settings-field"><span><Users size={13}/> عدد طلاب الصفحة الأولى</span><input type="number" min="3" max="100" value={form.tv_first_page_count} onChange={e=>set("tv_first_page_count",e.target.value)}/></label>
    <label className="settings-field full"><span><Users size={13}/> عدد طلاب الصفحات التالية</span><input type="number" min="1" max="100" value={form.tv_other_pages_count} onChange={e=>set("tv_other_pages_count",e.target.value)}/></label>
   </div>
  </section>
  <section className="settings-real-card"><div className="settings-real-card__head"><div><Trophy size={17}/><span><strong>عناصر العرض</strong><small>إظهار أو إخفاء مكونات الشاشة</small></span></div></div>
   <div className="settings-switch-row"><div><strong>منصة الثلاثة الأوائل</strong><small>إظهار منصة التتويج في الصفحة الأولى</small></div><button className={`settings-switch ${form.tv_show_podium==="true"?"on":""}`} onClick={()=>set("tv_show_podium",form.tv_show_podium==="true"?"false":"true")}><i/></button></div>
   <div className="settings-switch-row"><div><strong>العبارات التحفيزية</strong><small>عرض العبارات المحفوظة في شاشة العرض</small></div><button className={`settings-switch ${form.tv_show_quotes==="true"?"on":""}`} onClick={()=>set("tv_show_quotes",form.tv_show_quotes==="true"?"false":"true")}><i/></button></div>
  </section>
  <div className="settings-actions-pro"><button className="btn-secondary" onClick={load}><RefreshCw size={14}/> تحديث</button><button className="btn-primary" disabled={!dirty||saving} onClick={save}><Save size={14}/>{saving?"جاري الحفظ":"حفظ إعدادات الشاشة"}</button></div>
 </div>
}
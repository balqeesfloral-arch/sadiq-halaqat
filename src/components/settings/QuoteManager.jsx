import { useEffect, useState } from "react";
import { Plus, Trash2, Quote, Save, RefreshCw, CheckCircle2 } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { showToast } from "../../components/Toast";

export default function QuoteManager(){
 const [quotes,setQuotes]=useState([]),[newQuote,setNewQuote]=useState(""),[loading,setLoading]=useState(true),[adding,setAdding]=useState(false);
 useEffect(()=>{load()},[]);
 async function load(){try{setLoading(true);const {data,error}=await supabase.from("tv_quotes").select("*").order("sort_order",{ascending:true});if(error)throw error;setQuotes(data||[])}catch(e){console.error(e);showToast("تعذر تحميل العبارات")}finally{setLoading(false)}}
 async function add(){const value=newQuote.trim();if(!value)return;try{setAdding(true);const {error}=await supabase.from("tv_quotes").insert({quote:value});if(error)throw error;setNewQuote("");await load();showToast("تمت إضافة العبارة")}catch(e){console.error(e);showToast("تعذر إضافة العبارة")}finally{setAdding(false)}}
 async function update(id,value){const {error}=await supabase.from("tv_quotes").update({quote:value.trim()}).eq("id",id);if(error){showToast("تعذر حفظ العبارة");return}showToast("تم حفظ العبارة")}
 async function remove(id){if(!window.confirm("حذف هذه العبارة؟"))return;const {error}=await supabase.from("tv_quotes").delete().eq("id",id);if(error){showToast("تعذر حذف العبارة");return}setQuotes(p=>p.filter(x=>x.id!==id));showToast("تم حذف العبارة")}
 if(loading)return <div className="general-settings-state"><RefreshCw className="settings-spin" size={20}/><div><strong>جاري تحميل العبارات</strong><span>قراءة tv_quotes</span></div></div>;
 return <div>
  <section className="settings-panel-intro"><span className="settings-panel-intro__icon"><Quote size={21}/></span><div><small>محتوى شاشة العرض</small><h3>العبارات التحفيزية</h3><p>العبارات هنا محفوظة في قاعدة البيانات وتستخدمها شاشة العرض مباشرة.</p></div><span className="real-badge"><CheckCircle2 size={13}/> {quotes.length} عبارة</span></section>
  <section className="settings-real-card">
   <div className="settings-real-card__head"><div><Plus size={17}/><span><strong>إضافة عبارة</strong><small>اكتب عبارة قصيرة وواضحة للعرض</small></span></div></div>
   <div className="quote-add-pro"><input className="quote-editor-input" value={newQuote} onChange={e=>setNewQuote(e.target.value)} onKeyDown={e=>e.key==="Enter"&&add()} placeholder="أضف عبارة تحفيزية جديدة"/><button className="btn-primary" disabled={!newQuote.trim()||adding} onClick={add}><Plus size={14}/> إضافة</button></div>
  </section>
  <section className="settings-real-card"><div className="settings-real-card__head"><div><Quote size={17}/><span><strong>العبارات المحفوظة</strong><small>يمكن تعديل النص أو حذفه</small></span></div></div>
   <div className="quote-list-pro">{quotes.length?quotes.map(q=><QuoteRow key={q.id} item={q} onSave={update} onDelete={remove}/>):<div className="general-settings-note">لا توجد عبارات محفوظة.</div>}</div>
  </section>
 </div>
}
function QuoteRow({item,onSave,onDelete}){const [value,setValue]=useState(item.quote||"");return <div className="quote-row-pro"><input className="quote-editor-input" value={value} onChange={e=>setValue(e.target.value)}/><div className="quote-actions-pro"><button className="icon-btn" title="حفظ" onClick={()=>onSave(item.id,value)}><Save size={15}/></button><button className="icon-btn danger" title="حذف" onClick={()=>onDelete(item.id)}><Trash2 size={15}/></button></div></div>}

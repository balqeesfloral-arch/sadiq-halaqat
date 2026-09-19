import { useEffect, useMemo, useState } from "react";
import { Save, UserCog, Phone, BadgeCheck, RefreshCw, CheckCircle2, AlertCircle, Info } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { showToast } from "../../components/Toast";

const EMPTY={id:null,full_name:"",display_name:"",phone:"",user_number:"",role:""};

export default function GeneralSettings(){
  const [loading,setLoading]=useState(true),[saving,setSaving]=useState(false);
  const [form,setForm]=useState(EMPTY),[saved,setSaved]=useState(EMPTY),[error,setError]=useState("");
  const dirty=useMemo(()=>["full_name","display_name","phone"].some(k=>String(form[k]||"")!==String(saved[k]||"")),[form,saved]);

  useEffect(()=>{loadProfile()},[]);
  async function loadProfile(){
    try{
      setLoading(true);setError("");
      const {data:{user},error:authError}=await supabase.auth.getUser(); if(authError) throw authError;
      const {data,error}=await supabase.from("profiles").select("id,full_name,display_name,phone,user_number,role").eq("auth_user_id",user.id).single();
      if(error) throw error;
      const next={...EMPTY,...data}; setForm(next);setSaved(next);
    }catch(e){console.error(e);setError("تعذر تحميل بيانات حساب مدير النظام.");}
    finally{setLoading(false)}
  }
  async function save(){
    if(!dirty||saving)return;
    try{
      setSaving(true);
      const payload={full_name:form.full_name.trim(),display_name:form.display_name.trim()||null,phone:form.phone.trim()||null};
      const {error}=await supabase.from("profiles").update(payload).eq("id",form.id); if(error)throw error;
      const next={...form,...payload,display_name:payload.display_name||"",phone:payload.phone||""};setForm(next);setSaved(next);
      showToast("تم تحديث بيانات الحساب");
    }catch(e){console.error(e);showToast("تعذر حفظ بيانات الحساب");}finally{setSaving(false)}
  }
  if(loading)return <div className="general-settings-state"><RefreshCw className="settings-spin" size={20}/><div><strong>جاري تحميل الحساب</strong><span>قراءة بيانات المدير من profiles</span></div></div>;
  if(error)return <div className="general-settings-state"><AlertCircle size={20}/><div><strong>تعذر التحميل</strong><span>{error}</span></div><button className="btn-secondary" onClick={loadProfile}>إعادة المحاولة</button></div>;
  return <div className="general-settings-pro">
    <section className="general-settings-overview">
      <span className="general-settings-overview__icon"><UserCog size={22}/></span>
      <div><span>حساب مدير النظام</span><h3>البيانات الإدارية</h3><p>الاسم المعروض هنا مرتبط مباشرة بملفك ويظهر في واجهة الإدارة.</p></div>
      <span className="general-settings-live"><CheckCircle2 size={14}/> مرتبط بالحساب</span>
    </section>
    <section className="general-settings-section">
      <div className="general-settings-section__head"><div><strong>بيانات الحساب</strong><span>تعديل بيانات المدير الحالية فقط</span></div><span className="general-settings-count">{form.role==="admin"?"مدير النظام":form.role}</span></div>
      <div className="general-settings-grid">
        <label className="general-field"><span className="general-field__label"><BadgeCheck size={14}/> الاسم الكامل</span><input value={form.full_name||""} onChange={e=>setForm(p=>({...p,full_name:e.target.value}))}/></label>
        <label className="general-field"><span className="general-field__label"><UserCog size={14}/> الاسم المعروض</span><input value={form.display_name||""} placeholder="يظهر في الشريط العلوي" onChange={e=>setForm(p=>({...p,display_name:e.target.value}))}/></label>
        <label className="general-field"><span className="general-field__label"><Phone size={14}/> رقم الجوال</span><input dir="ltr" value={form.phone||""} onChange={e=>setForm(p=>({...p,phone:e.target.value}))}/></label>
        <label className="general-field"><span className="general-field__label"><BadgeCheck size={14}/> رقم المستخدم</span><input value={form.user_number||""} disabled/></label>
      </div>
    </section>
    <aside className="general-settings-note"><Info size={17}/><div><strong>إدارة المساجد منفصلة</strong><span>اسم المسجد وقسم رجال/نساء والعنوان لا توضع في إعدادات عامة؛ تُدار من صفحة المساجد.</span></div></aside>
    <div className="general-settings-actions"><div className={`general-settings-change-state ${dirty?"dirty":""}`}>{dirty?"تغييرات غير محفوظة":"البيانات محفوظة"}</div><div className="general-settings-buttons"><button className="general-settings-reload" onClick={loadProfile}><RefreshCw size={14}/> تحديث</button><button className="general-settings-save" disabled={!dirty||saving} onClick={save}><Save size={14}/>{saving?"جاري الحفظ":"حفظ التغييرات"}</button></div></div>
  </div>
}
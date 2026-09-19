import { useEffect, useState } from "react";
import { ShieldCheck, KeyRound, Mail, Save, AlertCircle, CheckCircle2 } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { showToast } from "../../components/Toast";

export default function SecuritySettings(){
  const [email,setEmail]=useState(""),[password,setPassword]=useState(""),[confirm,setConfirm]=useState(""),[saving,setSaving]=useState(false);
  useEffect(()=>{supabase.auth.getUser().then(({data})=>setEmail(data?.user?.email||""))},[]);
  async function changePassword(){
    if(password.length<8){showToast("كلمة المرور يجب ألا تقل عن 8 أحرف");return}
    if(password!==confirm){showToast("تأكيد كلمة المرور غير مطابق");return}
    try{setSaving(true);const {error}=await supabase.auth.updateUser({password});if(error)throw error;setPassword("");setConfirm("");showToast("تم تغيير كلمة المرور بنجاح")}
    catch(e){console.error(e);showToast("تعذر تغيير كلمة المرور")}finally{setSaving(false)}
  }
  return <div>
    <section className="settings-panel-intro"><span className="settings-panel-intro__icon"><ShieldCheck size={21}/></span><div><small>Supabase Auth</small><h3>الحساب والأمان</h3><p>هذه الصفحة تغيّر بيانات المصادقة الحقيقية للحساب، ولا تعرض مفاتيح أمان وهمية.</p></div><span className="real-badge"><CheckCircle2 size={13}/> فعلي</span></section>
    <section className="settings-real-card">
      <div className="settings-real-card__head"><div><Mail size={17}/><span><strong>حساب تسجيل الدخول</strong><small>البريد المرتبط بجلسة المصادقة الحالية</small></span></div></div>
      <div className="security-account"><i>{(email||"م").charAt(0).toUpperCase()}</i><div><strong>{email||"لا يوجد بريد"}</strong><small>حساب المصادقة الحالي</small></div></div>
    </section>
    <section className="settings-real-card">
      <div className="settings-real-card__head"><div><KeyRound size={17}/><span><strong>تغيير كلمة المرور</strong><small>يتم التحديث مباشرة عبر Supabase Auth</small></span></div></div>
      <div className="settings-real-grid">
        <label className="settings-field"><span>كلمة المرور الجديدة</span><input type="password" autoComplete="new-password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="8 أحرف على الأقل"/></label>
        <label className="settings-field"><span>تأكيد كلمة المرور</span><input type="password" autoComplete="new-password" value={confirm} onChange={e=>setConfirm(e.target.value)} placeholder="أعد كتابة كلمة المرور"/></label>
      </div>
      <div className="settings-actions-pro"><button className="btn-primary" disabled={saving||!password||!confirm} onClick={changePassword}><Save size={15}/>{saving?"جاري التحديث":"تحديث كلمة المرور"}</button></div>
    </section>
    <div className="general-settings-note"><AlertCircle size={17}/><div><strong>تم حذف مهلة الجلسة وسجل النشاطات من هذه الصفحة</strong><span>لأن النسخة السابقة كانت تحفظ القيم فقط ولم يكن هناك منطق في المشروع يطبقها فعليًا.</span></div></div>
  </div>
}
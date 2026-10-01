import { useCallback, useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import "./StudentAccessCard.css";

function studentLoginLink(card, origin = window.location.origin) {
  const params = new URLSearchParams({ student: card.user_number, name: card.full_name, code: card.access_code });
  return `${origin}/login#${params}`;
}

export default function StudentAccessCard({ studentId, initialCard = null, autoLoad = false }) {
  const [card, setCard] = useState(initialCard);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const loadCard = useCallback(async (reset = false) => {
    setLoading(true); setMessage("");
    try {
      const { data, error } = await supabase.functions.invoke("student-access-card", { body: { student_id: Number(studentId), reset: reset === true } });
      if (error || !data?.ok) throw new Error("تعذر عرض بطاقة الدخول. تحقق من صلاحيتك واتصالك.");
      setCard(data);
    } catch (error) { setMessage(error.message); }
    finally { setLoading(false); }
  }, [studentId]);
  useEffect(() => { if (autoLoad && !initialCard) loadCard(); }, [autoLoad, initialCard, loadCard]);
  async function copyLink() {
    try {
      await navigator.clipboard.writeText(studentLoginLink(card));
      setMessage("تم نسخ رابط الدخول. أرسله للطالب أو ولي أمره فقط.");
    } catch { setMessage("تعذر النسخ. استخدم رقم الطالب ورمز الدخول الظاهرين."); }
  }
  return <section className={`student-access-card ${card ? "" : "is-collapsed"}`} aria-label="بطاقة دخول الطالب">
    {card?.access_code ? <>
      <strong>بطاقة دخول الطالب</strong>
      <span>رقم الطالب: <bdi>{card.user_number}</bdi></span>
      <span>رمز الدخول السري: <bdi className="student-access-code">{card.access_code.slice(0, 4)} {card.access_code.slice(4)}</bdi></span>
      <button type="button" onClick={copyLink}>نسخ رابط الدخول</button>
      {studentId && <button type="button" disabled={loading} onClick={() => {
        if (window.confirm("تغيير الرمز يبطل رابط البطاقة السابق. جلسات الدخول الحالية تستمر حتى تسجيل الخروج. هل تريد تغيير الرمز؟")) loadCard(true);
      }}>تغيير رمز الدخول</button>}
      <small>احتفظ بالرمز والرابط للطالب وولي أمره. الأجهزة المسجل دخولها لا تحتاج إعادة إدخاله.</small>
    </> : <button type="button" onClick={loadCard} disabled={loading}>{loading ? "جاري التحميل…" : "عرض بطاقة الدخول"}</button>}
    {message && <p role="status">{message}</p>}
  </section>;
}

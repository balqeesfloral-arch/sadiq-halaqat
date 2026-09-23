import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  BellRing,
  BookOpen,
  CalendarClock,
  CheckCircle2,
  GraduationCap,
  Heart,
  MessageCircle,
  RefreshCw,
  Send,
  Sparkles,
  Target,
  TrendingUp,
  UserX,
} from "lucide-react";
import StudentPage from "../../components/student/StudentPage";
import { useStudentPortal } from "../../context/StudentPortalContext";
import { supabase } from "../../lib/supabase";
import { formatDateTime, formatGregorianDate } from "../../lib/studentPortalUtils";
import "./StudentPortal.css";

function categoryKind(category, severity) {
  if (severity === "positive") return "success";
  if (category === "attendance") return "attendance";
  if (category === "exam") return "exam";
  if (category === "revision") return "revision";
  if (category === "plan") return "progress";
  if (category === "recitation") return "recitation";
  return "analysis";
}

function segmentLabel(type) {
  if (type === "lesson") return "الدرس";
  if (type === "side_lesson") return "جنب الدرس";
  if (type === "revision") return "المراجعة";
  return "المطلوب";
}

function assignmentRange(row) {
  if (!row?.from_surah || !row?.to_surah) return "تم حفظ الموضع القرآني";
  if (row.from_surah === row.to_surah) return `${row.from_surah} ${row.from_ayah} ← ${row.to_ayah}`;
  return `${row.from_surah} ${row.from_ayah} ← ${row.to_surah} ${row.to_ayah}`;
}

export default function StudentNotifications() {
  const { profile, halaqa } = useStudentPortal();
  const [loading, setLoading] = useState(true);
  const [manual, setManual] = useState([]);
  const [smart, setSmart] = useState([]);
  const [analysis, setAnalysis] = useState(null);
  const [contacts, setContacts] = useState([]);
  const [recipientId, setRecipientId] = useState("");
  const [messageSubject, setMessageSubject] = useState("");
  const [messageBody, setMessageBody] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const [messageStatus, setMessageStatus] = useState("");

  useEffect(() => { load(); }, [profile?.id, halaqa?.id]);

  async function load() {
    if (!profile?.id) return;

    try {
      setLoading(true);

      const analysisRequest = halaqa?.id
        ? supabase.rpc("get_student_analysis", {
            p_student_id: Number(profile.id),
            p_halaqa_id: Number(halaqa.id),
          })
        : Promise.resolve({ data: null, error: null });

      const [manualResult, contactsResult, analysisResult] = await Promise.all([
        supabase.from("student_notifications")
          .select("id, title, body, kind, action_path, created_at, read_at, sender_id")
          .eq("student_id", profile.id)
          .order("created_at", { ascending: false })
          .limit(60),
        supabase.rpc("get_student_communication_contacts"),
        analysisRequest,
      ]);

      if (!manualResult.error) setManual(manualResult.data || []);
      if (contactsResult.error) throw contactsResult.error;
      if (analysisResult.error) throw analysisResult.error;

      const contactMap = new Map();
      (contactsResult.data || []).forEach((row) => {
        const id = Number(row.profile_id);
        if (!id) return;
        if (!contactMap.has(id)) {
          contactMap.set(id, {
            id,
            name: row.full_name || (row.role === "teacher" ? "المعلم" : "مشرف المسجد"),
            role: row.role,
            role_label: row.role_label || (row.role === "teacher" ? "المعلم" : "مشرف المسجد"),
            contexts: [],
          });
        }
        contactMap.get(id).contexts.push({
          mosque_id: row.mosque_id,
          mosque_name: row.mosque_name,
          halaqa_id: row.halaqa_id,
          halaqa_name: row.halaqa_name,
        });
      });

      const linkedContacts = [...contactMap.values()];
      setContacts(linkedContacts);
      setRecipientId((current) => {
        if (current && linkedContacts.some((item) => String(item.id) === String(current))) return current;
        const teacher = linkedContacts.find((item) => item.role === "teacher");
        return teacher ? String(teacher.id) : (linkedContacts[0] ? String(linkedContacts[0].id) : "");
      });

      const engine = analysisResult.data || null;
      setAnalysis(engine);

      const derived = [];
      const generatedAt = new Date().toISOString();

      (engine?.signals || []).forEach((signal) => {
        derived.push({
          id: `analysis-${signal.code}`,
          kind: categoryKind(signal.category, signal.severity),
          severity: signal.severity,
          title: signal.student_title || "مؤشر من بياناتك",
          body: signal.student_body || "ظهر مؤشر جديد من بيانات نشاطك.",
          created_at: generatedAt,
          evidence: signal.evidence || null,
        });
      });

      const assignments = engine?.next_assignments || [];
      if (assignments.length) {
        const firstDate = assignments[0]?.date;
        const sameDate = assignments.filter((row) => row.date === firstDate);
        derived.push({
          id: `next-${firstDate}`,
          kind: "assignment",
          title: "مطلوبك القادم جاهز",
          body: sameDate.map((row) => `${segmentLabel(row.segment_type)}: ${assignmentRange(row)}`).join(" • "),
          created_at: generatedAt,
          action_date: firstDate,
        });
      }

      if (engine?.metrics?.recitation_recent?.last_recitation) {
        derived.push({
          id: `last-recitation-${engine.metrics.recitation_recent.last_recitation}`,
          kind: "recitation",
          title: "آخر تسميع مسجل",
          body: `آخر جلسة تسميع مسجلة بتاريخ ${formatGregorianDate(engine.metrics.recitation_recent.last_recitation)}. افتح صفحة «تسميعي» لرؤية الموضع والتقييم بالتفصيل.`,
          created_at: `${engine.metrics.recitation_recent.last_recitation}T12:00:00`,
        });
      }

      setSmart(derived);
    } catch (error) {
      console.error("Student central analysis notifications:", error);
      setAnalysis(null);
      setSmart([]);
    } finally {
      setLoading(false);
    }
  }

  async function markRead(id) {
    const { error } = await supabase.from("student_notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("id", id)
      .eq("student_id", profile.id);
    if (!error) {
      setManual((current) => current.map((item) => item.id === id ? { ...item, read_at: new Date().toISOString() } : item));
    }
  }

  const contactById = useMemo(
    () => new Map(contacts.map((item) => [Number(item.id), item])),
    [contacts]
  );

  const notifications = useMemo(() => [
    ...manual.map((item) => ({ ...item, source: "manual", sender: contactById.get(Number(item.sender_id)) || null })),
    ...smart.map((item) => ({ ...item, source: "smart", read_at: true })),
  ].sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)), [manual, smart, contactById]);

  const unread = manual.filter((item) => !item.read_at).length;
  const analyticalCount = (analysis?.signals || []).filter((item) => ["high", "warning"].includes(item.severity)).length;
  const careLabel = analysis?.care_level === "needs_attention"
    ? "يحتاج عناية"
    : analysis?.care_level === "watch"
      ? "متابعة"
      : "مستقر";

  async function sendMessage(event) {
    event.preventDefault();
    if (!profile?.id || !recipientId || !messageBody.trim()) return;

    try {
      setSendingMessage(true);
      setMessageStatus("");

      const { error } = await supabase.rpc("send_internal_message", {
        p_recipient_id: Number(recipientId),
        p_subject: messageSubject.trim() || "رسالة من الطالب",
        p_body: messageBody.trim(),
        p_message_type: "general",
        p_priority: "normal",
        p_student_context_id: Number(profile.id),
        p_reply_to_id: null,
      });
      if (error) throw error;

      const recipient = contacts.find((item) => Number(item.id) === Number(recipientId));
      setMessageBody("");
      setMessageSubject("");
      setMessageStatus(recipient?.role === "supervisor" ? "تم إرسال الرسالة إلى مشرف المسجد" : "تم إرسال الرسالة إلى المعلم");
    } catch (error) {
      console.error("Student message:", error);
      setMessageStatus("تعذر إرسال الرسالة. حاول مرة أخرى.");
    } finally {
      setSendingMessage(false);
    }
  }

  return (
    <StudentPage
      eyebrow="الصديق يتابع معك"
      title="الإشعارات"
      description="رسائل مباشرة وتنبيهات تحليلية من المحرك المركزي، بنفس المؤشرات التي يراها المعلم والمشرف وبصياغة مناسبة لك."
      icon={BellRing}
    >
      <section className="student-metrics">
        <Metric icon={BellRing} label="غير مقروء" value={unread} note="رسالة مباشرة" />
        <Metric icon={TrendingUp} label="يحتاج انتباهك" value={analyticalCount} note="مؤشر تحليلي" />
        <Metric icon={Sparkles} label="حالتي" value={analysis ? careLabel : "—"} note="مؤشر متابعة وليس حكمًا" />
        <Metric icon={Heart} label="القاعدة" value="المعلم يقرر" note="والنظام يقترح" />
      </section>

      {analysis?.analysis_note && (
        <section className="student-panel" style={{ padding: "14px 16px" }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 10, color: "#546b62", lineHeight: 1.8 }}>
            <Sparkles size={18} style={{ marginTop: 4, flex: "0 0 auto" }} />
            <span>{analysis.analysis_note}</span>
          </div>
        </section>
      )}

      <section className="student-panel">
        <div className="student-panel-head">
          <div className="student-panel-title">
            <div className="student-panel-title-icon"><MessageCircle size={19}/></div>
            <div><span>التواصل</span><h3>المعلم والمشرف</h3></div>
          </div>
        </div>

        {!contacts.length ? (
          <div className="student-empty"><MessageCircle size={29}/><strong>لا توجد جهة تواصل مرتبطة بحسابك حاليًا</strong></div>
        ) : (
          <form onSubmit={sendMessage} style={{ display: "grid", gap: 12, padding: "14px 16px 18px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(190px,1fr))", gap: 10 }}>
              <label style={{ display: "grid", gap: 6 }}>
                <span style={{ fontSize: 12, fontWeight: 800, color: "#53665f" }}>إلى</span>
                <select
                  value={recipientId}
                  onChange={(event) => { setRecipientId(event.target.value); setMessageStatus(""); }}
                  style={{ width: "100%", minHeight: 42, border: "1px solid #dce7e2", borderRadius: 12, padding: "0 10px", background: "#fff", color: "#354a41", font: "inherit", outline: "none" }}
                >
                  {contacts.map((contact) => {
                    const context = contact.contexts?.[0];
                    const role = contact.role === "teacher" ? "المعلم" : "مشرف المسجد";
                    const place = context?.halaqa_name || context?.mosque_name || "";
                    return <option key={contact.id} value={contact.id}>{role} — {contact.name}{place ? ` • ${place}` : ""}</option>;
                  })}
                </select>
              </label>

              <label style={{ display: "grid", gap: 6 }}>
                <span style={{ fontSize: 12, fontWeight: 800, color: "#53665f" }}>الموضوع</span>
                <input
                  value={messageSubject}
                  onChange={(event) => setMessageSubject(event.target.value)}
                  maxLength={160}
                  placeholder="موضوع الرسالة"
                  style={{ width: "100%", minHeight: 42, border: "1px solid #dce7e2", borderRadius: 12, padding: "0 11px", background: "#fff", color: "#354a41", font: "inherit", outline: "none" }}
                />
              </label>
            </div>

            <label style={{ display: "grid", gap: 6 }}>
              <span style={{ fontSize: 12, fontWeight: 800, color: "#53665f" }}>الرسالة</span>
              <textarea
                value={messageBody}
                onChange={(event) => { setMessageBody(event.target.value); setMessageStatus(""); }}
                required
                maxLength={5000}
                rows={4}
                placeholder="اكتب رسالتك هنا…"
                style={{ width: "100%", minHeight: 105, resize: "vertical", border: "1px solid #dce7e2", borderRadius: 12, padding: 11, background: "#fff", color: "#354a41", font: "inherit", lineHeight: 1.7, outline: "none" }}
              />
            </label>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
              <span style={{ minHeight: 20, color: messageStatus.startsWith("تم ") ? "#0f6f52" : "#9b453e", fontSize: 12, fontWeight: 800 }}>{messageStatus}</span>
              <button
                type="submit"
                disabled={sendingMessage || !recipientId || !messageBody.trim()}
                style={{ minHeight: 40, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 7, padding: "0 14px", border: 0, borderRadius: 11, color: "#fff", background: "#0f4c45", font: "inherit", fontWeight: 900, cursor: sendingMessage ? "wait" : "pointer", opacity: sendingMessage || !recipientId || !messageBody.trim() ? 0.55 : 1 }}
              >
                <Send size={16}/>{sendingMessage ? "جارٍ الإرسال…" : "إرسال"}
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

        {loading ? (
          <div className="student-loading">جارٍ قراءة التحليل المركزي…</div>
        ) : !notifications.length ? (
          <div className="student-empty"><BellRing size={29}/><strong>لا توجد إشعارات جديدة</strong><span>لن يرسل الصديق تنبيهًا لمجرد زيادة العدد؛ يظهر التنبيه عندما توجد فائدة واضحة.</span></div>
        ) : (
          <div className="student-list">
            {notifications.map((item) => <NotificationItem item={item} key={`${item.source}-${item.id}`} onRead={markRead}/>) }
          </div>
        )}
      </section>
    </StudentPage>
  );
}

function NotificationItem({ item, onRead }) {
  const Icon = item.kind === "attendance" ? UserX
    : item.kind === "exam" ? GraduationCap
    : item.kind === "recitation" ? BookOpen
    : item.kind === "assignment" ? CalendarClock
    : item.kind === "revision" ? RefreshCw
    : item.kind === "progress" ? Target
    : item.kind === "analysis" ? AlertTriangle
    : item.kind === "success" ? CheckCircle2
    : Sparkles;

  return (
    <article className={`student-notification ${item.source === "manual" && !item.read_at ? "unread" : ""}`}>
      <div className="student-notification-icon"><Icon size={18}/></div>
      <div className="student-notification-copy">
        <strong>{item.title}</strong>
        {item.sender && (
          <span style={{ display: "block", marginTop: 3, fontWeight: 800, color: "#5f746c" }}>
            {item.sender.role === "teacher" ? "المعلم" : "مشرف المسجد"}: {item.sender.name}
          </span>
        )}
        <p>{item.body}</p>
        <span>{formatDateTime(item.created_at)}</span>
      </div>
      {item.source === "manual" && !item.read_at && <button type="button" onClick={() => onRead(item.id)}>تم الاطلاع</button>}
    </article>
  );
}

function Metric({ icon: Icon, label, value, note }) {
  return <article className="student-metric"><div className="student-metric-icon"><Icon size={20}/></div><div><span>{label}</span><strong>{value}</strong><small>{note}</small></div></article>;
}

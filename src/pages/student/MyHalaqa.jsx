import {
  BookOpenCheck,
  Building2,
  Clock3,
  MapPin,
  ShieldCheck,
  UserRound,
  Users,
} from "lucide-react";
import StudentPage from "../../components/student/StudentPage";
import { useStudentPortal } from "../../context/StudentPortalContext";
import { getPeriodLabel, recitationDaysLabel } from "../../lib/studentPortalUtils";
import "./StudentPortal.css";

export default function MyHalaqa() {
  const {
    loading, profile, halaqa, mosque, teachers, mainTeacher, classmatesCount,
  } = useStudentPortal();

  if (loading) {
    return <div className="student-loading">جارٍ تجهيز معلومات حلقتك…</div>;
  }

  return (
    <StudentPage
      eyebrow="مكاني في الصديق"
      title="حلقتي"
      description="تعرف على حلقتك، مسجدك، معلميك وزملائك في مكان واحد."
      icon={BookOpenCheck}
    >
      {!halaqa ? (
        <section className="student-panel">
          <div className="student-empty">
            <BookOpenCheck size={31} />
            <strong>لا توجد حلقة مرتبطة بحسابك حاليًا</strong>
            <span>عند ربطك بحلقة ستظهر معلوماتها هنا تلقائيًا.</span>
          </div>
        </section>
      ) : (
        <>
          <section className="student-metrics">
            <Metric icon={BookOpenCheck} label="الحلقة" value={halaqa.name} note={getPeriodLabel(halaqa.halaqa_period)} />
            <Metric icon={Building2} label="المسجد" value={mosque?.name || "—"} note={mosque?.address || "العنوان غير مضاف"} />
            <Metric icon={UserRound} label="المعلم" value={mainTeacher?.full_name || "غير محدد"} note={teachers.length > 1 ? `ومعه ${teachers.length - 1} معلم مساعد` : "المعلم الرئيسي"} />
            <Metric icon={Users} label="زملائي" value={`${classmatesCount}`} note="طالب في الحلقة غيرك" />
          </section>

          <section className="student-grid student-grid-2">
            <article className="student-panel">
              <div className="student-panel-head">
                <div className="student-panel-title">
                  <div className="student-panel-title-icon"><ShieldCheck size={19} /></div>
                  <div><span>فريق الحلقة</span><h3>معلموك</h3></div>
                </div>
              </div>

              <div className="student-list">
                {teachers.map((teacher) => (
                  <div className="student-list-row" key={teacher.id}>
                    <div className="student-list-avatar">{(teacher.full_name || "م").trim().charAt(0)}</div>
                    <div className="student-list-copy">
                      <strong>{teacher.full_name}</strong>
                      <span>{teacher.halaqa_role === "main" ? "المعلم الرئيسي" : "معلم مساعد"}</span>
                    </div>
                    <span className="student-soft-badge">{teacher.user_number || "معلم"}</span>
                  </div>
                ))}
              </div>
            </article>

            <article className="student-panel">
              <div className="student-panel-head">
                <div className="student-panel-title">
                  <div className="student-panel-title-icon"><Clock3 size={19} /></div>
                  <div><span>نظامك الأسبوعي</span><h3>أيام التسميع</h3></div>
                </div>
              </div>

              <div className="student-feature-card">
                <div className="icon"><Clock3 size={20} /></div>
                <span>الأيام المسجلة في ملفك</span>
                <strong>{recitationDaysLabel(profile?.recitation_days)}</strong>
                <p>الوقت المفضل: {profile?.preferred_recitation_time || "غير محدد"}</p>
              </div>
            </article>
          </section>

          {halaqa.description && (
            <section className="student-panel">
              <div className="student-panel-title">
                <div className="student-panel-title-icon"><MapPin size={19} /></div>
                <div><span>عن الحلقة</span><h3>معلومة إضافية</h3><p>{halaqa.description}</p></div>
              </div>
            </section>
          )}
        </>
      )}
    </StudentPage>
  );
}

function Metric({ icon: Icon, label, value, note }) {
  return (
    <article className="student-metric">
      <div className="student-metric-icon"><Icon size={20} /></div>
      <div><span>{label}</span><strong>{value}</strong><small>{note}</small></div>
    </article>
  );
}

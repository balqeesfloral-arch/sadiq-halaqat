import { useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  ArrowLeft,
  BookOpenCheck,
  CheckCircle2,
  ClipboardCheck,
  Target,
  UserX,
} from "lucide-react";

const TYPE_META = {
  absent: { icon: UserX, tone: "red" },
  recitation_delay: { icon: BookOpenCheck, tone: "gold" },
  monthly_plan: { icon: Target, tone: "orange" },
  attendance_missing: { icon: ClipboardCheck, tone: "blue" },
};

export default function TeacherAlerts({ alerts = [] }) {
  const navigate = useNavigate();

  if (!alerts.length) {
    return (
      <section className="td-alerts td-alerts--clear">
        <div className="td-clear-icon">
          <CheckCircle2 size={24} />
        </div>
        <div>
          <span>المتابعة الذكية</span>
          <strong>لا توجد حالات عاجلة الآن</strong>
          <p>بيانات الحلقة لا تعرض أي تنبيه يحتاج تدخلك في هذه اللحظة.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="td-alerts">
      <header className="td-section-head">
        <div>
          <span>يحتاج انتباهك</span>
          <h3>المتابعة الذكية</h3>
        </div>

        <div className="td-alert-count">
          <AlertTriangle size={15} />
          {alerts.length}
        </div>
      </header>

      <div className="td-alert-list">
        {alerts.map((alert) => {
          const meta = TYPE_META[alert.type] || {
            icon: AlertTriangle,
            tone: "gold",
          };
          const Icon = meta.icon;

          return (
            <article className={`td-alert td-alert-${meta.tone}`} key={alert.id}>
              <div className="td-alert-icon">
                <Icon size={19} />
              </div>

              <div className="td-alert-copy">
                <strong>{alert.title}</strong>
                <p>{alert.message}</p>
              </div>

              {alert.actionPath && (
                <button
                  type="button"
                  onClick={() => navigate(alert.actionPath)}
                >
                  {alert.actionLabel || "فتح"}
                  <ArrowLeft size={15} />
                </button>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}

import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  BookOpen,
  CalendarDays,
  Star,
} from "lucide-react";

export default function LatestRecitations({ recitations = [] }) {
  const navigate = useNavigate();

  return (
    <section className="td-panel td-list-panel">
      <header className="td-panel-header td-panel-header--between">
        <div className="td-panel-header-group">
          <div className="td-panel-icon td-panel-icon--green">
            <BookOpen size={20} />
          </div>

          <div>
            <span>آخر ما سُجل</span>
            <h3>أحدث التسميعات</h3>
          </div>
        </div>

        <button type="button" onClick={() => navigate("/teacher/recitations")}>
          عرض الكل
          <ArrowLeft size={15} />
        </button>
      </header>

      {!recitations.length ? (
        <div className="td-list-empty">لم يتم تسجيل تسميعات خلال آخر 30 يومًا.</div>
      ) : (
        <div className="td-recitation-list">
          {recitations.map((item) => (
            <article className="td-recitation-row" key={item.id}>
              <div className="td-recitation-main">
                <strong>{item.student_name}</strong>
                <span>
                  {item.from_surah || "—"}
                  {" ← "}
                  {item.to_surah || "—"}
                </span>
              </div>

              <div className="td-recitation-meta">
                {item.lesson_evaluation && (
                  <span className="td-evaluation">{item.lesson_evaluation}</span>
                )}

                <span className="td-points">
                  <Star size={13} />
                  {Number(item.points || 0)}
                </span>

                <span className="td-recitation-date">
                  <CalendarDays size={13} />
                  {item.recitation_date}
                </span>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

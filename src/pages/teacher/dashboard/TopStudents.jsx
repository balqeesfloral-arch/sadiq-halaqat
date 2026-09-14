import { useNavigate } from "react-router-dom";
import { ArrowLeft, Crown, Medal, Star, Trophy } from "lucide-react";

export default function TopStudents({ students = [] }) {
  const navigate = useNavigate();

  return (
    <section className="td-panel td-list-panel">
      <header className="td-panel-header td-panel-header--between">
        <div className="td-panel-header-group">
          <div className="td-panel-icon td-panel-icon--gold">
            <Trophy size={20} />
          </div>
          <div>
            <span>الترتيب التحفيزي</span>
            <h3>أعلى الطلاب نقاطًا</h3>
          </div>
        </div>

        <button type="button" onClick={() => navigate("/teacher/students")}>
          عرض الطلاب
          <ArrowLeft size={15} />
        </button>
      </header>

      {!students.length ? (
        <div className="td-list-empty">لا توجد نقاط طلاب لعرضها بعد.</div>
      ) : (
        <div className="td-ranking-list">
          {students.map((student, index) => (
            <StudentRow
              student={student}
              rank={index + 1}
              key={student.student_id}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function StudentRow({ student, rank }) {
  return (
    <article className="td-ranking-row">
      <div className={`td-rank td-rank-${rank}`}>
        {rank === 1 ? (
          <Crown size={19} />
        ) : rank <= 3 ? (
          <Medal size={19} />
        ) : (
          <span>{rank}</span>
        )}
      </div>

      <div className="td-ranking-name">
        <strong>{student.full_name}</strong>
        <span>المركز {rank}</span>
      </div>

      <div className="td-ranking-points">
        <Star size={15} />
        <strong>{student.total_points}</strong>
        <span>نقطة</span>
      </div>
    </article>
  );
}

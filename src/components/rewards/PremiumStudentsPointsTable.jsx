import {
  Gift,
  History,
  MinusCircle,
  Trophy,
  UserRound,
} from "lucide-react";

export default function PremiumStudentsPointsTable({
  students = [],
  onGrant,
  onPenalty,
  onHistory,
}) {
  return (
    <section className="tp-table-shell">
      <header className="tp-table-head">
        <div className="tp-table-title">
          <div className="tp-table-title-icon">
            <Trophy size={18} />
          </div>
          <div>
            <strong>طلاب الحلقة</strong>
            <span>الرصيد المعروض خاص بالشهر الهجري المحدد</span>
          </div>
        </div>
      </header>

      <div className="tp-table-wrap">
        <table className="tp-table">
          <thead>
            <tr>
              <th>الطالب</th>
              <th>الحضور اليوم</th>
              <th>رصيد الشهر</th>
              <th>الإجراءات</th>
            </tr>
          </thead>

          <tbody>
            {students.map((student) => (
              <tr key={student.id}>
                <td>
                  <div className="tp-student-cell">
                    <div className="tp-avatar">
                      {(student.full_name || "ط").trim().charAt(0)}
                    </div>
                    <div>
                      <strong>{student.full_name}</strong>
                      <span>رقم داخلي: {student.id}</span>
                    </div>
                  </div>
                </td>

                <td>
                  <AttendanceBadge status={student.attendance} />
                </td>

                <td>
                  <span className="tp-points-pill">
                    {Number(student.total_points || 0)} نقطة
                  </span>
                </td>

                <td>
                  <div className="tp-action-group">
                    <button
                      type="button"
                      className="tp-mini-btn grant"
                      onClick={() => onGrant?.(student)}
                    >
                      <Gift size={14} />
                      منح
                    </button>

                    <button
                      type="button"
                      className="tp-mini-btn deduct"
                      onClick={() => onPenalty?.(student)}
                    >
                      <MinusCircle size={14} />
                      خصم
                    </button>

                    <button
                      type="button"
                      className="tp-mini-btn history"
                      onClick={() => onHistory?.(student)}
                    >
                      <History size={14} />
                      السجل
                    </button>
                  </div>
                </td>
              </tr>
            ))}

            {!students.length && (
              <tr>
                <td colSpan={4}>
                  <div className="tp-empty">
                    <UserRound size={27} />
                    <strong>لا يوجد طلاب في الحلقة المحددة</strong>
                    <span>اختر حلقة أخرى أو تأكد من ربط الطلاب بالحلقات.</span>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function AttendanceBadge({ status }) {
  const map = {
    present: ["حاضر", "#e8f7ef", "#167352"],
    absent: ["غائب", "#fff0ee", "#ad4439"],
    late: ["متأخر", "#fff7df", "#8d6b15"],
    excused: ["بعذر", "#eef4fb", "#4e6f97"],
  };

  const [label, background, color] =
    map[status] || ["غير مسجل", "#f1f5f3", "#71837d"];

  return (
    <span
      style={{
        display: "inline-flex",
        minHeight: 28,
        alignItems: "center",
        paddingInline: "calc(9px * var(--app-density,1))",
        borderRadius: 999,
        background,
        color,
        fontSize: "calc(9px * var(--app-font-scale,1))",
        fontWeight: 900,
      }}
    >
      {label}
    </span>
  );
}

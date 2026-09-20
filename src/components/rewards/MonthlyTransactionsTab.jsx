import { useMemo, useState } from "react";
import {
  Gift,
  History,
  MinusCircle,
  BookOpen,
  Pencil,
  Search,
  Trash2,
  Users,
} from "lucide-react";

import ConfirmModal from "../ConfirmModal";
import { groupPointTransactions } from "../../lib/pointsHijri";

export default function MonthlyTransactionsTab({
  transactions = [],
  monthlyTotals = [],
  periodLabel = "",
  onDelete,
  onEdit,
}) {
  const [search, setSearch] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(null);

  const sessions = useMemo(
    () => groupPointTransactions(transactions),
    [transactions]
  );

  const filteredSessions = useMemo(() => {
    const text = search.trim().toLowerCase();
    if (!text) return sessions;

    return sessions.filter((session) => {
      const names = session.items
        .map((item) => item.reward_name || item.reason || "")
        .join(" ");

      return (
        String(session.student_name || "").toLowerCase().includes(text) ||
        names.toLowerCase().includes(text)
      );
    });
  }, [sessions, search]);

  const filteredTotals = useMemo(() => {
    const text = search.trim().toLowerCase();
    if (!text) return monthlyTotals;

    return monthlyTotals.filter((row) =>
      String(row.student_name || "").toLowerCase().includes(text)
    );
  }, [monthlyTotals, search]);

  const totals = useMemo(() => {
    return monthlyTotals.reduce(
      (acc, row) => {
        acc.grants += Number(row.grants || 0);
        acc.deductions += Number(row.deductions || 0);
        acc.net += Number(row.net || 0);
        acc.sessions += Number(row.sessions || 0);
        return acc;
      },
      { grants: 0, deductions: 0, net: 0, sessions: 0 }
    );
  }, [monthlyTotals]);

  return (
    <>
      <section className="tp-premium-panel">
        <div className="tp-panel-content">
          <div className="tp-table-head" style={{ padding: 0, border: 0, background: "transparent" }}>
            <div className="tp-table-title">
              <div className="tp-table-title-icon">
                <Users size={18} />
              </div>
              <div>
                <strong>ملخص الشهر</strong>
                <span>{periodLabel}</span>
              </div>
            </div>
          </div>

          <div className="tp-month-summary" style={{ marginTop: 12 }}>
            <Summary label="إجمالي المنح" value={`+${totals.grants}`} />
            <Summary label="إجمالي الخصومات" value={`-${totals.deductions}`} danger />
            <Summary label="صافي الشهر" value={totals.net} />
            <Summary label="عدد الجلسات" value={totals.sessions} />
          </div>

          <div className="tp-table-wrap">
            <table className="tp-table">
              <thead>
                <tr>
                  <th>الطالب</th>
                  <th>المنح</th>
                  <th>الخصومات</th>
                  <th>صافي الشهر</th>
                  <th>الجلسات</th>
                </tr>
              </thead>
              <tbody>
                {filteredTotals.map((row) => (
                  <tr key={row.student_id}>
                    <td>
                      <div className="tp-student-cell">
                        <div className="tp-avatar">
                          {(row.student_name || "ط").trim().charAt(0)}
                        </div>
                        <div>
                          <strong>{row.student_name}</strong>
                          <span>ملخص الشهر الهجري</span>
                        </div>
                      </div>
                    </td>
                    <td><strong style={{ color: "#167352" }}>+{row.grants}</strong></td>
                    <td><strong style={{ color: "#ad4439" }}>-{row.deductions}</strong></td>
                    <td><span className="tp-points-pill">{row.net}</span></td>
                    <td>{row.sessions}</td>
                  </tr>
                ))}

                {!filteredTotals.length && (
                  <tr>
                    <td colSpan={5}>
                      <div className="tp-empty">
                        <Users size={26} />
                        <strong>لا توجد بيانات لهذا الشهر</strong>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="tp-table-shell">
        <header className="tp-table-head">
          <div className="tp-table-title">
            <div className="tp-table-title-icon">
              <History size={18} />
            </div>
            <div>
              <strong>سجل الجلسات</strong>
              <span>كل جلسة تظهر كسجل واحد حتى لو احتوت عدة أنواع نقاط</span>
            </div>
          </div>

          <div style={{ position: "relative", minWidth: 250 }}>
            <Search
              size={16}
              style={{
                position: "absolute",
                left: 12,
                top: "50%",
                transform: "translateY(-50%)",
                color: "#93a19c",
              }}
            />
            <input
              className="tp-control"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="ابحث باسم الطالب أو النوع"
              style={{ paddingLeft: "calc(36px * var(--app-density,1))" }}
            />
          </div>
        </header>

        <div className="tp-table-wrap">
          <table className="tp-table">
            <thead>
              <tr>
                <th>الطالب</th>
                <th>نوع الجلسة</th>
                <th>الأنواع داخل الجلسة</th>
                <th>المجموع</th>
                <th>التاريخ</th>
                <th>الإجراءات</th>
              </tr>
            </thead>

            <tbody>
              {filteredSessions.map((session) => {
                const grant = session.category === "grant";
                const recitation = session.category === "recitation";
                const deduction = !grant && !recitation;

                const sessionLabel = grant
                  ? "منح"
                  : recitation
                    ? "تسميع"
                    : "خصم";

                const sessionChipClass = grant
                  ? "grant"
                  : recitation
                    ? "history"
                    : "deduct";

                const pointsColor = grant
                  ? "#167352"
                  : recitation
                    ? (session.totalPoints >= 0 ? "#167352" : "#ad4439")
                    : "#ad4439";

                return (
                  <tr key={session.id}>
                    <td>
                      <div className="tp-student-cell">
                        <div className="tp-avatar">
                          {(session.student_name || "ط").trim().charAt(0)}
                        </div>
                        <div>
                          <strong>{session.student_name}</strong>
                          <span>{session.items.length} نوع داخل الجلسة</span>
                        </div>
                      </div>
                    </td>

                    <td>
                      <span className={`tp-chip ${sessionChipClass}`}>
                        {grant ? (
                          <Gift size={12} />
                        ) : recitation ? (
                          <BookOpen size={12} />
                        ) : (
                          <MinusCircle size={12} />
                        )}
                        &nbsp;{sessionLabel}
                      </span>
                    </td>

                    <td>
                      <div className="tp-session-types">
                        {session.items.map((item) => (
                          <span
                            className={`tp-chip ${sessionChipClass}`}
                            key={item.id}
                          >
                            {item.reward_name || item.reason || "نقطة"}
                          </span>
                        ))}
                      </div>
                    </td>

                    <td>
                      <strong style={{ color: pointsColor }}>
                        {session.totalPoints > 0 ? "+" : ""}
                        {session.totalPoints}
                      </strong>
                    </td>

                    <td>{session.transaction_date}</td>

                    <td>
                      {recitation ? (
                        <span
                          style={{
                            color: "#64748B",
                            fontSize: "calc(12px * var(--app-font-scale,1))",
                            fontWeight: 700,
                          }}
                        >
                          يُدار من صفحة التسميع
                        </span>
                      ) : (
                        <div className="tp-action-group">
                          <button
                            type="button"
                            className="tp-mini-btn history"
                            onClick={() => onEdit?.(session)}
                          >
                            <Pencil size={13} />
                            تعديل
                          </button>

                          <button
                            type="button"
                            className="tp-mini-btn deduct"
                            onClick={() => setConfirmDelete(session)}
                          >
                            <Trash2 size={13} />
                            حذف
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}

              {!filteredSessions.length && (
                <tr>
                  <td colSpan={6}>
                    <div className="tp-empty">
                      <History size={26} />
                      <strong>لا توجد جلسات في {periodLabel}</strong>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <ConfirmModal
        open={!!confirmDelete}
        title="حذف الجلسة"
        message={
          confirmDelete
            ? `سيتم حذف جلسة ${
                confirmDelete.category === "grant" ? "المنح" : "الخصم"
              } كاملة للطالب ${confirmDelete.student_name}.`
            : ""
        }
        onConfirm={() => {
          onDelete?.(confirmDelete);
          setConfirmDelete(null);
        }}
        onClose={() => setConfirmDelete(null)}
      />
    </>
  );
}

function Summary({ label, value, danger = false }) {
  return (
    <article className="tp-summary-card">
      <span>{label}</span>
      <strong style={{ color: danger ? "#ad4439" : undefined }}>{value}</strong>
    </article>
  );
}

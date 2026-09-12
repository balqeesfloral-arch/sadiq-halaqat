import {
  Gift,
  History,
  MinusCircle,
  UserCheck,
  UserRound,
  UserX,
  Users,
  Clock3,
  CircleHelp,
  Sparkles,
} from "lucide-react";

/* =========================================================
   Helpers
========================================================= */

function formatNumber(value) {
  const number =
    Number(value) || 0;

  try {
    return new Intl.NumberFormat(
      "ar-SA"
    ).format(number);
  } catch {
    return String(number);
  }
}

function getInitials(name) {
  const text =
    String(name || "")
      .trim();

  if (!text) {
    return "ط";
  }

  const parts =
    text
      .split(/\s+/)
      .filter(Boolean);

  if (parts.length === 1) {
    return parts[0]
      .slice(0, 1);
  }

  return (
    parts[0].slice(0, 1) +
    parts[
      parts.length - 1
    ].slice(0, 1)
  );
}

function getAttendanceMeta(status) {
  switch (status) {
    case "present":
      return {
        label: "حاضر",
        className: "present",
        canUsePoints: true,
        icon: UserCheck,
      };

    case "late":
      return {
        label: "متأخر",
        className: "late",
        canUsePoints: true,
        icon: Clock3,
      };

    case "absent":
      return {
        label: "غائب",
        className: "absent",
        canUsePoints: false,
        icon: UserX,
      };

    case "excused":
      return {
        label: "غائب بعذر",
        className: "excused",
        canUsePoints: false,
        icon: UserX,
      };

    default:
      return {
        label: "لم يسجل",
        className: "unrecorded",
        canUsePoints: false,
        icon: CircleHelp,
      };
  }
}

/* =========================================================
   Student card
========================================================= */

function StudentPointCard({
  student,
  onGrant,
  onPenalty,
  onHistory,
}) {
  const attendance =
    getAttendanceMeta(
      student.attendance
    );

  const AttendanceIcon =
    attendance.icon;

  const totalPoints =
    Number(
      student.total_points ||
        0
    );

  const pointTone =
    totalPoints > 0
      ? "positive"
      : totalPoints < 0
        ? "negative"
        : "neutral";

  return (
    <article className="student-points-card">
      <div className="student-points-card-accent" />

      {/* =====================================
          STUDENT
      ===================================== */}

      <div className="student-points-card-head">
        <div className="student-points-identity">
          <div className="student-points-avatar">
            {getInitials(
              student.full_name
            )}
          </div>

          <div className="student-points-name">
            <span>
              الطالب
            </span>

            <strong>
              {student.full_name ||
                "طالب"}
            </strong>

            <small>
              {student.user_number
                ? `رقم الطالب: ${student.user_number}`
                : "طالب الحلقة"}
            </small>
          </div>
        </div>

        <button
          type="button"
          className="student-points-history-icon"
          onClick={() =>
            onHistory?.(
              student
            )
          }
          aria-label={`سجل نقاط ${student.full_name || "الطالب"}`}
          title="سجل النقاط"
        >
          <History
            size={15}
          />
        </button>
      </div>

      {/* =====================================
          STATUS + BALANCE
      ===================================== */}

      <div className="student-points-info-grid">
        <div className="student-points-info">
          <span>
            حضور اليوم
          </span>

          <div
            className={`student-attendance-badge ${attendance.className}`}
          >
            <AttendanceIcon
              size={12}
            />

            {attendance.label}
          </div>
        </div>

        <div className="student-points-info balance">
          <span>
            رصيد النقاط
          </span>

          <strong
            className={`student-points-balance ${pointTone}`}
          >
            {totalPoints > 0
              ? "+"
              : ""}
            {formatNumber(
              totalPoints
            )}

            <small>
              نقطة
            </small>
          </strong>
        </div>
      </div>

      {/* =====================================
          ATTENDANCE NOTICE
      ===================================== */}

      {!attendance.canUsePoints && (
        <div className="student-points-lock-note">
          <AttendanceIcon
            size={13}
          />

          <span>
            {student.attendance ===
            "absent"
              ? "الطالب غائب؛ المنح والخصم غير متاحة لهذا اليوم."
              : student.attendance ===
                  "excused"
                ? "الطالب غائب بعذر؛ المنح والخصم غير متاحة لهذا اليوم."
                : "سجّل حضور الطالب أولًا لتفعيل المنح والخصومات."}
          </span>
        </div>
      )}

      {/* =====================================
          ACTIONS
      ===================================== */}

      <div className="student-points-actions">
        <button
          type="button"
          className="student-points-action grant"
          disabled={
            !attendance.canUsePoints
          }
          onClick={() =>
            onGrant?.(
              student
            )
          }
        >
          <Gift
            size={14}
          />

          منح نقاط
        </button>

        <button
          type="button"
          className="student-points-action penalty"
          disabled={
            !attendance.canUsePoints
          }
          onClick={() =>
            onPenalty?.(
              student
            )
          }
        >
          <MinusCircle
            size={14}
          />

          خصم نقاط
        </button>

        <button
          type="button"
          className="student-points-action history"
          onClick={() =>
            onHistory?.(
              student
            )
          }
        >
          <History
            size={14}
          />

          السجل
        </button>
      </div>
    </article>
  );
}

/* =========================================================
   Main
========================================================= */

export default function StudentsPointsTable({
  students = [],
  onGrant,
  onPenalty,
  onHistory,
}) {
  const presentCount =
    students.filter(
      (student) =>
        student.attendance ===
          "present" ||
        student.attendance ===
          "late"
    ).length;

  const absentCount =
    students.filter(
      (student) =>
        student.attendance ===
          "absent" ||
        student.attendance ===
          "excused"
    ).length;

  const unrecordedCount =
    students.filter(
      (student) =>
        !student.attendance
    ).length;

  const totalBalance =
    students.reduce(
      (sum, student) =>
        sum +
        Number(
          student.total_points ||
            0
        ),
      0
    );

  return (
    <section
      className="students-points-panel"
      dir="rtl"
      aria-label="إدارة نقاط الطلاب"
    >
      {/* =========================================
          HEADER
      ========================================= */}

      <header className="students-points-header">
        <div className="students-points-heading">
          <span className="students-points-heading-icon">
            <Users
              size={19}
            />
          </span>

          <div>
            <div className="students-points-eyebrow">
              <Sparkles
                size={11}
              />

              إدارة نقاط الحلقة
            </div>

            <h2>
              الطلاب
            </h2>

            <p>
              منح وخصم النقاط ومراجعة سجل كل طالب من مكان واحد.
            </p>
          </div>
        </div>

        <div className="students-points-header-stats">
          <div>
            <span>
              الطلاب
            </span>

            <strong>
              {formatNumber(
                students.length
              )}
            </strong>
          </div>

          <div>
            <span>
              متاح للنقاط
            </span>

            <strong className="positive">
              {formatNumber(
                presentCount
              )}
            </strong>
          </div>

          <div>
            <span>
              إجمالي الأرصدة
            </span>

            <strong
              className={
                totalBalance < 0
                  ? "negative"
                  : "gold"
              }
            >
              {totalBalance > 0
                ? "+"
                : ""}
              {formatNumber(
                totalBalance
              )}
            </strong>
          </div>
        </div>
      </header>

      {/* =========================================
          MINI STATUS BAR
      ========================================= */}

      {students.length > 0 && (
        <div className="students-points-status-bar">
          <span className="available">
            <UserCheck
              size={12}
            />

            حاضر / متأخر:
            {" "}
            <b>
              {formatNumber(
                presentCount
              )}
            </b>
          </span>

          <span className="absent">
            <UserX
              size={12}
            />

            غائب:
            {" "}
            <b>
              {formatNumber(
                absentCount
              )}
            </b>
          </span>

          <span className="unrecorded">
            <CircleHelp
              size={12}
            />

            لم يسجل:
            {" "}
            <b>
              {formatNumber(
                unrecordedCount
              )}
            </b>
          </span>
        </div>
      )}

      {/* =========================================
          CONTENT
      ========================================= */}

      {students.length > 0 ? (
        <div className="students-points-grid">
          {students.map(
            (student) => (
              <StudentPointCard
                key={student.id}
                student={student}
                onGrant={
                  onGrant
                }
                onPenalty={
                  onPenalty
                }
                onHistory={
                  onHistory
                }
              />
            )
          )}
        </div>
      ) : (
        <div className="students-points-empty">
          <span>
            <UserRound
              size={24}
            />
          </span>

          <strong>
            لا يوجد طلاب للعرض
          </strong>

          <p>
            غيّر الحلقة أو الفلاتر الحالية، أو تأكد من وجود طلاب مرتبطين بالحلقة.
          </p>
        </div>
      )}

      {/* =========================================
          STYLES
      ========================================= */}

      <style>
        {`
          .students-points-panel {
            overflow: hidden;

            border:
              1px solid #E5EBE7;

            border-radius: 18px;

            background:
              #FFFFFF;

            box-shadow:
              0 10px 28px
              rgba(25,51,39,.045);
          }

          /* =========================
             HEADER
          ========================= */

          .students-points-header {
            display: flex;
            align-items: center;
            justify-content:
              space-between;

            gap: 14px;

            padding:
              14px 16px;

            border-bottom:
              1px solid #EDF1EE;

            background:
              linear-gradient(
                135deg,
                #FFFFFF 0%,
                #F8FCF9 72%,
                #FFFDF8 100%
              );
          }

          .students-points-heading {
            display: flex;
            align-items: center;

            gap: 9px;

            min-width: 0;
          }

          .students-points-heading-icon {
            width: 40px;
            height: 40px;

            flex: 0 0 40px;

            border-radius: 12px;

            display: flex;
            align-items: center;
            justify-content: center;

            color: #FFFFFF;

            background:
              linear-gradient(
                145deg,
                #0F5132,
                #0F766E
              );

            box-shadow:
              0 7px 17px
              rgba(15,81,50,.12);
          }

          .students-points-eyebrow {
            display: flex;
            align-items: center;

            gap: 3px;

            margin-bottom: 1px;

            color: #98772C;

            font-size: 6px;
            font-weight: 900;
          }

          .students-points-heading h2 {
            margin: 0;

            color: #35463C;

            font-size: 13px;
            font-weight: 950;
          }

          .students-points-heading p {
            margin: 2px 0 0;

            color: #8D9791;

            font-size: 6px;
            line-height: 1.5;
          }

          .students-points-header-stats {
            display: grid;

            grid-template-columns:
              repeat(
                3,
                minmax(82px,1fr)
              );

            gap: 5px;

            flex: 0 0 auto;
          }

          .students-points-header-stats > div {
            min-width: 84px;

            padding: 7px 8px;

            border:
              1px solid #E4EAE6;

            border-radius: 9px;

            background: #FFFFFF;
          }

          .students-points-header-stats span,
          .students-points-header-stats strong {
            display: block;
          }

          .students-points-header-stats span {
            color: #929B95;

            font-size: 5px;
          }

          .students-points-header-stats strong {
            margin-top: 1px;

            color: #3E4E44;

            font-size: 10px;
            font-weight: 950;
          }

          .students-points-header-stats strong.positive {
            color: #0F744C;
          }

          .students-points-header-stats strong.negative {
            color: #A44337;
          }

          .students-points-header-stats strong.gold {
            color: #947124;
          }

          /* =========================
             STATUS BAR
          ========================= */

          .students-points-status-bar {
            display: flex;
            align-items: center;
            flex-wrap: wrap;

            gap: 5px;

            padding:
              8px 16px;

            border-bottom:
              1px solid #EDF1EE;

            background: #FBFDFC;
          }

          .students-points-status-bar > span {
            min-height: 25px;

            padding:
              0 7px;

            border-radius: 999px;

            display: inline-flex;
            align-items: center;

            gap: 3px;

            font-size: 5.5px;
            font-weight: 850;
          }

          .students-points-status-bar .available {
            color: #0F704A;

            border:
              1px solid #D9EADD;

            background: #F0F9F3;
          }

          .students-points-status-bar .absent {
            color: #A44337;

            border:
              1px solid #EED8D3;

            background: #FFF4F1;
          }

          .students-points-status-bar .unrecorded {
            color: #6B7680;

            border:
              1px solid #E1E6EA;

            background: #F6F8F9;
          }

          /* =========================
             GRID
          ========================= */

          .students-points-grid {
            display: grid;

            grid-template-columns:
              repeat(
                auto-fill,
                minmax(
                  285px,
                  1fr
                )
              );

            gap: 10px;

            padding: 12px;
          }

          /* =========================
             CARD
          ========================= */

          .student-points-card {
            position: relative;

            min-width: 0;
            overflow: hidden;

            padding: 12px;

            border:
              1px solid #E5EBE7;

            border-radius: 14px;

            background: #FFFFFF;

            transition:
              transform .17s ease,
              box-shadow .17s ease,
              border-color .17s ease;
          }

          .student-points-card:hover {
            transform:
              translateY(-2px);

            border-color:
              #CADDD1;

            box-shadow:
              0 10px 23px
              rgba(25,51,39,.055);
          }

          .student-points-card-accent {
            position: absolute;

            top: 0;
            right: 0;
            left: 0;

            height: 2px;

            background:
              linear-gradient(
                90deg,
                transparent,
                #0F766E,
                #B18A32,
                transparent
              );
          }

          .student-points-card-head {
            display: flex;
            align-items: flex-start;
            justify-content:
              space-between;

            gap: 9px;
          }

          .student-points-identity {
            display: flex;
            align-items: center;

            gap: 8px;

            min-width: 0;
          }

          .student-points-avatar {
            width: 38px;
            height: 38px;

            flex: 0 0 38px;

            border-radius: 11px;

            display: flex;
            align-items: center;
            justify-content: center;

            color: #FFFFFF;

            background:
              linear-gradient(
                145deg,
                #0F5132,
                #0F766E
              );

            font-size: 9px;
            font-weight: 950;

            box-shadow:
              0 6px 14px
              rgba(15,81,50,.11);
          }

          .student-points-name {
            min-width: 0;
          }

          .student-points-name span,
          .student-points-name strong,
          .student-points-name small {
            display: block;
          }

          .student-points-name span {
            color: #9AA29D;

            font-size: 5px;
          }

          .student-points-name strong {
            margin-top: 1px;

            overflow: hidden;

            color: #3A4A40;

            font-size: 8.5px;
            font-weight: 950;

            text-overflow: ellipsis;
            white-space: nowrap;
          }

          .student-points-name small {
            margin-top: 2px;

            color: #929B95;

            font-size: 5px;
          }

          .student-points-history-icon {
            width: 30px;
            height: 30px;

            flex: 0 0 30px;

            border:
              1px solid #DCE7DF;

            border-radius: 9px;

            display: flex;
            align-items: center;
            justify-content: center;

            color: #3D6655;
            background: #F1F8F4;

            cursor: pointer;
          }

          .student-points-history-icon:hover {
            background: #E7F3EB;
          }

          /* =========================
             INFO
          ========================= */

          .student-points-info-grid {
            display: grid;

            grid-template-columns:
              repeat(
                2,
                minmax(0,1fr)
              );

            gap: 7px;

            margin-top: 12px;
          }

          .student-points-info {
            padding: 8px;

            border:
              1px solid #E7ECE9;

            border-radius: 10px;

            background: #FBFDFC;
          }

          .student-points-info > span {
            display: block;

            margin-bottom: 5px;

            color: #939C96;

            font-size: 5px;
          }

          .student-attendance-badge {
            min-height: 24px;

            padding: 0 6px;

            border-radius: 7px;

            display: inline-flex;
            align-items: center;

            gap: 3px;

            font-size: 5.5px;
            font-weight: 900;
          }

          .student-attendance-badge.present {
            color: #0F704A;
            background: #EAF7EE;
          }

          .student-attendance-badge.late {
            color: #906C22;
            background: #FFF7E2;
          }

          .student-attendance-badge.absent {
            color: #A44337;
            background: #FFF0ED;
          }

          .student-attendance-badge.excused {
            color: #8A6222;
            background: #FFF6E5;
          }

          .student-attendance-badge.unrecorded {
            color: #65717B;
            background: #EEF2F4;
          }

          .student-points-info.balance {
            text-align: right;
          }

          .student-points-balance {
            display: block;

            font-size: 15px;
            font-weight: 950;

            direction: ltr;
            text-align: right;
          }

          .student-points-balance.positive {
            color: #0F744C;
          }

          .student-points-balance.negative {
            color: #A44337;
          }

          .student-points-balance.neutral {
            color: #64716A;
          }

          .student-points-balance small {
            margin-left: 2px;

            color: #8F9992;

            font-size: 5px;
            font-weight: 800;
          }

          /* =========================
             LOCK NOTE
          ========================= */

          .student-points-lock-note {
            display: flex;
            align-items: flex-start;

            gap: 5px;

            margin-top: 8px;
            padding: 7px 8px;

            border:
              1px solid #E6E9E7;

            border-radius: 9px;

            color: #707A74;
            background: #F8FAF9;

            font-size: 5.3px;
            line-height: 1.45;
          }

          /* =========================
             ACTIONS
          ========================= */

          .student-points-actions {
            display: grid;

            grid-template-columns:
              1fr 1fr auto;

            gap: 5px;

            margin-top: 10px;
          }

          .student-points-action {
            min-height: 34px;

            padding: 0 8px;

            border: none;
            border-radius: 8px;

            display: inline-flex;
            align-items: center;
            justify-content: center;

            gap: 4px;

            font-size: 5.7px;
            font-weight: 900;

            cursor: pointer;
          }

          .student-points-action.grant {
            color: #0F704A;
            background: #EAF7EE;
          }

          .student-points-action.penalty {
            color: #A44337;
            background: #FFF0ED;
          }

          .student-points-action.history {
            color: #3F6688;
            background: #EEF5FA;
          }

          .student-points-action:hover:not(:disabled) {
            filter:
              brightness(.975);
          }

          .student-points-action:disabled {
            opacity: .38;
            cursor: not-allowed;
          }

          /* =========================
             EMPTY
          ========================= */

          .students-points-empty {
            min-height: 220px;

            display: flex;
            align-items: center;
            justify-content: center;
            flex-direction: column;

            gap: 4px;

            margin: 12px;

            border:
              1px dashed #DDE5E0;

            border-radius: 13px;

            color: #929C96;
            background: #FBFDFC;

            text-align: center;
          }

          .students-points-empty > span {
            width: 42px;
            height: 42px;

            margin-bottom: 3px;

            border-radius: 12px;

            display: flex;
            align-items: center;
            justify-content: center;

            color: #0F6B49;
            background: #EDF7F1;
          }

          .students-points-empty strong {
            color: #57645C;

            font-size: 8px;
          }

          .students-points-empty p {
            max-width: 360px;

            margin: 0;

            color: #929B95;

            font-size: 5.7px;
            line-height: 1.5;
          }

          /* =========================
             RESPONSIVE
          ========================= */

          @media
          (max-width: 900px) {
            .students-points-header {
              align-items:
                flex-start;
              flex-direction:
                column;
            }

            .students-points-header-stats {
              width: 100%;
            }
          }

          @media
          (max-width: 620px) {
            .students-points-header {
              padding: 12px 13px;
            }

            .students-points-heading p {
              display: none;
            }

            .students-points-header-stats {
              grid-template-columns:
                1fr;
            }

            .students-points-status-bar {
              padding:
                8px 13px;
            }

            .students-points-grid {
              grid-template-columns:
                1fr;

              padding: 10px;
            }
          }

          @media
          (max-width: 390px) {
            .student-points-info-grid {
              grid-template-columns:
                1fr;
            }

            .student-points-actions {
              grid-template-columns:
                1fr;
            }
          }
        `}
      </style>
    </section>
  );
}

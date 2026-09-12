import {
  Gift,
  MinusCircle,
  Trophy,
  Users,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  Activity,
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

function getNetMeta(value) {
  const number =
    Number(value) || 0;

  if (number > 0) {
    return {
      state: "positive",
      label: "صافي إيجابي",
      Icon: ArrowUpRight,
    };
  }

  if (number < 0) {
    return {
      state: "negative",
      label: "صافي سلبي",
      Icon: ArrowDownRight,
    };
  }

  return {
    state: "neutral",
    label: "متوازن",
    Icon: Activity,
  };
}

/* =========================================================
   Stat Card
========================================================= */

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  tone = "green",
  badge,
  signed = false,
}) {
  const numericValue =
    Number(value) || 0;

  const displayValue =
    signed && numericValue > 0
      ? `+${formatNumber(
          numericValue
        )}`
      : formatNumber(
          numericValue
        );

  return (
    <article
      className={`rewards-stat-card ${tone}`}
    >
      <div className="rewards-stat-accent" />

      <div className="rewards-stat-top">
        <div className="rewards-stat-copy">
          <span className="rewards-stat-kicker">
            {subtitle}
          </span>

          <h3>
            {title}
          </h3>
        </div>

        <div className="rewards-stat-icon">
          <Icon
            size={19}
            strokeWidth={1.8}
          />
        </div>
      </div>

      <div className="rewards-stat-value-row">
        <strong className="rewards-stat-value">
          {displayValue}
        </strong>

        {badge && (
          <span className="rewards-stat-badge">
            {badge}
          </span>
        )}
      </div>

      <div className="rewards-stat-footer">
        <span>
          تحديث مباشر
        </span>

        <Sparkles
          size={11}
        />
      </div>
    </article>
  );
}

/* =========================================================
   Main
========================================================= */

export default function RewardsStats({
  totalRewards = 0,
  totalPenalties = 0,
  netPoints = 0,
  totalStudents = 0,
}) {
  const netMeta =
    getNetMeta(
      netPoints
    );

  const NetStatusIcon =
    netMeta.Icon;

  return (
    <section
      className="rewards-stats-wrap"
      dir="rtl"
      aria-label="إحصائيات المنح والخصومات"
    >
      <div className="rewards-stats-grid">
        <StatCard
          title="إجمالي المنح"
          subtitle="النقاط المضافة"
          value={totalRewards}
          icon={Gift}
          tone="green"
          badge="منح"
        />

        <StatCard
          title="إجمالي الخصومات"
          subtitle="النقاط المخصومة"
          value={totalPenalties}
          icon={MinusCircle}
          tone="red"
          badge="خصم"
        />

        <StatCard
          title="صافي النقاط"
          subtitle="النتيجة النهائية"
          value={netPoints}
          icon={Trophy}
          tone={
            netMeta.state ===
            "negative"
              ? "red"
              : netMeta.state ===
                  "positive"
                ? "gold"
                : "slate"
          }
          signed
          badge={
            <span className="rewards-stat-net-badge">
              <NetStatusIcon
                size={11}
              />
              {netMeta.label}
            </span>
          }
        />

        <StatCard
          title="عدد الطلاب"
          subtitle="الطلاب في العرض الحالي"
          value={totalStudents}
          icon={Users}
          tone="blue"
          badge="طالب"
        />
      </div>

      <style>
        {`
          .rewards-stats-wrap {
            width: 100%;
            margin-bottom: 18px;
          }

          .rewards-stats-grid {
            display: grid;
            grid-template-columns:
              repeat(
                4,
                minmax(0, 1fr)
              );
            gap: 10px;
          }

          .rewards-stat-card {
            --accent: #0F766E;
            --accent-soft: #ECFDF5;
            --accent-border: #D6EFE5;
            --accent-text: #0F6848;

            position: relative;
            min-width: 0;
            overflow: hidden;

            padding: 14px;

            border:
              1px solid #E7ECE9;

            border-radius: 16px;

            background:
              linear-gradient(
                145deg,
                #FFFFFF 0%,
                #FCFDFC 100%
              );

            box-shadow:
              0 10px 28px
              rgba(24, 50, 38, .045);

            transition:
              transform .18s ease,
              box-shadow .18s ease,
              border-color .18s ease;
          }

          .rewards-stat-card:hover {
            transform:
              translateY(-2px);

            border-color:
              var(--accent-border);

            box-shadow:
              0 14px 30px
              rgba(24, 50, 38, .065);
          }

          .rewards-stat-card.green {
            --accent: #0F766E;
            --accent-soft: #ECFDF5;
            --accent-border: #CFE8DD;
            --accent-text: #0F6848;
          }

          .rewards-stat-card.red {
            --accent: #C44F3E;
            --accent-soft: #FFF2EF;
            --accent-border: #F0D5CE;
            --accent-text: #A33D31;
          }

          .rewards-stat-card.gold {
            --accent: #B88B2C;
            --accent-soft: #FFF8E8;
            --accent-border: #EEDFAE;
            --accent-text: #8D6A1F;
          }

          .rewards-stat-card.blue {
            --accent: #3B6FA8;
            --accent-soft: #EEF5FB;
            --accent-border: #D5E3F0;
            --accent-text: #315F90;
          }

          .rewards-stat-card.slate {
            --accent: #64748B;
            --accent-soft: #F3F6F8;
            --accent-border: #DFE6EB;
            --accent-text: #556273;
          }

          .rewards-stat-accent {
            position: absolute;
            top: 0;
            right: 0;
            left: 0;

            height: 3px;

            background:
              linear-gradient(
                90deg,
                transparent,
                var(--accent),
                transparent
              );

            opacity: .9;
          }

          .rewards-stat-top {
            display: flex;
            align-items: center;
            justify-content:
              space-between;

            gap: 10px;
          }

          .rewards-stat-copy {
            min-width: 0;
          }

          .rewards-stat-kicker {
            display: block;

            margin-bottom: 2px;

            color: #96A09A;

            font-size: 6px;
            font-weight: 800;
          }

          .rewards-stat-copy h3 {
            margin: 0;

            color: #3A4A40;

            font-size: 9px;
            font-weight: 950;

            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }

          .rewards-stat-icon {
            width: 34px;
            height: 34px;

            flex: 0 0 34px;

            border:
              1px solid
              var(--accent-border);

            border-radius: 10px;

            display: flex;
            align-items: center;
            justify-content: center;

            color:
              var(--accent-text);

            background:
              var(--accent-soft);
          }

          .rewards-stat-value-row {
            display: flex;
            align-items: flex-end;
            justify-content:
              space-between;

            gap: 10px;

            margin-top: 12px;
          }

          .rewards-stat-value {
            min-width: 0;

            color:
              var(--accent-text);

            font-size: 23px;
            font-weight: 950;

            letter-spacing: -.4px;

            line-height: 1;
          }

          .rewards-stat-badge {
            min-height: 24px;

            padding:
              0 7px;

            border:
              1px solid
              var(--accent-border);

            border-radius: 999px;

            display: inline-flex;
            align-items: center;
            justify-content: center;

            gap: 3px;

            color:
              var(--accent-text);

            background:
              var(--accent-soft);

            font-size: 5.5px;
            font-weight: 900;

            white-space: nowrap;
          }

          .rewards-stat-net-badge {
            display: inline-flex;
            align-items: center;
            gap: 3px;
          }

          .rewards-stat-footer {
            display: flex;
            align-items: center;
            justify-content:
              space-between;

            gap: 8px;

            margin-top: 11px;
            padding-top: 8px;

            border-top:
              1px solid #EEF2EF;

            color: #A0A8A3;

            font-size: 5.5px;
            font-weight: 800;
          }

          .rewards-stat-footer svg {
            color:
              var(--accent);
          }

          /* =========================
             Responsive
          ========================= */

          @media
          (max-width: 1100px) {
            .rewards-stats-grid {
              grid-template-columns:
                repeat(
                  2,
                  minmax(0, 1fr)
                );
            }
          }

          @media
          (max-width: 560px) {
            .rewards-stats-grid {
              grid-template-columns:
                1fr;
              gap: 8px;
            }

            .rewards-stat-card {
              padding: 13px;
            }

            .rewards-stat-value {
              font-size: 21px;
            }
          }
        `}
      </style>
    </section>
  );
}

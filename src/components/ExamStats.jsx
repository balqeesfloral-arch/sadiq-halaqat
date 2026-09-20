import {
  ClipboardCheck,
  CalendarDays,
  TrendingUp,
  Award,
} from "lucide-react";

const cardStyle = {
  background: "#fff",
  borderRadius: "calc(24px * var(--app-radius-scale,1))",
  padding: "calc(24px * var(--app-density,1))",
  border: "1px solid #E2E8F0",
  boxShadow:
    "0 4px 18px color-mix(in srgb,var(--app-color-0f766e,#0f766e) 6%,transparent)",
};

function StatCard({
  title,
  value,
  icon: Icon,
  color,
}) {
  return (
    <div style={cardStyle}>
      <div
        style={{
          display: "flex",
          justifyContent:
            "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <div
            style={{
              color: "#64748B",
              fontSize: "calc(13px * var(--app-font-scale,1))",
            }}
          >
            {title}
          </div>

          <div
            style={{
              fontSize: "calc(32px * var(--app-font-scale,1))",
              fontWeight: 800,
              marginTop: 8,
            }}
          >
            {value}
          </div>
        </div>

        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: "calc(18px * var(--app-radius-scale,1))",
            background: color,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#fff",
          }}
        >
          <Icon size={26} />
        </div>
      </div>
    </div>
  );
}

export default function ExamStats({
  totalExams,
  todayExams,
  monthExams,
  averageScore,
}) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns:
          "repeat(auto-fit,minmax(240px,1fr))",
        gap: "calc(18px * var(--app-density,1))",
        marginBottom: 24,
      }}
    >
      <StatCard
        title="إجمالي الاختبارات"
        value={totalExams}
        icon={ClipboardCheck}
        color="#0F766E"
      />

      <StatCard
        title="اختبارات اليوم"
        value={todayExams}
        icon={CalendarDays}
        color="#2563EB"
      />

      <StatCard
        title="اختبارات الشهر"
        value={monthExams}
        icon={TrendingUp}
        color="#D97706"
      />

      <StatCard
        title="متوسط الدرجات"
        value={`${averageScore}%`}
        icon={Award}
        color="#16A34A"
      />
    </div>
  );
}
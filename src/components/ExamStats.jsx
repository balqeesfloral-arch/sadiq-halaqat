import {
  ClipboardCheck,
  CalendarDays,
  TrendingUp,
  Award,
} from "lucide-react";

const cardStyle = {
  background: "#fff",
  borderRadius: 24,
  padding: 24,
  border: "1px solid #E2E8F0",
  boxShadow:
    "0 4px 18px rgba(15,118,110,.06)",
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
              fontSize: 13,
            }}
          >
            {title}
          </div>

          <div
            style={{
              fontSize: 32,
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
            borderRadius: 18,
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
        gap: 18,
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
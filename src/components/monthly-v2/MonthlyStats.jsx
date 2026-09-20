import {
  Users,
  CheckCircle,
  AlertTriangle,
  Award,
  BookOpen,
  RefreshCw,
  BadgeCheck
} from "lucide-react";

export default function MonthlyStats({
  totalStudents = 0,
  completed = 0,
  delayed = 0,
  rate = 0,
  totalMemorizationPages = 0,
  totalRevisionPages = 0,
  approvedCount = 0
}) {

  const cardStyle = {
    background: "#fff",
    borderRadius: "calc(18px * var(--app-radius-scale,1))",
    padding: "calc(20px * var(--app-density,1))",
    border: "1px solid #E5E7EB",
    boxShadow:
      "0 4px 12px rgba(0,0,0,.05)",
    display: "flex",
    alignItems: "center",
    gap: "calc(16px * var(--app-density,1))"
  };

  const iconBox = (bg) => ({
    width: "52px",
    height: "52px",
    borderRadius: "calc(14px * var(--app-radius-scale,1))",
    background: bg,
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  });

  const cards = [
    {
      title: "إجمالي الطلاب",
      value: totalStudents,
      icon: <Users size={24} />,
      bg: "#DCFCE7"
    },
    {
      title: "المنجزون",
      value: completed,
      icon: <CheckCircle size={24} />,
      bg: "#BBF7D0"
    },
    {
      title: "المتعثرون",
      value: delayed,
      icon: <AlertTriangle size={24} />,
      bg: "#FEE2E2"
    },
    {
      title: "نسبة الإنجاز",
      value: `${rate}%`,
      icon: <Award size={24} />,
      bg: "#FEF3C7"
    },
    {
      title: "صفحات الحفظ",
      value: totalMemorizationPages,
      icon: <BookOpen size={24} />,
      bg: "#DBEAFE"
    },
    {
      title: "صفحات المراجعة",
      value: totalRevisionPages,
      icon: <RefreshCw size={24} />,
      bg: "#E0E7FF"
    },
    {
      title: "المعتمدون",
      value: approvedCount,
      icon: <BadgeCheck size={24} />,
      bg: "#D1FAE5"
    }
  ];

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns:
          "repeat(auto-fit,minmax(220px,1fr))",
        gap: "calc(16px * var(--app-density,1))",
        marginBottom: "20px"
      }}
    >
      {cards.map((card) => (
        <div
          key={card.title}
          style={cardStyle}
        >
          <div
            style={iconBox(card.bg)}
          >
            {card.icon}
          </div>

          <div>
            <div
              style={{
                color: "#64748B",
                fontSize: "calc(13px * var(--app-font-scale,1))",
                marginBottom: "6px"
              }}
            >
              {card.title}
            </div>

            <div
              style={{
                fontSize: "calc(26px * var(--app-font-scale,1))",
                fontWeight: 700,
                color: "#14532D"
              }}
            >
              {card.value}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
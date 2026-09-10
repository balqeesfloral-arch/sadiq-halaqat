import {
  Gift,
  MinusCircle,
  Trophy,
  Users,
} from "lucide-react";

function StatCard({
  title,
  value,
  icon,
  color,
}) {
  return (
    <div
      style={{
        background: "#fff",
       borderRadius: "24px",
padding: "24px",
border: "1px solid #EEF2F7",
position: "relative",
overflow: "hidden",
boxShadow:
  "0 10px 40px rgba(15,23,42,.06)",
      }}
    >
<div
  style={{
    position: "absolute",
    top: 0,
    right: 0,
    left: 0,
    height: "4px",
    background: color,
  }}
/>
      <div>
        <div
          style={{
            fontSize: "13px",
            color: "#64748B",
            marginBottom: "8px",
            fontWeight: "700",
          }}
        >
          {title}
        </div>

<div
  style={{
    fontSize: "12px",
    color: "#94A3B8",
    marginTop: "2px",
  }}
>
  تحديث مباشر
</div>

        <div
          style={{
            fontSize: "34px",
fontWeight: "900",
letterSpacing: "-1px",
            color,
          }}
        >
          {value}
        </div>
      </div>

      <div
        style={{
          width: "68px",
height: "68px",
borderRadius: "20px",
background: `linear-gradient(
135deg,
${color}22,
${color}10
)`,
border: `1px solid ${color}25`,
backdropFilter: "blur(8px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color,
        }}
      >
        {icon}
      </div>
    </div>
  );
}

export default function RewardsStats({
  totalRewards = 0,
  totalPenalties = 0,
  netPoints = 0,
  totalStudents = 0,
}) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns:
          "repeat(auto-fit,minmax(240px,1fr))",
        gap: "18px",
        marginBottom: "24px",
      }}
    >
      <StatCard
        title="إجمالي المنح"
        value={totalRewards}
        color="#16A34A"
        icon={<Gift size={24} />}
      />

      <StatCard
        title="إجمالي الخصومات"
        value={totalPenalties}
        color="#DC2626"
        icon={<MinusCircle size={24} />}
      />

      <StatCard
        title="صافي النقاط"
        value={netPoints}
        color="#D97706"
        icon={<Trophy size={24} />}
      />

      <StatCard
        title="عدد الطلاب"
        value={totalStudents}
        color="#2563EB"
        icon={<Users size={24} />}
      />
    </div>
  );
}
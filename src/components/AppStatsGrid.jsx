import AppGrid from "./AppGrid";
import StatCard from "./StatCard";

export default function AppStatsGrid({
  stats = [],
}) {
  return (
    <AppGrid minWidth={250}>
      {stats.map((item) => (
        <StatCard
          key={item.title}
          title={item.title}
          value={item.value}
          description={
            item.description
          }
          icon={item.icon}
        />
      ))}
    </AppGrid>
  );
}
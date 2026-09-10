import theme from "../styles/theme";

export default function StatCard({
  title,
  value,
  icon: Icon,
  color = theme.colors.primary,
  subtitle,
}) {
  return (
    <div
      style={{
        ...theme.card,
        padding: 24,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      <div>
        <div
          style={{
            color: theme.colors.textMuted,
            fontSize: 14,
            fontWeight: 600,
          }}
        >
          {title}
        </div>

        <div
          style={{
            marginTop: 10,
            fontSize: 34,
            fontWeight: 900,
            color: theme.colors.text,
          }}
        >
          {value}
        </div>

        {subtitle && (
          <div
            style={{
              marginTop: 8,
              fontSize: 13,
              color: theme.colors.textMuted,
            }}
          >
            {subtitle}
          </div>
        )}
      </div>

      {Icon && (
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: 20,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: `${color}15`,
            color,
          }}
        >
          <Icon size={28} />
        </div>
      )}
    </div>
  );
}
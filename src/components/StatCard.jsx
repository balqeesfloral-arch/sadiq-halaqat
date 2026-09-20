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
        padding: "calc(24px * var(--app-density,1))",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      <div>
        <div
          style={{
            color: theme.colors.textMuted,
            fontSize: "calc(14px * var(--app-font-scale,1))",
            fontWeight: 600,
          }}
        >
          {title}
        </div>

        <div
          style={{
            marginTop: 10,
            fontSize: "calc(34px * var(--app-font-scale,1))",
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
              fontSize: "calc(13px * var(--app-font-scale,1))",
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
            borderRadius: "calc(20px * var(--app-radius-scale,1))",
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
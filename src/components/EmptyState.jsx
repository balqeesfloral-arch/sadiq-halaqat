import theme from "../styles/theme";

export default function EmptyState({
  title = "لا توجد بيانات",
  description = "لم يتم العثور على أي بيانات حالياً",
  icon: Icon,
  action,
}) {
  return (
    <div
      style={{
        background: theme.colors.card,
        border: `1px dashed ${theme.colors.border}`,
        borderRadius: `calc(${theme.radius.lg}px * var(--app-radius-scale,1))`,
        padding: "calc(50px * var(--app-density,1))",
        textAlign: "center",
      }}
    >
      {Icon && (
        <div
          style={{
            width: 80,
            height: 80,
            margin: "0 auto 20px",
            borderRadius: "calc(20px * var(--app-radius-scale,1))",
            background: "color-mix(in srgb,var(--app-color-0f766e,#0f766e) 8%,transparent)",
            color: theme.colors.primary,

            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Icon size={38} />
        </div>
      )}

      <h3
        style={{
          margin: 0,
          color: theme.colors.text,
          fontSize: "calc(22px * var(--app-font-scale,1))",
          fontWeight: 800,
        }}
      >
        {title}
      </h3>

      <p
        style={{
          marginTop: 10,
          color: theme.colors.textMuted,
          fontSize: "calc(14px * var(--app-font-scale,1))",
        }}
      >
        {description}
      </p>

      {action && (
        <div style={{ marginTop: 24 }}>
          {action}
        </div>
      )}
    </div>
  );
}
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
        borderRadius: theme.radius.lg,
        padding: 50,
        textAlign: "center",
      }}
    >
      {Icon && (
        <div
          style={{
            width: 80,
            height: 80,
            margin: "0 auto 20px",
            borderRadius: 20,
            background: "rgba(15,118,110,.08)",
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
          fontSize: 22,
          fontWeight: 800,
        }}
      >
        {title}
      </h3>

      <p
        style={{
          marginTop: 10,
          color: theme.colors.textMuted,
          fontSize: 14,
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
import theme from "../styles/theme";

export default function SectionCard({
  title,
  subtitle,
  action,
  children,
}) {
  return (
    <div
      style={{
        background: theme.colors.card,
        border: `1px solid ${theme.colors.border}`,
        borderRadius: theme.radius.lg,
        padding: 24,
        boxShadow: theme.shadows.card,
      }}
    >
      {(title || subtitle || action) && (
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 20,
            gap: 16,
          }}
        >
          <div>
            {title && (
              <h2
                style={{
                  margin: 0,
                  color: theme.colors.text,
                  fontSize: 20,
                  fontWeight: 800,
                }}
              >
                {title}
              </h2>
            )}

            {subtitle && (
              <p
                style={{
                  margin: "6px 0 0",
                  color: theme.colors.textMuted,
                  fontSize: 13,
                }}
              >
                {subtitle}
              </p>
            )}
          </div>

          {action && action}
        </div>
      )}

      {children}
    </div>
  );
}
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
        borderRadius: `calc(${theme.radius.lg}px * var(--app-radius-scale,1))`,
        padding: "calc(24px * var(--app-density,1))",
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
            gap: "calc(16px * var(--app-density,1))",
          }}
        >
          <div>
            {title && (
              <h2
                style={{
                  margin: 0,
                  color: theme.colors.text,
                  fontSize: "calc(20px * var(--app-font-scale,1))",
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
                  fontSize: "calc(13px * var(--app-font-scale,1))",
                }}
              >
                {subtitle}
              </p>
            )}
          </div>

          {action}
        </div>
      )}

      {children}
    </div>
  );
}
import { theme } from "../styles/theme";

export default function AppPage({
  title,
  description,
  actions,
  stats,
  children,
  width = "1600px",
}) {
  return (
    <div
      style={{
        maxWidth: width,
        margin: "0 auto",
        width: "100%",
        padding: theme.layout.pagePadding,
        boxSizing: "border-box",
      }}
    >
      {/* Header */}

      {(title || description || actions) && (
        <div
          style={{
            ...theme.card,
            padding: "calc(28px * var(--app-density,1))",
            marginBottom: 24,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "calc(20px * var(--app-density,1))",
            flexWrap: "wrap",
          }}
        >
          <div>
            {title && (
              <h1
                style={{
                  margin: 0,
                  fontSize: "calc(32px * var(--app-font-scale,1))",
                  fontWeight: 900,
                  color: theme.colors.text,
                }}
              >
                {title}
              </h1>
            )}

            {description && (
              <p
                style={{
                  marginTop: 8,
                  marginBottom: 0,
                  color: theme.colors.textMuted,
                  fontSize: "calc(15px * var(--app-font-scale,1))",
                }}
              >
                {description}
              </p>
            )}
          </div>

          {actions && (
            <div
              style={{
                display: "flex",
                gap: "calc(12px * var(--app-density,1))",
                flexWrap: "wrap",
              }}
            >
              {actions}
            </div>
          )}
        </div>
      )}

      {/* Stats */}

      {stats && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit,minmax(220px,1fr))",
            gap: "calc(20px * var(--app-density,1))",
            marginBottom: 24,
          }}
        >
          {stats}
        </div>
      )}

      {/* Content */}

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: theme.layout.sectionGap,
        }}
      >
        {children}
      </div>
    </div>
  );
}
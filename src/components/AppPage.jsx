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
            padding: 28,
            marginBottom: 24,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 20,
            flexWrap: "wrap",
          }}
        >
          <div>
            {title && (
              <h1
                style={{
                  margin: 0,
                  fontSize: 32,
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
                  fontSize: 15,
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
                gap: 12,
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
            gap: 20,
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
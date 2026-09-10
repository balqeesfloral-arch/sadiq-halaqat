import { theme } from "../styles/theme";

export default function PageHero({
  title,
  description,
  badge,
  actions,
}) {
  return (
    <div
      style={{
        ...theme.hero,
        padding: 40,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* زخرفة */}
      <div
        style={{
          position: "absolute",
          top: -80,
          left: -80,
          width: 220,
          height: 220,
          borderRadius: "50%",
          border: "2px solid rgba(255,255,255,.08)",
        }}
      />

      <div
        style={{
          position: "absolute",
          bottom: -120,
          right: -120,
          width: 300,
          height: 300,
          borderRadius: "50%",
          border: "2px solid rgba(255,255,255,.08)",
        }}
      />

      <div style={{ position: "relative", zIndex: 2 }}>
        {badge && (
          <div
            style={{
              display: "inline-block",
              padding: "8px 16px",
              borderRadius: 999,
              background: "rgba(255,255,255,.12)",
              marginBottom: 16,
              fontWeight: 700,
            }}
          >
            {badge}
          </div>
        )}

        <h1
          style={{
            margin: 0,
            fontSize: 42,
            fontWeight: 900,
          }}
        >
          {title}
        </h1>

        {description && (
          <p
            style={{
              marginTop: 12,
              marginBottom: 0,
              fontSize: 18,
              opacity: 0.9,
              maxWidth: 700,
            }}
          >
            {description}
          </p>
        )}

        {actions && (
          <div
            style={{
              marginTop: 24,
              display: "flex",
              gap: 12,
              flexWrap: "wrap",
            }}
          >
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}
import { OrnamentScene } from './ornaments/Ornament';
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
        padding: "calc(40px * var(--app-density,1))",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <OrnamentScene primary="02-shams" />

      <div style={{ position: "relative", zIndex: 2 }}>
        {badge && (
          <div
            style={{
              display: "inline-block",
              padding: "calc(8px * var(--app-density,1)) calc(16px * var(--app-density,1))",
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
            fontSize: "calc(42px * var(--app-font-scale,1))",
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
              fontSize: "calc(18px * var(--app-font-scale,1))",
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
              gap: "calc(12px * var(--app-density,1))",
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
export default function PageHero({
  title,
  subtitle,
  actions,
}) {
  return (
    <div
      style={{
        background:
          "linear-gradient(135deg,var(--app-color-0f766e,#0F766E) 0%,var(--app-color-115e59,#115E59) 100%)",
        borderRadius: "calc(32px * var(--app-radius-scale,1))",
        padding: "calc(36px * var(--app-density,1))",
        color: "#fff",
        marginBottom: "24px",
        position: "relative",
        overflow: "hidden",
        boxShadow:
          "0 20px 50px color-mix(in srgb,var(--app-color-0f766e,#0f766e) 25%,transparent)",
      }}
    >
      {/* زخرفة */}
      <div
        style={{
          position: "absolute",
          top: "-60px",
          left: "-60px",
          width: "220px",
          height: "220px",
          borderRadius: "50%",
          background:
            "rgba(255,255,255,.08)",
        }}
      />

      <div
        style={{
          position: "absolute",
          bottom: "-80px",
          right: "-80px",
          width: "260px",
          height: "260px",
          borderRadius: "50%",
          background:
            "rgba(255,255,255,.05)",
        }}
      />

      <div
        style={{
          position: "relative",
          zIndex: 2,
          display: "flex",
          justifyContent:
            "space-between",
          alignItems: "center",
          gap: "calc(24px * var(--app-density,1))",
          flexWrap: "wrap",
        }}
      >
        <div>
          <h1
            style={{
              margin: 0,
              fontSize: "calc(34px * var(--app-font-scale,1))",
              fontWeight: "800",
              lineHeight: 1.2,
            }}
          >
            {title}
          </h1>

          {subtitle && (
            <p
              style={{
                margin:
                  "12px 0 0 0",
                opacity: 0.9,
                fontSize: "calc(15px * var(--app-font-scale,1))",
                lineHeight: 1.8,
                maxWidth: "700px",
              }}
            >
              {subtitle}
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
    </div>
  );
}
export default function PageHero({
  title,
  subtitle,
  actions,
}) {
  return (
    <div
      style={{
        background:
          "linear-gradient(135deg,#0F766E 0%,#115E59 100%)",
        borderRadius: "32px",
        padding: "36px",
        color: "#fff",
        marginBottom: "24px",
        position: "relative",
        overflow: "hidden",
        boxShadow:
          "0 20px 50px rgba(15,118,110,.25)",
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
          gap: "24px",
          flexWrap: "wrap",
        }}
      >
        <div>
          <h1
            style={{
              margin: 0,
              fontSize: "34px",
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
                fontSize: "15px",
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
              gap: "12px",
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
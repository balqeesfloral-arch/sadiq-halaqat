export default function ActionCard({
  title,
  description,
  icon: Icon,
  onClick,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        border: "1px solid #e5e8e4",
        background: "#fff",
        borderRadius: "calc(15px * var(--app-radius-scale,1))",
        padding: "calc(17px * var(--app-density,1))",
        cursor: "pointer",
        textAlign: "right",
        display: "flex",
        alignItems: "center",
        gap: "calc(12px * var(--app-density,1))",
        width: "100%",
        boxShadow:
          "0 3px 12px rgba(0,0,0,0.035)",
      }}
    >
      <div
        style={{
          width: "43px",
          height: "43px",
          flexShrink: 0,
          borderRadius: "calc(12px * var(--app-radius-scale,1))",
          background: "var(--app-color-edf5ef,#edf5ef)",
          color: "var(--app-color-0f5132,#0f5132)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {Icon && <Icon size={20} />}
      </div>

      <div
        style={{
          flex: 1,
          minWidth: 0,
        }}
      >
        <div
          style={{
            color: "var(--app-color-173d2b,#173d2b)",
            fontWeight: "800",
            fontSize: "calc(13px * var(--app-font-scale,1))",
            marginBottom: "4px",
          }}
        >
          {title}
        </div>

        <div
          style={{
            color: "#8a918d",
            fontSize: "calc(10px * var(--app-font-scale,1))",
          }}
        >
          {description}
        </div>
      </div>
    </button>
  );
}
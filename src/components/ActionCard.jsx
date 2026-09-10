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
        borderRadius: "15px",
        padding: "17px",
        cursor: "pointer",
        textAlign: "right",
        display: "flex",
        alignItems: "center",
        gap: "12px",
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
          borderRadius: "12px",
          background: "#edf5ef",
          color: "#0f5132",
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
            color: "#173d2b",
            fontWeight: "800",
            fontSize: "13px",
            marginBottom: "4px",
          }}
        >
          {title}
        </div>

        <div
          style={{
            color: "#8a918d",
            fontSize: "10px",
          }}
        >
          {description}
        </div>
      </div>
    </button>
  );
}
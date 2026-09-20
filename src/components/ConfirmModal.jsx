import {
  AlertTriangle,
  X,
} from "lucide-react";

export default function ConfirmModal({
  open,
  title = "تأكيد العملية",
  message,
  confirmText = "تأكيد",
  cancelText = "إلغاء",
  danger = false,
  onConfirm,
  onCancel,
}) {
  if (!open) return null;

  return (
    <div
      dir="rtl"
      style={{
        position: "fixed",
        inset: 0,

        zIndex: 99998,

        background:
          "rgba(18, 31, 24, 0.45)",

        backdropFilter:
          "blur(5px)",

        display: "flex",
        alignItems: "center",
        justifyContent: "center",

        padding: "calc(20px * var(--app-density,1))",

        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "420px",

          background: "#fff",

          borderRadius: "calc(22px * var(--app-radius-scale,1))",

          padding: "calc(25px * var(--app-density,1))",

          boxShadow:
            "0 25px 80px rgba(0,0,0,0.22)",

          position: "relative",

          animation:
            "modalScale .2s ease",
        }}
      >
        <button
          type="button"
          onClick={onCancel}
          style={{
            position: "absolute",
            top: "14px",
            left: "14px",

            width: "34px",
            height: "34px",

            border: "none",
            background: "#f5f5f5",

            borderRadius: "calc(9px * var(--app-radius-scale,1))",

            color: "#666",

            cursor: "pointer",

            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <X size={18} />
        </button>

        <div
          style={{
            width: "58px",
            height: "58px",

            borderRadius: "calc(17px * var(--app-radius-scale,1))",

            background: danger
              ? "#fff1f0"
              : "#fff8e6",

            color: danger
              ? "#b42318"
              : "#9a6700",

            display: "flex",
            alignItems: "center",
            justifyContent: "center",

            marginBottom: "16px",
          }}
        >
          <AlertTriangle
            size={28}
            strokeWidth={1.8}
          />
        </div>

        <h2
          style={{
            margin: "0 0 8px",
            color: "var(--app-color-173d2b,#173d2b)",
            fontSize: "calc(20px * var(--app-font-scale,1))",
          }}
        >
          {title}
        </h2>

        <p
          style={{
            margin: "0 0 22px",
            color: "#707770",
            fontSize: "calc(14px * var(--app-font-scale,1))",
            lineHeight: 1.8,
          }}
        >
          {message}
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "1fr 1fr",
            gap: "calc(9px * var(--app-density,1))",
          }}
        >
          <button
            type="button"
            onClick={onCancel}
            style={{
              height: "45px",
              borderRadius: "calc(10px * var(--app-radius-scale,1))",

              border:
                "1px solid #ddd",

              background: "#fff",

              color: "#555",

              cursor: "pointer",

              fontWeight: "700",
            }}
          >
            {cancelText}
          </button>

          <button
            type="button"
            onClick={onConfirm}
            style={{
              height: "45px",
              borderRadius: "calc(10px * var(--app-radius-scale,1))",

              border: "none",

              background: danger
                ? "#b42318"
                : "var(--app-color-0f5132,#0f5132)",

              color: "#fff",

              cursor: "pointer",

              fontWeight: "700",
            }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
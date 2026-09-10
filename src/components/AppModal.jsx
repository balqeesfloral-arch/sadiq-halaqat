import { X } from "lucide-react";
import { theme } from "../styles/theme";

export default function AppModal({
  open,
  title,
  children,
  onClose,
  width = "700px",
}) {
  if (!open) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,

        background:
          theme.colors.overlay,

        display: "flex",

        alignItems: "center",

        justifyContent: "center",

        zIndex: 9999,

        padding: "20px",
      }}
    >
      <div
        onClick={(e) =>
          e.stopPropagation()
        }
        style={{
          width: "100%",
          maxWidth: width,

          background:
            theme.colors.surface,

          borderRadius:
            theme.radius.xl,

          boxShadow:
            theme.shadow.modal,

          overflow: "hidden",
        }}
      >
        <div
          style={{
            padding: "20px 24px",

            borderBottom:
              `1px solid ${theme.colors.border}`,

            display: "flex",

            alignItems: "center",

            justifyContent:
              "space-between",
          }}
        >
          <h2
            style={{
              margin: 0,

              fontSize: "22px",

              fontWeight: "800",

              color:
                theme.colors.text,
            }}
          >
            {title}
          </h2>

          <button
            type="button"
            onClick={onClose}
            style={{
              width: "40px",
              height: "40px",

              border: "none",

              background: "none",

              cursor: "pointer",

              display: "flex",

              alignItems: "center",

              justifyContent:
                "center",
            }}
          >
            <X size={20} />
          </button>
        </div>

        <div
          style={{
            padding: "24px",
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
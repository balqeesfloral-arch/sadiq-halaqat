import {
  AlertTriangle,
  CheckCircle2,
  Info,
  X,
} from "lucide-react";

export default function ConfirmDialog({
  open,
  title = "تأكيد العملية",
  message = "هل أنت متأكد من تنفيذ هذه العملية؟",
  confirmText = "تأكيد",
  cancelText = "إلغاء",
  type = "warning",
  loading = false,
  onConfirm,
  onCancel,
}) {
  if (!open) return null;

  const config = getConfig(type);

  return (
    <div
      dir="rtl"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100000,

        display: "flex",
        alignItems: "center",
        justifyContent: "center",

        padding: "calc(20px * var(--app-density,1))",

        background:
          "rgba(17, 35, 27, 0.38)",

        backdropFilter:
          "blur(5px)",

        WebkitBackdropFilter:
          "blur(5px)",
      }}
      onMouseDown={(event) => {
        if (
          event.target === event.currentTarget &&
          !loading
        ) {
          onCancel?.();
        }
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        style={{
          width: "100%",
          maxWidth: "430px",

          background: "#fff",

          borderRadius: "calc(22px * var(--app-radius-scale,1))",

          padding: "calc(24px * var(--app-density,1))",

          boxSizing: "border-box",

          boxShadow:
            "0 30px 80px rgba(0,0,0,0.20)",

          animation:
            "confirmDialogIn .2s ease",
        }}
      >
        {/* الرأس */}

        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: "calc(13px * var(--app-density,1))",
          }}
        >
          <div
            style={{
              width: "48px",
              height: "48px",
              flexShrink: 0,

              borderRadius: "calc(14px * var(--app-radius-scale,1))",

              background:
                config.background,

              color:
                config.color,

              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {config.icon}
          </div>

          <div
            style={{
              flex: 1,
              minWidth: 0,
            }}
          >
            <h2
              style={{
                margin: "2px 0 5px",

                color: "var(--app-color-173d2b,#173d2b)",

                fontSize: "calc(17px * var(--app-font-scale,1))",

                fontWeight: "800",
              }}
            >
              {title}
            </h2>

            <p
              style={{
                margin: 0,

                color: "#707872",

                fontSize: "calc(13px * var(--app-font-scale,1))",

                lineHeight: 1.8,
              }}
            >
              {message}
            </p>
          </div>

          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            aria-label="إغلاق"
            style={{
              width: "32px",
              height: "32px",

              flexShrink: 0,

              border: "none",

              borderRadius: "calc(9px * var(--app-radius-scale,1))",

              background: "#f5f6f5",

              color: "#7c857f",

              cursor: loading
                ? "not-allowed"
                : "pointer",

              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <X size={17} />
          </button>
        </div>

        {/* الأزرار */}

        <div
          style={{
            display: "grid",

            gridTemplateColumns:
              "1fr 1fr",

            gap: "calc(9px * var(--app-density,1))",

            marginTop: "24px",
          }}
        >
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            style={{
              minHeight: "45px",

              border:
                "1px solid #dfe3e0",

              borderRadius: "calc(11px * var(--app-radius-scale,1))",

              background: "#fff",

              color: "#58625c",

              cursor: loading
                ? "not-allowed"
                : "pointer",

              fontSize: "calc(13px * var(--app-font-scale,1))",

              fontWeight: "700",
            }}
          >
            {cancelText}
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            style={{
              minHeight: "45px",

              border: "none",

              borderRadius: "calc(11px * var(--app-radius-scale,1))",

              background:
                config.buttonBackground,

              color: "#fff",

              cursor: loading
                ? "wait"
                : "pointer",

              fontSize: "calc(13px * var(--app-font-scale,1))",

              fontWeight: "800",

              display: "flex",

              alignItems: "center",

              justifyContent: "center",

              gap: "calc(7px * var(--app-density,1))",
            }}
          >
            {loading ? (
              <>
                <span
                  style={{
                    width: "16px",
                    height: "16px",

                    border:
                      "2px solid rgba(255,255,255,.35)",

                    borderTopColor:
                      "#fff",

                    borderRadius: "50%",

                    animation:
                      "confirmSpin .7s linear infinite",
                  }}
                />

                جارٍ التنفيذ...
              </>
            ) : (
              <>
                <CheckCircle2
                  size={16}
                />

                {confirmText}
              </>
            )}
          </button>
        </div>
      </div>

      <style>
        {`
          @keyframes confirmDialogIn {
            from {
              opacity: 0;
              transform: translateY(10px) scale(.98);
            }

            to {
              opacity: 1;
              transform: translateY(0) scale(1);
            }
          }

          @keyframes confirmSpin {
            to {
              transform: rotate(360deg);
            }
          }
        `}
      </style>
    </div>
  );
}

function getConfig(type) {
  if (type === "danger") {
    return {
      color: "#b42318",
      background: "#fff0ef",
      buttonBackground: "#b42318",
      icon: (
        <AlertTriangle
          size={22}
        />
      ),
    };
  }

  if (type === "info") {
    return {
      color: "#1769aa",
      background: "#eef7ff",
      buttonBackground: "#1769aa",
      icon: (
        <Info size={22} />
      ),
    };
  }

  return {
    color: "#9a741f",
    background: "#fff7df",
    buttonBackground: "#0f5132",
    icon: (
      <AlertTriangle
        size={22}
      />
    ),
  };
}
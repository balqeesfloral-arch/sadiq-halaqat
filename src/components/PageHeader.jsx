import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function PageHeader({
  icon: Icon,
  title,
  description,
  backTo = "/admin",
  backText = "العودة للوحة المشرف",
  actions = null,
}) {
  const navigate = useNavigate();

  return (
    <header
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "calc(16px * var(--app-density,1))",
        flexWrap: "wrap",
        marginBottom: "25px",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "calc(12px * var(--app-density,1))",
          minWidth: 0,
        }}
      >
        {backTo && (
          <button
            type="button"
            onClick={() => navigate(backTo)}
            title={backText}
            style={{
              width: "42px",
              height: "42px",
              flexShrink: 0,
              border: "1px solid #dfe4e0",
              borderRadius: "calc(11px * var(--app-radius-scale,1))",
              background: "#fff",
              color: "var(--app-color-173d2b,#173d2b)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <ArrowRight size={19} />
          </button>
        )}

        {Icon && (
          <div
            style={{
              width: "48px",
              height: "48px",
              flexShrink: 0,
              borderRadius: "calc(14px * var(--app-radius-scale,1))",
              background: "#eaf3ed",
              color: "var(--app-color-0f5132,#0f5132)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Icon size={24} strokeWidth={1.8} />
          </div>
        )}

        <div style={{ minWidth: 0 }}>
          <h1
            style={{
              margin: 0,
              color: "var(--app-color-173d2b,#173d2b)",
              fontSize: "calc(28px * var(--app-font-scale,1))",
              fontWeight: "800",
              lineHeight: 1.3,
            }}
          >
            {title}
          </h1>

          {description && (
            <p
              style={{
                margin: "5px 0 0",
                color: "#818983",
                fontSize: "calc(13px * var(--app-font-scale,1))",
                lineHeight: 1.6,
              }}
            >
              {description}
            </p>
          )}
        </div>
      </div>

      {actions && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "calc(8px * var(--app-density,1))",
            flexWrap: "wrap",
          }}
        >
          {actions}
        </div>
      )}
    </header>
  );
}
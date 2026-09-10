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
        gap: "16px",
        flexWrap: "wrap",
        marginBottom: "25px",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
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
              borderRadius: "11px",
              background: "#fff",
              color: "#173d2b",
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
              borderRadius: "14px",
              background: "#eaf3ed",
              color: "#0f5132",
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
              color: "#173d2b",
              fontSize: "28px",
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
                fontSize: "13px",
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
            gap: "8px",
            flexWrap: "wrap",
          }}
        >
          {actions}
        </div>
      )}
    </header>
  );
}
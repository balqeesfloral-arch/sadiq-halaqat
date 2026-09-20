import { theme } from "../styles/theme";

export default function AppSection({
  icon: Icon,
  title,
  description,
  children,
}) {
  return (
    <section
      style={{
        marginBottom:
          theme.spacing.xl,
      }}
    >
      {(title || description) && (
        <div
          style={{
            marginBottom:
              theme.spacing.lg,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "calc(12px * var(--app-density,1))",
            }}
          >
            {Icon && (
              <div
                style={{
                  width: "42px",
                  height: "42px",
                  borderRadius: "calc(12px * var(--app-radius-scale,1))",
                  background: "#eef7f1",

                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",

                  color:
                    theme.colors.primary,
                }}
              >
                <Icon size={20} />
              </div>
            )}

            {title && (
              <h2
                style={{
                  margin: 0,
                  color:
                    theme.colors.text,
                  fontSize: "calc(22px * var(--app-font-scale,1))",
                  fontWeight: "800",
                }}
              >
                {title}
              </h2>
            )}
          </div>

          {description && (
            <p
              style={{
                marginTop: "10px",
                color:
                  theme.colors.textSecondary,
              }}
            >
              {description}
            </p>
          )}
        </div>
      )}

      {children}
    </section>
  );
}
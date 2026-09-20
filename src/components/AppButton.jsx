import { theme } from "../styles/theme";

export default function AppButton({
  children,
  variant = "primary",
  size = "md",
  icon: Icon,
  fullWidth = false,
  disabled = false,
  onClick,
  type = "button",
}) {
  const variants = {
    primary: {
      background:
        "linear-gradient(135deg,var(--app-color-0f5132,#0F5132),var(--app-color-1b6e46,#1B6E46))",
      color: "#fff",
      border: "none",
    },

    secondary: {
      background: "#fff",
      color: theme.colors.primary,
      border: `1px solid ${theme.colors.border}`,
    },

    danger: {
      background: theme.colors.danger,
      color: "#fff",
      border: "none",
    },
  };

  const sizes = {
    sm: {
      height: "40px",
      padding: "0 calc(14px * var(--app-density,1))",
      fontSize: "calc(13px * var(--app-font-scale,1))",
    },

    md: {
      height: "46px",
      padding: "0 calc(18px * var(--app-density,1))",
      fontSize: "calc(14px * var(--app-font-scale,1))",
    },

    lg: {
      height: "52px",
      padding: "0 calc(24px * var(--app-density,1))",
      fontSize: "calc(15px * var(--app-font-scale,1))",
    },
  };

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      style={{
        ...variants[variant],
        ...sizes[size],

        width: fullWidth
          ? "100%"
          : "auto",

        borderRadius:
          `calc(${theme.radius.md}px * var(--app-radius-scale,1))`,

        display: "inline-flex",

        alignItems: "center",

        justifyContent: "center",

        gap: "calc(8px * var(--app-density,1))",

        fontWeight: "700",

        cursor: disabled
          ? "not-allowed"
          : "pointer",

        transition:
  theme.transitions.normal,

        opacity: disabled
          ? 0.6
          : 1,

        boxShadow:
          variant === "primary"
            ? "0 8px 20px color-mix(in srgb,var(--app-color-0f5132,#0f5132) 20%,transparent)"
            : "none",
      }}
    >
      {Icon && (
        <Icon size={18} />
      )}

      {children}
    </button>
  );
}
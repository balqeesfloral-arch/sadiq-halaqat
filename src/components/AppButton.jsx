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
        "linear-gradient(135deg,#0F5132,#1B6E46)",
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
      padding: "0 14px",
      fontSize: "13px",
    },

    md: {
      height: "46px",
      padding: "0 18px",
      fontSize: "14px",
    },

    lg: {
      height: "52px",
      padding: "0 24px",
      fontSize: "15px",
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
          theme.radius.md,

        display: "inline-flex",

        alignItems: "center",

        justifyContent: "center",

        gap: "8px",

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
            ? "0 8px 20px rgba(15,81,50,.20)"
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
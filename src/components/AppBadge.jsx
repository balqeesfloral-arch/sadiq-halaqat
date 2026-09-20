import { theme } from "../styles/theme";

export default function AppBadge({
  children,
  variant = "success",
}) {
  const variants = {
    success: {
      background: "#EAF6EE",
      color: theme.colors.success,
    },

    warning: {
      background: "#FFF7E8",
      color: theme.colors.warning,
    },

    danger: {
      background: "#FDECEC",
      color: theme.colors.danger,
    },

    info: {
      background: "#EEF6FF",
      color: theme.colors.info,
    },

    primary: {
      background: "#EEF7F1",
      color: theme.colors.primary,
    },
  };

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",

        minHeight: "30px",

        padding: "0 calc(12px * var(--app-density,1))",

        borderRadius:
          `calc(${theme.radius.round}px * var(--app-radius-scale,1))`,

        fontSize: "calc(12px * var(--app-font-scale,1))",

        fontWeight: "700",

        ...variants[variant],
      }}
    >
      {children}
    </span>
  );
}
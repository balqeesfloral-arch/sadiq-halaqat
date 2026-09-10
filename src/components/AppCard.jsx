import { theme } from "../styles/theme";

export default function AppCard({
  children,
  padding = theme.card.padding,
  hover = true,
  style = {},
  onClick,
}) {
  const clickable = Boolean(onClick);

  return (
    <div
      onClick={onClick}
      role={clickable ? "button" : undefined}
      tabIndex={clickable ? 0 : undefined}
      onKeyDown={(event) => {
        if (
          clickable &&
          (event.key === "Enter" ||
            event.key === " ")
        ) {
          onClick();
        }
      }}
      style={{
        background:
          theme.card.background,

        border:
          theme.card.border,

        borderRadius:
          theme.card.borderRadius,

        boxShadow:
          theme.card.boxShadow,

        padding,

        transition:
          theme.transition.normal,

        cursor: clickable
          ? "pointer"
          : "default",

        overflow: "hidden",

        ...style,
      }}
      onMouseEnter={(event) => {
        if (!hover) return;

        event.currentTarget.style.transform =
          "translateY(-4px)";

        event.currentTarget.style.boxShadow =
          theme.shadow.hover;
      }}
      onMouseLeave={(event) => {
        if (!hover) return;

        event.currentTarget.style.transform =
          "translateY(0)";

        event.currentTarget.style.boxShadow =
          theme.card.boxShadow;
      }}
    >
      {children}
    </div>
  );
}
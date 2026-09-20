import { theme } from "./theme";

export const pagePresets = {
  card: {
    background: theme.colors.surface,
    border: `1px solid ${theme.colors.border}`,
    borderRadius: `calc(${theme.radius.lg}px * var(--app-radius-scale,1))`,
    boxShadow: theme.shadow.card,
  },

  toolbar: {
    display: "flex",
    gap: "calc(12px * var(--app-density,1))",
    flexWrap: "wrap",
    alignItems: "center",
  },

  filtersGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit,minmax(220px,1fr))",
    gap: "calc(16px * var(--app-density,1))",
  },

  statsGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit,minmax(260px,1fr))",
    gap: "calc(20px * var(--app-density,1))",
  },

  cardsGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit,minmax(260px,1fr))",
    gap: "calc(20px * var(--app-density,1))",
  },

  tableContainer: {
    overflowX: "auto",
  },

  sectionSpacing: {
    marginBottom: theme.spacing.xl,
  },
};
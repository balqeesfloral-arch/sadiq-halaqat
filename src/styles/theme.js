export const theme = {
  colors: {
    primary: "var(--app-color-0f766e,#0F766E)",
    primaryLight: "#14B8A6",
    primaryDark: "var(--app-color-115e59,#115E59)",

    success: "#16A34A",
    warning: "#F59E0B",
    danger: "#DC2626",

    background: "var(--app-color-f4f8f7,#F4F8F7)",

    card: "#FFFFFF",
    surface: "#FFFFFF",

    text: "#0F172A",

    textMuted: "#64748B",
    textSecondary: "#64748B",
    textLight: "#64748B",

    border: "#E2E8F0",

    gold: "#D4AF37",
    olive: "#556B2F",
  },

  radius: {
    xs: 8,
    sm: 12,
    md: 18,
    lg: 24,
    xl: 32,
    xxl: 40,
  },

  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },

  transitions: {
    fast: "all .15s ease",
    normal: "all .25s ease",
    slow: "all .4s ease",
  },

  // للتوافق مع الملفات القديمة
  transition: {
    fast: "all .15s ease",
    normal: "all .25s ease",
    slow: "all .4s ease",
  },

  shadows: {
    card:
      "0 4px 20px rgba(15,118,110,.06)",

    hover:
      "0 12px 30px rgba(15,118,110,.12)",

    hero:
      "0 20px 50px color-mix(in srgb,var(--app-color-0f766e,#0f766e) 25%,transparent)",

    modal:
      "0 24px 60px rgba(0,0,0,.12)",
  },

  // للتوافق مع الملفات القديمة
  shadow: {
    card:
      "0 4px 20px rgba(15,118,110,.06)",

    hover:
      "0 12px 30px rgba(15,118,110,.12)",

    hero:
      "0 20px 50px color-mix(in srgb,var(--app-color-0f766e,#0f766e) 25%,transparent)",
  },

  layout: {
    pagePadding: 24,
    sectionGap: 24,
    sidebarWidth: 300,
    maxWidth: 1600,
  },

  card: {
    background: "#FFFFFF",

    borderRadius: "calc(24px * var(--app-radius-scale,1))",

    border: "1px solid #E2E8F0",

    boxShadow:
      "0 4px 20px color-mix(in srgb,var(--app-color-0f766e,#0f766e) 6%,transparent)",
  },

  hero: {
    background:
      "linear-gradient(135deg,#556B2F,var(--app-color-0f766e,#0F766E))",

    borderRadius: "calc(32px * var(--app-radius-scale,1))",

    color: "#D4AF37",

    boxShadow:
      "0 20px 50px color-mix(in srgb,var(--app-color-0f766e,#0f766e) 25%,transparent)",
  },
};

export default theme;
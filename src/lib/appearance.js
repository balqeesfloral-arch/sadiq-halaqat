const THEMES = {
  sadiq: "#0B5D4B",
  olive: "#596B37",
  emerald: "#087F5B",
  navy: "#27445D",
  burgundy: "#713B46",
  gold: "#9A7425",
};

const DEFAULTS = {
  theme: "sadiq",
  customColor: "#0B5D4B",
  fontSize: "normal",
  density: "comfortable",
  rounded: true,
};

const FONT_SIZE = { compact: 14, normal: 16, large: 18 };
const DENSITY = { compact: 0.92, comfortable: 1, spacious: 1.06 };

export function readAppAppearance() {
  try {
    const stored = JSON.parse(localStorage.getItem("sadiq_appearance") || "null");
    return { ...DEFAULTS, ...(stored || {}) };
  } catch {
    return { ...DEFAULTS };
  }
}

export function applyAppAppearance(value = readAppAppearance()) {
  const root = document.documentElement;
  const primary =
    value.theme === "custom"
      ? value.customColor
      : (THEMES[value.theme] || THEMES.sadiq);

  root.style.setProperty("--app-primary", primary);
  root.style.setProperty("--primary", primary);
  root.style.setProperty("--app-font-size", `${FONT_SIZE[value.fontSize] || 16}px`);
  root.style.setProperty("--app-density", String(DENSITY[value.density] || 1));
  root.dataset.appCorners = value.rounded === false ? "soft" : "rounded";
  root.dataset.appTheme = value.theme || "sadiq";

  return value;
}

export function saveAppAppearance(value) {
  localStorage.setItem("sadiq_appearance", JSON.stringify(value));
  return applyAppAppearance(value);
}
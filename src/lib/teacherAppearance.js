// src/lib/teacherAppearance.js

export const TEACHER_APPEARANCE_PRESETS = [
  {
    key: "sadiq",
    label: "الصِّدّيق",
    description: "الأخضر العميق والذهبي المعتمد",
    primary: "#0F4C45",
    accent: "#0F766E",
    deep: "#082F2A",
    gold: "#D1B34C",
    background: "#F4F7F5",
    soft: "#F8FBF9",
    text: "#173630",
  },
  {
    key: "olive",
    label: "زيتوني",
    description: "هادئ ومناسب للواجهات التعليمية",
    primary: "#596B37",
    accent: "#758A50",
    deep: "#344125",
    gold: "#C3A64B",
    background: "#F7F8F3",
    soft: "#FAFBF7",
    text: "#313B2C",
  },
  {
    key: "emerald",
    label: "زمردي",
    description: "أوضح وأكثر حيوية مع بقاء الطابع الوقور",
    primary: "#087F5B",
    accent: "#0CA678",
    deep: "#055B43",
    gold: "#C6A64A",
    background: "#F3F8F6",
    soft: "#F7FBF9",
    text: "#173A31",
  },
  {
    key: "navy",
    label: "كحلي",
    description: "واجهة مؤسسية هادئة وعصرية",
    primary: "#27445D",
    accent: "#3B6E8F",
    deep: "#182C3C",
    gold: "#C5A44B",
    background: "#F4F7F9",
    soft: "#F8FAFB",
    text: "#203440",
  },
  {
    key: "burgundy",
    label: "عنابي",
    description: "فاخر ودافئ مع لمسة كلاسيكية",
    primary: "#713B46",
    accent: "#965467",
    deep: "#48252D",
    gold: "#C5A44B",
    background: "#F8F4F5",
    soft: "#FBF8F9",
    text: "#402B31",
  },
  {
    key: "gold",
    label: "ذهبي داكن",
    description: "ذهبي معتّق بطابع رسمي",
    primary: "#8A6A23",
    accent: "#B08A31",
    deep: "#514016",
    gold: "#C9A63B",
    background: "#F9F7F1",
    soft: "#FCFAF6",
    text: "#403820",
  },
];

export const TEACHER_APPEARANCE_DEFAULTS = {
  appearance_theme: "sadiq",
  appearance_primary: "#0F4C45",
  appearance_font_size: "normal",
  appearance_radius: "soft",
  appearance_pattern: "subtle",
  appearance_motion: "full",
};

const FONT_SCALES = {
  small: 0.92,
  normal: 1,
  large: 1.08,
  xlarge: 1.16,
};

const DENSITY_SCALES = {
  compact: 0.88,
  comfortable: 1,
};

const RADIUS_SCALES = {
  compact: 0.78,
  soft: 1,
  round: 1.22,
};

const PATTERN_OPACITY = {
  none: 0,
  subtle: 0.026,
  rich: 0.05,
};

function normalizeHex(value, fallback = "#0F4C45") {
  const text = String(value || "").trim();
  return /^#[0-9a-f]{6}$/i.test(text) ? text.toUpperCase() : fallback;
}

function hexToRgb(hex) {
  const safe = normalizeHex(hex).slice(1);
  return {
    r: parseInt(safe.slice(0, 2), 16),
    g: parseInt(safe.slice(2, 4), 16),
    b: parseInt(safe.slice(4, 6), 16),
  };
}

function rgbToHex({ r, g, b }) {
  const channel = (value) =>
    Math.max(0, Math.min(255, Math.round(value)))
      .toString(16)
      .padStart(2, "0");
  return `#${channel(r)}${channel(g)}${channel(b)}`.toUpperCase();
}

function mix(hex, target, amount) {
  const from = hexToRgb(hex);
  const to = hexToRgb(target);
  const ratio = Math.max(0, Math.min(1, Number(amount) || 0));

  return rgbToHex({
    r: from.r + (to.r - from.r) * ratio,
    g: from.g + (to.g - from.g) * ratio,
    b: from.b + (to.b - from.b) * ratio,
  });
}

export function getTeacherAppearancePreset(key) {
  return (
    TEACHER_APPEARANCE_PRESETS.find((item) => item.key === key) ||
    TEACHER_APPEARANCE_PRESETS[0]
  );
}

export function normalizeTeacherAppearance(row = {}) {
  const themeKeys = new Set([
    ...TEACHER_APPEARANCE_PRESETS.map((item) => item.key),
    "custom",
  ]);

  const fontKeys = new Set(Object.keys(FONT_SCALES));
  const radiusKeys = new Set(Object.keys(RADIUS_SCALES));
  const patternKeys = new Set(Object.keys(PATTERN_OPACITY));
  const motionKeys = new Set(["full", "reduced"]);

  return {
    appearance_theme: themeKeys.has(row.appearance_theme)
      ? row.appearance_theme
      : TEACHER_APPEARANCE_DEFAULTS.appearance_theme,
    appearance_primary: normalizeHex(
      row.appearance_primary,
      TEACHER_APPEARANCE_DEFAULTS.appearance_primary
    ),
    appearance_font_size: fontKeys.has(row.appearance_font_size)
      ? row.appearance_font_size
      : TEACHER_APPEARANCE_DEFAULTS.appearance_font_size,
    appearance_radius: radiusKeys.has(row.appearance_radius)
      ? row.appearance_radius
      : TEACHER_APPEARANCE_DEFAULTS.appearance_radius,
    appearance_pattern: patternKeys.has(row.appearance_pattern)
      ? row.appearance_pattern
      : TEACHER_APPEARANCE_DEFAULTS.appearance_pattern,
    appearance_motion: motionKeys.has(row.appearance_motion)
      ? row.appearance_motion
      : TEACHER_APPEARANCE_DEFAULTS.appearance_motion,
  };
}

export function buildTeacherAppearanceVariables(
  appearanceInput = {},
  uiDensity = "comfortable"
) {
  const appearance = normalizeTeacherAppearance(appearanceInput);
  const preset = getTeacherAppearancePreset(appearance.appearance_theme);

  const primary =
    appearance.appearance_theme === "custom"
      ? normalizeHex(appearance.appearance_primary)
      : preset.primary;

  const accent =
    appearance.appearance_theme === "custom"
      ? mix(primary, "#FFFFFF", 0.18)
      : preset.accent;

  const deep =
    appearance.appearance_theme === "custom"
      ? mix(primary, "#000000", 0.34)
      : preset.deep;

  const text =
    appearance.appearance_theme === "custom"
      ? mix(primary, "#000000", 0.44)
      : preset.text;

  const background =
    appearance.appearance_theme === "custom"
      ? mix(primary, "#FFFFFF", 0.95)
      : preset.background;

  const soft =
    appearance.appearance_theme === "custom"
      ? mix(primary, "#FFFFFF", 0.975)
      : preset.soft;

  const tint = mix(primary, "#FFFFFF", 0.9);
  const tint2 = mix(accent, "#FFFFFF", 0.91);

  return {
    "--app-primary": primary,
    "--primary": primary,
    "--app-font-scale":
      FONT_SCALES[appearance.appearance_font_size] || 1,
    "--app-density":
      DENSITY_SCALES[uiDensity] || DENSITY_SCALES.comfortable,
    "--app-radius-scale":
      RADIUS_SCALES[appearance.appearance_radius] || 1,

    "--app-color-0f4c45": primary,
    "--app-color-0f5132": primary,
    "--app-color-0f766e": accent,
    "--app-color-082f2a": deep,
    "--app-color-173630": text,
    "--app-color-173d2b": text,
    "--app-color-f4f7f5": background,
    "--app-color-f8fbf9": soft,
    "--app-color-f7faf8": mix(primary, "#FFFFFF", 0.965),
    "--app-color-f5faf7": mix(primary, "#FFFFFF", 0.95),
    "--app-color-edf7f1": tint,
    "--app-color-edf8f7": tint2,

    "--teacher-page-bg": background,
    "--teacher-surface": "#FFFFFF",
    "--teacher-sidebar-from": deep,
    "--teacher-sidebar-mid": primary,
    "--teacher-sidebar-to": mix(deep, primary, 0.28),
    "--teacher-gold": preset.gold || "#D1B34C",
    "--teacher-pattern-opacity":
      PATTERN_OPACITY[appearance.appearance_pattern] ?? 0.026,
  };
}

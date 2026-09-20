export const THEMES = Object.freeze({
  sadiq: "#0B5D4B", olive: "#596B37", emerald: "#087F5B",
  navy: "#27445D", burgundy: "#713B46", gold: "#9A7425",
});

export const DEFAULT_APPEARANCE = Object.freeze({
  theme: "sadiq", customColor: "#0B5D4B", fontSize: "normal",
  density: "comfortable", rounded: true, subtleOrnaments: true,
  reducedMotion: false, smoothScroll: false, rememberSettingsTab: false,
});

export const BRAND_COLORS = Object.freeze([
  "0b5d4b", "0f5132", "0f4c45", "0f766e", "173d2b", "147a5e",
  "12685b", "082f2a", "0f6848", "0f6b5d", "115e59", "0f704a",
  "0b654f", "073b32", "075544", "0a4b3e", "173d33", "21493c",
  "244b3e", "294d41", "304f44", "0f5b45", "16614c", "0b433b",
  "052b27", "173630", "173b34", "0d4f3c", "0b4d3b", "064e3b",
  "0f3d2e", "0b3f33", "0d5b46", "0d6b53", "1b6e46", "08351f",
  "edf7f1", "edf5ef", "edf8f7", "edf5f1", "f5faf7", "f8fbf9",
  "f7faf8", "f4f8f7", "f4f7f5", "f3f7f5", "e8f2ed", "f4f8f6",
]);

const STORAGE_KEY = "sadiq_appearance";
export const APPEARANCE_EVENT = "sadiq:appearance-saved";
const FONT_SIZE = { compact: 14, normal: 16, large: 18 };
const DENSITY = { compact: 0.92, comfortable: 1, spacious: 1.06 };
const has = (object, key) => Object.prototype.hasOwnProperty.call(object, key);

export function normalizeAppAppearance(input) {
  const value = input && typeof input === "object" && !Array.isArray(input) ? input : {};
  const result = { ...DEFAULT_APPEARANCE };
  if (has(THEMES, value.theme) || value.theme === "custom") result.theme = value.theme;
  if (typeof value.customColor === "string" && /^#[\da-f]{6}$/i.test(value.customColor)) result.customColor = value.customColor;
  if (has(FONT_SIZE, value.fontSize)) result.fontSize = value.fontSize;
  if (has(DENSITY, value.density)) result.density = value.density;
  for (const key of ["rounded", "subtleOrnaments", "reducedMotion", "smoothScroll", "rememberSettingsTab"]) {
    if (typeof value[key] === "boolean") result[key] = value[key];
  }
  return result;
}

export function readAppAppearance() {
  try {
    return normalizeAppAppearance(JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "null"));
  } catch { return { ...DEFAULT_APPEARANCE }; }
}

function hsl(hex) {
  const [r, g, b] = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255);
  const max = Math.max(r, g, b), min = Math.min(r, g, b), delta = max - min;
  const light = (max + min) / 2;
  let hue = 0;
  if (delta) {
    if (max === r) hue = ((g - b) / delta + (g < b ? 6 : 0)) / 6;
    else if (max === g) hue = ((b - r) / delta + 2) / 6;
    else hue = ((r - g) / delta + 4) / 6;
  }
  return [hue * 360, delta ? delta / (1 - Math.abs(2 * light - 1)) : 0, light];
}

function tone(hex, primary) {
  if (primary.toLowerCase() === THEMES.sadiq.toLowerCase()) return `#${hex}`;
  if (hex === "0b5d4b") return primary;
  const [, saturation, lightness] = hsl(`#${hex}`);
  const [hue, selectedSaturation] = hsl(primary);
  const [, baseSaturation] = hsl(THEMES.sadiq);
  return `hsl(${hue.toFixed(2)} ${(Math.min(1, saturation * selectedSaturation / baseSaturation) * 100).toFixed(2)}% ${(lightness * 100).toFixed(2)}%)`;
}

export function applyAppAppearance(input = readAppAppearance()) {
  const value = normalizeAppAppearance(input);
  if (typeof document === "undefined") return value;
  const root = document.documentElement;
  const primary = value.theme === "custom" ? value.customColor : THEMES[value.theme];
  root.style.setProperty("--app-primary", primary);
  root.style.setProperty("--primary", primary);
  root.style.setProperty("--app-font-size", `${FONT_SIZE[value.fontSize]}px`);
  root.style.setProperty("--app-font-scale", String(FONT_SIZE[value.fontSize] / 16));
  root.style.setProperty("--app-density", String(DENSITY[value.density]));
  root.style.setProperty("--app-radius-scale", value.rounded ? "1" : "0.6");
  for (const color of BRAND_COLORS) root.style.setProperty(`--app-color-${color}`, tone(color, primary));
  Object.assign(root.dataset, {
    appTheme: value.theme,
    appCorners: value.rounded ? "rounded" : "soft",
    appReducedMotion: String(value.reducedMotion),
    appSmoothScroll: String(value.smoothScroll),
  });
  return value;
}

export function saveAppAppearance(input) {
  const value = normalizeAppAppearance(input);
  // Storage failures must reach the caller; do not show a false success message.
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  applyAppAppearance(value);
  window.dispatchEvent(new CustomEvent(APPEARANCE_EVENT, { detail: value }));
  return value;
}

export function initializeAppAppearance() {
  if (typeof window === "undefined") return () => {};
  applyAppAppearance();
  const onStorage = (event) => {
    if (event.key !== STORAGE_KEY && event.key !== null) return;
    const value = applyAppAppearance(readAppAppearance());
    window.dispatchEvent(new CustomEvent(APPEARANCE_EVENT, { detail: value }));
  };
  window.addEventListener("storage", onStorage);
  return () => window.removeEventListener("storage", onStorage);
}

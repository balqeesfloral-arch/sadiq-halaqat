export function escapeHtml(value) {
  const text = String(value ?? "");

  if (typeof document === "undefined") {
    return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  const element = document.createElement("div");
  element.textContent = text;
  return element.innerHTML;
}

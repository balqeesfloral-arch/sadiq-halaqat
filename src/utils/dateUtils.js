import moment from "moment-hijri";

export function formatGregorian(date) {
  if (!date) return "-";

  return moment(date).format("YYYY/MM/DD");
}

export function formatHijri(date) {
  if (!date) return "-";

  return moment(date).format("iYYYY/iMM/iDD");
}

export function formatDualDate(date) {
  if (!date) return "-";

  return `${formatGregorian(date)} | ${formatHijri(date)}`;
}
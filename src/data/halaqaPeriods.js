export const HALAQA_PERIODS = [
  {
    value: "after_fajr",
    label: "بعد الفجر",
  },
  {
    value: "after_dhuhr",
    label: "بعد الظهر",
  },
  {
    value: "after_asr",
    label: "بعد العصر",
  },
  {
    value: "after_maghrib",
    label: "بعد المغرب",
  },
  {
    value: "after_isha",
    label: "بعد العشاء",
  },
];

export function getHalaqaPeriodLabel(value) {
  return (
    HALAQA_PERIODS.find(
      (item) => item.value === value
    )?.label || "غير محدد"
  );
}
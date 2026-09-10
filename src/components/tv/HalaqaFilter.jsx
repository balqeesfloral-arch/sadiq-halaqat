import {
  Layers3,
  RotateCcw,
} from "lucide-react";

import AppSelect from "../AppSelect";

export default function HalaqaFilter({
  value = [],
  onChange,
  options = [],
}) {
  const selectedValue =
    Array.isArray(value)
      ? value
      : [];

  return (
    <div className="tv-halaqa-filter">
      <div className="tv-halaqa-filter__select">
        <AppSelect
          value={selectedValue}
          onChange={onChange}
          options={options}
          multiple
          searchable
          placeholder="جميع الحلقات"
        />
      </div>

      <button
        type="button"
        className="tv-filter-reset"
        onClick={() => onChange([])}
        disabled={
          selectedValue.length === 0
        }
        title="عرض جميع الحلقات"
      >
        {selectedValue.length > 0 ? (
          <>
            <RotateCcw size={16} />
            جميع الحلقات
          </>
        ) : (
          <>
            <Layers3 size={16} />
            الكل
          </>
        )}
      </button>
    </div>
  );
}

import { useState, useEffect } from "react";
import moment from "moment-hijri";

export default function AppDatePicker({
  label,
  value,
  onChange,
}) {

  const [localValue, setLocalValue] =
    useState(value || "");
useEffect(() => {
  setLocalValue(value || "");
}, [value]);
  const inputStyle = {
    width: "100%",
    height: "54px",
    border: "1px solid #E2E8F0",
    borderRadius: "calc(14px * var(--app-radius-scale,1))",
    padding: "0 calc(16px * var(--app-density,1))",
    fontSize: "calc(14px * var(--app-font-scale,1))",
    background: "#FFFFFF",
    outline: "none",
    boxSizing: "border-box",
  };

  const labelStyle = {
    fontSize: "calc(13px * var(--app-font-scale,1))",
    fontWeight: "700",
    color: "#374151",
    marginBottom: "8px",
    display: "block",
  };

  function handleChange(e) {

    const gregorianDate =
      e.target.value;

    setLocalValue(gregorianDate);

    if (!gregorianDate) {
      onChange("");
      return;
    }

    onChange(gregorianDate);
  }

  const hijriPreview =
    localValue
      ? moment(localValue)
          .format("iYYYY/iMM/iDD")
      : "";

  return (
    <div>
      <label style={labelStyle}>
        {label}
      </label>

      <div
        style={{
          display: "flex",
          gap: "calc(10px * var(--app-density,1))",
          alignItems: "center",
        }}
      >

        
        <input
          type="date"
          value={localValue}
          onChange={handleChange}
          style={{
            ...inputStyle,
            flex: 1,
          }}
        />

      </div>

{hijriPreview && (
          <div
            style={{
              marginTop: "8px",
              fontSize: "calc(12px * var(--app-font-scale,1))",
              color: "var(--app-color-0f5132,#0F5132)",
              fontWeight: "600",
            }}
          >
            هجري:
            {" "}
            {hijriPreview}
          </div>
      )}
    </div>
  );
}
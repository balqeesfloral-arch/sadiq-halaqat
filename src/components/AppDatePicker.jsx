
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
    borderRadius: "14px",
    padding: "0 16px",
    fontSize: "14px",
    background: "#FFFFFF",
    outline: "none",
    boxSizing: "border-box",
  };

  const labelStyle = {
    fontSize: "13px",
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
          gap: "10px",
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
              fontSize: "12px",
              color: "#0F5132",
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
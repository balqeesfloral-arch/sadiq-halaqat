import { useState } from "react";
import { ChevronDown, Check, X } from "lucide-react";

export default function AppMultiSelect({
  label,
  options = [],
  value = [],
  onChange,
  placeholder = "اختر"
}) {

  const [open, setOpen] = useState(false);

  function toggleOption(optionValue) {

    if (value.includes(optionValue)) {

      onChange(
        value.filter(
          v => v !== optionValue
        )
      );

      return;
    }

    onChange([
      ...value,
      optionValue
    ]);
  }

  const selectedLabels =
    options
      .filter(
        option =>
          value.includes(option.value)
      )
      .map(
        option => option.label
      );

  return (
    <div
      style={{
        marginBottom: 16,
        position: "relative"
      }}
    >
      {label && (
        <label
          style={{
            display: "block",
            marginBottom: 6,
            fontWeight: 600
          }}
        >
          {label}
        </label>
      )}

      <div
        onClick={() =>
          setOpen(!open)
        }
        style={{
          minHeight: 48,
          border: "1px solid #E2E8F0",
          borderRadius: 12,
          padding: 12,
          cursor: "pointer",
          background: "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between"
        }}
      >
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 6
          }}
        >
          {selectedLabels.length === 0 && (
            <span
              style={{
                color: "#94A3B8"
              }}
            >
              {placeholder}
            </span>
          )}

          {selectedLabels.map(label => (
            <span
              key={label}
              style={{
                background: "#E6FFFA",
                color: "#0F766E",
                padding: "4px 8px",
                borderRadius: 999
              }}
            >
              {label}
            </span>
          ))}
        </div>

        <ChevronDown size={18} />
      </div>

      {open && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            right: 0,
            left: 0,
            zIndex: 999,
            background: "#fff",
            border: "1px solid #E2E8F0",
            borderRadius: 12,
            marginTop: 6,
            maxHeight: 260,
            overflowY: "auto",
            boxShadow:
              "0 10px 25px rgba(0,0,0,.08)"
          }}
        >
          {options.map(option => {

            const selected =
              value.includes(
                option.value
              );

            return (
              <div
                key={option.value}
                onClick={() =>
                  toggleOption(
                    option.value
                  )
                }
                style={{
                  padding: 12,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent:
                    "space-between",
                  borderBottom:
                    "1px solid #F1F5F9"
                }}
              >
                <span>
                  {option.label}
                </span>

                {selected && (
                  <Check
                    size={18}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
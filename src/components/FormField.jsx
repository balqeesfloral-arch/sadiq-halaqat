export default function FormField({
  label,
  value,
  onChange,
  placeholder = "",
  type = "text",
  required = false,
  disabled = false,
  icon: Icon,
}) {
  return (
    <div style={{ minWidth: 0 }}>
      <label
        style={{
          display: "block",
          marginBottom: "7px",
          color: "#465149",
          fontSize: "12px",
          fontWeight: "700",
        }}
      >
        {label}

        {required && (
          <span
            style={{
              color: "#b42318",
              marginRight: "4px",
            }}
          >
            *
          </span>
        )}
      </label>

      <div
        style={{
          position: "relative",
        }}
      >
        {Icon && (
          <Icon
            size={17}
            strokeWidth={1.7}
            style={{
              position: "absolute",
              right: "13px",
              top: "50%",
              transform:
                "translateY(-50%)",
              color: "#89918b",
              pointerEvents: "none",
            }}
          />
        )}

        <input
          type={type}
          value={value}
          onChange={(event) =>
            onChange(event.target.value)
          }
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          style={{
            width: "100%",
            height: "48px",
            padding: Icon
              ? "0 42px 0 13px"
              : "0 13px",
            boxSizing: "border-box",
            border:
              "1px solid #d9dfdb",
            borderRadius: "11px",
            outline: "none",
            background:
              disabled
                ? "#f5f6f5"
                : "#fff",
            color: "#26332c",
            fontSize: "13px",
            direction: "rtl",
          }}
        />
      </div>
    </div>
  );
}
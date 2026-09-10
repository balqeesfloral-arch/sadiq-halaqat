import { Search, X } from "lucide-react";

export default function SearchBar({
  value,
  onChange,
  placeholder = "ابحث...",
}) {
  return (
    <div
      style={{
        position: "relative",
        width: "100%",
      }}
    >
      <Search
        size={19}
        strokeWidth={1.8}
        style={{
          position: "absolute",
          right: "14px",
          top: "50%",
          transform: "translateY(-50%)",
          color: "#89918b",
          pointerEvents: "none",
        }}
      />

      <input
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        placeholder={placeholder}
        style={{
          width: "100%",
          height: "48px",
          padding: "0 44px 0 42px",
          boxSizing: "border-box",
          border: "1px solid #d9dfdb",
          borderRadius: "11px",
          outline: "none",
          background: "#fff",
          color: "#26332c",
          fontSize: "13px",
          direction: "rtl",
        }}
      />

      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          style={{
            position: "absolute",
            left: "8px",
            top: "50%",
            transform: "translateY(-50%)",
            width: "32px",
            height: "32px",
            border: "none",
            borderRadius: "8px",
            background: "#f1f3f1",
            color: "#707872",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <X size={15} />
        </button>
      )}
    </div>
  );
}
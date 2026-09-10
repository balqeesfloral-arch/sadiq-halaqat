import {
  ChevronDown,
  Check,
  Search,
  X,
} from "lucide-react";

import {
  useState,
  useRef,
  useEffect,
} from "react";

export default function AppSelect({
  label,
  value,
  onChange,
  options = [],
  placeholder = "اختر",
  multiple = false,
  searchable = true,
  disabled = false,
}) {
  const [open, setOpen] =
    useState(false);

  const [search, setSearch] =
    useState("");

  const ref = useRef(null);

  useEffect(() => {
    function handleClick(e) {
      if (
        ref.current &&
        !ref.current.contains(e.target)
      ) {
        setOpen(false);
      }
    }

    document.addEventListener(
      "mousedown",
      handleClick
    );

    return () =>
      document.removeEventListener(
        "mousedown",
        handleClick
      );
  }, []);

  const filteredOptions =
    options.filter((option) =>
      option.label
        ?.toLowerCase()
        .includes(
          search.toLowerCase()
        )
    );

  function isSelected(id) {
    if (multiple) {
      return (
        value?.includes(id)
      );
    }

    return value === id;
  }

  function selectItem(id) {
    if (multiple) {
      const exists =
        value.includes(id);

      if (exists) {
        onChange(
          value.filter(
            (x) => x !== id
          )
        );
      } else {
        onChange([
          ...value,
          id,
        ]);
      }

      return;
    }

    onChange(id);
    setOpen(false);
  }

  function removeItem(id) {
    onChange(
      value.filter(
        (x) => x !== id
      )
    );
  }

  const selectedLabels =
    multiple
      ? options.filter((x) =>
          value.includes(
            x.value
          )
        )
      : options.find(
          (x) =>
            x.value === value
        );

  return (
  <div
    style={{
      width: "100%",
      marginBottom: 15,
    }}
  >

    {label && (
      <div
        style={{
          marginBottom: 8,
          fontWeight: 600,
          color: "#0F172A",
          fontSize: 14,
        }}
      >
        {label}
      </div>
    )}

    <div
      ref={ref}
      style={{
        position: "relative",
        width: "100%",
      }}
    >
      <div
        onClick={() =>
          !disabled &&
          setOpen(!open)
        }
        style={{
          minHeight: 54,
          border:
            "1px solid #E2E8F0",
          borderRadius: 14,
          background:
            "#fff",
          cursor:
            disabled
              ? "not-allowed"
              : "pointer",
          padding: 10,
          display: "flex",
          alignItems:
            "center",
          justifyContent:
            "space-between",
          gap: 10,
        }}
      >
        <div
          style={{
            flex: 1,
            display: "flex",
            flexWrap:
              "wrap",
            gap: 6,
          }}
        >
          {!multiple &&
            !selectedLabels && (
              <span
                style={{
                  color:
                    "#94A3B8",
                }}
              >
                {
                  placeholder
                }
              </span>
            )}

          {!multiple &&
            selectedLabels && (
              <span>
                {
                  selectedLabels.label
                }
              </span>
            )}

          {multiple &&
            value.length ===
              0 && (
              <span
                style={{
                  color:
                    "#94A3B8",
                }}
              >
                {
                  placeholder
                }
              </span>
            )}

          {multiple &&
            selectedLabels.map(
              (item) => (
                <div
                  key={
                    item.value
                  }
                  style={{
                    background:
                      "#ECFDF5",
                    color:
                      "#065F46",
                    borderRadius:
                      999,
                    padding:
                      "4px 10px",
                    display:
                      "flex",
                    alignItems:
                      "center",
                    gap: 4,
                  }}
                >
                  {
                    item.label
                  }

                  <X
                    size={14}
                    onClick={(
                      e
                    ) => {
                      e.stopPropagation();

                      removeItem(
                        item.value
                      );
                    }}
                  />
                </div>
              )
            )}
        </div>

        <ChevronDown
          size={18}
        />
      </div>

      {open && (
        <div
          style={{
            position:
              "absolute",
            top:
              "calc(100% + 8px)",
            left: 0,
            right: 0,
            background:
              "#fff",
            border:
              "1px solid #E2E8F0",
            borderRadius: 16,
            boxShadow:
              "0 10px 30px rgba(0,0,0,.08)",
            zIndex: 999,
            overflow:
              "hidden",
          }}
        >
          {searchable && (
            <div
              style={{
                padding: 10,
                borderBottom:
                  "1px solid #F1F5F9",
              }}
            >
              <div
                style={{
                  display:
                    "flex",
                  alignItems:
                    "center",
                  gap: 8,
                  border:
                    "1px solid #E2E8F0",
                  borderRadius:
                    12,
                  padding:
                    "8px 12px",
                }}
              >
                <Search
                  size={16}
                />

                <input
                  value={
                    search
                  }
                  onChange={(
                    e
                  ) =>
                    setSearch(
                      e.target
                        .value
                    )
                  }
                  placeholder="بحث..."
                  style={{
                    border:
                      "none",
                    outline:
                      "none",
                    width:
                      "100%",
                  }}
                />
              </div>
            </div>
          )}

          <div
            style={{
              maxHeight:
                260,
              overflowY:
                "auto",
            }}
          >
            {filteredOptions.map(
              (option) => (
                <div
                  key={
                    option.value
                  }
                  onClick={() =>
                    selectItem(
                      option.value
                    )
                  }
                  style={{
                    padding:
                      "12px 14px",
                    display:
                      "flex",
                    alignItems:
                      "center",
                    justifyContent:
                      "space-between",
                    cursor:
                      "pointer",
                  }}
                >
                  <span>
                    {
                      option.label
                    }
                  </span>

                  {isSelected(
                    option.value
                  ) && (
                    <Check
                      size={
                        18
                      }
                    />
                  )}
                </div>
              )
            )}
          </div>
        </div>
            )}
    </div>

  </div>
);
}
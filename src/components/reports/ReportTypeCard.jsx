import { theme } from "../../styles/theme";

export default function ReportTypeCard({
  report,
  selected,
  onSelect,
}) {
  const Icon = report?.icon;

  return (
    <div
      onClick={() =>
        report?.id &&
        onSelect(report.id)
      }
      style={{
        cursor: "pointer",

        background: selected
          ? theme.colors.primary
          : theme.colors.card,

        color: selected
          ? "#fff"
          : theme.colors.text,

        borderRadius:
          theme.radius.lg,

        padding: "24px",

        border: selected
          ? `2px solid ${theme.colors.primary}`
          : `1px solid ${theme.colors.border}`,

        boxShadow:
          theme.shadows.card,

        transition:
          "all .25s ease",

        display: "flex",
        flexDirection: "column",

        gap: "14px",

        minHeight: "140px",

        justifyContent: "center",
      }}
    >
      <div
        style={{
          width: "56px",
          height: "56px",

          borderRadius: "16px",

          background: selected
            ? "rgba(255,255,255,0.15)"
            : "#eef7f1",

          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {Icon ? (
          <Icon size={28} />
        ) : (
          <span
            style={{
              fontSize: "24px",
            }}
          >
            📊
          </span>
        )}
      </div>

      <div
        style={{
          fontWeight: "800",
          fontSize: "16px",
        }}
      >
        {report?.title ||
          "تقرير"}
      </div>

      {report?.description && (
        <div
          style={{
            fontSize: "13px",
            opacity: 0.8,
            lineHeight: 1.7,
          }}
        >
          {report.description}
        </div>
      )}
    </div>
  );
}
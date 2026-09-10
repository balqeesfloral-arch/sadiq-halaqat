import { theme } from "../styles/theme";

export default function AppTable({
  columns = [],
  data = [],
}) {
  return (
    <div
      style={{
        overflowX: "auto",
      }}
    >
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
        }}
      >
        <thead>
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                style={{
                  padding: "16px",
                  textAlign: "right",
                  background:
                    theme.colors.surfaceAlt,
                  borderBottom:
                    `1px solid ${theme.colors.border}`,
                }}
              >
                {column.title}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {data.map((row, index) => (
            <tr key={index}>
              {columns.map((column) => (
                <td
                  key={column.key}
                  style={{
                    padding: "14px 16px",
                    borderBottom:
                      `1px solid ${theme.colors.border}`,
                  }}
                >
                  {row[column.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
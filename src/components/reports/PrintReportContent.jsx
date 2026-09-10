export default function PrintReportContent({
  selectedReport,
  reportData = [],
}) {

  if (!reportData?.length) {
    return (
      <div
        style={{
          textAlign: "center",
          padding: "40px",
        }}
      >
        لا توجد بيانات
      </div>
    );
  }

  const columns =
    Object.keys(reportData[0]);

  return (

    <div>

      {/* احصائيات */}

      <div
        style={{
          display: "flex",
          gap: "16px",
          marginBottom: "24px",
        }}
      >

        <div
          style={{
            flex: 1,
            border:
              "1px solid #D6C28A",
            borderRadius: "14px",
            padding: "18px",
            textAlign: "center",
            background:
              "#FAFAF8",
          }}
        >
          <div
            style={{
              fontSize: "34px",
              fontWeight: "900",
              color: "#0F5132",
            }}
          >
            {reportData.length}
          </div>

          <div>
            إجمالي السجلات
          </div>
        </div>

      </div>

      {/* الجدول */}

      <table
        style={{
          width: "100%",
          borderCollapse:
            "collapse",
        }}
      >

        <thead>

          <tr>

            {columns.map(
              col => (

                <th
                  key={col}
                  style={{
                    background:
                      "#0F5132",

                    color: "#fff",

                    border:
                      "1px solid #D6C28A",

                    padding:
                      "10px",

                    fontSize:
                      "13px",
                  }}
                >
                  {col}
                </th>

              )
            )}

          </tr>

        </thead>

        <tbody>

          {reportData.map(
            (
              row,
              index
            ) => (

              <tr
                key={index}
              >

                {columns.map(
                  col => (

                    <td
                      key={col}
                      style={{
                        border:
                          "1px solid #E5E7EB",

                        padding:
                          "8px",

                        textAlign:
                          "center",

                        fontSize:
                          "12px",
                      }}
                    >

                      {typeof row[
                        col
                      ] ===
                      "object"
                        ? ""
                        : String(
                            row[
                              col
                            ] ?? ""
                          )}

                    </td>

                  )
                )}

              </tr>

            )
          )}

        </tbody>

      </table>

    </div>

  );
}
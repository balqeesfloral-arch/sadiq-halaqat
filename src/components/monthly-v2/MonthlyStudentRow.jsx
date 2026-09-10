export default function MonthlyStudentRow({
  row,
  onChange
}) {

  const completed =
    row.memorization_completed &&
    row.revision_completed;

const progress =
  (row.memorization_completed ? 50 : 0) +
  (row.revision_completed ? 50 : 0);

const status =
  progress === 100
    ? "مكتمل"
    : progress > 0
    ? "جزئي"
    : "متعثر";

  return (

    <tr
      style={{
        background:
          completed
            ? "#F0FDF4"
            : "#FFFFFF",
        transition:"0.2s"
      }}
    >

      <td
        style={{
          padding:"16px",
          borderBottom:"1px solid #F1F5F9",
          fontWeight:"800",
          color:"#0F172A"
        }}
      >
        {row.student_name}
      </td>

      <td
        style={{
          padding:"12px",
          borderBottom:"1px solid #F1F5F9"
        }}
      >
        <input
          type="number"
          value={row.memorization_pages || ""}
          onChange={(e)=>
            onChange(
              row.id,
              "memorization_pages",
              e.target.value
            )
          }
          style={{
            width:"90px",
            height:"42px",
            border:"1px solid #E2E8F0",
            borderRadius:"12px",
            textAlign:"center"
          }}
        />
      </td>

      <td
        style={{
          textAlign:"center",
          borderBottom:"1px solid #F1F5F9"
        }}
      >
        <button
  onClick={() =>
    onChange(
      row.id,
      "memorization_completed",
      !row.memorization_completed
    )
  }
  style={{
    width:"40px",
    height:"40px",
    borderRadius:"50%",
    border:"none",
    cursor:"pointer",
    background:
      row.memorization_completed
        ? "#16A34A"
        : "#E2E8F0",
    color:"#fff",
    fontWeight:"900"
  }}
>
  ✓
</button>
      </td>

      <td
        style={{
          padding:"12px",
          borderBottom:"1px solid #F1F5F9"
        }}
      >
        <input
          type="number"
          value={row.revision_pages || ""}
          onChange={(e)=>
            onChange(
              row.id,
              "revision_pages",
              e.target.value
            )
          }
          style={{
            width:"90px",
            height:"42px",
            border:"1px solid #E2E8F0",
            borderRadius:"12px",
            textAlign:"center"
          }}
        />
      </td>

      <td
        style={{
          textAlign:"center",
          borderBottom:"1px solid #F1F5F9"
        }}
      >
      <button
  onClick={() =>
    onChange(
      row.id,
      "revision_completed",
      !row.revision_completed
    )
  }
  style={{
    width:"40px",
    height:"40px",
    borderRadius:"50%",
    border:"none",
    cursor:"pointer",
    background:
      row.revision_completed
        ? "#16A34A"
        : "#E2E8F0",
    color:"#fff",
    fontWeight:"900"
  }}
>
  ✓
</button>
      </td>

      <td
        style={{
          padding:"12px",
          borderBottom:"1px solid #F1F5F9"
        }}
      >
        <input
  value={row.delay_reason || ""}
  onChange={(e)=>
    onChange(
      row.id,
      "delay_reason",
      e.target.value
    )
  }
  placeholder="اكتب سبب التعثر..."
  style={{
    width:"100%",
    height:"44px",
    border:"1px solid #E2E8F0",
    borderRadius:"14px",
    padding:"0 14px",
    background:"#F8FAFC",
    color:"#0F172A",
    fontSize:"14px",
    fontWeight:"600",
    outline:"none",
    transition:"all .2s"
  }}
/>
      </td>

      <td
        style={{
          padding:"12px",
          borderBottom:"1px solid #F1F5F9"
        }}
      >
        <input
          value={row.notes || ""}
          onChange={(e)=>
            onChange(
              row.id,
              "notes",
              e.target.value
            )
          }
          placeholder="ملاحظات"
          style={{
            width:"100%",
            height:"42px",
            border:"1px solid #E2E8F0",
            borderRadius:"12px",
            padding:"0 12px"
          }}
        />
      </td>

<td>
  <div
    style={{
      background:
        progress === 100
          ? "#DCFCE7"
          : progress > 0
          ? "#FEF3C7"
          : "#FEE2E2",

      color:
        progress === 100
          ? "#166534"
          : progress > 0
          ? "#92400E"
          : "#B91C1C",

      padding:"8px 16px",
      borderRadius:"999px",
      fontWeight:"800",
      display:"inline-block"
    }}
  >
    {status}
  </div>
</td>

    </tr>
  );

}
import MonthlyStudentRow
from "./MonthlyStudentRow";

export default function MonthlyGrid({

  rows,
  onChange

}) {


  return (

    <div
      style={{
        background:"#FFFFFF",
        borderRadius:"calc(24px * var(--app-radius-scale,1))",
        border:"1px solid #E2E8F0",
        overflow:"hidden",
        boxShadow:
          "0 10px 35px rgba(15,23,42,.05)"
      }}
    >

      <div
        style={{
          overflowX:"auto"
        }}
      >

        <table
          style={{
            width:"100%",
            borderCollapse:"collapse",
            minWidth:"1000px"
          }}
        >

          <thead>

            <tr
              style={{
                background:"#F8FAFC"
              }}
            >
<th style={thStyle}>
  الطالب
</th>

<th style={thStyle}>
  الحفظ
</th>

<th style={thStyle}>
  أنجز 
</th>

<th style={thStyle}>
  المراجعة
</th>


<th style={thStyle}>
  أنجز
</th>



<th style={thStyle}>
  سبب التعثر
</th>

<th style={thStyle}>
  ملاحظات
</th>

<th style={thStyle}>
  الإنجاز
</th>

            </tr>

          </thead>

          <tbody>

            {rows.map(row=>(

              <MonthlyStudentRow
                key={row.id}
                row={row}
                onChange={onChange}
              />

            ))}

          </tbody>

        </table>

      </div>

    </div>

  );

}

const thStyle = {

  padding:"calc(18px * var(--app-density,1))",

  textAlign:"center",

  color:"#334155",

  fontWeight:"900",

  fontSize:"calc(14px * var(--app-font-scale,1))",

  borderBottom:
    "1px solid #E2E8F0",

  whiteSpace:"nowrap"

};
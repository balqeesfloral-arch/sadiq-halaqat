import {
  Save,
  BadgeCheck,
  Printer,
  FileSpreadsheet,
  FileText
} from "lucide-react";

export default function MonthlyHeader({
  onSave,
  onApprove,
  onExportExcel,
  onExportPdf,
  onPrint,
  selectedMonth,
  loading
}){

let monthText = "";

if (selectedMonth) {

  const date =
    new Date(
      `${selectedMonth}-01`
    );

  const gregorian =
    date.toLocaleDateString(
      "ar-SA",
      {
        year: "numeric",
        month: "long"
      }
    );

  const hijri =
    new Intl.DateTimeFormat(
      "ar-SA-u-ca-islamic",
      {
        year: "numeric",
        month: "long"
      }
    ).format(date);

  monthText =
    `${gregorian} • ${hijri}`;
}
  return (
    <div
      style={{
        display:"flex",
        justifyContent:"space-between",
        alignItems:"center",
        marginBottom:"28px",
        gap:"20px",
        flexWrap:"wrap"
      }}
    >

      <div>
        <h1
          style={{
            margin:0,
            fontSize:"34px",
            fontWeight:"900",
            color:"#0F172A"
          }}
        >
          الإنجاز الشهري
        </h1>

        <div
          style={{
            color:"#64748B",
            marginTop:"8px",
            fontSize:"15px"
          }}
        >
          متابعة حفظ ومراجعة طلاب الحلقة
        </div>
{
  monthText &&
  (
    <div
      style={{
        marginTop:"10px",
        color:"#0F766E",
        fontWeight:"700",
        fontSize:"14px"
      }}
    >
      {monthText}
    </div>
  )
}
      </div>

     <div
  style={{
    display:"flex",
    gap:"12px",
    flexWrap:"wrap"
  }}
>

  <button
    onClick={onExportExcel}
    style={{
      border:"none",
      background:"#EFF6FF",
      color:"#1D4ED8",
      padding:"14px 18px",
      borderRadius:"14px",
      fontWeight:"800",
      cursor:"pointer",
      display:"flex",
      alignItems:"center",
      gap:"8px"
    }}
  >
    <FileSpreadsheet size={18}/>
    Excel
  </button>



  <button
    onClick={onPrint}
    style={{
      border:"none",
      background:"#F8FAFC",
      color:"#334155",
      padding:"14px 18px",
      borderRadius:"14px",
      fontWeight:"800",
      cursor:"pointer",
      display:"flex",
      alignItems:"center",
      gap:"8px"
    }}
  >
    <Printer size={18}/>
    طباعة
  </button>

  <button
    onClick={onApprove}
    style={{
      border:"none",
      background:"#ECFDF5",
      color:"#065F46",
      padding:"14px 20px",
      borderRadius:"14px",
      fontWeight:"800",
      cursor:"pointer",
      display:"flex",
      alignItems:"center",
      gap:"8px"
    }}
  >
    <BadgeCheck size={18}/>
    اعتماد
  </button>

  <button
    onClick={onSave}
    disabled={loading}
    style={{
      border:"none",
      background:
        "linear-gradient(135deg,#0F766E,#115E59)",
      color:"#fff",
      padding:"14px 22px",
      borderRadius:"14px",
      fontWeight:"900",
      cursor:"pointer",
      display:"flex",
      alignItems:"center",
      gap:"8px",
      boxShadow:
        "0 10px 30px rgba(15,118,110,.25)"
    }}
  >
    <Save size={18}/>
    حفظ
  </button>

</div>

    </div>
  );
}
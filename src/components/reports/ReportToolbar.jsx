import {
  Printer,
  FileText,
  FileSpreadsheet,
  Database,
  Copy,
} from "lucide-react";

import { showToast }
from "../../components/Toast";

export default function ReportToolbar({
  onPrint,
  onCopy,
  onExcel,
  onCSV,
  onPDF,
}) {
  const btnStyle = {
    display: "flex",
    alignItems: "center",
    gap: "8px",

    background: "#ffffff",

    border: "1px solid #E5E7EB",

    borderRadius: "14px",

    padding: "12px 18px",

    fontSize: "14px",

    fontWeight: "600",

    color: "#1F2937",

    cursor: "pointer",

    transition: "0.2s",

    boxShadow:
      "0 4px 12px rgba(0,0,0,0.04)",
  };



  return (
    <div
      style={{
        display: "flex",

        flexWrap: "wrap",

        gap: "12px",

        marginTop: "20px",

        marginBottom: "20px",
      }}
    >
     <button
  style={btnStyle}
  onClick={onPrint}
>
  <Printer size={18} />
  طباعة
</button>

     <button
  style={btnStyle}
  onClick={onPDF}
>
  <FileText size={18} />
  PDF
</button>

<button
  style={btnStyle}
  onClick={onExcel}
>
  <FileSpreadsheet size={18} />
  Excel
</button>

      <button
  style={btnStyle}
  onClick={onCSV}
>
  <Database size={18} />
  CSV
</button>

<button
  style={btnStyle}
  onClick={onCopy}
>
  <Copy size={18} />
  نسخ
</button>
    </div>
  );
}
import { useState, useEffect } from "react";

import {
  REPORT_TYPES,
} from "../../reports/reportDefinitions";

import { Icons } from "../../styles/icons";

import { supabase } from "../../lib/supabase";

import { showToast }
from "../../components/Toast";

import AppPage from "../../components/AppPage";
import AppSection from "../../components/AppSection";
import AppStatsGrid from "../../components/AppStatsGrid";

import PageHeader from "../../components/PageHeader";
import AppCard from "../../components/AppCard";
import AppButton from "../../components/AppButton";
import StatCard from "../../components/StatCard";

import ReportTypeCard from "../../components/reports/ReportTypeCard";
import ReportFilters from "../../components/reports/ReportFilters";
import ReportToolbar from "../../components/reports/ReportToolbar";
import ReportViewer from "../../components/reports/ReportViewer";

import PrintReport
from "../../components/reports/PrintReport";

import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

import html2canvas from "html2canvas";
import jsPDF from "jspdf";

import PrintHeader from "../../components/reports/PrintHeader";
import PrintFooter from "../../components/reports/PrintFooter";

import PrintReportContent
from "../../components/reports/PrintReportContent";

export default function Reports() {
  const [
    selectedReport,
    setSelectedReport,
  ] = useState("");

 const [reportData, setReportData] =
  useState([]);

const [mosques, setMosques] = useState([]);
const [halaqat, setHalaqat] = useState([]);
const [teachers, setTeachers] = useState([]);
const [students, setStudents] = useState([]);

const [filters, setFilters] =
  useState({
    dateType: "hijri",
    fromDate: "",
    toDate: "",
    mosqueId: "",
    halaqaId: "",
    teacherId: "",
    studentId: "",
  });

useEffect(() => {
  loadFilters();
}, []);

async function loadFilters() {

  const [
    mosquesRes,
    halaqatRes,
    teachersRes,
    studentsRes,
  ] = await Promise.all([

    supabase
      .from("mosques")
      .select("id,name"),

    supabase
      .from("halaqat")
      .select("id,name"),

    supabase
      .from("profiles")
      .select("id,full_name")
      .eq("role","teacher"),

    supabase
      .from("profiles")
      .select("id,full_name")
      .eq("role","student"),

  ]);

  setMosques(
    mosquesRes.data || []
  );

  setHalaqat(
    halaqatRes.data || []
  );

  setTeachers(
    teachersRes.data || []
  );

  setStudents(
    studentsRes.data || []
  );
}

  async function handleGenerateReport() {

  if (!selectedReport) {
    alert("اختر تقريراً أولاً");
    return;
  }

  if (selectedReport === "attendance") {

  let query =
    supabase
      .from("attendance")
      .select(`
        *,
        profiles!attendance_student_id_fkey(
          full_name
        ),
        halaqat(
          name
        )
      `);

  if (filters.studentId) {
    query = query.eq(
      "student_id",
      filters.studentId
    );
  }

  if (filters.halaqaId) {
    query = query.eq(
      "halaqa_id",
      filters.halaqaId
    );
  }

  if (filters.fromDate) {
    query = query.gte(
      "attendance_date",
      filters.fromDate
    );
  }

  if (filters.toDate) {
    query = query.lte(
      "attendance_date",
      filters.toDate
    );
  }

  const { data, error } =
    await query.order(
      "attendance_date",
      { ascending: false }
    );

console.log("filters", filters);
console.log("data", data);

  if (error) {
    console.error(error);
    return;
  }

console.log("selectedReport", selectedReport);
console.log("reportData", data);

  setReportData(data || []);
}

if (selectedReport === "recitations") {

  let query =
    supabase
      .from("recitations")
      .select(`
        *,
        profiles!recitations_student_id_fkey(
          full_name
        ),
        halaqat!recitations_halaqa_id_fkey(
          name
        )
      `);

  if (filters.studentId) {
    query = query.eq(
      "student_id",
      filters.studentId
    );
  }

  if (filters.halaqaId) {
    query = query.eq(
      "halaqa_id",
      filters.halaqaId
    );
  }

  if (filters.fromDate) {
    query = query.gte(
      "recitation_date",
      filters.fromDate
    );
  }

  if (filters.toDate) {
    query = query.lte(
      "recitation_date",
      filters.toDate
    );
  }

  const { data, error } =
    await query.order(
      "recitation_date",
      { ascending: false }
    );

console.log("filters", filters);
console.log("data", data);

  if (error) {
    console.error(error);
    return;
  }

  setReportData(data || []);
}



if (selectedReport === "students") {

  let query =
    supabase
      .from("profiles")
      .select(`
        id,
        full_name,
        role
      `)
      .eq("role", "student");

  if (filters.studentId) {
    query = query.eq(
      "id",
      filters.studentId
    );
  }

  const { data, error } =
    await query.order(
      "full_name",
      { ascending: true }
    );

  if (error) {
    console.error(error);
    return;
  }

  setReportData(data || []);
}
if (selectedReport === "teachers") {

  let query = supabase
    .from("profiles")
    .select(`
      id,
      full_name,
      role,
      created_at,
      teacher_halaqat(
        halaqa_id,
        halaqat(
          id,
          name,
          mosque_id
        )
      )
    `)
    .eq("role", "teacher");

  if (filters.fromDate) {
    query = query.gte(
      "created_at",
      filters.fromDate
    );
  }

  if (filters.toDate) {
    query = query.lte(
      "created_at",
      filters.toDate
    );
  }

  const { data, error } =
    await query;

  if (error) {
    console.error(error);
    return;
  }

  let filteredData =
    data || [];

  if (filters.teacherId) {
    filteredData =
      filteredData.filter(
        (t) =>
          String(t.id) ===
          String(filters.teacherId)
      );
  }

  if (filters.halaqaId) {
    filteredData =
      filteredData.filter((t) =>
        t.teacher_halaqat?.some(
          (th) =>
            String(
              th.halaqa_id
            ) ===
            String(
              filters.halaqaId
            )
        )
      );
  }

  if (filters.mosqueId) {
    filteredData =
      filteredData.filter((t) =>
        t.teacher_halaqat?.some(
          (th) =>
            String(
              th.halaqat
                ?.mosque_id
            ) ===
            String(
              filters.mosqueId
            )
        )
      );
  }

  setReportData(filteredData);
}
if (selectedReport === "halaqat") {

  let query = supabase
    .from("halaqat")
    .select(`
      id,
      name,
      capacity,
      status,
      description,
      created_at,

      mosques(
        id,
        name
      ),

      teacher_halaqat(
        teacher_id,
        role,
        profiles(
          id,
          full_name
        )
      ),

      student_halaqat(
        student_id
      )
    `);

  // فلتر المسجد
  if (filters.mosqueId) {
    query = query.eq(
      "mosque_id",
      filters.mosqueId
    );
  }

  const { data, error } =
    await query;

  if (error) {
    console.error(error);
    return;
  }

  let filteredData = data || [];

  // فلتر الحلقة
  if (filters.halaqaId) {
    filteredData =
      filteredData.filter(
        h =>
          String(h.id) ===
          String(filters.halaqaId)
      );
  }

  // فلتر المعلم
  if (filters.teacherId) {
    filteredData =
      filteredData.filter(
        h =>
          h.teacher_halaqat?.some(
            t =>
              String(
                t.teacher_id
              ) ===
              String(
                filters.teacherId
              )
          )
      );
  }

  // فلتر الطالب
  if (filters.studentId) {
    filteredData =
      filteredData.filter(
        h =>
          h.student_halaqat?.some(
            s =>
              String(
                s.student_id
              ) ===
              String(
                filters.studentId
              )
          )
      );
  }

  const formattedData =
    filteredData.map(h => ({

      ...h,

      main_teacher:
        h.teacher_halaqat?.find(
          t => t.role === "main"
        )?.profiles || null,

      assistant_teacher:
        h.teacher_halaqat?.find(
          t =>
            t.role ===
            "assistant"
        )?.profiles || null,

      students_count:
        h.student_halaqat
          ?.length || 0,

    }));

  setReportData(
    formattedData
  );
}
if (selectedReport === "monthly-progress") {

  let query = supabase
    .from("monthly_progress")
    .select(`
      *,
      profiles!monthly_progress_student_id_fkey(
        id,
        full_name
      ),
      halaqat(
        id,
        name,
        mosque_id
      )
    `)
    .order(
      "progress_month",
      { ascending:false }
    );

  // فلتر الحلقة
  if (filters.halaqaId) {
    query = query.eq(
      "halaqa_id",
      filters.halaqaId
    );
  }

  // فلتر الطالب
  if (filters.studentId) {
    query = query.eq(
      "student_id",
      filters.studentId
    );
  }

  // فلتر التاريخ
  if (filters.fromDate) {
    query = query.gte(
      "progress_month",
      filters.fromDate
    );
  }

  if (filters.toDate) {
    query = query.lte(
      "progress_month",
      filters.toDate
    );
  }

  const { data, error } =
    await query;

console.log("filters", filters);
console.log("data", data);

  if (error) {
    console.error(error);
    return;
  }

  let filteredData =
    data || [];

  // فلتر المسجد
  if (filters.mosqueId) {
    filteredData =
      filteredData.filter(
        row =>
          String(
            row.halaqat?.mosque_id
          ) ===
          String(
            filters.mosqueId
          )
      );
  }

  // فلتر المعلم
  if (filters.teacherId) {

    const {
      data: teacherHalaqat
    } = await supabase
      .from("teacher_halaqat")
      .select("halaqa_id")
      .eq(
        "teacher_id",
        filters.teacherId
      );

    const halaqaIds =
      teacherHalaqat?.map(
        x => x.halaqa_id
      ) || [];

    filteredData =
      filteredData.filter(
        row =>
          halaqaIds.includes(
            row.halaqa_id
          )
      );
  }

  setReportData(
    filteredData
  );
}
if (selectedReport === "full") {

  let mosquesQuery =
    supabase
      .from("mosques")
      .select("id");

  let halaqatQuery =
    supabase
      .from("halaqat")
      .select(`
        id,
        mosque_id
      `);

  let studentsQuery =
    supabase
      .from("profiles")
      .select("id")
      .eq("role","student");

  let teachersQuery =
    supabase
      .from("profiles")
      .select("id")
      .eq("role","teacher");

  let recitationsQuery =
    supabase
      .from("recitations")
      .select(`
        id,
        halaqa_id,
        student_id,
        recitation_date
      `);

  let attendanceQuery =
    supabase
      .from("attendance")
      .select(`
        id,
        halaqa_id,
        student_id,
        attendance_date
      `);

  if (filters.studentId) {

    recitationsQuery =
      recitationsQuery.eq(
        "student_id",
        filters.studentId
      );

    attendanceQuery =
      attendanceQuery.eq(
        "student_id",
        filters.studentId
      );
  }

  if (filters.halaqaId) {

    recitationsQuery =
      recitationsQuery.eq(
        "halaqa_id",
        filters.halaqaId
      );

    attendanceQuery =
      attendanceQuery.eq(
        "halaqa_id",
        filters.halaqaId
      );

    halaqatQuery =
      halaqatQuery.eq(
        "id",
        filters.halaqaId
      );
  }

  if (filters.fromDate) {

    recitationsQuery =
      recitationsQuery.gte(
        "recitation_date",
        filters.fromDate
      );

    attendanceQuery =
      attendanceQuery.gte(
        "attendance_date",
        filters.fromDate
      );
  }

  if (filters.toDate) {

    recitationsQuery =
      recitationsQuery.lte(
        "recitation_date",
        filters.toDate
      );

    attendanceQuery =
      attendanceQuery.lte(
        "attendance_date",
        filters.toDate
      );
  }

  const [
    mosquesRes,
    halaqatRes,
    studentsRes,
    teachersRes,
    recitationsRes,
    attendanceRes,
  ] = await Promise.all([

    mosquesQuery,
    halaqatQuery,
    studentsQuery,
    teachersQuery,
    recitationsQuery,
    attendanceQuery,

  ]);

  let halaqatData =
    halaqatRes.data || [];

  if (filters.mosqueId) {

    halaqatData =
      halaqatData.filter(
        h =>
          String(h.mosque_id) ===
          String(filters.mosqueId)
      );
  }

  setReportData({

    mosques:
      mosquesRes.data?.length || 0,

    halaqat:
      halaqatData.length || 0,

    students:
      studentsRes.data?.length || 0,

    teachers:
      teachersRes.data?.length || 0,

    recitations:
      recitationsRes.data?.length || 0,

    attendance:
      attendanceRes.data?.length || 0,

  });
}

}

function buildPrintTable() {

  if (selectedReport === "recitations") {

    return `

      <table>

        <thead>

          <tr>

            <th>الطالب</th>

            <th>الحلقة</th>

            <th>التاريخ</th>

            <th>الدرس</th>

            <th>تقييم الدرس</th>

            <th>المراجعة</th>

            <th>تقييم المراجعة</th>

            <th>الدرس القادم</th>

          </tr>

        </thead>

        <tbody>

          ${reportData.map(row => `

            <tr>

              <td>
                ${row.profiles?.full_name || "-"}
              </td>

              <td>
                ${row.halaqat?.name || "-"}
              </td>

              <td>
                ${row.recitation_date || "-"}
              </td>

              <td>
                ${row.from_surah || ""}
                ${row.from_ayah || ""}
                -
                ${row.to_ayah || ""}
              </td>

              <td>
                ${row.lesson_evaluation || "-"}
              </td>

              <td>
                ${row.review_surah || ""}
                ${row.review_from_ayah || ""}
                -
                ${row.review_to_ayah || ""}
              </td>

              <td>
                ${row.review_evaluation || "-"}
              </td>

              <td>
                ${row.next_surah || ""}
                ${row.next_from_ayah || ""}
                -
                ${row.next_to_ayah || ""}
              </td>

            </tr>

          `).join("")}

        </tbody>

      </table>

    `;
  }

  return `
    <div>
      لا يوجد قالب طباعة لهذا التقرير
    </div>
  `;
}

function generatePrintHtml() {

  return `
<!DOCTYPE html>

<html dir="rtl">

<head>

<meta charset="utf-8"/>

<title>الصديق</title>

<style>

@page{
  size:A4 landscape;
  margin:10mm;
}

body{
  direction:rtl;
  font-family:
    Tahoma,
    Arial;
  margin:0;
  padding:20px;
  color:#1F2937;
}

.header{
  text-align:center;
  margin-bottom:30px;
}

.logo{
  width:90px;
}

.title{
  font-size:36px;
  color:#0F5132;
  font-weight:900;
}

.subtitle{
  color:#64748B;
}

table{
  width:100%;
  border-collapse:collapse;
}

th{
  background:#0F5132;
  color:white;
}

th,td{
  border:1px solid #D1D5DB;
  padding:8px;
  text-align:center;
}

.footer{
  margin-top:30px;
  text-align:center;
  color:#6B7280;
}

.watermark{
  position:fixed;
  top:50%;
  left:50%;
  transform:translate(-50%,-50%);
  width:450px;
  opacity:.04;
  z-index:0;
}

.content{
  position:relative;
  z-index:2;
}

.gold-line{
  height:3px;
  background:
  linear-gradient(
    to left,
    #D6C28A,
    #0F5132,
    #D6C28A
  );
  margin:20px 0;
}

.corner{
  position:fixed;
  width:110px;
  opacity:.08;
}

.c1{
  top:15px;
  right:15px;
}

.c2{
  top:15px;
  left:15px;
}

.c3{
  bottom:15px;
  right:15px;
}

.c4{
  bottom:15px;
  left:15px;
}

</style>

</head>

<body>

<img
  class="watermark"
  src="${window.location.origin}/logo.png"
/>

<img
  class="corner c1"
  src="${window.location.origin}/patterns/Z-1.png"
/>

<img
  class="corner c2"
  src="${window.location.origin}/patterns/Z-3.png"
/>

<img
  class="corner c3"
  src="${window.location.origin}/patterns/Z-5.png"
/>

<img
  class="corner c4"
  src="${window.location.origin}/patterns/Z-1.png"
/>

<div class="content">

<div class="header">

  <img
    src="${window.location.origin}/logo.png"
    class="logo"
  />

  <div class="title">
    الصديق
  </div>

  <div class="subtitle">
    نظام إدارة الحلقات القرآنية
  </div>

</div>

${buildPrintTable()}

<div class="footer">

تم إنشاء التقرير بواسطة نظام الصديق

</div>

</div>

</body>

</html>
`;
}

function handlePrint() {

  const reportElement =
    document.getElementById(
      "print-report"
    );

  if (!reportElement) {
    showToast(
      "لا يوجد تقرير للطباعة",
      "error"
    );
    return;
  }

  const printWindow =
    window.open(
      "",
      "_blank",
      "width=1600,height=1000"
    );

  printWindow.document.write(`
    <!DOCTYPE html>

    <html dir="rtl">

    <head>

      <meta charset="UTF-8"/>

      <title>تقرير الصديق</title>

      <style>

        @page{
          size:A4 landscape;
          margin:10mm;
        }

        body{
          margin:0;
          padding:20px;
          direction:rtl;
          font-family:
            Tahoma,
            Arial,
            sans-serif;
          background:#fff;
        }

        img{
          max-width:100%;
        }

        table{
          width:100%;
          border-collapse:collapse;
        }

        thead{
          display:table-header-group;
        }

        tr{
          page-break-inside:avoid;
        }

      </style>

    </head>

    <body>

      ${reportElement.innerHTML}

    </body>

    </html>
  `);

  printWindow.document.close();

  setTimeout(() => {

    printWindow.focus();

    printWindow.print();

  }, 1000);
}
async function handleCopy() {
  try {

    if (!reportData?.length) {

      showToast(
        "لا توجد بيانات لنسخها",
        "info"
      );

      return;
    }

    await navigator.clipboard.writeText(
      JSON.stringify(
        reportData,
        null,
        2
      )
    );

    showToast(
      "تم نسخ التقرير بنجاح",
      "success"
    );

  } catch (error) {

    console.error(error);

    showToast(
      "فشل نسخ التقرير",
      "error"
    );

  }

}

function handleExcel() {

  if (!reportData) {
    showToast(
      "لا توجد بيانات للتصدير",
      "info"
    );
    return;
  }

  const data =
    Array.isArray(reportData)
      ? reportData
      : [reportData];

  const worksheet =
    XLSX.utils.json_to_sheet(
      data
    );

  const workbook =
    XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(
    workbook,
    worksheet,
    "Report"
  );

  const excelBuffer =
    XLSX.write(
      workbook,
      {
        bookType: "xlsx",
        type: "array",
      }
    );

  const fileData =
    new Blob(
      [excelBuffer],
      {
        type:
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      }
    );

  saveAs(
    fileData,
    `report-${selectedReport}.xlsx`
  );

  showToast(
    "تم تصدير Excel بنجاح",
    "success"
  );
}

function handleCSV() {

  if (!reportData?.length) {
    showToast(
      "لا توجد بيانات للتصدير",
      "info"
    );
    return;
  }

  const worksheet =
    XLSX.utils.json_to_sheet(
      reportData
    );

  const csv =
    XLSX.utils.sheet_to_csv(
      worksheet
    );

  const blob =
    new Blob(
      [csv],
      {
        type:
          "text/csv;charset=utf-8;",
      }
    );

  saveAs(
    blob,
    `report-${selectedReport}.csv`
  );

  showToast(
    "تم تصدير CSV بنجاح",
    "success"
  );
}

function buildPdfData() {

  return {
    title:
      {
        attendance:
          "تقرير الحضور",
        recitations:
          "تقرير التسميع",
        students:
          "تقرير الطلاب",
        teachers:
          "تقرير المعلمين",
        halaqat:
          "تقرير الحلقات",
        "monthly-progress":
          "تقرير الإنجاز الشهري",
        full:
          "التقرير الشامل",
      }[selectedReport] ||
      "تقرير",

    total:
      Array.isArray(reportData)
        ? reportData.length
        : 1,
  };
}

function getPdfTableData() {

  if (selectedReport === "attendance") {

    return {

      headers: [
        "الطالب",
        "الحلقة",
        "التاريخ",
        "الحالة",
        "ملاحظات",
      ],

      rows: reportData.map(r => [

        r.profiles?.full_name || "",

        r.halaqat?.name || "",

        r.attendance_date || "",

        r.status || "",

        r.notes || "",
      ]),
    };
  }

  if (selectedReport === "students") {

    return {

      headers: [
        "اسم الطالب",
      ],

      rows: reportData.map(r => [

        r.full_name || "",
      ]),
    };
  }

  if (selectedReport === "teachers") {

    return {

      headers: [
        "اسم المعلم",
      ],

      rows: reportData.map(r => [

        r.full_name || "",
      ]),
    };
  }

  if (selectedReport === "halaqat") {

    return {

      headers: [
        "الحلقة",
        "المسجد",
        "المعلم الأساسي",
        "المعلم المساعد",
        "السعة",
        "الحالة",
      ],

      rows: reportData.map(r => [

        r.name || "",

        r.mosques?.name || "",

        r.main_teacher?.full_name || "",

        r.assistant_teacher?.full_name || "",

        r.capacity || "",

        r.status || "",
      ]),
    };
  }

  if (selectedReport === "monthly-progress") {

    return {

      headers: [
        "الطالب",
        "الحلقة",
        "الشهر",
        "الحفظ",
        "المراجعة",
        "معتمد",
      ],

      rows: reportData.map(r => [

        r.profiles?.full_name || "",

        r.halaqat?.name || "",

        r.progress_month || "",

        r.memorization_pages || 0,

        r.revision_pages || 0,

        r.approved
          ? "نعم"
          : "لا",
      ]),
    };
  }

  return {

    headers: Object.keys(
      reportData[0]
    ),

    rows: reportData.map(
      row =>
        Object.values(row)
    ),
  };
}

async function handlePDF() {

  const element =
    document.getElementById(
      "report-export"
    );

  if (!element) {

    showToast(
      "لم يتم العثور على التقرير",
      "error"
    );

    return;
  }

  try {

    showToast(
      "جاري إنشاء PDF...",
      "info"
    );

    const canvas =
      await html2canvas(
        element,
        {
          scale: 2,
          useCORS: true,
        }
      );

    const image =
      canvas.toDataURL(
        "image/png"
      );

    const pdf =
      new jsPDF(
        "p",
        "mm",
        "a4"
      );

    const pdfWidth =
      210;

    const pdfHeight =
      (
        canvas.height *
        pdfWidth
      ) /
      canvas.width;

    pdf.addImage(
      image,
      "PNG",
      0,
      0,
      pdfWidth,
      pdfHeight
    );

    pdf.save(
      `sadiq-${selectedReport}.pdf`
    );

    showToast(
      "تم إنشاء PDF بنجاح",
      "success"
    );

  } catch (error) {

    console.error(error);

    showToast(
      "فشل إنشاء PDF",
      "error"
    );
  }
}
  return (
    <AppPage>
      <PageHeader
        icon={Icons.reports}
        title="مركز التقارير"
        description="متابعة الأداء والإحصائيات وتحليل بيانات الحلقات"
      />

     <AppCard>
  <div
    style={{
      textAlign: "center",
      padding: "20px",
      color: "#64748B",
      lineHeight: 1.9,
    }}
  >
    اختر نوع التقرير ثم حدد الفلاتر المطلوبة
    لعرض بيانات الحلقات والطلاب والمعلمين
    بصورة تفصيلية وقابلة للطباعة والتصدير.
  </div>
</AppCard>

      <AppSection
        title="أنواع التقارير"
        icon={Icons.reports}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit,minmax(240px,1fr))",
            gap: "18px",
          }}
        >
          {REPORT_TYPES.map(
            (report) => (
              <ReportTypeCard
                key={report.id}
                report={report}
                selected={
                  selectedReport ===
                  report.id
                }
                onSelect={
                  setSelectedReport
                }
              />
            )
          )}
        </div>
      </AppSection>

      <AppSection
        title="خيارات التقرير"
      >
      <ReportFilters
  filters={filters}
  setFilters={setFilters}
  mosques={mosques}
  halaqat={halaqat}
  teachers={teachers}
  students={students}
/>

        <div
          style={{
            display: "flex",
            justifyContent:
              "center",
            marginTop: "24px",
          }}
        >
        <AppButton
  onClick={handleGenerateReport}
>
  عرض التقرير
</AppButton>
        </div>
      </AppSection>

      <AppSection
        title="التصدير والطباعة"
      >
    <ReportToolbar
  onPrint={handlePrint}
  onCopy={handleCopy}
  onExcel={handleExcel}
  onCSV={handleCSV}
  onPDF={handlePDF}
/>
      </AppSection>

      <AppSection
        title="معاينة التقرير"
      >
        <div
  id="report-export"
  style={{
    position: "relative",
    background: "#FFFFFF",
    borderRadius: "28px",
    overflow: "hidden",
    padding: "40px",
    border: "1px solid #E5E7EB",
  }}
>

  {/* زخارف الزوايا */}

  <img
    src="/patterns/Z-1.png"
    alt=""
    style={{
      position: "absolute",
      top: 20,
      left: 20,
      width: "120px",
      opacity: 0.08,
      pointerEvents: "none",
    }}
  />

  <img
    src="/patterns/Z-3.png"
    alt=""
    style={{
      position: "absolute",
      top: 20,
      right: 20,
      width: "120px",
      opacity: 0.08,
      pointerEvents: "none",
    }}
  />

  <img
    src="/patterns/Z-5.png"
    alt=""
    style={{
      position: "absolute",
      bottom: 20,
      left: 20,
      width: "120px",
      opacity: 0.08,
      pointerEvents: "none",
    }}
  />

  <img
    src="/patterns/Z-1.png"
    alt=""
    style={{
      position: "absolute",
      bottom: 20,
      right: 20,
      width: "120px",
      opacity: 0.08,
      pointerEvents: "none",
    }}
  />

  {/* شعار مركزي بالخلفية */}

  <img
    src="/logo.png"
    alt=""
    style={{
      position: "absolute",
      top: "50%",
      left: "50%",
      transform:
        "translate(-50%, -50%)",
      width: "420px",
      opacity: 0.03,
      pointerEvents: "none",
    }}
  />

  {/* الهيدر */}

  <div
    style={{
      textAlign: "center",
      position: "relative",
      zIndex: 2,
      marginBottom: "30px",
    }}
  >

    <img
      src="/logo.png"
      alt="الصديق"
      style={{
        width: "120px",
        marginBottom: "12px",
      }}
    />

    <h1
      style={{
        margin: 0,
        fontSize: "38px",
        color: "#0F5132",
        fontWeight: "900",
      }}
    >
      الصديق
    </h1>

    <div
      style={{
        color: "#64748B",
        fontSize: "15px",
        marginTop: "6px",
      }}
    >
      نظام إدارة الحلقات القرآنية
    </div>

    <div
      style={{
        width: "220px",
        height: "3px",
        background:
          "linear-gradient(to left,#D6C28A,#0F5132,#D6C28A)",
        margin:
          "18px auto 0 auto",
        borderRadius: "999px",
      }}
    />
  </div>

  {/* التقرير */}

  <div
    style={{
      position: "relative",
      zIndex: 2,
    }}
  >
    <ReportViewer
      selectedReport={selectedReport}
      reportData={reportData}
    />
  </div>

  {/* الفوتر */}

  <div
    style={{
      textAlign: "center",
      marginTop: "30px",
      position: "relative",
      zIndex: 2,
    }}
  >

    <img
      src="/patterns/Z-3.png"
      alt=""
      style={{
        width: "70px",
        opacity: 0.2,
        marginBottom: "10px",
      }}
    />

    <div
      style={{
        color: "#64748B",
        fontSize: "13px",
      }}
    >
      © الصديق - إدارة الحلقات القرآنية
    </div>

  </div>

</div>

<div
  id="print-report"
  style={{
    position: "absolute",
    left: "-99999px",
    top: 0,
    width: "1400px",
    background: "#FFFFFF",
    borderRadius: "28px",
    overflow: "hidden",
    padding: "40px",
    border: "1px solid #E5E7EB",
  }}
>

  {/* زخارف */}

  <img
    src="/patterns/Z-1.png"
    alt=""
    style={{
      position: "absolute",
      top: 20,
      left: 20,
      width: "120px",
      opacity: 0.08,
    }}
  />

  <img
    src="/patterns/Z-3.png"
    alt=""
    style={{
      position: "absolute",
      top: 20,
      right: 20,
      width: "120px",
      opacity: 0.08,
    }}
  />

  <img
    src="/patterns/Z-5.png"
    alt=""
    style={{
      position: "absolute",
      bottom: 20,
      left: 20,
      width: "120px",
      opacity: 0.08,
    }}
  />

  <img
    src="/patterns/Z-1.png"
    alt=""
    style={{
      position: "absolute",
      bottom: 20,
      right: 20,
      width: "120px",
      opacity: 0.08,
    }}
  />

  {/* علامة مائية */}

  <img
    src="/logo.png"
    alt=""
    style={{
      position: "absolute",
      top: "50%",
      left: "50%",
      transform:
        "translate(-50%, -50%)",
      width: "420px",
      opacity: 0.03,
    }}
  />

  {/* الهيدر */}

  <div
    style={{
      textAlign: "center",
      position: "relative",
      zIndex: 2,
      marginBottom: "30px",
    }}
  >

    <img
      src="/logo.png"
      alt="الصديق"
      style={{
        width: "120px",
        marginBottom: "12px",
      }}
    />

    <h1
      style={{
        margin: 0,
        fontSize: "38px",
        color: "#0F5132",
        fontWeight: "900",
      }}
    >
      الصديق
    </h1>

    <div
      style={{
        color: "#64748B",
        fontSize: "15px",
        marginTop: "6px",
      }}
    >
      نظام إدارة الحلقات القرآنية
    </div>

  </div>

  {/* التقرير */}

  <ReportViewer
    selectedReport={selectedReport}
    reportData={reportData}
    isPrint={true}
  />

  {/* الفوتر */}

  <div
    style={{
      textAlign: "center",
      marginTop: "30px",
      color: "#64748B",
      fontSize: "13px",
    }}
  >
    © الصديق - إدارة الحلقات القرآنية
  </div>

</div>

      </AppSection>
    </AppPage>
  );
}
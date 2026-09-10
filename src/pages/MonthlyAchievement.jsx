import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { showToast } from "../components/Toast";
import MonthlyHeader from "../components/monthly-v2/MonthlyHeader";
import MonthlyStats from "../components/monthly-v2/MonthlyStats";
import MonthlyFilters from "../components/monthly-v2/MonthlyFilters";
import MonthlyGrid from "../components/monthly-v2/MonthlyGrid";
import MonthlySummaryBar from "../components/monthly-v2/MonthlySummaryBar";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function MonthlyAchievement(){

  const [rows,setRows] =
    useState([]);

const totalStudents =
  rows.length;

const completedStudents =
  rows.filter(
    x =>
      x.memorization_completed &&
      x.revision_completed
  ).length;

const delayedStudents =
  rows.filter(
    x =>
      !x.memorization_completed ||
      !x.revision_completed
  ).length;

const achievementRate =
  totalStudents
    ? Math.round(
        (completedStudents /
          totalStudents) *
          100
      )
    : 0;
  const [loading,setLoading] =
    useState(false);

const [mosques,setMosques] =
  useState([]);

const [halaqat,setHalaqat] =
  useState([]);

const currentHijriMonth =
  new Intl.DateTimeFormat(
    "ar-SA-u-ca-islamic",
    {
      month:"long",
      year:"numeric"
    }
  ).format(new Date());

const [filters,setFilters] =
  useState({
    mosque_id:"",
    halaqa_id:"",
    hijriYear:"",
    hijriMonth:"",
    teacher_id:null
  });
const [teacherName, setTeacherName] =
  useState("-");
const [selectedTeacherName, setSelectedTeacherName] =
  useState("-");
const today =
  new Intl.DateTimeFormat(
    "ar-SA-u-ca-islamic",
    {
      day:"numeric",
      month:"long",
      year:"numeric"
    }
  ).format(new Date());

const origin =
  window.location.origin;

const selectedMosqueName =
  mosques.find(
    m => m.id == filters.mosque_id
  )?.name || "-";

const selectedHalaqaName =
  halaqat.find(
    h => h.id == filters.halaqa_id
  )?.name || "-";




useEffect(()=>{

  loadMosques();

},[]);

async function loadMosques(){

  const { data,error } =
    await supabase
      .from("mosques")
      .select("id,name")
      .order("name");

  if(error){

    showToast(
      error.message,
      "error"
    );

    return;
  }

  setMosques(
    data || []
  );

}

async function loadHalaqat(
  mosqueId
){

  const { data,error } =
    await supabase
      .from("halaqat")
      .select("id,name")
      .eq(
        "mosque_id",
        mosqueId
      )
      .order("name");

  if(error){

    showToast(
      error.message,
      "error"
    );

    return;
  }

  setHalaqat(
    data || []
  );

}

async function loadTeacherName(halaqaId){

  if(!halaqaId){
    setTeacherName("-");
    return;
  }

  const { data: teacherHalaqa } =
    await supabase
      .from("teacher_halaqat")
      .select("teacher_id")
      .eq("halaqa_id", halaqaId)
      .eq("role", "main")
      .single();


  if(!teacherHalaqa){
    setTeacherName("-");
    return;
  }

  const { data: teacher } =
    await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", teacherHalaqa.teacher_id)
      .single();

  setTeacherName(
    teacher?.full_name || "-"
  );
}

  function handleRowChange(
    id,
    field,
    value
  ){

    setRows(prev=>

      prev.map(row=>

        row.id === id

        ? {
            ...row,
            [field]:value
          }

        : row

      )

    );

  }

 async function loadStudents(){

  if(
    !filters.halaqa_id
  ){

    showToast(
      "اختر الحلقة",
      "error"
    );

    return;
  }

  setLoading(true);

  try{

    const { data,error } =
  await supabase
    .from(
      "student_halaqat"
    )
    .select(`
      student_id,

      profiles(
        id,
        full_name
      )
    `)
    .eq(
      "halaqa_id",
      filters.halaqa_id
    )
    .eq(
      "is_current",
      true
    );
    if(error)
      throw error;

const { data: teacherData } =
  await supabase
    .from("teacher_halaqat")
    .select("teacher_id")
    .eq(
      "halaqa_id",
      filters.halaqa_id
    )
    .limit(1)
    .maybeSingle();

setFilters(prev => ({
  ...prev,
  teacher_id:
    teacherData?.teacher_id || null
}));

const uniqueStudents = [

  ...new Map(

    (data || []).map(
      item => [
        item.student_id,
        item
      ]
    )

  ).values()

];

    const studentsRows =

  uniqueStudents
  .map(item=>({

    id:item.student_id,

    student_id:
    item.student_id,

    student_name:
    item.profiles?.full_name

  }));

const existing =

  await loadExistingProgress(

    studentsRows.map(
      x => x.student_id
    )

  );

const result =

  studentsRows.map(student=>{

    const old =

      existing.find(

        x =>
        x.student_id ===
        student.student_id

      );

const hijriMonths = [
  "محرم",
  "صفر",
  "ربيع الأول",
  "ربيع الآخر",
  "جمادى الأولى",
  "جمادى الآخرة",
  "رجب",
  "شعبان",
  "رمضان",
  "شوال",
  "ذو القعدة",
  "ذو الحجة"
];

const hijriYears = [];

for (
  let year = 1400;
  year <= 1500;
  year++
) {
  hijriYears.push({
    value: year,
    label: year.toString()
  });
}

    return {

      ...student,

      memorization_pages:
        old?.memorization_pages || 0,

      memorization_completed:
        old?.memorization_completed || false,

      revision_pages:
        old?.revision_pages || 0,

      revision_completed:
        old?.revision_completed || false,

      delay_reason:
        old?.delay_reason || "",

      notes:
        old?.notes || "",

      approved:
        old?.approved || false

    };

  });

setRows(result);

    showToast(
      "تم تحميل الطلاب",
      "success"
    );

  }

  catch(error){

    showToast(
      error.message,
      "error"
    );

  }

  finally{

    setLoading(false);

  }

}

async function loadExistingProgress(studentIds){

  if(
  !filters.hijriMonth ||
  !filters.hijriYear
){
  return [];
}

  const { data,error } =
    await supabase
      .from("monthly_progress")
      .select("*")
      .eq(
        "halaqa_id",
        filters.halaqa_id
      )
 .eq(
  "progress_month",
  `${filters.hijriYear}-${filters.hijriMonth}-01`
)
      .in(
        "student_id",
        studentIds
      );

  if(error) throw error;

  return data || [];
}
async function saveAll(){

  if(rows.length === 0){

    showToast(
      "لا توجد بيانات للحفظ",
      "error"
    );

    return;

  }



if (!filters.hijriMonth) {

  showToast(
    "اختر الشهر",
    "error"
  );

  return;
}

if(!filters.teacher_id){

  showToast(
    "لم يتم العثور على معلم للحلقة",
    "error"
  );

  return;

}

  setLoading(true);

  try{
console.log("FILTERS =", filters);
console.log(
  "filters.teacher_id =",
  filters.teacher_id
);

    const payload =

      rows.map(row=>({

        student_id:
          row.student_id,

        halaqa_id:
          filters.halaqa_id,

        mosque_id:
          filters.mosque_id,

teacher_id:
  filters.teacher_id,

        progress_month:
  `${filters.hijriYear}-${filters.hijriMonth}-01`,

        memorization_pages:
          Number(
            row.memorization_pages
          ) || 0,

        memorization_completed:
          row.memorization_completed,

        revision_pages:
          Number(
            row.revision_pages
          ) || 0,

        revision_completed:
          row.revision_completed,

        delay_reason:
          row.delay_reason || null,

        notes:
          row.notes || null

      }));

    const { error } =

      await supabase
        .from(
          "monthly_progress"
        )
        .upsert(
          payload,
          {
          
           onConflict:
"student_id,halaqa_id,progress_month"
          }
        );



    if(error)

      throw error;

    showToast(
      "تم حفظ الإنجازات بنجاح",
      "success"
    );

  }

  catch(error){

    showToast(
      error.message,
      "error"
    );

  }

  finally{

    setLoading(false);

  }
  }



async function approveAll(){

  if(rows.length === 0){

    showToast(
      "لا توجد بيانات",
      "error"
    );

    return;

  }

  setLoading(true);

  try{

    const ids =

      rows.map(
        row => row.student_id
      );

    const { error } =

      await supabase
        .from(
          "monthly_progress"
        )
        .update({

          approved:true

        })
        .in(
          "student_id",
          ids
        )
        .eq(
  "progress_month",
  `${filters.hijriYear}-${filters.hijriMonth}-01`
);

    if(error)
      throw error;

    showToast(
      "تم اعتماد الإنجازات",
      "success"
    );

setRows(prev =>
  prev.map(row => ({
    ...row,
    approved:true
  }))
);

  }

  catch(error){

    showToast(
      error.message,
      "error"
    );

  }

  finally{

    setLoading(false);

  }

}


const totalMemorizationPages =
  rows.reduce(
    (sum,row)=>
      sum +
      (Number(
        row.memorization_pages
      ) || 0),
    0
  );

const totalRevisionPages =
  rows.reduce(
    (sum,row)=>
      sum +
      (Number(
        row.revision_pages
      ) || 0),
    0
  );

const approvedCount =
  rows.filter(
    x => x.approved
  ).length;

function exportExcel() {

  const exportData =
    rows.map((row) => ({

      الطالب:
        row.student_name,

      "صفحات الحفظ":
        row.memorization_pages || 0,

      "صفحات المراجعة":
        row.revision_pages || 0,

    "حالة الحفظ":
  row.memorization_completed
    ? "منجز"
    : "غير منجز",

"حالة المراجعة":
  row.revision_completed
    ? "منجز"
    : "غير منجز",

      "سبب التعثر":
        row.delay_reason || "",

      ملاحظات:
        row.notes || "",

      معتمد:
        row.approved
          ? "نعم"
          : "لا"
    }));

  const worksheet =
    XLSX.utils.json_to_sheet(exportData);

  const workbook =
    XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(
    workbook,
    worksheet,
    "الإنجاز الشهري"
  );

  XLSX.writeFile(
    workbook,
    `monthly-achievement-${filters.month}.xlsx`
  );

  showToast(
    "تم تصدير Excel",
    "success"
  );
}

function exportPdf() {

  const doc =
    new jsPDF({
      orientation:"landscape"
    });

  doc.setFontSize(18);

  doc.text(
    "Monthly Achievement Report",
    14,
    20
  );

  autoTable(doc,{
    startY:30,

    head:[[
      "Student",
      "Memorization",
      "Revision",
      "Completed",
      "Approved"
    ]],

    body:
      rows.map(row => [

        row.student_name,

        row.memorization_pages || 0,

        row.revision_pages || 0,

        row.memorization_completed &&
        row.revision_completed
          ? "Yes"
          : "No",

        row.approved
          ? "Yes"
          : "No"
      ])
  });

  doc.save(
    `monthly-achievement-${filters.month}.pdf`
  );

  showToast(
    "تم إنشاء PDF",
    "success"
  );
}

function printReport() {
const origin = window.location.origin;
const hijriMonths = {
  "01":"محرم",
  "02":"صفر",
  "03":"ربيع الأول",
  "04":"ربيع الآخر",
  "05":"جمادى الأولى",
  "06":"جمادى الآخرة",
  "07":"رجب",
  "08":"شعبان",
  "09":"رمضان",
  "10":"شوال",
  "11":"ذو القعدة",
  "12":"ذو الحجة"
};

const selectedMonthName =
  hijriMonths[filters.hijriMonth] || "-";
  const totalStudents = rows.length;

const printWindow =
  window.open("", "_blank");

  const completedStudents =
    rows.filter(
      r =>
        r.memorization_completed &&
        r.revision_completed
    ).length;

  const delayedStudents =
    totalStudents - completedStudents;

  const achievementRate =
    totalStudents > 0
      ? Math.round(
          (completedStudents / totalStudents) * 100
        )
      : 0;

  const totalMemPages =
    rows.reduce(
      (sum,r)=>
        sum + (Number(r.memorization_pages) || 0),
      0
    );

  const totalRevPages =
    rows.reduce(
      (sum,r)=>
        sum + (Number(r.revision_pages) || 0),
      0
    );



  const rowsHtml =
    rows.map((row,index)=>`

      <tr>

        <td>${index + 1}</td>

        <td style="font-weight:700">
          ${row.student_name}
        </td>

        <td>${row.memorization_pages || 0}</td>

        <td>
          <span class="${
            row.memorization_completed
              ? "success"
              : "danger"
          }">
            ${
              row.memorization_completed
                ? "منجز"
                : "غير منجز"
            }
          </span>
        </td>

        <td>${row.revision_pages || 0}</td>

        <td>
          <span class="${
            row.revision_completed
              ? "success"
              : "danger"
          }">
            ${
              row.revision_completed
                ? "منجز"
                : "غير منجز"
            }
          </span>
        </td>

   <td>

<span
class="${
row.approved
? 'approved'
: 'not-approved'
}"
>

${
row.approved
? 'معتمد'
: 'غير معتمد'
}

</span>

</td>

      </tr>

    `).join("");

  printWindow.document.write(`

<!DOCTYPE html>

<html dir="rtl" lang="ar">

<head>

<meta charset="utf-8"/>

<title>
تقرير الإنجاز الشهري
</title>

<style>

*{
margin:0;
padding:0;
box-sizing:border-box;
}

body{

font-family:
Tahoma,
Arial,
sans-serif;

padding:35px;

background:#f7f8f4;

color:#0f172a;

position:relative;
}

.watermark-logo{

position:fixed;

top:50%;
left:50%;

transform:
translate(-50%,-50%);

width:650px;

opacity:.08;

z-index:0;
}
.pattern-right{

position:fixed;

top:20px;
right:20px;

width:160px;

opacity:.08;

z-index:0;
}

.pattern-left{

position:fixed;

top:20px;
left:20px;

width:160px;

opacity:.08;

z-index:0;
}

.pattern-bottom{

position:fixed;

bottom:20px;
left:50%;

transform:
translateX(-50%);

width:220px;

opacity:.08;

z-index:0;
}

.header,
.stats,
.summary,

.info-grid{

display:grid;

grid-template-columns:
repeat(4,1fr);

gap:16px;

margin-top:25px;
}

.info-grid div{

background:
rgba(255,255,255,.12);

padding:15px;

border-radius:14px;

text-align:center;

font-weight:700;

backdrop-filter:blur(4px);
}

.footer{

position:relative;
z-index:2;
}

@page{
  size:A4;
  margin:8mm;
}

@media print{

  *{
    -webkit-print-color-adjust:exact !important;
    print-color-adjust:exact !important;
  }

  body{
    zoom:0.90;
  }

}
.header{

background:
linear-gradient(
135deg,
#0f5132,
#14532d
);

color:white;

border-radius:30px;

padding:35px;

position:relative;

overflow:hidden;

margin-bottom:25px;
}

.logo{

position:absolute;

left:25px;
top:20px;

width:110px;
}

.header-logo{

width:130px;

display:block;

margin:0 auto 15px;
}

.title{

font-size:40px;

font-weight:900;

text-align:center;
}

.subtitle{

text-align:center;

margin-top:10px;

font-size:18px;

opacity:.9;
}

.month{

text-align:center;

margin-top:8px;

font-size:16px;
}

.stats{

display:grid;

grid-template-columns:
repeat(4,1fr);

gap:20px;

margin-bottom:25px;
}

.stat{

background:white;

padding:25px;

border-radius:20px;

text-align:center;

box-shadow:
0 10px 25px
rgba(0,0,0,.08);
}

.stat-value{

font-size:42px;

font-weight:900;

color:#14532d;
}

.stat-label{

margin-top:8px;

font-weight:700;
}

.table-wrapper{

background:white;

border-radius:20px;

overflow:hidden;

box-shadow:
0 10px 25px
rgba(0,0,0,.08);
}

table{

width:100%;

border-collapse:collapse;
}

th{

background:
linear-gradient(
135deg,
#0f5132,
#14532d
);

color:white;

padding:18px;
}

td{

padding:14px 10px;

border:1px solid #E2E8F0;

text-align:center;

white-space:nowrap;
}

.success{

background:#dcfce7;

color:#15803d;

padding:6px 12px;

border-radius:999px;

font-weight:700;
}

.danger{

background:#fee2e2;

color:#b91c1c;

padding:6px 12px;

border-radius:999px;

font-weight:700;
}

.approved{

display:inline-block;

padding:6px 14px;

border-radius:999px;

background:#DCFCE7;

color:#166534;

font-weight:700;

white-space:nowrap;
}

.not-approved{

display:inline-block;

padding:6px 14px;

border-radius:999px;

background:#F1F5F9;

color:#475569;

font-weight:700;

white-space:nowrap;
}


.summary{

display:grid;

grid-template-columns:
1fr 1fr;

gap:20px;

margin-top:25px;
}



.summary-number{

font-size:42px;

font-weight:900;

color:#14532d;
}

.footer{

margin-top:30px;

padding:25px;

background:white;

border-radius:20px;

text-align:center;

box-shadow:
0 10px 25px
rgba(0,0,0,.08);
}

.footer-title{

font-size:22px;

font-weight:900;

color:#14532d;
}

.footer-sub{

margin-top:10px;

color:#64748b;
}

.report{
position:relative;
z-index:2;
}

.hero{
background:
linear-gradient(
135deg,
#0f5132,
#14532d
);

border-radius:30px;

padding:40px;

color:white;

margin-bottom:25px;
}

.hero-top{
display:flex;
align-items:center;
justify-content:center;
gap:20px;
}

.main-logo{
width:120px;
}

.hero-title{
font-size:42px;
font-weight:900;
}

.hero-subtitle{
margin-top:8px;
font-size:18px;
opacity:.9;
}

.info-grid{
display:grid;
grid-template-columns:
repeat(4,1fr);
gap:18px;
margin-bottom:25px;
}

.info-card{
background:white;
padding:22px;
border-radius:20px;
text-align:center;
box-shadow:
0 10px 25px rgba(0,0,0,.08);
}

.info-label{
color:#64748B;
font-size:14px;
}

.info-value{
font-size:22px;
font-weight:800;
margin-top:10px;
color:#14532d;
}

.stats-grid{
display:grid;
grid-template-columns:
repeat(4,1fr);
gap:18px;
margin-bottom:25px;
}

.summary-grid{
display:grid;
grid-template-columns:
1fr 1fr;
gap:20px;
margin-top:25px;
}

.summary-card{
padding:30px;
border-radius:24px;
text-align:center;
color:white;
}

.summary-card.green{
background:
linear-gradient(
135deg,
#0f5132,
#166534
);
}

.summary-card.gold{
background:
linear-gradient(
135deg,
#C69214,
#EAB308
);
}

.footer-card{
background:white;
padding:30px;
border-radius:24px;
margin-top:25px;
text-align:center;
box-shadow:
0 10px 25px rgba(0,0,0,.08);
}

.footer-date{
margin-top:10px;
color:#64748B;
}

.stat-card{

background:white;

padding:25px;

border-radius:20px;

text-align:center;

box-shadow:
0 10px 25px rgba(0,0,0,.08);

}

.stat-number{

font-size:42px;

font-weight:900;

color:#14532d;

}

.stat-text{

margin-top:8px;

font-weight:700;

}

.hero-date{
  margin-top:12px;
  text-align:center;
  font-size:16px;
  opacity:.9;
}

</style>

</head>

<body>

<img
src="${origin}/logo.png"
class="watermark-logo"
/>

<img
src="${origin}/patterns/Z-1.png"
class="pattern-right"
/>

<img
src="${origin}/patterns/Z-3.png"
class="pattern-left"
/>

<img
src="${origin}/patterns/Z-5.png"
class="pattern-bottom"
/>


<div class="report">

<div class="hero">

<div class="hero-top">

<img
src="${origin}/logo.png"
class="main-logo"
/>


<div>

<div class="hero-title">
تقرير الإنجاز الشهري
</div>

<div class="hero-subtitle">
نظام الصديق لإدارة حلقات القرآن الكريم
</div>



</div>

</div>

</div>

<div class="info-grid">

<div class="info-card">
<div class="info-label">المسجد</div>
<div class="info-value">
${selectedMosqueName}
</div>
</div>

<div class="info-card">
<div class="info-label">الحلقة</div>
<div class="info-value">
${selectedHalaqaName}
</div>
</div>

<div class="info-card">
<div class="info-label">المعلم</div>
<div class="info-value">
${teacherName}
</div>
</div>

<div class="info-card">
<div class="info-label">الشهر</div>
<div class="info-value">
${selectedMonthName} ${filters.hijriYear}
</div>
</div>

</div>

<div class="stats-grid">

<div class="stat-card">
<div class="stat-number">
${totalStudents}
</div>
<div class="stat-text">
إجمالي الطلاب
</div>
</div>

<div class="stat-card">
<div class="stat-number">
${completedStudents}
</div>
<div class="stat-text">
المنجزون
</div>
</div>

<div class="stat-card">
<div class="stat-number">
${delayedStudents}
</div>
<div class="stat-text">
المتعثرون
</div>
</div>

<div class="stat-card">
<div class="stat-number">
${achievementRate}%
</div>
<div class="stat-text">
نسبة الإنجاز
</div>
</div>

</div>

<div class="table-wrapper">

<table>

<thead>

<tr>

<th>#</th>
<th>الطالب</th>

<th>صفحات الحفظ</th>
<th>حالة الحفظ</th>

<th>صفحات المراجعة</th>
<th>حالة المراجعة</th>

<th>الاعتماد</th>

</tr>

</thead>

<tbody>

${rowsHtml}

</tbody>

</table>

</div>

<div class="summary-grid">

<div class="summary-card gold">

<div class="summary-number">
${totalRevPages}
</div>

<div>
إجمالي صفحات المراجعة
</div>

</div>

<div class="summary-card gold">

<div class="summary-number">
${totalMemPages}
</div>

<div>
إجمالي صفحات الحفظ
</div>

</div>

</div>

<div class="footer-card">

<div class="footer-title">
تم إنشاء التقرير بواسطة نظام الصديق
</div>

<div class="footer-subtitle">
إدارة حلقات القرآن الكريم
</div>

<div class="footer-date">
${today}
</div>

</div>

</div>

</body>
</html>

`);

printWindow.document.close();

printWindow.onload = () => {
  printWindow.focus();
  printWindow.print();
};

} 
 return(

    <div
      style={{
        padding:"24px"
      }}
    >

  <MonthlyHeader
  onSave={saveAll}
  onApprove={approveAll}
  onExportExcel={exportExcel}
  onExportPdf={exportPdf}
  onPrint={printReport}
  selectedMonth={filters.month}
  loading={loading}
/>

      

      <MonthlyFilters

  mosques={mosques}
  halaqat={halaqat}

  selectedMosque={
    filters.mosque_id
  }

  selectedHalaqa={
    filters.halaqa_id
  }

selectedYear={
  filters.hijriYear
}

selectedMonth={
  filters.hijriMonth
}

  onMosqueChange={(value)=>{

    setFilters(prev=>({

      ...prev,

      mosque_id:value,

      halaqa_id:""

    }));

    loadHalaqat(value);

  }}

  onHalaqaChange={async (value)=>{

  setFilters(prev=>({
    ...prev,
    halaqa_id:value
  }));

  const { data: teacherLink } =
    await supabase
      .from("teacher_halaqat")
      .select("teacher_id")
      .eq("halaqa_id", value)
      .eq("role", "main")
      .single();

  if(teacherLink){

    const { data: teacher } =
      await supabase
        .from("profiles")
        .select("*")
        .eq(
          "id",
          teacherLink.teacher_id
        )
        .single();

    console.log("teacher", teacher);

    setTeacherName(
      teacher?.full_name ||
      teacher?.name ||
      "-"
    );

  }else{

    setTeacherName("-");

  }

}}

  onYearChange={(value)=>{

  setFilters(prev=>({

    ...prev,

    hijriYear:value

  }));

}}

onMonthChange={(value)=>{

  setFilters(prev=>({

    ...prev,

    hijriMonth:value

  }));

}}

  onLoad={loadStudents}

/>

<MonthlyStats
  totalStudents={totalStudents}
  completed={completedStudents}
  delayed={delayedStudents}
  rate={achievementRate}
  totalMemorizationPages={
    totalMemorizationPages
  }
  totalRevisionPages={
    totalRevisionPages
  }
  approvedCount={
    approvedCount
  }
/>

      <MonthlyGrid
        rows={rows}
        onChange={handleRowChange}
      />

      

    </div>

  );

}
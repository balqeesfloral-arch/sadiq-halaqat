import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Plus,
  FileCheck,
  Clock,
  CheckCircle,
  Users,
} from "lucide-react";

import { supabase } from "../lib/supabase";

import ExamDetailsModal from "../components/ExamDetailsModal";

import CreateExamModal from "../components/CreateExamModal";

import ConfirmModal from "../components/ConfirmModal";

import { useToast } from "../components/Toast";

export default function Exams() {

  const navigate = useNavigate();

const { showToast } = useToast();

  const [exams,setExams] = useState([]);

  const [loading,setLoading] = useState(true);

  const [showCreate,setShowCreate] = useState(false);

const [selectedExam,setSelectedExam] = useState(null);

const [editingExam,setEditingExam] = useState(null);

const [deleteId, setDeleteId] =
  useState(null);


  useEffect(()=>{
    loadExams();
  },[]);



  async function loadExams(){

    setLoading(true);


   const { data, error } = await supabase
  .from("exams")
  .select(`
    *,
    mosques(name),
    exam_halaqat(
  halaqa_id,
  halaqat(name)
),

exam_students(
      student_id
    ),

    exam_teachers(
  teacher_id
    ),

    exam_results(
      score
    )
  `)
  .order("created_at", { ascending: false });

console.log("EXAMS DATA =", data);
console.log("EXAMS ERROR =", error);
console.log("FIRST EXAM =", data?.[0]);

if (error) {

  showToast(
    error.message,
    "error"
  );

  setLoading(false);
  return;
}
  const { data: teachersData } = await supabase
    .from("profiles")
    .select("id,full_name")
    .eq("role", "teacher");

  const teachersMap = {};

  (teachersData || []).forEach(t => {
    teachersMap[t.id] = t.full_name;
  });

  const formatted = (data || []).map(exam => ({

    ...exam,

halaqa_names:
  exam.exam_halaqat?.length
    ? exam.exam_halaqat
        .map(h => h.halaqat?.name)
        .filter(Boolean)
        .join("، ")
    : exam.halaqat?.name || "-",

    teacher_name:
      exam.exam_teachers?.length
        ? exam.exam_teachers
            .map(t => teachersMap[t.teacher_id])
            .filter(Boolean)
            .join("، ")
        : "-",

  }));

  setExams(formatted);


    setLoading(false);

}


const totalStudents = exams.reduce(
  (sum, exam) =>
    sum + (exam.exam_students?.length || 0),
  0
);

  const completed =
    exams.filter(
      e=>e.status==="completed"
    ).length;



  const scheduled =
    exams.filter(
      e=>e.status==="scheduled"
    ).length;



const getSuccessRate = (exam) => {

  const results = exam.exam_results || [];

  if (results.length === 0) {
    return 0;
  }

  const passed = results.filter(
    r => Number(r.score) >= Number(exam.passing_score)
  ).length;

  return Math.round(
    (passed / results.length) * 100
  );

};

async function deleteExam(id){

  try{

    await supabase
      .from("exam_results")
      .delete()
      .eq("exam_id", id);

    await supabase
      .from("exam_teachers")
      .delete()
      .eq("exam_id", id);

    await supabase
      .from("exam_halaqat")
      .delete()
      .eq("exam_id", id);

await supabase
  .from("exam_students")
  .delete()
  .eq("exam_id", id);

    await supabase
      .from("exams")
      .delete()
      .eq("id", id);

    showToast(
      "تم حذف الاختبار بنجاح",
      "success"
    );

    loadExams();

  }catch(err){

    showToast(
      err.message,
      "error"
    );

  }

}

const handleEdit = (exam) => {

  console.log("EDIT EXAM FULL =", exam);
  console.log("exam_halaqat =", exam.exam_halaqat);
  console.log("exam_teachers =", exam.exam_teachers);

  setEditingExam(exam);
  setShowCreate(true);
};

  return (

<div
style={{
padding:30,
direction:"rtl"
}}
>


{/* HEADER */}

<div
style={{
display:"flex",
justifyContent:"space-between",
alignItems:"center",
marginBottom:30
}}
>


<div>

<button
onClick={()=>navigate(-1)}
style={{
border:"none",
background:"#fff",
padding:"10px 18px",
borderRadius:14,
cursor:"pointer",
display:"flex",
alignItems:"center",
gap:8,
marginBottom:20
}}
>

<ArrowRight size={18}/>
رجوع

</button>


<h1
style={{
margin:0,
fontSize:32,
fontWeight:900,
color:"#0F172A"
}}
>

الاختبارات

</h1>


<p
style={{
color:"#64748B"
}}
>

إدارة اختبارات الطلاب ونتائجهم

</p>


</div>



<button
  onClick={() => setShowCreate(true)}
  style={{
    background:"#0F766E",
    color:"#fff",
    border:"none",
    borderRadius:"20px",
    padding:"0 24px",
    height:"56px",
    cursor:"pointer",
    display:"flex",
    alignItems:"center",
    gap:"14px",
    fontWeight:"800",
    fontSize:"15px",
    boxShadow:
      "0 12px 30px rgba(15,118,110,.25)",
    transition:"all .25s ease"
  }}
>
  <div
    style={{
      width:"34px",
      height:"34px",
      borderRadius:"12px",
      background:"rgba(255,255,255,.15)",
      display:"flex",
      alignItems:"center",
      justifyContent:"center"
    }}
  >
    <Plus size={18}/>
  </div>

  <span>
    إنشاء اختبار جديد
  </span>
</button>


</div>





{/* STATS */}

<div

style={{

display:"grid",

gridTemplateColumns:
"repeat(auto-fit,minmax(220px,1fr))",

gap:20,

marginBottom:30

}}

>


<Stat
icon={FileCheck}
title="إجمالي الاختبارات"
value={exams.length}
/>


<Stat
icon={CheckCircle}
title="المكتملة"
value={completed}
/>


<Stat
icon={Clock}
title="المجدولة"
value={scheduled}
/>


<Stat
  icon={Users}
  title="إجمالي الطلاب"
  value={totalStudents}
/>



</div>





{/* TABLE */}

<div

style={{

background:"#fff",

borderRadius:24,

overflow:"hidden",

boxShadow:
"0 10px 30px rgba(0,0,0,.05)"

}}

>

<div
style={{
  width:"100%",
  overflowX:"auto",
  borderRadius:20,
  border:"1px solid #E2E8F0",
  background:"#fff"
}}
>

<table
style={{
  width:"100%",
  minWidth:"1400px",
  borderCollapse:"collapse"
}}
>


<thead>

<tr
style={{
  background:"#F8FAFC",
  height:"64px"
}}
>

<th
style={{
  padding:"16px",
  textAlign:"right",
  fontWeight:800,
  whiteSpace:"nowrap"
}}
>
الاختبار
</th>
<th
style={{
  padding:"16px",
  textAlign:"right",
  fontWeight:800,
  whiteSpace:"nowrap"
}}
>
المسجد
</th>
<th
style={{
  padding:"16px",
  textAlign:"right",
  fontWeight:800,
  whiteSpace:"nowrap"
}}
>
الحلقة
</th>
<th
style={{
  padding:"16px",
  textAlign:"right",
  fontWeight:800,
  whiteSpace:"nowrap"
}}
>
التاريخ
</th>
<th
style={{
  padding:"16px",
  textAlign:"right",
  fontWeight:800,
  whiteSpace:"nowrap"
}}
>
الحالة
</th>
<th>نوع الاختبار</th>
<th
style={{
  padding:"16px",
  textAlign:"center",
  fontWeight:800,
  whiteSpace:"nowrap"
}}
>
المعلم
</th>
<th>عدد الطلاب</th>
<th>الدرجة الكاملة</th>
<th>درجة النجاح</th>
<th>نسبة النجاح</th>
<th
style={{
  width:"220px",
  padding:"16px",
  textAlign:"right"
}}
>
الإجراءات
</th>


</tr>

</thead>



<tbody>


{

loading ?

<tr>
<td
colSpan="5"
style={{
padding:40,
textAlign:"center"
}}
>
جاري التحميل...
</td>
</tr>


:

exams.length===0?


<tr>
<td
colSpan="5"
style={{
padding:40,
textAlign:"center"
}}
>
لا توجد اختبارات
</td>
</tr>



:


exams.map(exam=>(

<tr
key={exam.id}
>


<td
style={{
  padding:"18px 16px",
  borderBottom:"1px solid #F1F5F9"
}}
>
{exam.title}
</td>


<td
style={{
  padding:"18px 16px",
  borderBottom:"1px solid #F1F5F9"
}}
>
{exam.mosques?.name || "-"}
</td>


<td
  style={{
    minWidth:"220px",
    padding:"18px 16px"
  }}
>
  <div
    style={{
      display:"flex",
      flexWrap:"wrap",
      gap:6,
      justifyContent:"center"
    }}
  >
    {(exam.halaqa_names || "")
      .split("،")
      .filter(Boolean)
      .map((name,index)=>(
        <span
          key={index}
          style={{
            background:"#EFF6FF",
            color:"#1D4ED8",
            padding:"4px 10px",
            borderRadius:999,
            whiteSpace:"nowrap"
          }}
        >
          {name}
        </span>
      ))}
  </div>
</td>


<td
style={{
  padding:"18px 16px",
  borderBottom:"1px solid #F1F5F9"
}}
>
{exam.exam_date}
</td>

<td>

<span
style={{

padding:"6px 14px",

borderRadius:30,

background:
exam.status==="completed"
?
"#DCFCE7"
:
"#FEF3C7",

color:
exam.status==="completed"
?
"#15803D"
:
"#92400E"

}}
>

{
exam.status==="completed"
?
"مكتمل"
:
"مجدول"
}

</span>

</td>

<td
style={{
  padding:"18px 16px",
  borderBottom:"1px solid #F1F5F9"
}}
>
{exam.exam_type}
</td>

<td
  style={{
    minWidth:"240px",
    padding:"18px 16px",
    textAlign:"center"
  }}
>
  <div
    style={{
      display:"flex",
      justifyContent:"center",
      alignItems:"center",
      gap:6,
      flexWrap:"wrap"
    }}
  >
    {(exam.teacher_name || "")
      .split("،")
      .filter(Boolean)
      .map((name,index)=>(
        <span
          key={index}
          style={{
            background:"#ECFDF5",
            color:"#065F46",
            padding:"4px 10px",
            borderRadius:999
          }}
        >
          {name}
        </span>
      ))}
  </div>
</td>
<td
style={{
  padding:"18px 16px",
  borderBottom:"1px solid #F1F5F9"
}}
>
{exam.exam_results?.length || 0}
</td>

<td
style={{
  padding:"18px 16px",
  borderBottom:"1px solid #F1F5F9"
}}
>
{exam.total_score}
</td>

<td
style={{
  padding:"18px 16px",
  borderBottom:"1px solid #F1F5F9"
}}
>
{exam.passing_score}
</td>

<td>
  {getSuccessRate(exam)}%
</td>

<td>

<div
  style={{
    display:"flex",
    gap:8,
    flexWrap:"wrap"
  }}
>

  <button
    onClick={() => setSelectedExam(exam)}
    style={{
      background:"#0F766E",
      color:"#fff",
      border:"none",
      padding:"8px 14px",
      borderRadius:10,
      cursor:"pointer",
      fontWeight:700
    }}
  >
    عرض
  </button>

  <button
    onClick={() => handleEdit(exam)}
    style={{
      background:"#2563EB",
      color:"#fff",
      border:"none",
      padding:"8px 14px",
      borderRadius:10,
      cursor:"pointer",
      fontWeight:700
    }}
  >
    تعديل
  </button>

  <button
  onClick={() =>
    setDeleteId(exam.id)
  }
  style={{
    background:"#DC2626",
    color:"#fff",
    border:"none",
    padding:"8px 14px",
    borderRadius:10,
    cursor:"pointer",
    fontWeight:700
  }}
>
  حذف
</button>

</div>



</td>

</tr>





))


}


</tbody>


</table>


</div>


</div>


{
showCreate && (
  <CreateExamModal
    exam={editingExam}
    onClose={() => {
      setShowCreate(false);
      setEditingExam(null);
    }}
    onCreated={() => {
      loadExams();
      setShowCreate(false);
      setEditingExam(null);
    }}
  />
)
}

{
selectedExam &&

<ExamDetailsModal
exam={selectedExam}
onClose={() =>
  setSelectedExam(null)
}
onUpdated={() =>
  loadExams()
}
/>

}

<ConfirmModal
  open={!!deleteId}
  title="حذف الاختبار"
  message="سيتم حذف الاختبار وجميع نتائجه وربطه بالطلاب والمعلمين. لا يمكن التراجع عن هذه العملية."
  confirmText="حذف"
  cancelText="إلغاء"
  danger={true}
  onCancel={() =>
    setDeleteId(null)
  }
  onConfirm={async () => {

    await deleteExam(deleteId);

    setDeleteId(null);

  }}
/>

</div>


  );

}





function Stat({
icon:Icon,
title,
value
}){


return (

<div

style={{

background:"#fff",

borderRadius:22,

padding:22,

boxShadow:
"0 8px 25px rgba(0,0,0,.04)"

}}

>


<Icon
size={28}
color="#0F766E"
/>


<p
style={{
color:"#64748B"
}}
>
{title}
</p>


<h2
style={{
margin:0,
fontSize:30
}}
>
{value}

</h2>



</div>

);


}
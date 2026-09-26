import { useEffect, useState } from "react";
import { X, Save, CheckCircle } from "lucide-react";
import { supabase } from "../lib/supabase";
import { useToast } from "./Toast";

export default function ExamDetailsModal({
  exam,
  onClose,
  onUpdated
}) {

  const { showToast } = useToast();

  const [loading,setLoading] =
    useState(false);

  const [results,setResults] =
    useState([]);

  useEffect(() => {
    loadResults();
  }, []);

  async function loadResults(){

    setLoading(true);

const {
  data: { user },
} = await supabase.auth.getUser();

const { data: profile } =
  await supabase
    .from("profiles")
    .select("id")
    .eq(
      "auth_user_id",
      user.id
    )
    .single();

const {
  data: teacherExam,
} = await supabase
  .from("exam_teachers")
  .select("id")
  .eq(
    "exam_id",
    exam.id
  )
  .eq(
    "teacher_id",
    profile.id
  )
  .maybeSingle();

if (!teacherExam) {

  showToast(
    "ليس لديك صلاحية لهذا الاختبار",
    "error"
  );

  setLoading(false);

  return;
}

    const { data,error } =
      await supabase
        .from("exam_results")
        .select(`
          *,
          profiles!exam_results_student_id_fkey(
            id,
            full_name
          )
        `)
        .eq("exam_id", exam.id)
        .order("id");

    if(error){

      showToast(
        error.message,
        "error"
      );

      setLoading(false);
      return;

    }

    setResults(data || []);

    setLoading(false);

  }

  const totalStudents =
    results.length;

  const passedCount =
    results.filter(
      r => r.is_passed
    ).length;

  const averageScore =
    results.length
      ? Math.round(
          results.reduce(
            (sum,r)=>
              sum + Number(r.score || 0),
            0
          ) / results.length
        )
      : 0;

  const highestScore =
    results.length
      ? Math.max(
          ...results.map(
            r => Number(r.score || 0)
          )
        )
      : 0;

  const successRate =
    results.length
      ? Math.round(
          (passedCount / results.length)
          * 100
        )
      : 0;

  async function saveResults(){

    try{

      setLoading(true);

const {
  data: { user },
} = await supabase.auth.getUser();

const { data: profile } =
  await supabase
    .from("profiles")
    .select("id")
    .eq(
      "auth_user_id",
      user.id
    )
    .single();

const {
  data: teacherExam,
} = await supabase
  .from("exam_teachers")
  .select("id")
  .eq(
    "exam_id",
    exam.id
  )
  .eq(
    "teacher_id",
    profile.id
  )
  .maybeSingle();

if (!teacherExam) {

  showToast(
    "ليس لديك صلاحية للتعديل",
    "error"
  );

  setLoading(false);

  return;
}

      for(const row of results){

        await supabase
          .from("exam_results")
          .update({

            score: row.score,

            notes: row.notes,

            is_passed:
              Number(row.score)
              >=
              Number(
                exam.passing_score
              ),

            updated_at:
              new Date()
                .toISOString()

          })
          .eq("id", row.id);

      }

      showToast(
        "تم حفظ النتائج",
        "success"
      );

      loadResults();

    }catch(err){

      showToast(
        err.message,
        "error"
      );

    }

    finally{

      setLoading(false);

    }

  }

  async function approveResults(){

const {
  data: teacherExam,
} = await supabase
  .from("exam_teachers")
  .select("id")
  .eq(
    "exam_id",
    exam.id
  )
  .eq(
    "teacher_id",
    profile.id
  )
  .maybeSingle();

if (!teacherExam) {

  showToast(
    "ليس لديك صلاحية لاعتماد النتائج",
    "error"
  );

  return;
}

    const { error } =
      await supabase
        .from("exams")
        .update({
          status:"completed"
        })
        .eq("id", exam.id);

    if(error){

      showToast(
        error.message,
        "error"
      );

      return;

    }

    showToast(
      "تم اعتماد النتائج",
      "success"
    );

    onUpdated?.();

  }

  return (

    <div
      style={{
        position:"fixed",
        inset:0,
        background:"rgba(0,0,0,.45)",
        display:"flex",
        justifyContent:"center",
        alignItems:"center",
        zIndex:9999
      }}
    >

    <div
  style={{
    width:"95%",
    maxWidth:"1500px",
    maxHeight:"92vh",
    overflowY:"auto",
    background:"#fff",
    borderRadius:"calc(28px * var(--app-radius-scale,1))",
    padding:"calc(32px * var(--app-density,1))",
    boxShadow:"0 20px 60px rgba(0,0,0,.15)"
  }}
>

        <div
          style={{
            display:"flex",
            justifyContent:"space-between",
            alignItems:"center"
          }}
        >

          <h2>
            نتائج الاختبار
          </h2>

<div
  style={{
    background:"#F8FAFC",
    borderRadius:"calc(20px * var(--app-radius-scale,1))",
    padding:"calc(20px * var(--app-density,1))",
    marginTop:15,
    marginBottom:25
  }}
>
  <h3 style={{margin:0}}>
    {exam.title}
  </h3>

  <p style={{color:"#64748B"}}>
    المسجد:
    {" "}
    {exam.mosques?.name || "-"}
  </p>

  <p style={{color:"#64748B"}}>
    التاريخ:
    {" "}
    {exam.exam_date}
  </p>
</div>

          <button type="button"
            onClick={onClose}
            style={{
              border:"none",
              background:"transparent",
              cursor:"pointer"
            }}
          >
            <X/>
          </button>

        </div>

        <div
  style={{
    display:"grid",
    gridTemplateColumns:"repeat(4,1fr)",
    gap:"calc(15px * var(--app-density,1))",
    marginTop:20,
    marginBottom:25
  }}
>

  <StatCard
    title="عدد الطلاب"
    value={totalStudents}
  />

  <StatCard
    title="نسبة النجاح"
    value={`${successRate}%`}
  />

  <StatCard
    title="المتوسط"
    value={averageScore}
  />

  <StatCard
    title="أعلى درجة"
    value={highestScore}
  />

</div>

      <div
  style={{
    marginTop:"25px"
  }}
>

  <div
  style={{
    marginTop:"20px"
  }}
>

  <div
    style={{
      display:"grid",
      gridTemplateColumns:
        "70px 2fr 140px 140px 140px 3fr",
      gap:"calc(14px * var(--app-density,1))",
      padding:"calc(14px * var(--app-density,1)) calc(18px * var(--app-density,1))",
      background:"#F8FAFC",
      borderRadius:"calc(16px * var(--app-radius-scale,1))",
      fontWeight:"800",
      color:"#0F172A",
      marginBottom:"12px"
    }}
  >
    <div>#</div>
    <div>الطالب</div>
    <div>الدرجة</div>
    <div>النسبة</div>
    <div>الحالة</div>
    <div>ملاحظات</div>
  </div>

  {results.map((result,index)=>{

    const percentage =
      Math.round(
        (
          Number(result.score || 0)
          /
          Number(exam.total_score)
        ) * 100
      );

    const passed =
      Number(result.score)
      >=
      Number(exam.passing_score);

    return(

      <div
        key={result.id}
        style={{
          display:"grid",
          gridTemplateColumns:
            "70px 2fr 140px 140px 140px 3fr",
          gap:"calc(14px * var(--app-density,1))",
          alignItems:"center",
          padding:"calc(16px * var(--app-density,1)) calc(18px * var(--app-density,1))",
          border:"1px solid #E2E8F0",
          borderRadius:"calc(18px * var(--app-radius-scale,1))",
          marginBottom:"12px",
          background:"#fff"
        }}
      >

        <div>{index + 1}</div>

        <div
          style={{
            fontWeight:"700"
          }}
        >
          {result.profiles?.full_name}
        </div>

        <input
          type="number"
          min="0"
          max={exam.total_score}
          value={result.score}
          style={{
            width:"100%",
            height:"46px",
            border:"1px solid #CBD5E1",
            borderRadius:"calc(12px * var(--app-radius-scale,1))",
            textAlign:"center",
            fontWeight:"700"
          }}
          onChange={(e)=>{

            const value =
              Number(e.target.value);

            setResults(
              prev =>
              prev.map(r =>
                r.id === result.id
                ? {
                    ...r,
                    score:value,
                    is_passed:
                      value >=
                      exam.passing_score
                  }
                : r
              )
            );

          }}
        />

        <div>
          {percentage}%
        </div>

        <div>

          <span
            style={{
              background:
                passed
                ? "#DCFCE7"
                : "#FEE2E2",

              color:
                passed
                ? "#166534"
                : "#991B1B",

              padding:"calc(8px * var(--app-density,1)) calc(14px * var(--app-density,1))",
              borderRadius:"999px",
              fontWeight:"700"
            }}
          >
            {passed ? "ناجح" : "راسب"}
          </span>

        </div>

        <textarea
          rows={2}
          value={result.notes || ""}
          style={{
            width:"100%",
            border:"1px solid #CBD5E1",
            borderRadius:"calc(12px * var(--app-radius-scale,1))",
            padding:"calc(10px * var(--app-density,1))",
            resize:"vertical"
          }}
          onChange={(e)=>{

            setResults(
              prev =>
              prev.map(r =>
                r.id === result.id
                ? {
                    ...r,
                    notes:e.target.value
                  }
                : r
              )
            );

          }}
        />

      </div>

    );

  })}

</div>

</div>

        <div
          style={{
            display:"grid",
            gap:"calc(10px * var(--app-density,1))",
           justifyContent:"space-between",
alignItems:"center",
marginTop:"30px",
paddingTop:"calc(20px * var(--app-density,1))",
borderTop:"1px solid #E2E8F0"
          }}
        >

          <button type="button"
            onClick={
              saveResults
            }
            disabled={
              loading
            }
            style={{
              background:"var(--app-color-0f766e,#0F766E)",
              color:"#fff",
              border:"none",
              padding:
              "calc(12px * var(--app-density,1)) calc(18px * var(--app-density,1))",
              borderRadius:"calc(12px * var(--app-radius-scale,1))",
              cursor:"pointer"
            }}
          >

            <Save
              size={18}
            />

            حفظ النتائج

          </button>

          <button type="button"
            onClick={
              approveResults
            }
            style={{
              background:"#2563EB",
              color:"#fff",
              border:"none",
              padding:
              "calc(12px * var(--app-density,1)) calc(18px * var(--app-density,1))",
              borderRadius:"calc(12px * var(--app-radius-scale,1))",
              cursor:"pointer"
            }}
          >

            <CheckCircle
              size={18}
            />

            اعتماد النتائج

          </button>

        </div>

      </div>

    </div>

  );

}

function StatCard({
  title,
  value
}){

  return(

    <div
      style={{
        background:"#F8FAFC",
        borderRadius:"calc(18px * var(--app-radius-scale,1))",
        padding:"calc(20px * var(--app-density,1))"
      }}
    >

      <div
        style={{
          color:"#64748B",
          marginBottom:8
        }}
      >
        {title}
      </div>

      <div
        style={{
          fontSize:"calc(28px * var(--app-font-scale,1))",
          fontWeight:800
        }}
      >
        {value}
      </div>

    </div>

  );

}
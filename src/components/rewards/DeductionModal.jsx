import { useMemo, useState } from "react";

import {
  MinusCircle,
AlertTriangle,
 Ban,
  Save,
  X,
} from "lucide-react";

import { supabase } from "../../lib/supabase";

import ConfirmModal from "../ConfirmModal";

import {
  showToast,
} from "../Toast";

export default function DeductionModal({

  open,

  student,

  penaltyTypes = [],

  selectedDate,

  selectedHalaqa,

  onClose,

  onSaved,

}) {

  const [
    selectedPenalties,
    setSelectedPenalties
  ] = useState([]);

  const [
    notes,
    setNotes
  ] = useState("");

  const [
    saving,
    setSaving
  ] = useState(false);

  const [
    showConfirm,
    setShowConfirm
  ] = useState(false);

  const totalPenalty =
    useMemo(() => {

      return Math.abs(

        selectedPenalties.reduce(
          (sum,item)=>
            sum + item.points,
          0
        )

      );

    },[
      selectedPenalties
    ]);

  if(
    !open ||
    !student
  ) return null;

  const togglePenalty =
  (penalty)=>{

    const exists =
      selectedPenalties.some(
        x =>
        x.id === penalty.id
      );

    if(exists){

      setSelectedPenalties(
        prev =>
          prev.filter(
            x =>
            x.id !== penalty.id
          )
      );

      return;
    }

    setSelectedPenalties(
      prev => [
        ...prev,
        penalty
      ]
    );

  };

  const savePenalty =
  async ()=>{

    try{

const allowedStudent =
  student &&
  students?.some(
    (s) =>
      Number(s.id) ===
      Number(student.id)
  );

if (!allowedStudent) {

  showToast(
    "الطالب لا يتبع حلقتك",
    "error"
  );

  setSaving(false);

  return;
}


      setSaving(true);

      for(
        const penalty
        of selectedPenalties
      ){

        const {
          error
        } = await supabase
        .from(
          "points_transactions"
        )
.insert({

  student_id:
    student.id,

  points:
    penalty.points,

  reason:
    penalty.name,

  reward_type_id:
    penalty.id,

  category:
    "deduction",

  halaqa_id:
    selectedHalaqa,

  transaction_date:
    selectedDate,

  notes:
    notes || ""

});

        if(error)
          throw error;

      }

      const {
        data:
        transactions
      } = await supabase
      .from(
        "points_transactions"
      )
      .select("points")
      .eq(
        "student_id",
        student.id
      );

      const total =
      (
        transactions || []
      ).reduce(
        (sum,item)=>
          sum +
          item.points,
        0
      );

      await supabase
      .from("profiles")
      .update({

        total_points:
          total

      })
      .eq(
        "id",
        student.id
      );

showToast(
  "تم حفظ الخصم بنجاح",
  "success"
);

      onSaved?.();

      onClose?.();

    }

    catch(error){

      console.error(error);

   showToast(
  "تعذر حفظ الخصم",
  "error"
);

    }

    finally{

      setSaving(false);

    }

  };

return (
<>
<div
  style={{
    position: "fixed",
    inset: 0,
    background: "rgba(15,23,42,.55)",
    backdropFilter: "blur(6px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9999,
    padding: "24px",
  }}
>

<div
  style={{
    width: "1100px",
    maxWidth: "95vw",
    height: "90vh",
    maxHeight: "90vh",
    overflowY: "auto",
    overflowX: "hidden",
    background: "#fff",
    borderRadius: "32px",
    padding: "32px",
    boxShadow:
      "0 25px 60px rgba(0,0,0,.18)",
  }}
>

<div
  style={{
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "24px",
  }}
>

<div>
<h2
  style={{
    margin: 0,
    color: "#DC2626",
    fontWeight: "900",
  }}
>
خصم نقاط
</h2>

<p
  style={{
    marginTop: "8px",
    color: "#64748B",
  }}
>
{student?.full_name}
</p>
</div>

<button
  onClick={onClose}
  style={{
    border: "none",
    background: "#F1F5F9",
    width: "42px",
    height: "42px",
    borderRadius: "12px",
    cursor: "pointer",
  }}
>
✕
</button>

</div>

<div
  style={{
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fill,minmax(220px,1fr))",
    gap: "14px",
    marginBottom: "24px",
  }}
>
{penaltyTypes.map((penalty) => {

  const selected =
    selectedPenalties.some(
      x => x.id === penalty.id
    );

  return (

<div
  key={penalty.id}
  onClick={() =>
    togglePenalty(penalty)
  }
  style={{
    cursor: "pointer",
    border: selected
      ? "2px solid #DC2626"
      : "1px solid #E2E8F0",
    background: selected
      ? "#FEF2F2"
      : "#fff",
    borderRadius: "18px",
    padding: "16px",
    transition: ".2s",
  }}
>

<div
  style={{
    display: "flex",
    justifyContent:
      "space-between",
    marginBottom: "12px",
  }}
>

<AlertTriangle
  size={20}
  color="#DC2626"
/>

{selected && (
<div
  style={{
    width: "10px",
    height: "10px",
    borderRadius: "999px",
    background: "#DC2626",
  }}
/>
)}

</div>

<div
  style={{
    fontWeight: "700",
    marginBottom: "8px",
  }}
>
{penalty.name}
</div>

<div
  style={{
    color: "#DC2626",
    fontWeight: "800",
  }}
>
{penalty.points} نقطة
</div>

</div>

  );

})}
</div>

<textarea
  value={notes}
  onChange={(e)=>
    setNotes(e.target.value)
  }
  placeholder="أضف ملاحظات..."
  style={{
    width: "100%",
    minHeight: "110px",
    border:
      "1px solid #E2E8F0",
    borderRadius: "16px",
    padding: "14px",
    resize: "none",
    marginBottom: "20px",
  }}
/>

<div
  style={{
    background:
      "linear-gradient(135deg,#FEF2F2,#FEE2E2)",
    border:
      "1px solid #FCA5A5",
    borderRadius: "18px",
    padding: "18px",
    textAlign: "center",
    marginBottom: "24px",
  }}
>

<div
  style={{
    color: "#7F1D1D",
    marginBottom: "8px",
  }}
>
إجمالي الخصم
</div>

<div
  style={{
    fontSize: "42px",
    fontWeight: "900",
    color: "#DC2626",
  }}
>
-{totalPenalty}
</div>

</div>

<div
  style={{
    display: "flex",
    justifyContent: "flex-end",
    gap: "12px",
  }}
>

<button
  onClick={onClose}
  style={{
    height: "52px",
    padding: "0 24px",
    border:
      "1px solid #CBD5E1",
    borderRadius: "14px",
    background: "#fff",
    fontWeight: "700",
    cursor: "pointer",
  }}
>
إلغاء
</button>

<button
  disabled={
    saving ||
    !selectedPenalties.length
  }
  onClick={() =>
    setShowConfirm(true)
  }
  style={{
    height: "52px",
    padding: "0 24px",
    border: "none",
    borderRadius: "14px",
    background:
      "linear-gradient(135deg,#DC2626,#B91C1C)",
    color: "#fff",
    fontWeight: "800",
    cursor: "pointer",
  }}
>
حفظ الخصم
</button>

</div>

</div>

</div>

<ConfirmModal
  open={showConfirm}
  title="تأكيد الخصم"
  message={`
سيتم خصم
${totalPenalty}
نقطة من الطالب
${student?.full_name}
`}
  onConfirm={savePenalty}
  onCancel={() =>
    setShowConfirm(false)
  }
/>

</>
);
}
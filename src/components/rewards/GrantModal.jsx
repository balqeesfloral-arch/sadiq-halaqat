import { useMemo, useState } from "react";

import {
  Gift,
  Save,
  X,
} from "lucide-react";

import { supabase } from "../../lib/supabase";

import ConfirmModal from "../ConfirmModal";

import {
  showToast,
} from "../Toast";

export default function GrantModal({

  open,

  student,

  rewardTypes = [],

  selectedDate,

  selectedHalaqa,

  onClose,

  onSaved,

}) {

  const [selectedRewards,
    setSelectedRewards] =
    useState([]);

  const [notes,
    setNotes] =
    useState("");

  const [saving,
    setSaving] =
    useState(false);

  const [showConfirm,
    setShowConfirm] =
    useState(false);

  const totalPoints =
    useMemo(() => {

      return selectedRewards
      .reduce(
        (sum,item)=>
          sum + item.points,
        0
      );

    },[
      selectedRewards
    ]);

  if(!open || !student)
    return null;

  const toggleReward =
  (reward)=>{

    const exists =
      selectedRewards.some(
        x =>
        x.id === reward.id
      );

    if(exists){

      setSelectedRewards(
        prev =>
          prev.filter(
            x =>
            x.id !== reward.id
          )
      );

      return;
    }

    setSelectedRewards(
      prev => [
        ...prev,
        reward
      ]
    );

  };

  const saveGrant =
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
        const reward
        of selectedRewards
      ){

        const {
          error
        } = await supabase
        .from(
          "points_transactions"
        )
       .insert({
  student_id: student.id,

  points: reward.points,

  reason: reward.name,

  reward_type_id: reward.id,

  category: "grant",

  halaqa_id: selectedHalaqa,

  transaction_date: selectedDate,

  notes: notes || ""
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
  "تم حفظ المنحة بنجاح",
  "success"
);

      onSaved?.();

      onClose?.();

    }

    catch(error){

      console.error(error);

    showToast(
  "تعذر حفظ المنحة",
  "error"
);

    }

    finally{

      setSaving(false);

    }

  };

console.log(
  "Reward Types:",
  rewardTypes
);

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
    position: "relative",
    scrollbarWidth: "thin",
  }}
>
       <div
  style={{
    textAlign: "center",
    marginBottom: "30px",
    position: "relative",
  }}
>
  <button
    onClick={() => onClose?.()}
    style={{
      position: "absolute",
      left: 0,
      top: 0,
      width: "52px",
      height: "52px",
      borderRadius: "16px",
      border: "1px solid #E2E8F0",
      background: "#fff",
      cursor: "pointer",
    }}
  >
    <X />
  </button>

  <div
    style={{
      width: "84px",
      height: "84px",
      borderRadius: "999px",
      background:
        "linear-gradient(135deg,#0F766E,#115E59)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      margin: "0 auto 16px",
      color: "#fff",
    }}
  >
    <Gift size={40} />
  </div>

  <h2
    style={{
      margin: 0,
      fontSize: "34px",
      fontWeight: "900",
    }}
  >
    منح نقاط
  </h2>

  <div
    style={{
      marginTop: "8px",
      color: "#64748B",
    }}
  >
    اختر أنواع المنح للطالب
  </div>
</div>

          

          <div
            className="
            modal-body
            "
          >
<div
  style={{
    display: "grid",
    gridTemplateColumns:
      "repeat(3,1fr)",
    gap: "16px",
    marginBottom: "28px",
  }}
>
  <div
    style={{
      border: "1px solid #E2E8F0",
      borderRadius: "18px",
      padding: "18px",
      textAlign: "center",
    }}
  >
    <div style={{color:"#64748B"}}>
      الطالب
    </div>

    <div
      style={{
        marginTop:"8px",
        fontWeight:"800"
      }}
    >
      {student.full_name}
    </div>
  </div>

  <div
    style={{
      border: "1px solid #E2E8F0",
      borderRadius: "18px",
      padding: "18px",
      textAlign: "center",
    }}
  >
    <div style={{color:"#64748B"}}>
      الحلقة
    </div>

    <div
      style={{
        marginTop:"8px",
        fontWeight:"800"
      }}
    >
      {selectedHalaqa || "-"}
    </div>
  </div>

  <div
    style={{
      border: "1px solid #E2E8F0",
      borderRadius: "18px",
      padding: "18px",
      textAlign: "center",
    }}
  >
    <div style={{color:"#64748B"}}>
      التاريخ
    </div>

    <div
      style={{
        marginTop:"8px",
        fontWeight:"800"
      }}
    >
      {selectedDate}
    </div>
  </div>
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
  {rewardTypes.map((reward) => {

    const selected =
      selectedRewards.some(
        x => x.id === reward.id
      );

    return (
      <div
        key={reward.id}
        onClick={() =>
          toggleReward(reward)
        }
        style={{
          cursor: "pointer",
          border: selected
            ? "2px solid #0F766E"
            : "1px solid #E2E8F0",
          background: selected
            ? "#F0FDFA"
            : "#fff",
          borderRadius: "18px",
          padding: "16px",
          transition: ".25s",
position: "relative",
boxShadow:
  "0 8px 20px rgba(15,118,110,.08)",
transform:
  selected
    ? "translateY(-4px)"
    : "translateY(0)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent:
              "space-between",
            alignItems: "center",
            marginBottom: "12px",
          }}
        >
          <Gift
            size={20}
            color="#0F766E"
          />

          {selected && (
            <div
              style={{
                width: "10px",
                height: "10px",
                borderRadius: "999px",
                background:
                  "#0F766E",
              }}
            />
          )}
        </div>

        <div
          style={{
            fontWeight: "700",
            marginBottom: "8px",
            color: "#0F172A",
          }}
        >
          {reward.name}
        </div>

        <div
          style={{
            color: "#16A34A",
            fontWeight: "800",
          }}
        >
          +{reward.points} نقطة
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
    fontFamily: "inherit",
    marginBottom: "20px",
  }}
/>

        <div
  style={{
    background:
      "linear-gradient(135deg,#ECFDF5,#D1FAE5)",
    border:
      "1px solid #A7F3D0",
    borderRadius: "18px",
    padding: "18px",
    textAlign: "center",
  }}
>
  <div
    style={{
      color: "#065F46",
      marginBottom: "8px",
    }}
  >
    إجمالي النقاط
  </div>

  <div
    style={{
      fontSize: "42px",
      fontWeight: "900",
      color: "#059669",
    }}
  >
    +{totalPoints}
  </div>
</div>
</div>
          <div
  style={{
    display: "flex",
    justifyContent:
      "space-between",
    alignItems: "center",
    marginTop: "24px",
  }}
>

            <button
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
              onClick={() => onClose?.()}
              className="
              btn-secondary
              "
            >
              إلغاء
            </button>

            <button
style={{
  height: "52px",
  padding: "0 24px",
  border: "none",
  borderRadius: "14px",
  background:
    "linear-gradient(135deg,#0F766E,#115E59)",
  color: "#fff",
  fontWeight: "800",
  display: "flex",
  alignItems: "center",
  gap: "8px",
  cursor: "pointer",
}}
              disabled={
                saving ||
                !selectedRewards
                .length
              }

              onClick={()=>
                setShowConfirm(
                  true
                )
              }

              className="
              btn-primary
              "
            >

              <Save
                size={16}
              />

              حفظ

            </button>

          </div>

        </div>

      </div>

      <ConfirmModal

        open={
          showConfirm
        }

        title="
        تأكيد المنح
        "

        message={`
        سيتم منح
        ${totalPoints}
        نقطة للطالب
        ${student.full_name}
        `}

        onConfirm={
          saveGrant
        }

        onCancel={()=>
          setShowConfirm(
            false
          )
        }

      />

    </>

  );

}
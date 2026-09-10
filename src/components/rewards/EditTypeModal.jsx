import { useEffect, useState } from "react";

import {
  Save,
  X,
  Pencil,
} from "lucide-react";

import { supabase } from "../../lib/supabase";

import AppSelect from "../AppSelect";

import { showToast } from "../Toast";

export default function EditTypeModal({

  open,

  item,

  onClose,

  onSaved,

}) {

  const [name,setName] =
    useState("");

  const [points,setPoints] =
    useState("");


  const [type,setType] =
    useState("reward");

  const [saving,setSaving] =
    useState(false);

  useEffect(()=>{

    if(!item) return;

    setName(
      item.name || ""
    );

    setPoints(
      item.points || 0
    );

    setType(
      item.type || "reward"
    );

  },[item]);

  if(
    !open ||
    !item
  ) return null;

  const saveChanges =
  async ()=>{

    try{

      setSaving(true);

      const {
        error
      } = await supabase

      .from("reward_types")

      .update({

        name,

        points:
          Number(points),

        type

      })

      .eq(
        "id",
        item.id
      );

      if(error)
        throw error;

      showToast(
        "تم تحديث النوع"
      );

      onSaved?.();

      onClose?.();

    }

    catch(error){

      console.error(error);

      showToast(
        "فشل التحديث"
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
          width: "700px",
          maxWidth: "95vw",
          background: "#fff",
          borderRadius: "32px",
          padding: "32px",
          boxShadow:
            "0 25px 60px rgba(0,0,0,.18)",
          position: "relative",
        }}
      >

        {/* HEADER */}

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
            {item ? (
              <Pencil size={40} />
            ) : (
              <PlusCircle size={40} />
            )}
          </div>

          <h2
            style={{
              margin: 0,
              fontSize: "32px",
              fontWeight: "900",
            }}
          >
            {item
              ? "تعديل النوع"
              : "إضافة نوع جديد"}
          </h2>

          <div
            style={{
              marginTop: "8px",
              color: "#64748B",
            }}
          >
            إدارة أنواع المنح والخصومات
          </div>
        </div>

        {/* FORM */}

        <div
          style={{
            display: "grid",
            gap: "18px",
          }}
        >
          <div>
            <label
              style={{
                display: "block",
                marginBottom: "8px",
                fontWeight: "700",
              }}
            >
              الاسم
            </label>

            <input
              value={name}
              onChange={(e) =>
                setName(e.target.value)
              }
              style={{
                width: "100%",
                height: "54px",
                border:
                  "1px solid #E2E8F0",
                borderRadius: "14px",
                padding: "0 16px",
              }}
            />
          </div>

          <div>
            <label
              style={{
                display: "block",
                marginBottom: "8px",
                fontWeight: "700",
              }}
            >
              النقاط
            </label>

            <input
              type="number"
              value={points}
              onChange={(e) =>
                setPoints(e.target.value)
              }
              style={{
                width: "100%",
                height: "54px",
                border:
                  "1px solid #E2E8F0",
                borderRadius: "14px",
                padding: "0 16px",
              }}
            />
          </div>

          <div>
            <label
              style={{
                display: "block",
                marginBottom: "8px",
                fontWeight: "700",
              }}
            >
              النوع
            </label>

            <AppSelect
              value={type}
              onChange={setType}
              options={[
                {
                  value: "reward",
                  label: "منحة",
                },
                {
                  value: "penalty",
                  label: "خصم",
                },
              ]}
            />
          </div>
        </div>

        {/* FOOTER */}

        <div
          style={{
            display: "flex",
            justifyContent:
              "space-between",
            marginTop: "30px",
          }}
        >
          <button
            onClick={() => onClose?.()}
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
            disabled={saving}
            onClick={
              item
                ? saveChanges
                : saveType
            }
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
          >
            {item ? (
              <Pencil size={16} />
            ) : (
              <PlusCircle size={16} />
            )}

            {item
              ? "حفظ التعديلات"
              : "إنشاء النوع"}
          </button>
        </div>

      </div>
    </div>
  </>
);
}
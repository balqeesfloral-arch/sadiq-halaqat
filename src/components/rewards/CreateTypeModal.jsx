import { useState } from "react";

import {
  Save,
  X,
  PlusCircle,
} from "lucide-react";

import { supabase } from "../../lib/supabase";

import AppSelect from "../AppSelect";

import {
  showToast,
} from "../Toast";

export default function CreateTypeModal({

  open,

  defaultType = "reward",

  onClose,

  onSaved,

}) {

  const [name,setName] =
    useState("");

  const [points,setPoints] =
    useState("");

  const [type,setType] =
    useState(defaultType);

  const [saving,setSaving] =
    useState(false);

  if(!open) return null;

  const saveType =
  async ()=>{

    if(!name.trim()){

      showToast(
        "أدخل الاسم"
      );

      return;
    }

    if(!points){

      showToast(
        "أدخل النقاط"
      );

      return;
    }

    try{

      setSaving(true);

      const {
        error
      } = await supabase

      .from("reward_types")

      .insert({

        name,

        points:
          Number(points),

        type,

        is_active:true

      });

      if(error)
        throw error;

      showToast(
        "تم إنشاء النوع"
      );

      onSaved?.();

      onClose?.();

    }

    catch(error){

      console.error(error);

      showToast(
        "فشل الحفظ"
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
            <PlusCircle size={40} />
          </div>

          <h2
            style={{
              margin: 0,
              fontSize: "32px",
              fontWeight: "900",
            }}
          >
            إضافة نوع جديد
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
            onClick={saveType}
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
            <PlusCircle size={16} />
            إنشاء النوع
          </button>
        </div>

      </div>
    </div>
  </>
);

}
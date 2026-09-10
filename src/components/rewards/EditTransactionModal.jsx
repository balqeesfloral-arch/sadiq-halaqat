import { useEffect, useState } from "react";

import {
  X,
  Save,
  Gift,
  MinusCircle,
} from "lucide-react";

import { supabase } from "../../lib/supabase";

export default function EditTransactionModal({

  open,
  transaction,
  onClose,
  onSaved,

}) {

  const [points, setPoints] =
    useState("");

  const [saving, setSaving] =
    useState(false);

  useEffect(() => {

    if (!transaction) return;

    setPoints(
      transaction.points || 0
    );

  }, [transaction]);

  if (
    !open ||
    !transaction
  ) {
    return null;
  }

  const saveChanges =
  async () => {

    try {

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

      const { error } =
        await supabase

          .from(
            "points_transactions"
          )

          .update({

            points:
              Number(points)

          })

          .eq(
            "id",
            transaction.id
          );

      if (error)
        throw error;

      onSaved?.();

      onClose?.();

    }

    catch (error) {

      console.error(error);

      alert(
        "فشل تحديث العملية"
      );

    }

    finally {

      setSaving(false);

    }

  };

  const isGrant =
    transaction.category ===
    "grant";

  return (

    <div
      style={{
        position: "fixed",
        inset: 0,
        background:
          "rgba(15,23,42,.55)",
        backdropFilter:
          "blur(6px)",
        display: "flex",
        justifyContent:
          "center",
        alignItems:
          "center",
        zIndex: 9999,
        padding: "20px",
      }}
    >

      <div
        style={{
          width: "650px",
          maxWidth: "95vw",
          background: "#fff",
          borderRadius: "30px",
          padding: "32px",
          boxShadow:
            "0 25px 60px rgba(0,0,0,.18)",
          position: "relative",
        }}
      >

        {/* CLOSE */}

        <button

          onClick={onClose}

          style={{
            position: "absolute",
            left: "24px",
            top: "24px",
            width: "48px",
            height: "48px",
            borderRadius: "14px",
            border:
              "1px solid #E2E8F0",
            background: "#fff",
            cursor: "pointer",
          }}

        >

          <X />

        </button>

        {/* ICON */}

        <div
          style={{
            width: "84px",
            height: "84px",
            borderRadius: "999px",
            margin: "0 auto",
            background:
              isGrant
                ? "#ECFDF5"
                : "#FEF2F2",
            color:
              isGrant
                ? "#16A34A"
                : "#DC2626",
            display: "flex",
            alignItems: "center",
            justifyContent:
              "center",
          }}
        >

          {isGrant ? (

            <Gift size={42} />

          ) : (

            <MinusCircle
              size={42}
            />

          )}

        </div>

        {/* TITLE */}

        <h2
          style={{
            textAlign: "center",
            marginTop: "18px",
            marginBottom: "8px",
            fontSize: "30px",
            fontWeight: "900",
          }}
        >
          تعديل العملية
        </h2>

        <p
          style={{
            textAlign: "center",
            color: "#64748B",
            marginBottom: "32px",
          }}
        >
          تعديل بيانات المنح والخصومات
        </p>

        {/* INFO */}

        <div
          style={{
            display: "grid",
            gap: "18px",
          }}
        >

          <div>

            <label>
              الطالب
            </label>

            <input

              disabled

              value={
                transaction.student_name ||
                ""
              }

              style={{
                width: "100%",
                height: "54px",
                border:
                  "1px solid #E2E8F0",
                borderRadius:
                  "14px",
                padding:
                  "0 14px",
                background:
                  "#F8FAFC",
              }}

            />

          </div>

          <div>

            <label>
              نوع العملية
            </label>

            <input

              disabled

              value={
                isGrant
                  ? "منح"
                  : "خصم"
              }

              style={{
                width: "100%",
                height: "54px",
                border:
                  "1px solid #E2E8F0",
                borderRadius:
                  "14px",
                padding:
                  "0 14px",
                background:
                  "#F8FAFC",
              }}

            />

          </div>

          <div>

            <label>
              النقاط
            </label>

            <input

              type="number"

              value={points}

              onChange={(e) =>
                setPoints(
                  e.target.value
                )
              }

              style={{
                width: "100%",
                height: "56px",
                border:
                  "1px solid #CBD5E1",
                borderRadius:
                  "14px",
                padding:
                  "0 14px",
                fontSize: "16px",
                fontWeight: "700",
              }}

            />

          </div>

        </div>

        {/* FOOTER */}

        <div
          style={{
            display: "flex",
            justifyContent:
              "space-between",
            marginTop: "34px",
          }}
        >

          <button

            onClick={onClose}

            style={{
              height: "52px",
              padding:
                "0 24px",
              border:
                "1px solid #CBD5E1",
              borderRadius:
                "14px",
              background:
                "#FFFFFF",
              fontWeight: "700",
              cursor: "pointer",
            }}

          >

            إلغاء

          </button>

          <button

            disabled={saving}

            onClick={
              saveChanges
            }

            style={{
              height: "52px",
              padding:
                "0 24px",
              border: "none",
              borderRadius:
                "14px",
              background:
                "linear-gradient(135deg,#0F766E,#115E59)",
              color: "#fff",
              fontWeight: "800",
              display: "flex",
              alignItems:
                "center",
              gap: "10px",
              cursor: "pointer",
            }}

          >

            <Save size={16} />

            حفظ التعديلات

          </button>

        </div>

      </div>

    </div>

  );

}
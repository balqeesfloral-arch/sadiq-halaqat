import { useState } from "react";

import {
  Gift,
  MinusCircle,
  Pencil,
  Trash2,
  Power,
  Plus,
} from "lucide-react";

import ConfirmModal from "../ConfirmModal";

export default function RewardTypesTab({

  rewardTypes = [],

  onCreate,

  onEdit,

  onDelete,

  onToggleStatus,

}) {

  const [
    confirmDelete,
    setConfirmDelete
  ] = useState(null);

  const [
    confirmToggle,
    setConfirmToggle
  ] = useState(null);

  const rewards =
    rewardTypes.filter(
      x => x.type === "reward"
    );

  const penalties =
    rewardTypes.filter(
      x => x.type === "penalty"
    );

  const renderTable =
  (title, rows, color)=>(

    <div
      style={{
        background:"#fff",
        borderRadius:"22px",
        border:"1px solid #E2E8F0",
        overflow:"hidden",
        marginBottom:"24px"
      }}
    >

      <div
        style={{
          padding:"18px 22px",
          borderBottom:
            "1px solid #E2E8F0",
          display:"flex",
          justifyContent:
            "space-between",
          alignItems:"center"
        }}
      >

        <div
          style={{
            display:"flex",
            alignItems:"center",
            gap:"10px"
          }}
        >

          {title ===
          "أنواع المنح"

          ? <Gift size={20}/>

          : <MinusCircle
              size={20}
            />
          }

          <strong>
            {title}
          </strong>

        </div>

    <button
  onClick={() =>
    onCreate(
      title === "أنواع المنح"
        ? "reward"
        : "penalty"
    )
  }
  style={{
    height: "48px",
    padding: "0 20px",
    border: "none",
    borderRadius: "14px",
    background:
      "linear-gradient(135deg,#0F766E,#115E59)",
    color: "#fff",
    fontWeight: "800",
    fontSize: "14px",
    display: "flex",
    alignItems: "center",
    gap: "10px",
    cursor: "pointer",
    boxShadow:
      "0 8px 20px rgba(15,118,110,.25)",
    transition: "all .2s ease",
  }}
  onMouseEnter={(e) => {
    e.currentTarget.style.transform =
      "translateY(-2px)";
  }}
  onMouseLeave={(e) => {
    e.currentTarget.style.transform =
      "translateY(0)";
  }}
>
  <Plus size={18} />

  <span>إضافة نوع جديد</span>
</button>

      </div>

      <div
  style={{
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fill,minmax(280px,1fr))",
    gap: "18px",
    padding: "20px",
  }}
>
  {rows.map((item) => (
    <div
      key={item.id}
      style={{
        border: "1px solid #E2E8F0",
        borderRadius: "20px",
        padding: "20px",
        background: "#fff",
        transition: ".2s",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "16px",
        }}
      >
        <strong>
          {item.name}
        </strong>

        <span
          style={{
            background:
              color === "#16A34A"
                ? "#ECFDF5"
                : "#FEF2F2",
            color,
            padding: "8px 14px",
            borderRadius: "999px",
            fontWeight: "800",
          }}
        >
          {item.points > 0
            ? `+${item.points}`
            : item.points}
        </span>
      </div>

      <div
        onClick={() =>
          setConfirmToggle(item)
        }
        style={{
          cursor: "pointer",
          display: "inline-flex",
          alignItems: "center",
          gap: "8px",
          padding: "8px 14px",
          borderRadius: "999px",
          background: item.is_active
            ? "#ECFDF5"
            : "#FEF2F2",
          color: item.is_active
            ? "#059669"
            : "#DC2626",
          fontWeight: "700",
          fontSize: "13px",
        }}
      >
        <Power size={14} />
        {item.is_active
          ? "فعال"
          : "معطل"}
      </div>

      <div
        style={{
          display: "flex",
          gap: "10px",
          marginTop: "18px",
        }}
      >
        <button
          onClick={() =>
            onEdit(item)
          }
          style={{
            flex: 1,
            height: "42px",
            border: "none",
            borderRadius: "12px",
            background: "#EEF2FF",
            color: "#4F46E5",
            cursor: "pointer",
          }}
        >
          <Pencil size={16}/>
        </button>

        <button
          onClick={() =>
            setConfirmDelete(item)
          }
          style={{
            flex: 1,
            height: "42px",
            border: "none",
            borderRadius: "12px",
            background: "#FEF2F2",
            color: "#DC2626",
            cursor: "pointer",
          }}
        >
          <Trash2 size={16}/>
        </button>
      </div>
    </div>
  ))}
</div>
</div>
  );

  return (

    <>

      {renderTable(
        "أنواع المنح",
        rewards,
        "#16A34A"
      )}

      {renderTable(
        "أنواع الخصومات",
        penalties,
        "#DC2626"
      )}

      <ConfirmModal

        open={
          !!confirmDelete
        }

        title="
        حذف النوع
        "

        message={
          confirmDelete

          ? `هل تريد حذف ${confirmDelete.name} ؟`

          : ""
        }

        onConfirm={() => {

          onDelete(
            confirmDelete
          );

          setConfirmDelete(
            null
          );

        }}

        onCancel={()=>
          setConfirmDelete(
            null
          )
        }

      />

      <ConfirmModal

        open={
          !!confirmToggle
        }

        title="
        تغيير الحالة
        "

        message={
          confirmToggle

          ? `هل تريد تغيير حالة ${confirmToggle.name} ؟`

          : ""
        }

        onConfirm={() => {

          onToggleStatus(
            confirmToggle
          );

          setConfirmToggle(
            null
          );

        }}

        onCancel={()=>
          setConfirmToggle(
            null
          )
        }

      />

    </>

  );

}
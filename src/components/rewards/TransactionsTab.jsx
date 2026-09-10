import { useMemo, useState } from "react";

import {
  Search,
  Trash2,
  Pencil,
  Gift,
  MinusCircle,
} from "lucide-react";

import ConfirmModal from "../ConfirmModal";

export default function TransactionsTab({

  transactions = [],

  onDelete,

  onEdit,

}) {

  const [
    search,
    setSearch
  ] = useState("");

  const [
    confirmDelete,
    setConfirmDelete
  ] = useState(null);

  const filtered =
  useMemo(() => {

    if (!search)
      return transactions;

    return transactions.filter(
      item =>
        item.student_name
          ?.toLowerCase()
          .includes(
            search.toLowerCase()
          )
    );

  }, [
    transactions,
    search
  ]);


  return (

    <>

  

      <div
        style={{
          background:"#fff",
          borderRadius:"22px",
          overflow:"hidden",
          border:
            "1px solid #E2E8F0"
        }}
      >

        <div
  style={{
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fill,minmax(340px,1fr))",
    gap: "16px",
  }}
>
  {filtered.map((item) => (

    <div
      key={item.id}
      style={{
        background: "#fff",
        border: "1px solid #E2E8F0",
        borderRadius: "24px",
        padding: "20px",
        boxShadow:
          "0 10px 25px rgba(15,23,42,.05)",
      }}
    >

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: "16px",
        }}
      >

        <span
          style={{
            background:
              item.category === "grant"
                ? "#ECFDF5"
                : "#FEF2F2",
            color:
              item.category === "grant"
                ? "#16A34A"
                : "#DC2626",
            padding: "8px 14px",
            borderRadius: "999px",
            fontWeight: "700",
          }}
        >
          {item.category === "grant"
            ? "منح"
            : "خصم"}
        </span>

        <div
          style={{
            color: "#64748B",
          }}
        >
          {item.transaction_date}
        </div>

      </div>

      <h3
        style={{
          margin: 0,
          marginBottom: "10px",
          color: "#0F172A",
        }}
      >
        {item.student_name}
      </h3>

      <div
        style={{
          color: "#475569",
          marginBottom: "16px",
        }}
      >
        {item.reward_name}
      </div>

      <div
        style={{
          fontSize: "30px",
          fontWeight: "900",
          color:
            item.points > 0
              ? "#16A34A"
              : "#DC2626",
        }}
      >
        {item.points > 0 ? "+" : ""}
        {item.points}
      </div>

      <div
        style={{
          display: "flex",
          gap: "10px",
          marginTop: "18px",
        }}
      >

        <button
  onClick={() => onEdit(item)}
  style={{
    width: "44px",
    height: "44px",
    borderRadius: "12px",
    border: "1px solid #D1FAE5",
    background: "#ECFDF5",
    color: "#059669",
    cursor: "pointer",
  }}
>
  <Pencil size={18} />
</button>

     <button
  onClick={() =>
    setConfirmDelete(item)
  }
  style={{
    width: "44px",
    height: "44px",
    borderRadius: "12px",
    border: "1px solid #FECACA",
    background: "#FEF2F2",
    color: "#DC2626",
    cursor: "pointer",
  }}
>
  <Trash2 size={18} />
</button>

      </div>

    </div>

  ))}
</div>

      </div>

      <ConfirmModal

        open={
          !!confirmDelete
        }

        title="
        حذف العملية
        "

        message={
          confirmDelete

          ? `هل تريد حذف العملية الخاصة بالطالب ${confirmDelete.student_name} ؟`

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

    </>

  );

}
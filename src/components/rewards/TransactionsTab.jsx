import {
  useMemo,
  useState,
} from "react";

import {
  ArrowDownRight,
  ArrowUpRight,
  CalendarDays,
  CircleHelp,
  FileText,
  Gift,
  History,
  MinusCircle,
  Pencil,
  Search,
  Sparkles,
  Trash2,
  UserRound,
  WalletCards,
  X,
} from "lucide-react";

import ConfirmModal from "../ConfirmModal";

/* =========================================================
   Helpers
========================================================= */

function formatNumber(value) {
  const number =
    Number(value) || 0;

  try {
    return new Intl.NumberFormat(
      "ar-SA"
    ).format(number);
  } catch {
    return String(number);
  }
}

function toLocalDate(value) {
  if (!value) {
    return null;
  }

  const text =
    String(value).slice(
      0,
      10
    );

  const [
    year,
    month,
    day,
  ] =
    text
      .split("-")
      .map(Number);

  if (
    !year ||
    !month ||
    !day
  ) {
    return null;
  }

  return new Date(
    year,
    month - 1,
    day,
    12,
    0,
    0
  );
}

function formatGregorian(value) {
  const date =
    toLocalDate(value);

  if (!date) {
    return "—";
  }

  try {
    return new Intl.DateTimeFormat(
      "ar-SA-u-ca-gregory",
      {
        day: "numeric",
        month: "short",
        year: "numeric",
      }
    ).format(date);
  } catch {
    return String(value);
  }
}

function formatHijri(value) {
  const date =
    toLocalDate(value);

  if (!date) {
    return "—";
  }

  try {
    return new Intl.DateTimeFormat(
      "ar-SA-u-ca-islamic-umalqura",
      {
        day: "numeric",
        month: "short",
        year: "numeric",
      }
    ).format(date);
  } catch {
    return "—";
  }
}

function getCategoryMeta(item) {
  if (
    item?.category ===
    "grant"
  ) {
    return {
      key: "grant",
      label: "منحة",
      Icon: Gift,
      sign: "+",
    };
  }

  if (
    item?.category ===
    "deduction"
  ) {
    return {
      key: "deduction",
      label: "خصم",
      Icon: MinusCircle,
      sign: "-",
    };
  }

  return {
    key: "other",
    label: "عملية",
    Icon: WalletCards,
    sign:
      Number(item?.points) >= 0
        ? "+"
        : "-",
  };
}

function getDisplayPoints(item) {
  const meta =
    getCategoryMeta(item);

  const amount =
    Math.abs(
      Number(
        item?.points
      ) || 0
    );

  return `${meta.sign}${formatNumber(
    amount
  )}`;
}

/* =========================================================
   Transaction Card
========================================================= */

function TransactionCard({
  item,
  onEdit,
  onAskDelete,
  busy,
}) {
  const meta =
    getCategoryMeta(item);

  const CategoryIcon =
    meta.Icon;

  const reason =
    item.reward_name ||
    item.reason ||
    "بدون سبب محدد";

  const canEdit =
    meta.key === "grant" ||
    meta.key === "deduction";

  return (
    <article
      className={`transaction-card ${meta.key}`}
    >
      <div className="transaction-card-accent" />

      {/* =====================================
          TOP
      ===================================== */}

      <div className="transaction-card-top">
        <span
          className={`transaction-category-badge ${meta.key}`}
        >
          <CategoryIcon
            size={12}
          />

          {meta.label}
        </span>

        <div className="transaction-date">
          <CalendarDays
            size={12}
          />

          <div>
            <strong>
              {formatGregorian(
                item.transaction_date
              )}
            </strong>

            <small>
              {formatHijri(
                item.transaction_date
              )}
            </small>
          </div>
        </div>
      </div>

      {/* =====================================
          STUDENT
      ===================================== */}

      <div className="transaction-student">
        <span className="transaction-student-icon">
          <UserRound
            size={17}
          />
        </span>

        <div>
          <small>
            الطالب
          </small>

          <strong>
            {item.student_name ||
              "طالب"}
          </strong>
        </div>
      </div>

      {/* =====================================
          REASON
      ===================================== */}

      <div className="transaction-reason">
        <span>
          <FileText
            size={12}
          />
          السبب
        </span>

        <strong>
          {reason}
        </strong>
      </div>

      {/* =====================================
          VALUE
      ===================================== */}

      <div className="transaction-value-row">
        <div>
          <span>
            قيمة العملية
          </span>

          <strong>
            {getDisplayPoints(
              item
            )}

            <small>
              نقطة
            </small>
          </strong>
        </div>

        <span className="transaction-id">
          #{item.id}
        </span>
      </div>

      {/* =====================================
          NOTES
      ===================================== */}

      {item.notes && (
        <div className="transaction-note">
          {item.notes}
        </div>
      )}

      {/* =====================================
          ACTIONS
      ===================================== */}

      <div className="transaction-actions">
        <button
          type="button"
          className="transaction-action edit"
          disabled={
            !canEdit ||
            busy
          }
          onClick={() =>
            onEdit?.(item)
          }
          title={
            canEdit
              ? "تعديل العملية"
              : "هذا النوع غير قابل للتعديل من هذه النافذة"
          }
        >
          <Pencil
            size={14}
          />

          تعديل
        </button>

        <button
          type="button"
          className="transaction-action delete"
          disabled={busy}
          onClick={() =>
            onAskDelete(item)
          }
        >
          <Trash2
            size={14}
          />

          حذف
        </button>
      </div>
    </article>
  );
}

/* =========================================================
   Main
========================================================= */

export default function TransactionsTab({
  transactions = [],
  onDelete,
  onEdit,
}) {
  const [
    search,
    setSearch,
  ] =
    useState("");

  const [
    category,
    setCategory,
  ] =
    useState("all");

  const [
    confirmDelete,
    setConfirmDelete,
  ] =
    useState(null);

  const [
    busyId,
    setBusyId,
  ] =
    useState(null);

  /* =====================================================
     Derived
  ===================================================== */

  const normalizedSearch =
    search
      .trim()
      .toLowerCase();

  const filtered =
    useMemo(() => {
      return transactions.filter(
        (item) => {
          const meta =
            getCategoryMeta(
              item
            );

          if (
            category !== "all" &&
            meta.key !== category
          ) {
            return false;
          }

          if (
            !normalizedSearch
          ) {
            return true;
          }

          const haystack =
            [
              item.student_name,
              item.reward_name,
              item.reason,
              item.notes,
              item.id,
            ]
              .filter(
                Boolean
              )
              .join(" ")
              .toLowerCase();

          return haystack.includes(
            normalizedSearch
          );
        }
      );
    }, [
      transactions,
      normalizedSearch,
      category,
    ]);

  const totalGrants =
    transactions.filter(
      (item) =>
        item.category ===
        "grant"
    ).length;

  const totalDeductions =
    transactions.filter(
      (item) =>
        item.category ===
        "deduction"
    ).length;

  const grantsPoints =
    transactions
      .filter(
        (item) =>
          item.category ===
          "grant"
      )
      .reduce(
        (sum, item) =>
          sum +
          Math.abs(
            Number(
              item.points
            ) || 0
          ),
        0
      );

  const deductionPoints =
    transactions
      .filter(
        (item) =>
          item.category ===
          "deduction"
      )
      .reduce(
        (sum, item) =>
          sum +
          Math.abs(
            Number(
              item.points
            ) || 0
          ),
        0
      );

  const netPoints =
    grantsPoints -
    deductionPoints;

  /* =====================================================
     Delete
  ===================================================== */

  async function confirmDeleteItem() {
    const item =
      confirmDelete;

    if (!item) {
      return;
    }

    setConfirmDelete(
      null
    );

    try {
      setBusyId(
        item.id
      );

      await onDelete?.(
        item
      );
    } finally {
      setBusyId(
        null
      );
    }
  }

  /* =====================================================
     Render
  ===================================================== */

  return (
    <>
      <section
        className="transactions-tab"
        dir="rtl"
      >
        {/* =========================================
            HEADER
        ========================================= */}

        <header className="transactions-header">
          <div className="transactions-heading">
            <span className="transactions-heading-icon">
              <History
                size={19}
              />
            </span>

            <div>
              <div className="transactions-eyebrow">
                <Sparkles
                  size={11}
                />

                سجل النقاط
              </div>

              <h2>
                العمليات
              </h2>

              <p>
                مراجعة المنح والخصومات وتعديلها أو حذفها مع عرض التاريخ الهجري والميلادي.
              </p>
            </div>
          </div>

          <div className="transactions-overview">
            <div>
              <span>
                العمليات
              </span>

              <strong>
                {formatNumber(
                  transactions.length
                )}
              </strong>
            </div>

            <div>
              <span>
                المنح
              </span>

              <strong className="positive">
                {formatNumber(
                  totalGrants
                )}
              </strong>
            </div>

            <div>
              <span>
                الخصومات
              </span>

              <strong className="negative">
                {formatNumber(
                  totalDeductions
                )}
              </strong>
            </div>

            <div>
              <span>
                صافي النقاط
              </span>

              <strong
                className={
                  netPoints < 0
                    ? "negative"
                    : "gold"
                }
              >
                {netPoints > 0
                  ? "+"
                  : ""}
                {formatNumber(
                  netPoints
                )}
              </strong>
            </div>
          </div>
        </header>

        {/* =========================================
            TOOLBAR
        ========================================= */}

        <div className="transactions-toolbar">
          <div className="transactions-search">
            <Search
              size={15}
            />

            <input
              type="search"
              value={search}
              onChange={(
                event
              ) =>
                setSearch(
                  event.target
                    .value
                )
              }
              placeholder="ابحث باسم الطالب أو السبب أو رقم العملية..."
            />

            {search && (
              <button
                type="button"
                onClick={() =>
                  setSearch("")
                }
                aria-label="مسح البحث"
              >
                <X
                  size={13}
                />
              </button>
            )}
          </div>

          <div className="transactions-category-filter">
            <button
              type="button"
              className={
                category ===
                "all"
                  ? "active"
                  : ""
              }
              onClick={() =>
                setCategory(
                  "all"
                )
              }
            >
              الكل
              <span>
                {formatNumber(
                  transactions.length
                )}
              </span>
            </button>

            <button
              type="button"
              className={
                category ===
                "grant"
                  ? "active grant"
                  : "grant"
              }
              onClick={() =>
                setCategory(
                  "grant"
                )
              }
            >
              <Gift
                size={12}
              />

              المنح
              <span>
                {formatNumber(
                  totalGrants
                )}
              </span>
            </button>

            <button
              type="button"
              className={
                category ===
                "deduction"
                  ? "active deduction"
                  : "deduction"
              }
              onClick={() =>
                setCategory(
                  "deduction"
                )
              }
            >
              <MinusCircle
                size={12}
              />

              الخصومات
              <span>
                {formatNumber(
                  totalDeductions
                )}
              </span>
            </button>
          </div>
        </div>

        {/* =========================================
            RESULT BAR
        ========================================= */}

        {(normalizedSearch ||
          category !==
            "all") && (
          <div className="transactions-result-bar">
            <span>
              عرض
              {" "}
              <b>
                {formatNumber(
                  filtered.length
                )}
              </b>
              {" "}
              من
              {" "}
              <b>
                {formatNumber(
                  transactions.length
                )}
              </b>
              {" "}
              عملية
            </span>

            <button
              type="button"
              onClick={() => {
                setSearch("");
                setCategory(
                  "all"
                );
              }}
            >
              مسح التصفية
            </button>
          </div>
        )}

        {/* =========================================
            CARDS
        ========================================= */}

        {filtered.length > 0 ? (
          <div className="transactions-grid">
            {filtered.map(
              (item) => (
                <TransactionCard
                  key={item.id}
                  item={item}
                  onEdit={
                    onEdit
                  }
                  onAskDelete={
                    setConfirmDelete
                  }
                  busy={
                    busyId ===
                    item.id
                  }
                />
              )
            )}
          </div>
        ) : (
          <div className="transactions-empty">
            <span>
              {normalizedSearch ||
              category !==
                "all" ? (
                <Search
                  size={24}
                />
              ) : (
                <History
                  size={24}
                />
              )}
            </span>

            <strong>
              {normalizedSearch ||
              category !==
                "all"
                ? "لا توجد عمليات مطابقة"
                : "لا توجد عمليات مسجلة"}
            </strong>

            <p>
              {normalizedSearch ||
              category !==
                "all"
                ? "غيّر البحث أو نوع العملية لعرض نتائج أخرى."
                : "ستظهر هنا المنح والخصومات المسجلة للطلاب."}
            </p>
          </div>
        )}

        {/* =========================================
            STYLES
        ========================================= */}

        <style>
          {`
            .transactions-tab {
              overflow: hidden;

              border:
                1px solid #E5EBE7;

              border-radius: 18px;

              background: #FFFFFF;

              box-shadow:
                0 10px 28px
                rgba(25,51,39,.045);
            }

            /* =========================
               HEADER
            ========================= */

            .transactions-header {
              display: flex;
              align-items: center;
              justify-content:
                space-between;

              gap: 14px;

              padding:
                14px 16px;

              border-bottom:
                1px solid #EDF1EE;

              background:
                linear-gradient(
                  135deg,
                  #FFFFFF 0%,
                  #F8FCF9 72%,
                  #FFFDF8 100%
                );
            }

            .transactions-heading {
              display: flex;
              align-items: center;

              gap: 9px;

              min-width: 0;
            }

            .transactions-heading-icon {
              width: 40px;
              height: 40px;

              flex: 0 0 40px;

              border-radius: 12px;

              display: flex;
              align-items: center;
              justify-content: center;

              color: #FFFFFF;

              background:
                linear-gradient(
                  145deg,
                  #0F5132,
                  #0F766E
                );

              box-shadow:
                0 7px 17px
                rgba(15,81,50,.12);
            }

            .transactions-eyebrow {
              display: flex;
              align-items: center;

              gap: 3px;

              margin-bottom: 1px;

              color: #98772C;

              font-size: 6px;
              font-weight: 900;
            }

            .transactions-heading h2 {
              margin: 0;

              color: #35463C;

              font-size: 13px;
              font-weight: 950;
            }

            .transactions-heading p {
              margin: 2px 0 0;

              color: #8D9791;

              font-size: 6px;
              line-height: 1.5;
            }

            .transactions-overview {
              display: grid;
              grid-template-columns:
                repeat(
                  4,
                  minmax(72px,1fr)
                );

              gap: 5px;

              flex: 0 0 auto;
            }

            .transactions-overview > div {
              min-width: 74px;

              padding: 7px 8px;

              border:
                1px solid #E4EAE6;

              border-radius: 9px;

              background: #FFFFFF;
            }

            .transactions-overview span,
            .transactions-overview strong {
              display: block;
            }

            .transactions-overview span {
              color: #929B95;

              font-size: 5px;
            }

            .transactions-overview strong {
              margin-top: 1px;

              color: #3E4E44;

              font-size: 9px;
              font-weight: 950;
            }

            .transactions-overview strong.positive {
              color: #0F744C;
            }

            .transactions-overview strong.negative {
              color: #A44337;
            }

            .transactions-overview strong.gold {
              color: #947124;
            }

            /* =========================
               TOOLBAR
            ========================= */

            .transactions-toolbar {
              display: flex;
              align-items: center;
              justify-content:
                space-between;

              gap: 9px;

              padding: 10px 12px;

              border-bottom:
                1px solid #EDF1EE;

              background: #FBFDFC;
            }

            .transactions-search {
              position: relative;

              width: min(
                420px,
                100%
              );
            }

            .transactions-search > svg {
              position: absolute;
              right: 10px;
              top: 50%;

              transform:
                translateY(-50%);

              color: #8D9791;

              pointer-events: none;
            }

            .transactions-search input {
              width: 100%;
              height: 38px;

              padding:
                0 32px 0 31px;

              border:
                1px solid #DDE5E0;

              border-radius: 9px;

              outline: none;

              color: #3D4D43;
              background: #FFFFFF;

              font-size: 7px;
            }

            .transactions-search input:focus {
              border-color: #A3C6B0;

              box-shadow:
                0 0 0 3px
                rgba(15,81,50,.05);
            }

            .transactions-search button {
              position: absolute;
              left: 8px;
              top: 50%;

              width: 22px;
              height: 22px;

              transform:
                translateY(-50%);

              border: none;
              border-radius: 6px;

              display: flex;
              align-items: center;
              justify-content: center;

              color: #76827A;
              background: #EDF2EF;

              cursor: pointer;
            }

            .transactions-category-filter {
              display: flex;
              align-items: center;

              gap: 4px;
            }

            .transactions-category-filter button {
              min-height: 31px;

              padding: 0 8px;

              border:
                1px solid #E0E7E2;

              border-radius: 8px;

              display: inline-flex;
              align-items: center;

              gap: 4px;

              color: #6F7B73;
              background: #FFFFFF;

              font-size: 5.7px;
              font-weight: 850;

              cursor: pointer;
            }

            .transactions-category-filter button span {
              min-width: 17px;
              min-height: 17px;

              padding: 0 4px;

              border-radius: 999px;

              display: inline-flex;
              align-items: center;
              justify-content: center;

              color: #77837B;
              background: #F0F4F1;

              font-size: 5px;
            }

            .transactions-category-filter button.active {
              border-color: #BFD5C7;

              color: #0F6848;
              background: #EDF7F1;
            }

            .transactions-category-filter button.active.grant {
              border-color: #BFDCC9;

              color: #0F744C;
              background: #EAF7EE;
            }

            .transactions-category-filter button.active.deduction {
              border-color: #E8CDC7;

              color: #A44337;
              background: #FFF0ED;
            }

            /* =========================
               RESULT BAR
            ========================= */

            .transactions-result-bar {
              display: flex;
              align-items: center;
              justify-content:
                space-between;

              gap: 8px;

              padding:
                7px 12px;

              border-bottom:
                1px solid #EDF1EE;

              color: #7A867E;
              background: #FFFFFF;

              font-size: 5.6px;
            }

            .transactions-result-bar b {
              color: #405046;
            }

            .transactions-result-bar button {
              border: none;

              color: #0F6848;
              background: transparent;

              font-size: 5.6px;
              font-weight: 900;

              cursor: pointer;
            }

            /* =========================
               GRID
            ========================= */

            .transactions-grid {
              display: grid;

              grid-template-columns:
                repeat(
                  auto-fill,
                  minmax(
                    285px,
                    1fr
                  )
                );

              gap: 10px;

              padding: 12px;
            }

            /* =========================
               CARD
            ========================= */

            .transaction-card {
              position: relative;

              min-width: 0;
              overflow: hidden;

              padding: 12px;

              border:
                1px solid #E5EBE7;

              border-radius: 14px;

              background: #FFFFFF;

              transition:
                transform .17s ease,
                box-shadow .17s ease,
                border-color .17s ease;
            }

            .transaction-card:hover {
              transform:
                translateY(-2px);

              box-shadow:
                0 10px 23px
                rgba(25,51,39,.055);
            }

            .transaction-card.grant:hover {
              border-color: #C6DDCE;
            }

            .transaction-card.deduction:hover {
              border-color: #E6CCC6;
            }

            .transaction-card-accent {
              position: absolute;
              top: 0;
              right: 0;
              left: 0;

              height: 2px;
            }

            .transaction-card.grant
            .transaction-card-accent {
              background:
                linear-gradient(
                  90deg,
                  transparent,
                  #0F766E,
                  transparent
                );
            }

            .transaction-card.deduction
            .transaction-card-accent {
              background:
                linear-gradient(
                  90deg,
                  transparent,
                  #B64D3D,
                  transparent
                );
            }

            .transaction-card.other
            .transaction-card-accent {
              background:
                linear-gradient(
                  90deg,
                  transparent,
                  #64748B,
                  transparent
                );
            }

            .transaction-card-top {
              display: flex;
              align-items: center;
              justify-content:
                space-between;

              gap: 8px;
            }

            .transaction-category-badge {
              min-height: 24px;

              padding: 0 7px;

              border-radius: 999px;

              display: inline-flex;
              align-items: center;

              gap: 3px;

              font-size: 5.4px;
              font-weight: 900;
            }

            .transaction-category-badge.grant {
              color: #0F704A;

              border:
                1px solid #D9EADD;

              background: #F0F9F3;
            }

            .transaction-category-badge.deduction {
              color: #A44337;

              border:
                1px solid #EED8D3;

              background: #FFF4F1;
            }

            .transaction-category-badge.other {
              color: #65717A;

              border:
                1px solid #E1E6EA;

              background: #F5F7F8;
            }

            .transaction-date {
              display: flex;
              align-items: flex-start;

              gap: 4px;

              color: #8D9791;
            }

            .transaction-date > div {
              text-align: left;
            }

            .transaction-date strong,
            .transaction-date small {
              display: block;
            }

            .transaction-date strong {
              color: #657169;

              font-size: 5.5px;
              font-weight: 850;
            }

            .transaction-date small {
              margin-top: 1px;

              color: #9AA29D;

              font-size: 5px;
            }

            /* =========================
               STUDENT
            ========================= */

            .transaction-student {
              display: flex;
              align-items: center;

              gap: 7px;

              margin-top: 11px;
            }

            .transaction-student-icon {
              width: 30px;
              height: 30px;

              flex: 0 0 30px;

              border-radius: 9px;

              display: flex;
              align-items: center;
              justify-content: center;

              color: #0F6848;
              background: #EDF7F1;
            }

            .transaction-student small,
            .transaction-student strong {
              display: block;
            }

            .transaction-student small {
              color: #98A09B;

              font-size: 5px;
            }

            .transaction-student strong {
              margin-top: 1px;

              color: #3D4C42;

              font-size: 8px;
              font-weight: 950;
            }

            /* =========================
               REASON
            ========================= */

            .transaction-reason {
              margin-top: 9px;
              padding: 8px;

              border:
                1px solid #E8ECEA;

              border-radius: 9px;

              background: #FBFDFC;
            }

            .transaction-reason > span {
              display: flex;
              align-items: center;

              gap: 3px;

              color: #929B95;

              font-size: 5px;
            }

            .transaction-reason > strong {
              display: block;

              margin-top: 3px;

              overflow: hidden;

              color: #536159;

              font-size: 6.5px;
              font-weight: 900;

              text-overflow: ellipsis;
              white-space: nowrap;
            }

            /* =========================
               VALUE
            ========================= */

            .transaction-value-row {
              display: flex;
              align-items: flex-end;
              justify-content:
                space-between;

              gap: 8px;

              margin-top: 11px;
            }

            .transaction-value-row > div > span,
            .transaction-value-row > div > strong {
              display: block;
            }

            .transaction-value-row > div > span {
              color: #98A09B;

              font-size: 5px;
            }

            .transaction-value-row > div > strong {
              margin-top: 1px;

              font-size: 20px;
              font-weight: 950;

              direction: ltr;
            }

            .transaction-card.grant
            .transaction-value-row > div > strong {
              color: #0F744C;
            }

            .transaction-card.deduction
            .transaction-value-row > div > strong {
              color: #AE4336;
            }

            .transaction-card.other
            .transaction-value-row > div > strong {
              color: #5B6878;
            }

            .transaction-value-row strong small {
              margin-left: 2px;

              color: #8F9992;

              font-size: 5.5px;
              font-weight: 800;
            }

            .transaction-id {
              color: #9AA29D;

              font-size: 5.3px;
            }

            /* =========================
               NOTE
            ========================= */

            .transaction-note {
              margin-top: 8px;
              padding-top: 7px;

              border-top:
                1px solid #EEF2EF;

              color: #8B958F;

              font-size: 5.4px;
              line-height: 1.55;

              display: -webkit-box;
              -webkit-line-clamp: 2;
              -webkit-box-orient:
                vertical;

              overflow: hidden;
            }

            /* =========================
               ACTIONS
            ========================= */

            .transaction-actions {
              display: grid;
              grid-template-columns:
                repeat(
                  2,
                  minmax(0,1fr)
                );

              gap: 5px;

              margin-top: 10px;
            }

            .transaction-action {
              min-height: 33px;

              padding: 0 8px;

              border: none;
              border-radius: 8px;

              display: inline-flex;
              align-items: center;
              justify-content: center;

              gap: 4px;

              font-size: 5.7px;
              font-weight: 900;

              cursor: pointer;
            }

            .transaction-action.edit {
              color: #3D6655;
              background: #EDF6F1;
            }

            .transaction-action.delete {
              color: #A34236;
              background: #FFF0ED;
            }

            .transaction-action:hover:not(:disabled) {
              filter: brightness(.975);
            }

            .transaction-action:disabled {
              opacity: .4;
              cursor: not-allowed;
            }

            /* =========================
               EMPTY
            ========================= */

            .transactions-empty {
              min-height: 220px;

              display: flex;
              align-items: center;
              justify-content: center;
              flex-direction: column;

              gap: 4px;

              margin: 12px;

              border:
                1px dashed #DDE5E0;

              border-radius: 13px;

              color: #929C96;
              background: #FBFDFC;

              text-align: center;
            }

            .transactions-empty > span {
              width: 42px;
              height: 42px;

              margin-bottom: 3px;

              border-radius: 12px;

              display: flex;
              align-items: center;
              justify-content: center;

              color: #0F6B49;
              background: #EDF7F1;
            }

            .transactions-empty strong {
              color: #57645C;

              font-size: 8px;
            }

            .transactions-empty p {
              max-width: 350px;

              margin: 0;

              color: #929B95;

              font-size: 5.7px;
              line-height: 1.5;
            }

            /* =========================
               RESPONSIVE
            ========================= */

            @media
            (max-width: 980px) {
              .transactions-header {
                align-items:
                  flex-start;
                flex-direction:
                  column;
              }

              .transactions-overview {
                width: 100%;
              }
            }

            @media
            (max-width: 700px) {
              .transactions-toolbar {
                align-items:
                  stretch;
                flex-direction:
                  column;
              }

              .transactions-search {
                width: 100%;
              }

              .transactions-category-filter {
                width: 100%;

                display: grid;
                grid-template-columns:
                  repeat(
                    3,
                    minmax(0,1fr)
                  );
              }

              .transactions-category-filter button {
                justify-content:
                  center;
              }
            }

            @media
            (max-width: 600px) {
              .transactions-header {
                padding: 12px 13px;
              }

              .transactions-heading p {
                display: none;
              }

              .transactions-overview {
                grid-template-columns:
                  repeat(
                    2,
                    minmax(0,1fr)
                  );
              }

              .transactions-grid {
                grid-template-columns:
                  1fr;

                padding: 10px;
              }
            }

            @media
            (max-width: 390px) {
              .transactions-category-filter {
                grid-template-columns:
                  1fr;
              }

              .transactions-overview {
                grid-template-columns:
                  1fr;
              }
            }
          `}
        </style>
      </section>

      {/* =========================================
          DELETE CONFIRM
      ========================================= */}

      <ConfirmModal
        open={
          Boolean(
            confirmDelete
          )
        }
        title="حذف العملية"
        message={
          confirmDelete
            ? `هل تريد حذف العملية الخاصة بالطالب ${confirmDelete.student_name || "المحدد"}؟\n\n${getCategoryMeta(confirmDelete).label}: ${getDisplayPoints(confirmDelete)} نقطة\nالسبب: ${confirmDelete.reward_name || confirmDelete.reason || "غير محدد"}\n\nسيؤثر الحذف على رصيد الطالب بعد إعادة احتسابه من الصفحة الأم.`
            : ""
        }
        onConfirm={
          confirmDeleteItem
        }
        onCancel={() =>
          setConfirmDelete(
            null
          )
        }
      />
    </>
  );
}

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  AlertTriangle,
  CheckCircle2,
  Gift,
  Loader2,
  MinusCircle,
  Pencil,
  Save,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";

import { supabase } from "../../lib/supabase";
import AppSelect from "../AppSelect";
import ConfirmModal from "../ConfirmModal";
import { showToast } from "../Toast";

export default function EditTypeModal({
  open,
  item,
  onClose,
  onSaved,
}) {
  const [name, setName] = useState("");
  const [points, setPoints] = useState("");
  const [type, setType] = useState("reward");
  const [isActive, setIsActive] = useState(true);

  const [usageCount, setUsageCount] = useState(0);
  const [loadingUsage, setLoadingUsage] = useState(false);

  const [saving, setSaving] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  /* =====================================================
     Load item
  ===================================================== */

  useEffect(() => {
    if (!open || !item) {
      return;
    }

    setName(item.name || "");

    setPoints(
      String(
        Math.abs(
          Number(item.points || 0)
        )
      )
    );

    setType(
      item.type === "penalty"
        ? "penalty"
        : "reward"
    );

    setIsActive(
      item.is_active !== false
    );

    setShowConfirm(false);

    loadUsageCount();
  }, [open, item?.id]);

  /* =====================================================
     Lock page scroll
  ===================================================== */

  useEffect(() => {
    if (!open) {
      return;
    }

    const previous =
      document.body.style.overflow;

    document.body.style.overflow =
      "hidden";

    return () => {
      document.body.style.overflow =
        previous;
    };
  }, [open]);

  /* =====================================================
     Keyboard
  ===================================================== */

  useEffect(() => {
    if (!open) {
      return;
    }

    function handleKeyDown(event) {
      if (
        event.key === "Escape" &&
        !showConfirm
      ) {
        handleClose();
      }
    }

    window.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  }, [
    open,
    showConfirm,
    saving,
  ]);

  /* =====================================================
     Derived
  ===================================================== */

  const originalName =
    String(item?.name || "").trim();

  const originalPoints =
    Math.abs(
      Number(item?.points || 0)
    );

  const originalType =
    item?.type === "penalty"
      ? "penalty"
      : "reward";

  const originalActive =
    item?.is_active !== false;

  const cleanName =
    name.trim();

  const numericPoints =
    Math.abs(
      Number(points) || 0
    );

  const typeChanged =
    type !== originalType;

  const hasChanges =
    cleanName !== originalName ||
    numericPoints !== originalPoints ||
    typeChanged ||
    isActive !== originalActive;

  const canChangeType =
    usageCount === 0;

  const canSave =
    cleanName.length >= 2 &&
    Number.isFinite(numericPoints) &&
    numericPoints > 0 &&
    hasChanges &&
    !saving &&
    !loadingUsage;

  const config =
    useMemo(() => {
      if (type === "penalty") {
        return {
          label: "خصم",
          title: "تعديل نوع خصم",
          icon: MinusCircle,
          sign: "-",
          previewText:
            "سيُستخدم هذا النوع لخصم النقاط من رصيد الطالب.",
        };
      }

      return {
        label: "منحة",
        title: "تعديل نوع منحة",
        icon: Gift,
        sign: "+",
        previewText:
          "سيُستخدم هذا النوع لإضافة النقاط إلى رصيد الطالب.",
      };
    }, [type]);

  const TypeIcon =
    config.icon;

  /* =====================================================
     Usage
  ===================================================== */

  async function loadUsageCount() {
    if (!item?.id) {
      return;
    }

    try {
      setLoadingUsage(true);

      const {
        count,
        error,
      } =
        await supabase
          .from("points_transactions")
          .select("id", {
            count: "exact",
            head: true,
          })
          .eq(
            "reward_type_id",
            item.id
          );

      if (error) {
        throw error;
      }

      setUsageCount(
        Number(count || 0)
      );

    } catch (error) {
      console.error(
        "LOAD REWARD TYPE USAGE:",
        error
      );

      /*
        لو تعذر حساب الاستخدام،
        لا نسمح بتغيير نوع العملية
        احتياطًا حتى لا نفسد الدلالة
        التاريخية للنوع.
      */

      setUsageCount(1);

      showToast(
        "تعذر التحقق من استخدام هذا النوع؛ تم قفل تغيير نوع العملية احتياطًا.",
        "error"
      );

    } finally {
      setLoadingUsage(false);
    }
  }

  /* =====================================================
     Close
  ===================================================== */

  function handleClose() {
    if (saving) {
      return;
    }

    setShowConfirm(false);

    onClose?.();
  }

  /* =====================================================
     Type change
  ===================================================== */

  function handleTypeChange(value) {
    if (!canChangeType) {
      showToast(
        "لا يمكن تحويل نوع مستخدم في معاملات سابقة من منحة إلى خصم أو العكس. أنشئ نوعًا جديدًا بدلًا من ذلك.",
        "error"
      );

      return;
    }

    setType(value);
  }

  /* =====================================================
     Validate
  ===================================================== */

  function requestSave() {
    if (cleanName.length < 2) {
      showToast(
        "أدخل اسمًا واضحًا للنوع.",
        "error"
      );

      return;
    }

    if (
      !Number.isFinite(numericPoints) ||
      numericPoints <= 0
    ) {
      showToast(
        "أدخل عدد نقاط صحيحًا أكبر من صفر.",
        "error"
      );

      return;
    }

    if (
      typeChanged &&
      !canChangeType
    ) {
      showToast(
        "لا يمكن تغيير نوع العملية بعد استخدامه في معاملات سابقة.",
        "error"
      );

      return;
    }

    if (!hasChanges) {
      showToast(
        "لا توجد تعديلات للحفظ.",
        "info"
      );

      return;
    }

    setShowConfirm(true);
  }

  /* =====================================================
     Save
  ===================================================== */

  async function saveChanges() {
    if (!canSave) {
      return;
    }

    setShowConfirm(false);
    setSaving(true);

    try {
      /*
        نعيد التحقق من الاستخدام إذا
        كان المستخدم يحاول تغيير
        المنحة إلى خصم أو العكس.
      */

      if (typeChanged) {
        const {
          count,
          error: usageError,
        } =
          await supabase
            .from("points_transactions")
            .select("id", {
              count: "exact",
              head: true,
            })
            .eq(
              "reward_type_id",
              item.id
            );

        if (usageError) {
          throw usageError;
        }

        if (
          Number(count || 0) > 0
        ) {
          throw new Error(
            "لا يمكن تغيير نوع العملية لأنه مستخدم في معاملات سابقة. أنشئ نوعًا جديدًا بدلًا من ذلك."
          );
        }
      }

      const {
        data,
        error,
      } =
        await supabase
          .from("reward_types")
          .update({
            name: cleanName,
            points: numericPoints,
            type,
            is_active: isActive,
          })
          .eq(
            "id",
            item.id
          )
          .select("*")
          .single();

      if (error) {
        throw error;
      }

      showToast(
        "تم تحديث نوع النقاط بنجاح.",
        "success"
      );

      await onSaved?.(data);

      onClose?.();

    } catch (error) {
      console.error(
        "UPDATE REWARD TYPE:",
        error
      );

      showToast(
        error?.message ||
          "تعذر تحديث النوع.",
        "error"
      );

    } finally {
      setSaving(false);
    }
  }

  /* =====================================================
     Render guard
  ===================================================== */

  if (
    !open ||
    !item
  ) {
    return null;
  }

  return (
    <>
      <div
        className="edit-type-overlay"
        dir="rtl"
        onMouseDown={(event) => {
          if (
            event.target ===
              event.currentTarget &&
            !showConfirm
          ) {
            handleClose();
          }
        }}
      >
        <div
          className={`edit-type-modal ${type}`}
          role="dialog"
          aria-modal="true"
          aria-label={config.title}
        >
          {/* =========================================
              HEADER
          ========================================= */}

          <div className="edit-type-header">
            <div className="edit-type-heading">
              <div className="edit-type-main-icon">
                <Pencil size={21} />
              </div>

              <div>
                <div className="edit-type-eyebrow">
                  <Sparkles size={12} />
                  إدارة أنواع النقاط
                </div>

                <h2>
                  {config.title}
                </h2>

                <p>
                  عدّل الاسم والقيمة والحالة مع الحفاظ على سلامة السجل التاريخي.
                </p>
              </div>
            </div>

            <button
              type="button"
              className="edit-type-close"
              onClick={handleClose}
              disabled={saving}
              aria-label="إغلاق"
            >
              <X size={17} />
            </button>
          </div>

          {/* =========================================
              STATUS
          ========================================= */}

          <div className="edit-type-status-strip">
            <div>
              <span>
                رقم النوع
              </span>

              <strong>
                #{item.id}
              </strong>
            </div>

            <div>
              <span>
                الاستخدام
              </span>

              <strong>
                {loadingUsage
                  ? "جارٍ الفحص..."
                  : `${usageCount} عملية`}
              </strong>
            </div>

            <div>
              <span>
                الحالة
              </span>

              <strong
                className={
                  isActive
                    ? "active"
                    : "inactive"
                }
              >
                {isActive
                  ? "نشط"
                  : "متوقف"}
              </strong>
            </div>
          </div>

          {/* =========================================
              BODY
          ========================================= */}

          <div className="edit-type-body">
            <section className="edit-type-section">
              <div className="edit-type-section-head">
                <div>
                  <h3>
                    بيانات النوع
                  </h3>

                  <p>
                    الاسم والقيمة التي سيستخدمها المعلم في العمليات الجديدة.
                  </p>
                </div>

                <ShieldCheck size={17} />
              </div>

              <div className="edit-type-grid">
                <label className="edit-type-field full">
                  <span>
                    اسم النوع
                    <b>*</b>
                  </span>

                  <input
                    type="text"
                    value={name}
                    maxLength={80}
                    autoFocus
                    onChange={(event) =>
                      setName(
                        event.target.value
                      )
                    }
                    placeholder={
                      type === "reward"
                        ? "مثال: إتقان متميز"
                        : "مثال: مخالفة سلوكية"
                    }
                  />

                  <small>
                    <span>
                      اختر اسمًا واضحًا ومختصرًا.
                    </span>

                    <span>
                      {name.length}/80
                    </span>
                  </small>
                </label>

                <label className="edit-type-field">
                  <span>
                    عدد النقاط
                    <b>*</b>
                  </span>

                  <div className="edit-type-points-shell">
                    <input
                      type="number"
                      min="1"
                      step="1"
                      inputMode="numeric"
                      value={points}
                      onChange={(event) =>
                        setPoints(
                          event.target.value
                        )
                      }
                    />

                    <strong>
                      نقطة
                    </strong>
                  </div>

                  <small>
                    أدخل قيمة موجبة دائمًا.
                  </small>
                </label>

                <div className="edit-type-field">
                  <span>
                    نوع العملية
                  </span>

                  <AppSelect
                    value={type}
                    onChange={handleTypeChange}
                    options={[
                      {
                        value: "reward",
                        label: "منحة / مكافأة",
                      },
                      {
                        value: "penalty",
                        label: "خصم",
                      },
                    ]}
                  />

                  <small>
                    {canChangeType
                      ? "يمكن تغيير النوع لأنه غير مستخدم في معاملات سابقة."
                      : "تم قفل تغيير النوع لأنه مستخدم في سجل النقاط."}
                  </small>
                </div>
              </div>
            </section>

            {/* =====================================
                ACTIVE STATUS
            ===================================== */}

            <section className="edit-type-section">
              <div className="edit-type-section-head">
                <div>
                  <h3>
                    حالة النوع
                  </h3>

                  <p>
                    إيقاف النوع يمنع استخدامه مستقبلًا دون حذف السجل القديم.
                  </p>
                </div>

                <CheckCircle2 size={17} />
              </div>

              <div className="edit-type-toggle-row">
                <div>
                  <strong>
                    النوع نشط
                  </strong>

                  <span>
                    عند إيقافه يبقى محفوظًا في المعاملات السابقة لكنه لا يظهر كخيار جديد.
                  </span>
                </div>

                <button
                  type="button"
                  className={
                    isActive
                      ? "edit-type-toggle on"
                      : "edit-type-toggle"
                  }
                  onClick={() =>
                    !saving &&
                    setIsActive(
                      (current) =>
                        !current
                    )
                  }
                  disabled={saving}
                  aria-pressed={isActive}
                >
                  <span />
                </button>
              </div>
            </section>

            {/* =====================================
                LIVE PREVIEW
            ===================================== */}

            <section className="edit-type-preview-section">
              <div className="edit-type-preview-title">
                <span>
                  معاينة مباشرة
                </span>

                <small>
                  كيف سيظهر النوع للمعلم
                </small>
              </div>

              <div
                className={`edit-type-preview-card ${type}`}
              >
                <div className="edit-type-preview-icon">
                  <TypeIcon size={19} />
                </div>

                <div className="edit-type-preview-copy">
                  <span>
                    {config.label}
                  </span>

                  <strong>
                    {cleanName ||
                      "اسم النوع"}
                  </strong>

                  <small>
                    {config.previewText}
                  </small>
                </div>

                <div className="edit-type-preview-points">
                  {config.sign}
                  {numericPoints || 0}

                  <small>
                    نقطة
                  </small>
                </div>
              </div>
            </section>

            {/* =====================================
                HISTORICAL SAFETY
            ===================================== */}

            {usageCount > 0 && (
              <div className="edit-type-warning">
                <AlertTriangle size={18} />

                <div>
                  <strong>
                    هذا النوع مستخدم في معاملات سابقة
                  </strong>

                  <span>
                    يمكنك تعديل الاسم والقيمة والحالة للعمليات المستقبلية، لكن تحويله من منحة إلى خصم أو العكس مقفول لحماية معنى السجل التاريخي. تعديل القيمة هنا لا يغيّر قيمة المعاملات القديمة المسجلة بالفعل.
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* =========================================
              FOOTER
          ========================================= */}

          <div className="edit-type-footer">
            <div
              className={
                hasChanges
                  ? "edit-type-change-state changed"
                  : "edit-type-change-state"
              }
            >
              {hasChanges ? (
                <>
                  <AlertTriangle size={12} />
                  توجد تغييرات غير محفوظة
                </>
              ) : (
                <>
                  <CheckCircle2 size={12} />
                  لا توجد تغييرات
                </>
              )}
            </div>

            <div className="edit-type-actions">
              <button
                type="button"
                className="edit-type-cancel"
                onClick={handleClose}
                disabled={saving}
              >
                إلغاء
              </button>

              <button
                type="button"
                className="edit-type-save"
                disabled={!canSave}
                onClick={requestSave}
              >
                {saving ? (
                  <Loader2
                    size={15}
                    className="edit-type-spin"
                  />
                ) : (
                  <Save size={15} />
                )}

                {saving
                  ? "جارٍ الحفظ..."
                  : "حفظ التعديلات"}
              </button>
            </div>
          </div>
        </div>

        <style>
          {`
            .edit-type-overlay {
              position: fixed;
              inset: 0;
              z-index: 9999;

              display: flex;
              align-items: center;
              justify-content: center;

              padding: 18px;

              background:
                rgba(10, 29, 24, .60);

              backdrop-filter:
                blur(7px);
            }

            .edit-type-modal {
              width: min(700px, 100%);
              max-height: calc(100vh - 36px);

              overflow: auto;

              border:
                1px solid
                rgba(255,255,255,.5);

              border-radius: 24px;

              background: #FFFFFF;

              box-shadow:
                0 30px 90px
                rgba(0,0,0,.25);

              animation:
                editTypeIn
                .18s ease-out;
            }

            @keyframes editTypeIn {
              from {
                opacity: 0;

                transform:
                  translateY(8px)
                  scale(.985);
              }

              to {
                opacity: 1;

                transform:
                  translateY(0)
                  scale(1);
              }
            }

            /* =========================
               HEADER
            ========================= */

            .edit-type-header {
              position: sticky;
              top: 0;
              z-index: 20;

              display: flex;
              align-items: flex-start;
              justify-content: space-between;

              gap: 14px;

              padding: 17px 20px;

              border-bottom:
                1px solid #E8EEE9;

              background:
                linear-gradient(
                  135deg,
                  rgba(255,255,255,.98),
                  rgba(247,251,248,.98)
                );

              backdrop-filter:
                blur(10px);
            }

            .edit-type-heading {
              display: flex;
              align-items: center;

              gap: 10px;
            }

            .edit-type-main-icon {
              width: 46px;
              height: 46px;

              flex: 0 0 46px;

              border-radius: 14px;

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
                0 8px 20px
                rgba(15,81,50,.13);
            }

            .edit-type-modal.penalty
            .edit-type-main-icon {
              background:
                linear-gradient(
                  145deg,
                  #9F4639,
                  #BE5846
                );
            }

            .edit-type-eyebrow {
              display: flex;
              align-items: center;

              gap: 4px;

              margin-bottom: 2px;

              color: #94742D;

              font-size: 9px;
              font-weight: 900;
            }

            .edit-type-heading h2 {
              margin: 0;

              color: #2F4036;

              font-size: 19px;
              font-weight: 950;
            }

            .edit-type-heading p {
              margin: 3px 0 0;

              color: #8B958F;

              font-size: 9px;
              line-height: 1.5;
            }

            .edit-type-close {
              width: 36px;
              height: 36px;

              flex: 0 0 36px;

              border:
                1px solid #E0E7E2;

              border-radius: 10px;

              display: flex;
              align-items: center;
              justify-content: center;

              color: #657169;
              background: #FFFFFF;

              cursor: pointer;
            }

            .edit-type-close:hover {
              color: #A34337;

              border-color:
                #EBD7D3;

              background:
                #FFF9F7;
            }

            /* =========================
               STATUS STRIP
            ========================= */

            .edit-type-status-strip {
              display: grid;
              grid-template-columns:
                repeat(3, minmax(0, 1fr));

              gap: 7px;

              margin: 14px 20px 10px;
            }

            .edit-type-status-strip > div {
              padding: 9px 10px;

              border:
                1px solid #E5EBE7;

              border-radius: 11px;

              background:
                #FBFDFC;
            }

            .edit-type-status-strip span,
            .edit-type-status-strip strong {
              display: block;
            }

            .edit-type-status-strip span {
              color: #8C9690;
              font-size: 6px;
            }

            .edit-type-status-strip strong {
              margin-top: 2px;

              color: #3E4D43;

              font-size: 8px;
            }

            .edit-type-status-strip strong.active {
              color: #0F714A;
            }

            .edit-type-status-strip strong.inactive {
              color: #9D4A3E;
            }

            /* =========================
               BODY
            ========================= */

            .edit-type-body {
              padding: 0 20px 16px;
            }

            .edit-type-section {
              margin-bottom: 10px;

              padding: 12px;

              border:
                1px solid #E7ECE9;

              border-radius: 14px;

              background: #FFFFFF;
            }

            .edit-type-section-head {
              display: flex;
              align-items: center;
              justify-content:
                space-between;

              gap: 10px;

              margin-bottom: 10px;

              color: #89958D;
            }

            .edit-type-section-head h3 {
              margin: 0;

              color: #405046;

              font-size: 10px;
              font-weight: 950;
            }

            .edit-type-section-head p {
              margin: 2px 0 0;

              color: #929B95;

              font-size: 6px;
            }

            /* =========================
               FORM
            ========================= */

            .edit-type-grid {
              display: grid;
              grid-template-columns:
                repeat(2, minmax(0, 1fr));

              gap: 8px;
            }

            .edit-type-field {
              min-width: 0;

              display: block;

              padding: 9px;

              border:
                1px solid #E7ECE9;

              border-radius: 11px;

              background: #FBFDFC;
            }

            .edit-type-field.full {
              grid-column: 1 / -1;
            }

            .edit-type-field > span {
              display: block;

              margin-bottom: 6px;

              color: #56635B;

              font-size: 6.5px;
              font-weight: 900;
            }

            .edit-type-field > span b {
              margin-right: 2px;
              color: #A53F34;
            }

            .edit-type-field > input,
            .edit-type-points-shell {
              width: 100%;

              border:
                1px solid #DCE5DF;

              border-radius: 9px;

              outline: none;

              color: #3D4C42;
              background: #FFFFFF;

              font-size: 8px;
            }

            .edit-type-field > input {
              height: 40px;

              padding: 0 10px;
            }

            .edit-type-field > input:focus,
            .edit-type-points-shell:focus-within {
              border-color: #9FC5AE;

              box-shadow:
                0 0 0 3px
                rgba(15,81,50,.05);
            }

            .edit-type-field > small {
              display: flex;
              align-items: center;
              justify-content:
                space-between;

              gap: 8px;

              margin-top: 5px;

              color: #969F99;

              font-size: 5.5px;
              line-height: 1.45;
            }

            .edit-type-points-shell {
              display: flex;
              align-items: center;

              overflow: hidden;
            }

            .edit-type-points-shell input {
              flex: 1;

              min-width: 0;
              height: 40px;

              padding: 0 10px;

              border: none;
              outline: none;

              color: #3D4C42;
              background: transparent;

              font-size: 9px;
              font-weight: 900;
            }

            .edit-type-points-shell strong {
              padding: 0 10px;

              color: #7E8A82;

              font-size: 6px;
            }

            /* =========================
               TOGGLE
            ========================= */

            .edit-type-toggle-row {
              display: flex;
              align-items: center;
              justify-content:
                space-between;

              gap: 12px;
            }

            .edit-type-toggle-row strong,
            .edit-type-toggle-row span {
              display: block;
            }

            .edit-type-toggle-row strong {
              color: #425147;

              font-size: 7px;
            }

            .edit-type-toggle-row span {
              margin-top: 2px;

              color: #929B95;

              font-size: 5.7px;
              line-height: 1.5;
            }

            .edit-type-toggle {
              position: relative;

              width: 42px;
              height: 24px;

              flex: 0 0 42px;

              padding: 0;

              border: none;
              border-radius: 999px;

              background: #DDE4DF;

              cursor: pointer;
            }

            .edit-type-toggle > span {
              position: absolute;

              top: 3px;
              right: 3px;

              width: 18px;
              height: 18px;

              margin: 0;

              border-radius: 50%;

              background: #FFFFFF;

              box-shadow:
                0 2px 6px
                rgba(15,23,42,.15);

              transition:
                transform .18s ease;
            }

            .edit-type-toggle.on {
              background:
                linear-gradient(
                  135deg,
                  #0F5132,
                  #0F766E
                );
            }

            .edit-type-toggle.on > span {
              transform:
                translateX(-18px);
            }

            /* =========================
               PREVIEW
            ========================= */

            .edit-type-preview-section {
              margin-bottom: 10px;

              padding: 12px;

              border:
                1px solid #E7ECE9;

              border-radius: 14px;

              background:
                linear-gradient(
                  135deg,
                  #FBFDFC,
                  #FFFDF8
                );
            }

            .edit-type-preview-title {
              display: flex;
              align-items: center;
              justify-content:
                space-between;

              gap: 8px;

              margin-bottom: 8px;
            }

            .edit-type-preview-title span {
              color: #405046;

              font-size: 8px;
              font-weight: 900;
            }

            .edit-type-preview-title small {
              color: #929B95;

              font-size: 5.5px;
            }

            .edit-type-preview-card {
              display: grid;
              grid-template-columns:
                auto 1fr auto;

              align-items: center;

              gap: 9px;

              padding: 10px;

              border-radius: 11px;
            }

            .edit-type-preview-card.reward {
              border:
                1px solid #D8E8DE;

              background: #F2FAF5;
            }

            .edit-type-preview-card.penalty {
              border:
                1px solid #EFD7D2;

              background: #FFF5F2;
            }

            .edit-type-preview-icon {
              width: 34px;
              height: 34px;

              border-radius: 10px;

              display: flex;
              align-items: center;
              justify-content: center;
            }

            .edit-type-preview-card.reward
            .edit-type-preview-icon {
              color: #0F6948;
              background: #E4F3E9;
            }

            .edit-type-preview-card.penalty
            .edit-type-preview-icon {
              color: #A84235;
              background: #F9E8E4;
            }

            .edit-type-preview-copy {
              min-width: 0;
            }

            .edit-type-preview-copy span,
            .edit-type-preview-copy strong,
            .edit-type-preview-copy small {
              display: block;
            }

            .edit-type-preview-copy span {
              color: #87928B;

              font-size: 5.5px;
            }

            .edit-type-preview-copy strong {
              margin-top: 1px;

              color: #3C4B41;

              font-size: 8px;
            }

            .edit-type-preview-copy small {
              margin-top: 2px;

              color: #8C9690;

              font-size: 5.4px;
              line-height: 1.45;
            }

            .edit-type-preview-points {
              color: #0F714A;

              font-size: 17px;
              font-weight: 950;

              direction: ltr;
            }

            .edit-type-preview-card.penalty
            .edit-type-preview-points {
              color: #B42318;
            }

            .edit-type-preview-points small {
              margin-left: 2px;

              font-size: 6px;
              font-weight: 800;
            }

            /* =========================
               WARNING
            ========================= */

            .edit-type-warning {
              display: flex;
              align-items: flex-start;

              gap: 8px;

              padding: 10px;

              border:
                1px solid #EADDBA;

              border-radius: 12px;

              color: #86651E;

              background: #FFF9EA;
            }

            .edit-type-warning strong,
            .edit-type-warning span {
              display: block;
            }

            .edit-type-warning strong {
              font-size: 7px;
            }

            .edit-type-warning span {
              margin-top: 2px;

              font-size: 6px;
              line-height: 1.55;
            }

            /* =========================
               FOOTER
            ========================= */

            .edit-type-footer {
              position: sticky;
              bottom: 0;
              z-index: 20;

              display: flex;
              align-items: center;
              justify-content:
                space-between;

              gap: 10px;

              padding: 12px 20px;

              border-top:
                1px solid #E9EEEB;

              background:
                rgba(
                  251,
                  253,
                  252,
                  .96
                );

              backdrop-filter:
                blur(10px);
            }

            .edit-type-change-state {
              display: flex;
              align-items: center;

              gap: 4px;

              color: #7B877F;

              font-size: 6px;
            }

            .edit-type-change-state.changed {
              color: #8B691D;

              font-weight: 850;
            }

            .edit-type-actions {
              display: flex;
              align-items: center;

              gap: 6px;
            }

            .edit-type-cancel,
            .edit-type-save {
              min-height: 40px;

              padding: 0 13px;

              border-radius: 9px;

              font-size: 8px;
              font-weight: 900;

              cursor: pointer;
            }

            .edit-type-cancel {
              border:
                1px solid #DCE4DF;

              color: #647169;
              background: #FFFFFF;
            }

            .edit-type-save {
              border: none;

              display: inline-flex;
              align-items: center;
              justify-content: center;

              gap: 5px;

              color: #FFFFFF;

              background:
                linear-gradient(
                  135deg,
                  #0F5132,
                  #0F766E
                );
            }

            .edit-type-modal.penalty
            .edit-type-save {
              background:
                linear-gradient(
                  135deg,
                  #A84235,
                  #C35A47
                );
            }

            .edit-type-cancel:disabled,
            .edit-type-save:disabled,
            .edit-type-close:disabled,
            .edit-type-toggle:disabled {
              opacity: .48;

              cursor: not-allowed;
            }

            @keyframes editTypeSpin {
              to {
                transform:
                  rotate(360deg);
              }
            }

            .edit-type-spin {
              animation:
                editTypeSpin
                .8s linear infinite;
            }

            /* =========================
               MOBILE
            ========================= */

            @media
            (max-width: 620px) {
              .edit-type-overlay {
                align-items: flex-end;

                padding: 7px;
              }

              .edit-type-modal {
                width: 100%;

                max-height:
                  calc(100vh - 14px);

                border-radius:
                  22px 22px
                  10px 10px;
              }

              .edit-type-header {
                padding: 14px 15px;
              }

              .edit-type-heading p {
                display: none;
              }

              .edit-type-status-strip {
                margin:
                  10px 15px 8px;
              }

              .edit-type-body {
                padding:
                  0 15px 13px;
              }

              .edit-type-grid {
                grid-template-columns:
                  1fr;
              }

              .edit-type-field.full {
                grid-column: auto;
              }

              .edit-type-footer {
                align-items: stretch;
                flex-direction: column;

                padding:
                  10px 15px;
              }

              .edit-type-actions {
                width: 100%;
              }

              .edit-type-actions button {
                flex: 1;
              }
            }

            @media
            (max-width: 430px) {
              .edit-type-heading h2 {
                font-size: 17px;
              }

              .edit-type-status-strip {
                grid-template-columns:
                  1fr;
              }

              .edit-type-preview-card {
                grid-template-columns:
                  auto 1fr;
              }

              .edit-type-preview-points {
                grid-column: 1 / -1;

                text-align: right;
              }
            }
          `}
        </style>
      </div>

      <ConfirmModal
        open={showConfirm}
        title="تأكيد تعديل النوع"
        message={
          `سيتم تحديث النوع "${originalName}".\n\n` +
          `الاسم: ${originalName} ← ${cleanName}\n` +
          `النقاط: ${originalPoints} ← ${numericPoints}\n` +
          `النوع: ${originalType === "reward" ? "منحة" : "خصم"} ← ${type === "reward" ? "منحة" : "خصم"}\n` +
          `الحالة: ${originalActive ? "نشط" : "متوقف"} ← ${isActive ? "نشط" : "متوقف"}`
        }
        onConfirm={saveChanges}
        onCancel={() =>
          !saving &&
          setShowConfirm(false)
        }
      />
    </>
  );
}

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Award,
  BadgeMinus,
  CheckCircle2,
  Loader2,
  Plus,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";

import {
  supabase,
} from "../../lib/supabase";

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
  const [
    name,
    setName,
  ] = useState("");

  const [
    points,
    setPoints,
  ] = useState("");

  const [
    type,
    setType,
  ] = useState(
    defaultType
  );

  const [
    saving,
    setSaving,
  ] = useState(false);

  /* =====================================================
     عند فتح النافذة
  ===================================================== */

  useEffect(() => {
    if (!open) {
      return;
    }

    setName("");
    setPoints("");
    setType(
      defaultType ||
        "reward"
    );
  }, [
    open,
    defaultType,
  ]);

  /* =====================================================
     معلومات النوع
  ===================================================== */

  const typeConfig =
    useMemo(() => {
      if (
        type ===
        "penalty"
      ) {
        return {
          title:
            "إضافة نوع خصم",

          subtitle:
            "أنشئ سبب خصم واضح يمكن استخدامه عند تسجيل الخصومات.",

          shortLabel:
            "خصم",

          icon:
            BadgeMinus,

          previewTitle:
            "سيُستخدم كخصم",

          previewDescription:
            "عند تطبيق هذا النوع على الطالب ستُخصم النقاط المحددة من رصيده.",
        };
      }

      return {
        title:
          "إضافة نوع منحة",

        subtitle:
          "أنشئ منحة جديدة يمكن للمعلم استخدامها لمكافأة الطلاب.",

        shortLabel:
          "منحة",

        icon:
          Award,

        previewTitle:
          "سيُستخدم كمكافأة",

        previewDescription:
          "عند تطبيق هذا النوع على الطالب ستُضاف النقاط المحددة إلى رصيده.",
      };
    }, [
      type,
    ]);

  const TypeIcon =
    typeConfig.icon;

  /* =====================================================
     Validation
  ===================================================== */

  const normalizedPoints =
    Number(points);

  const canSave =
    name.trim().length >=
      2 &&
    Number.isFinite(
      normalizedPoints
    ) &&
    normalizedPoints >
      0 &&
    !saving;

  /* =====================================================
     إغلاق
  ===================================================== */

  function handleClose() {
    if (saving) {
      return;
    }

    onClose?.();
  }

  /* =====================================================
     حفظ
  ===================================================== */

  async function saveType() {
    const cleanName =
      name.trim();

    if (
      cleanName.length <
      2
    ) {
      showToast(
        "أدخل اسمًا واضحًا للنوع.",
        "error"
      );

      return;
    }

    if (
      !Number.isFinite(
        normalizedPoints
      ) ||
      normalizedPoints <=
        0
    ) {
      showToast(
        "أدخل عدد نقاط صحيح أكبر من صفر.",
        "error"
      );

      return;
    }

    try {
      setSaving(true);

      const {
        error,
      } =
        await supabase
          .from(
            "reward_types"
          )
          .insert({
            name:
              cleanName,

            points:
              normalizedPoints,

            type,

            is_active:
              true,
          });

      if (error) {
        throw error;
      }

      showToast(
        type ===
          "reward"
          ? "تم إنشاء نوع المنحة بنجاح."
          : "تم إنشاء نوع الخصم بنجاح.",
        "success"
      );

      onSaved?.();

      onClose?.();

    } catch (error) {
      console.error(
        "CREATE REWARD TYPE:",
        error
      );

      showToast(
        error?.message ||
          "تعذر إنشاء النوع.",
        "error"
      );

    } finally {
      setSaving(false);
    }
  }

  /* =====================================================
     Keyboard
  ===================================================== */

  useEffect(() => {
    if (!open) {
      return;
    }

    function handleKeyDown(
      event
    ) {
      if (
        event.key ===
        "Escape"
      ) {
        handleClose();
      }

      if (
        event.key ===
          "Enter" &&
        (event.ctrlKey ||
          event.metaKey)
      ) {
        saveType();
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
    saving,
    name,
    points,
    type,
  ]);

  if (!open) {
    return null;
  }

  return (
    <div
      className="reward-type-overlay"
      dir="rtl"
      onMouseDown={(
        event
      ) => {
        if (
          event.target ===
          event.currentTarget
        ) {
          handleClose();
        }
      }}
    >
      <div
        className="reward-type-modal"
        role="dialog"
        aria-modal="true"
        aria-label={
          typeConfig.title
        }
      >
        {/* =========================================
            HEADER
        ========================================= */}

        <div className="reward-type-header">
          <button
            type="button"
            className="reward-type-close"
            onClick={
              handleClose
            }
            disabled={
              saving
            }
            aria-label="إغلاق"
          >
            <X size={17} />
          </button>

          <div className="reward-type-heading">
            <div
              className={`reward-type-main-icon ${
                type ===
                "reward"
                  ? "reward"
                  : "penalty"
              }`}
            >
              <TypeIcon
                size={22}
                strokeWidth={
                  1.8
                }
              />
            </div>

            <div>
              <div className="reward-type-eyebrow">
                <Sparkles
                  size={12}
                />

                نظام النقاط
              </div>

              <h2>
                {
                  typeConfig.title
                }
              </h2>

              <p>
                {
                  typeConfig.subtitle
                }
              </p>
            </div>
          </div>
        </div>

        {/* =========================================
            BODY
        ========================================= */}

        <div className="reward-type-body">
          {/* النوع */}

          <div className="reward-field">
            <label>
              نوع العملية
            </label>

            <AppSelect
              value={type}
              onChange={
                setType
              }
              options={[
                {
                  value:
                    "reward",
                  label:
                    "منحة / مكافأة",
                },
                {
                  value:
                    "penalty",
                  label:
                    "خصم",
                },
              ]}
            />

            <span className="reward-field-help">
              اختر هل هذا
              النوع سيضيف
              نقاطًا أو يخصمها
              من رصيد الطالب.
            </span>
          </div>

          {/* الاسم */}

          <div className="reward-field">
            <label htmlFor="reward-type-name">
              اسم النوع

              <b>
                *
              </b>
            </label>

            <input
              id="reward-type-name"
              type="text"
              value={name}
              onChange={(
                event
              ) =>
                setName(
                  event
                    .target
                    .value
                )
              }
              placeholder={
                type ===
                "reward"
                  ? "مثال: إتقان متميز"
                  : "مثال: مخالفة سلوكية"
              }
              maxLength={
                80
              }
              autoFocus
            />

            <div className="reward-field-meta">
              <span>
                اكتب اسمًا
                واضحًا يظهر
                للمعلم في قائمة
                العمليات.
              </span>

              <span>
                {
                  name.length
                }
                /80
              </span>
            </div>
          </div>

          {/* النقاط */}

          <div className="reward-field">
            <label htmlFor="reward-type-points">
              عدد النقاط

              <b>
                *
              </b>
            </label>

            <div className="reward-points-shell">
              <input
                id="reward-type-points"
                type="number"
                min="1"
                step="1"
                inputMode="numeric"
                value={
                  points
                }
                onChange={(
                  event
                ) =>
                  setPoints(
                    event
                      .target
                      .value
                  )
                }
                placeholder="10"
              />

              <span>
                نقطة
              </span>
            </div>

            <span className="reward-field-help">
              أدخل القيمة
              موجبة دائمًا؛ نوع
              العملية هو الذي
              يحدد الإضافة أو
              الخصم.
            </span>
          </div>

          {/* =========================================
              LIVE PREVIEW
          ========================================= */}

          <div
            className={`reward-type-preview ${
              type ===
              "reward"
                ? "reward"
                : "penalty"
            }`}
          >
            <div className="reward-preview-icon">
              <TypeIcon
                size={19}
              />
            </div>

            <div className="reward-preview-content">
              <div className="reward-preview-top">
                <div>
                  <span>
                    معاينة النوع
                  </span>

                  <strong>
                    {name.trim() ||
                      "اسم النوع"}
                  </strong>
                </div>

                <div className="reward-preview-points">
                  {type ===
                  "reward"
                    ? "+"
                    : "-"}
                  {normalizedPoints >
                  0
                    ? normalizedPoints
                    : 0}

                  <small>
                    نقطة
                  </small>
                </div>
              </div>

              <div className="reward-preview-divider" />

              <div className="reward-preview-note">
                <ShieldCheck
                  size={14}
                />

                <div>
                  <strong>
                    {
                      typeConfig.previewTitle
                    }
                  </strong>

                  <span>
                    {
                      typeConfig.previewDescription
                    }
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* =========================================
            FOOTER
        ========================================= */}

        <div className="reward-type-footer">
          <div className="reward-keyboard-tip">
            Ctrl + Enter للحفظ
          </div>

          <div className="reward-type-actions">
            <button
              type="button"
              className="reward-cancel-button"
              onClick={
                handleClose
              }
              disabled={
                saving
              }
            >
              إلغاء
            </button>

            <button
              type="button"
              className={`reward-create-button ${
                type ===
                "reward"
                  ? "reward"
                  : "penalty"
              }`}
              disabled={
                !canSave
              }
              onClick={
                saveType
              }
            >
              {saving ? (
                <Loader2
                  size={16}
                  className="reward-spin"
                />
              ) : (
                <Plus
                  size={16}
                />
              )}

              {saving
                ? "جارٍ الإنشاء..."
                : `إنشاء ${typeConfig.shortLabel}`}
            </button>
          </div>
        </div>
      </div>

      {/* =========================================
          STYLE
      ========================================= */}

      <style>
        {`
          .reward-type-overlay {
            position: fixed;
            inset: 0;
            z-index: 9999;

            display: flex;
            align-items: center;
            justify-content: center;

            padding: 18px;

            background:
              rgba(10, 30, 24, .58);

            backdrop-filter:
              blur(7px);
          }

          .reward-type-modal {
            width: min(580px, 100%);
            max-height: calc(100vh - 36px);

            overflow: auto;

            border:
              1px solid
              rgba(255,255,255,.52);

            border-radius:
              24px;

            background:
              #ffffff;

            box-shadow:
              0 30px 90px
              rgba(0,0,0,.25);

            animation:
              rewardModalIn
              .18s ease-out;
          }

          @keyframes rewardModalIn {
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

          .reward-type-header {
            position: relative;

            padding:
              18px 20px;

            border-bottom:
              1px solid #E8EEE9;

            background:
              linear-gradient(
                135deg,
                #FFFFFF,
                #F5FAF7
              );
          }

          .reward-type-close {
            position: absolute;
            left: 16px;
            top: 16px;

            width: 36px;
            height: 36px;

            border:
              1px solid #DFE7E2;

            border-radius:
              10px;

            display: flex;
            align-items: center;
            justify-content: center;

            color: #64748B;
            background: #FFFFFF;

            cursor: pointer;
          }

          .reward-type-close:hover {
            color: #B42318;
            background: #FFF8F7;
            border-color: #F1DAD7;
          }

          .reward-type-heading {
            display: flex;
            align-items: center;

            gap: 11px;

            padding-left: 44px;
          }

          .reward-type-main-icon {
            width: 46px;
            height: 46px;

            flex: 0 0 46px;

            border-radius:
              14px;

            display: flex;
            align-items: center;
            justify-content: center;
          }

          .reward-type-main-icon.reward {
            color: #FFFFFF;

            background:
              linear-gradient(
                145deg,
                #0F5132,
                #0F766E
              );

            box-shadow:
              0 8px 20px
              rgba(15,81,50,.14);
          }

          .reward-type-main-icon.penalty {
            color: #A44735;

            background:
              #FFF3F0;

            border:
              1px solid #F2D6CF;
          }

          .reward-type-eyebrow {
            display: flex;
            align-items: center;

            gap: 4px;

            color: #A07C2B;

            font-size: 10px;
            font-weight: 900;

            margin-bottom: 2px;
          }

          .reward-type-heading h2 {
            margin: 0;

            color: #243B2E;

            font-size: 19px;
            font-weight: 950;
          }

          .reward-type-heading p {
            margin:
              3px 0 0;

            color: #87928B;

            font-size: 10px;
            line-height: 1.55;
          }

          /* =========================
             BODY
          ========================= */

          .reward-type-body {
            padding: 18px 20px;
          }

          .reward-field {
            margin-bottom: 13px;
          }

          .reward-field > label {
            display: flex;
            align-items: center;

            gap: 3px;

            margin-bottom: 6px;

            color: #526158;

            font-size: 10px;
            font-weight: 900;
          }

          .reward-field > label b {
            color: #B42318;
          }

          .reward-field > input,
          .reward-points-shell {
            width: 100%;

            border:
              1px solid #DCE5DF;

            border-radius:
              11px;

            background:
              #FBFDFC;

            transition:
              border-color .18s ease,
              box-shadow .18s ease;
          }

          .reward-field > input {
            height: 44px;

            padding:
              0 13px;

            outline: none;

            color: #33443A;

            font-size: 11px;
          }

          .reward-field > input:focus,
          .reward-points-shell:focus-within {
            border-color:
              #96BDA6;

            box-shadow:
              0 0 0 3px
              rgba(15,81,50,.055);

            background:
              #FFFFFF;
          }

          .reward-points-shell {
            display: flex;
            align-items: center;

            overflow: hidden;
          }

          .reward-points-shell input {
            flex: 1;

            min-width: 0;
            height: 44px;

            padding:
              0 13px;

            border: none;
            outline: none;

            color: #33443A;
            background:
              transparent;

            font-size: 11px;
          }

          .reward-points-shell > span {
            padding:
              0 13px;

            color: #7B877F;

            font-size: 9px;
            font-weight: 800;
          }

          .reward-field-help {
            display: block;

            margin-top: 5px;

            color: #99A19C;

            font-size: 8px;
            line-height: 1.5;
          }

          .reward-field-meta {
            display: flex;
            align-items: center;
            justify-content: space-between;

            gap: 8px;

            margin-top: 5px;

            color: #99A19C;

            font-size: 8px;
          }

          /* =========================
             PREVIEW
          ========================= */

          .reward-type-preview {
            display: flex;
            align-items: flex-start;

            gap: 10px;

            padding: 12px;

            margin-top: 16px;

            border-radius:
              14px;
          }

          .reward-type-preview.reward {
            border:
              1px solid #DCEADF;

            background:
              linear-gradient(
                135deg,
                #F3FAF6,
                #FCFEFD
              );
          }

          .reward-type-preview.penalty {
            border:
              1px solid #F1DDD8;

            background:
              linear-gradient(
                135deg,
                #FFF7F5,
                #FFFCFB
              );
          }

          .reward-preview-icon {
            width: 37px;
            height: 37px;

            flex: 0 0 37px;

            border-radius:
              11px;

            display: flex;
            align-items: center;
            justify-content: center;
          }

          .reward-type-preview.reward
          .reward-preview-icon {
            color: #0F5132;
            background: #E6F4EB;
          }

          .reward-type-preview.penalty
          .reward-preview-icon {
            color: #A44735;
            background: #FBEAE6;
          }

          .reward-preview-content {
            min-width: 0;
            flex: 1;
          }

          .reward-preview-top {
            display: flex;
            align-items: center;
            justify-content: space-between;

            gap: 12px;
          }

          .reward-preview-top span,
          .reward-preview-top strong {
            display: block;
          }

          .reward-preview-top span {
            color: #8B958F;

            font-size: 8px;
          }

          .reward-preview-top strong {
            margin-top: 2px;

            color: #35473C;

            font-size: 11px;
          }

          .reward-preview-points {
            flex: 0 0 auto;

            color: #0F5132;

            font-size: 18px;
            font-weight: 950;

            direction: ltr;
          }

          .reward-type-preview.penalty
          .reward-preview-points {
            color: #B42318;
          }

          .reward-preview-points small {
            margin-left: 3px;

            font-size: 7px;
            font-weight: 800;
          }

          .reward-preview-divider {
            height: 1px;

            margin: 9px 0;

            background:
              rgba(111,127,118,.12);
          }

          .reward-preview-note {
            display: flex;
            align-items: flex-start;

            gap: 6px;

            color: #65736A;
          }

          .reward-preview-note strong,
          .reward-preview-note span {
            display: block;
          }

          .reward-preview-note strong {
            color: #4A5B50;

            font-size: 8px;
          }

          .reward-preview-note span {
            margin-top: 2px;

            color: #87928B;

            font-size: 7px;
            line-height: 1.55;
          }

          /* =========================
             FOOTER
          ========================= */

          .reward-type-footer {
            display: flex;
            align-items: center;
            justify-content: space-between;

            gap: 10px;

            padding:
              13px 20px;

            border-top:
              1px solid #E9EEEB;

            background:
              #FBFDFC;
          }

          .reward-keyboard-tip {
            color: #9BA39E;

            font-size: 7px;
          }

          .reward-type-actions {
            display: flex;
            align-items: center;

            gap: 6px;
          }

          .reward-cancel-button,
          .reward-create-button {
            min-height: 39px;

            padding:
              0 13px;

            border-radius:
              9px;

            font-size: 9px;
            font-weight: 900;

            cursor: pointer;
          }

          .reward-cancel-button {
            border:
              1px solid #DCE4DF;

            color: #647169;
            background: #FFFFFF;
          }

          .reward-create-button {
            border: none;

            display: inline-flex;
            align-items: center;
            justify-content: center;

            gap: 5px;

            color: #FFFFFF;
          }

          .reward-create-button.reward {
            background:
              linear-gradient(
                135deg,
                #0F5132,
                #0F766E
              );
          }

          .reward-create-button.penalty {
            background:
              linear-gradient(
                135deg,
                #A44735,
                #C65B46
              );
          }

          .reward-create-button:disabled,
          .reward-cancel-button:disabled,
          .reward-type-close:disabled {
            opacity: .5;
            cursor: not-allowed;
          }

          @keyframes rewardSpin {
            to {
              transform:
                rotate(360deg);
            }
          }

          .reward-spin {
            animation:
              rewardSpin
              .8s linear infinite;
          }

          /* =========================
             MOBILE
          ========================= */

          @media
          (max-width: 600px) {

            .reward-type-overlay {
              align-items:
                flex-end;

              padding: 7px;
            }

            .reward-type-modal {
              width: 100%;
              max-height:
                calc(100vh - 14px);

              border-radius:
                22px 22px
                10px 10px;
            }

            .reward-type-header {
              padding:
                16px;
            }

            .reward-type-body {
              padding:
                15px 16px;
            }

            .reward-type-footer {
              padding:
                12px 16px;
            }

            .reward-type-heading {
              align-items:
                flex-start;

              padding-left:
                38px;
            }

            .reward-type-heading h2 {
              font-size:
                17px;
            }

            .reward-keyboard-tip {
              display: none;
            }

            .reward-type-actions {
              width: 100%;
            }

            .reward-type-actions button {
              flex: 1;
            }
          }
        `}
      </style>
    </div>
  );
}
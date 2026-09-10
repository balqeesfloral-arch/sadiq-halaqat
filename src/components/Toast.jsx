import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import {
  CheckCircle2,
  AlertCircle,
  Info,
  X,
} from "lucide-react";

const ToastContext =
  createContext(null);

export function ToastProvider({
  children,
}) {
  const [toast, setToast] =
    useState(null);

  useEffect(() => {
    function handleToast(event) {
      const detail =
        event.detail || {};

      setToast({
        id: Date.now(),
        message:
          detail.message ||
          "",
        type:
          detail.type ||
          "success",
      });
    }

    window.addEventListener(
      "app:toast",
      handleToast
    );

    return () => {
      window.removeEventListener(
        "app:toast",
        handleToast
      );
    };
  }, []);

  useEffect(() => {
    if (!toast) return;

    const timer =
      setTimeout(() => {
        setToast(null);
      }, 3500);

    return () =>
      clearTimeout(timer);
  }, [toast]);

  function showToast(
    message,
    type = "success"
  ) {
    setToast({
      id: Date.now(),
      message,
      type,
    });
  }

  return (
    <ToastContext.Provider
      value={{
        showToast,
      }}
    >
      {children}

      {toast && (
        <Toast
          toast={toast}
          onClose={() =>
            setToast(null)
          }
        />
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(
    ToastContext
  );
}

function Toast({
  toast,
  onClose,
}) {
  const config =
    getToastConfig(
      toast.type
    );

  return (
    <div
      dir="rtl"
      style={{
        position:
          "fixed",
        top: "22px",
        right: "22px",
        zIndex: 99999,

        minWidth:
          "300px",
        maxWidth:
          "420px",

        background:
          "#fff",

        border:
          "1px solid #e5e9e6",

        borderRadius:
          "15px",

        padding:
          "13px 14px",

        display:
          "flex",
        alignItems:
          "center",
        gap:
          "11px",

        boxShadow:
          "0 15px 40px rgba(0,0,0,.13)",

animation:
"toastIn .35s cubic-bezier(.2,.8,.2,1)"
      }}
    >
      <div
        style={{
          width:
            "38px",
          height:
            "38px",
          flexShrink:
            0,
          borderRadius:
            "11px",

          background:
            config.background,

          color:
            config.color,

          display:
            "flex",
          alignItems:
            "center",
          justifyContent:
            "center",
        }}
      >
        {config.icon}
      </div>

      <div
        style={{
          flex: 1,
        }}
      >
        <div
          style={{
            color:
              "#173d2b",
            fontSize:
              "13px",
            fontWeight:
              "800",
            marginBottom:
              "2px",
          }}
        >
          {config.title}
        </div>

        <div
          style={{
            color:
              "#69736d",
            fontSize:
              "12px",
            lineHeight:
              "1.6",
          }}
        >
          {toast.message}
        </div>
      </div>

      <button
        type="button"
        onClick={
          onClose
        }
        style={{
          width:
            "30px",
          height:
            "30px",
          border:
            "none",
          background:
            "transparent",
          color:
            "#89918b",
          cursor:
            "pointer",
          display:
            "flex",
          alignItems:
            "center",
          justifyContent:
            "center",
        }}
      >
        <X
          size={17}
        />
      </button>
    </div>
  );
}

function getToastConfig(
  type
) {
  if (type === "error") {
    return {
      title:
        "حدث خطأ",
      color:
        "#b42318",
      background:
        "#fff0ef",
      icon: (
        <AlertCircle
          size={20}
        />
      ),
    };
  }

  if (type === "info") {
    return {
      title:
        "تنبيه",
      color:
        "#1769aa",
      background:
        "#eef7ff",
      icon: (
        <Info
          size={20}
        />
      ),
    };
  }

  return {
    title:
      "تم بنجاح",
    color:
      "#0f5132",
    background:
      "#eaf6ee",
    icon: (
      <CheckCircle2
        size={20}
      />
    ),
  };
}
export function showToast(
  message,
  type = "success"
){
  window.dispatchEvent(
    new CustomEvent(
      "app:toast",
      {
        detail:{
          message,
          type
        }
      }
    )
  );
}
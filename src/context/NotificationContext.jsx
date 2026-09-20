import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Info,
  X,
} from "lucide-react";

const NotificationContext =
  createContext(null);

export function NotificationProvider({
  children,
}) {
  const [notifications, setNotifications] =
    useState([]);

  const timers = useRef(new Map());

  const remove = useCallback((id) => {
    setNotifications((current) =>
      current.filter(
        (item) => item.id !== id
      )
    );

    const timer = timers.current.get(id);

    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const notify = useCallback(
    ({
      message,
      type = "info",
      duration = 3500,
    }) => {
      if (!message) return null;

      const id =
        `${Date.now()}-${Math.random()}`;

      setNotifications((current) => [
        ...current,
        {
          id,
          message: String(message),
          type,
        },
      ]);

      if (duration > 0) {
        const timer = setTimeout(() => {
          remove(id);
        }, duration);

        timers.current.set(id, timer);
      }

      return id;
    },
    [remove]
  );

  const success = useCallback(
    (message, duration) =>
      notify({
        message,
        type: "success",
        duration,
      }),
    [notify]
  );

  const error = useCallback(
    (message, duration) =>
      notify({
        message,
        type: "error",
        duration,
      }),
    [notify]
  );

  const warning = useCallback(
    (message, duration) =>
      notify({
        message,
        type: "warning",
        duration,
      }),
    [notify]
  );

  const info = useCallback(
    (message, duration) =>
      notify({
        message,
        type: "info",
        duration,
      }),
    [notify]
  );

  /*
  ========================================
  تحويل alert القديم إلى Toast
  ========================================
  */

  useEffect(() => {
    const originalAlert = window.alert;

    window.alert = (message) => {
      notify({
        message,
        type: "info",
      });
    };

    return () => {
      window.alert = originalAlert;
    };
  }, [notify]);

  /*
  ========================================
  تنظيف المؤقتات
  ========================================
  */

  useEffect(() => {
    return () => {
      timers.current.forEach(
        (timer) => clearTimeout(timer)
      );

      timers.current.clear();
    };
  }, []);

  const value = useMemo(
    () => ({
      notify,
      success,
      error,
      warning,
      info,
      remove,
    }),
    [
      notify,
      success,
      error,
      warning,
      info,
      remove,
    ]
  );

  return (
    <NotificationContext.Provider
      value={value}
    >
      {children}

      <NotificationContainer
        notifications={notifications}
        onRemove={remove}
      />
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context =
    useContext(NotificationContext);

  if (!context) {
    throw new Error(
      "useNotifications يجب استخدامه داخل NotificationProvider"
    );
  }

  return context;
}

/*
==========================================
حاوية الإشعارات
==========================================
*/

function NotificationContainer({
  notifications,
  onRemove,
}) {
  return (
    <>
      <div
        style={{
          position: "fixed",
          top: "20px",
          right: "20px",

          zIndex: 999999,

          width:
            "min(390px, calc(100vw - 40px))",

          display: "flex",
          flexDirection: "column",
          gap: "calc(10px * var(--app-density,1))",

          direction: "rtl",

          pointerEvents: "none",
        }}
      >
        {notifications.map(
          (notification) => (
            <Notification
              key={notification.id}
              notification={notification}
              onRemove={onRemove}
            />
          )
        )}
      </div>

      <style>
        {`
          @keyframes notificationEnter {
            from {
              opacity: 0;
              transform: translateY(-12px) scale(0.97);
            }

            to {
              opacity: 1;
              transform: translateY(0) scale(1);
            }
          }

          @keyframes notificationExit {
            from {
              opacity: 1;
              transform: translateY(0);
            }

            to {
              opacity: 0;
              transform: translateY(-8px);
            }
          }
        `}
      </style>
    </>
  );
}

/*
==========================================
الإشعار
==========================================
*/

function Notification({
  notification,
  onRemove,
}) {
  const settings = {
    success: {
      title: "تم بنجاح",
      icon: CheckCircle2,
      background: "#f1faf4",
      border: "#bfe4cc",
      color: "#0f5132",
    },

    error: {
      title: "حدث خطأ",
      icon: AlertCircle,
      background: "#fff4f3",
      border: "#efc5c1",
      color: "#b42318",
    },

    warning: {
      title: "تنبيه",
      icon: AlertTriangle,
      background: "#fff9e9",
      border: "#ead9a2",
      color: "#8a6500",
    },

    info: {
      title: "معلومة",
      icon: Info,
      background: "#f3f7fb",
      border: "#cbdbea",
      color: "#315d82",
    },
  };

  const config =
    settings[notification.type] ||
    settings.info;

  const Icon = config.icon;

  return (
    <div
      role="status"
      style={{
        pointerEvents: "auto",

        display: "flex",
        alignItems: "flex-start",

        gap: "calc(11px * var(--app-density,1))",

        width: "100%",

        boxSizing: "border-box",

        padding: "calc(13px * var(--app-density,1))",

        background:
          config.background,

        border:
          `1px solid ${config.border}`,

        borderRadius: "calc(15px * var(--app-radius-scale,1))",

        boxShadow:
          "0 14px 40px rgba(0,0,0,0.12)",

        animation:
          "notificationEnter 0.25s ease",

        backdropFilter: "blur(10px)",
      }}
    >
      <div
        style={{
          width: "38px",
          height: "38px",

          flexShrink: 0,

          borderRadius: "calc(11px * var(--app-radius-scale,1))",

          background: "#fff",

          color: config.color,

          display: "flex",
          alignItems: "center",
          justifyContent: "center",

          boxShadow:
            "0 2px 8px rgba(0,0,0,0.04)",
        }}
      >
        <Icon
          size={20}
          strokeWidth={2}
        />
      </div>

      <div
        style={{
          flex: 1,
          minWidth: 0,
          paddingTop: "calc(1px * var(--app-density,1))",
        }}
      >
        <div
          style={{
            color: config.color,
            fontSize: "calc(13px * var(--app-font-scale,1))",
            fontWeight: "800",
            marginBottom: "3px",
          }}
        >
          {config.title}
        </div>

        <div
          style={{
            color: "#4c554f",
            fontSize: "calc(12px * var(--app-font-scale,1))",
            lineHeight: 1.75,
            wordBreak: "break-word",
          }}
        >
          {notification.message}
        </div>
      </div>

      <button
        type="button"
        onClick={() =>
          onRemove(notification.id)
        }
        aria-label="إغلاق"
        style={{
          width: "28px",
          height: "28px",

          flexShrink: 0,

          border: "none",
          background: "transparent",

          color: "#7f8882",

          cursor: "pointer",

          borderRadius: "calc(8px * var(--app-radius-scale,1))",

          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <X size={16} />
      </button>
    </div>
  );
}
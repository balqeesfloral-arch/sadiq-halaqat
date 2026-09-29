import { useEffect, useMemo, useState } from "react";
import {
  BellRing,
  CheckCircle2,
  CircleAlert,
  Loader2,
  RefreshCw,
  ShieldCheck,
  Smartphone,
  Volume2,
  VolumeX,
} from "lucide-react";
import {
  backgroundPushConfigured,
  getSadiqServiceWorker,
  removeCurrentPushSubscription,
  requestDeviceNotifications,
  showDeviceNotification,
  syncPushSubscription,
} from "../../lib/pwa";
import "./DeviceNotificationSettings.css";

function permissionLabel(value) {
  if (value === "granted") return "مسموح";
  if (value === "denied") return "محظور من المتصفح";
  if (value === "default") return "بانتظار موافقتك";
  return "غير مدعوم";
}

export default function DeviceNotificationSettings({
  title = "إشعارات الجهاز",
  description = "استقبل تنبيهات الصديق على جهازك عند وصول تحديثات مهمة.",
}) {
  const supported =
    typeof window !== "undefined" &&
    "Notification" in window &&
    "serviceWorker" in navigator;

  const [permission, setPermission] = useState(
    supported ? Notification.permission : "unsupported"
  );
  const [subscribed, setSubscribed] = useState(false);
  const [working, setWorking] = useState("");
  const [message, setMessage] = useState(null);

  const backgroundReady = backgroundPushConfigured();

  const stateLabel = useMemo(() => {
    if (!supported) return "غير مدعوم";
    if (permission === "denied") return "محظور";
    if (permission === "granted" && subscribed && backgroundReady) {
      return "مفعّل بالكامل";
    }
    if (permission === "granted") return "مفعّل على الجهاز";
    return "جاهز للتفعيل";
  }, [supported, permission, subscribed, backgroundReady]);

  useEffect(() => {
    refresh();
  }, []);

  async function refresh() {
    if (!supported) return;

    setWorking("refresh");

    try {
      setPermission(Notification.permission);
      const registration = await getSadiqServiceWorker();
      const subscription =
        await registration?.pushManager?.getSubscription?.();

      setSubscribed(Boolean(subscription));
    } catch (error) {
      console.warn("Notification settings refresh failed:", error);
    } finally {
      setWorking("");
    }
  }

  async function enable() {
    if (!supported || working) return;

    setWorking("enable");
    setMessage(null);

    try {
      const result = await requestDeviceNotifications();
      setPermission(result.permission);

      if (result.permission === "granted") {
        let background = null;

        try {
          background = await syncPushSubscription();
        } catch (error) {
          console.warn("Background push sync failed:", error);
        }

        await refresh();

        setMessage({
          type: "success",
          text:
            background?.ok
              ? "تم تفعيل إشعارات الجهاز، بما فيها الإشعارات أثناء إغلاق التطبيق."
              : "تم السماح بإشعارات الجهاز. سيتم تفعيل الخلفية تلقائيًا بعد اكتمال إعداد خادم الإشعارات.",
        });
      } else if (result.permission === "denied") {
        setMessage({
          type: "error",
          text: "المتصفح حظر الإشعارات. يمكنك السماح بها من إعدادات الموقع في المتصفح.",
        });
      }
    } catch (error) {
      console.error("Notification enable failed:", error);
      setMessage({
        type: "error",
        text: error?.message || "تعذر تفعيل إشعارات الجهاز.",
      });
    } finally {
      setWorking("");
    }
  }

  async function disableSubscription() {
    if (working) return;

    setWorking("disable");
    setMessage(null);

    try {
      await removeCurrentPushSubscription();
      setSubscribed(false);
      setMessage({
        type: "success",
        text: "تم إيقاف اشتراك الصديق لهذا الجهاز. إذن المتصفح نفسه يبقى كما هو ويمكن تغييره من إعدادات الموقع.",
      });
    } catch (error) {
      console.error("Notification disable failed:", error);
      setMessage({
        type: "error",
        text: "تعذر إيقاف اشتراك الجهاز.",
      });
    } finally {
      setWorking("");
    }
  }

  async function testNotification() {
    if (permission !== "granted" || working) return;

    setWorking("test");
    setMessage(null);

    try {
      const shown = await showDeviceNotification({
        title: "اختبار إشعارات الصديق",
        body: "الإشعارات تعمل على هذا الجهاز بنجاح.",
        url: window.location.pathname,
        tag: "sadiq-notification-test",
      });

      setMessage({
        type: shown ? "success" : "error",
        text: shown
          ? "تم إرسال إشعار تجريبي إلى جهازك."
          : "تعذر عرض الإشعار التجريبي.",
      });
    } finally {
      setWorking("");
    }
  }

  return (
    <section className="device-notify-card" dir="rtl">
      <div className="device-notify-card__head">
        <div className="device-notify-card__icon">
          <BellRing />
        </div>

        <div className="device-notify-card__copy">
          <span>تنبيهات فورية</span>
          <h3>{title}</h3>
          <p>{description}</p>
        </div>

        <div className="device-notify-card__state">
          <i className={permission === "denied" ? "danger" : "ok"} />
          <strong>{stateLabel}</strong>
          <small>{permissionLabel(permission)}</small>
        </div>
      </div>

      <div className="device-notify-card__features">
        <div>
          <Smartphone />
          <span>
            <strong>تنبيه على الجهاز</strong>
            <small>يظهر خارج صفحة الصديق بعد منح الإذن.</small>
          </span>
        </div>

        <div>
          {backgroundReady ? <CheckCircle2 /> : <CircleAlert />}
          <span>
            <strong>تنبيهات الخلفية</strong>
            <small>
              {backgroundReady
                ? "خادم Web Push مهيأ ويمكنه التنبيه حتى عند إغلاق التطبيق."
                : "واجهة التطبيق جاهزة؛ يتبقى ربط مفاتيح Web Push بالخادم."}
            </small>
          </span>
        </div>

        <div>
          <ShieldCheck />
          <span>
            <strong>خصوصية أعلى</strong>
            <small>لا تُرسل بيانات البصمة أو الوجه ضمن الإشعارات.</small>
          </span>
        </div>
      </div>

      {message && (
        <div className={`device-notify-card__message ${message.type}`}>
          {message.type === "success" ? <CheckCircle2 /> : <CircleAlert />}
          <span>{message.text}</span>
        </div>
      )}

      <div className="device-notify-card__actions">
        {permission !== "granted" || !subscribed ? (
          <button
            type="button"
            className="device-notify-card__primary"
            onClick={enable}
            disabled={!supported || Boolean(working)}
          >
            {working === "enable" ? (
              <Loader2 className="device-notify-spin" />
            ) : (
              <Volume2 />
            )}
            تفعيل الإشعارات
          </button>
        ) : (
          <button
            type="button"
            className="device-notify-card__secondary"
            onClick={disableSubscription}
            disabled={Boolean(working)}
          >
            {working === "disable" ? (
              <Loader2 className="device-notify-spin" />
            ) : (
              <VolumeX />
            )}
            إيقافها على هذا الجهاز
          </button>
        )}

        <button
          type="button"
          className="device-notify-card__secondary"
          onClick={testNotification}
          disabled={permission !== "granted" || Boolean(working)}
        >
          {working === "test" ? (
            <Loader2 className="device-notify-spin" />
          ) : (
            <BellRing />
          )}
          اختبار
        </button>

        <button
          type="button"
          className="device-notify-card__icon-button"
          onClick={refresh}
          disabled={Boolean(working)}
          title="تحديث الحالة"
          aria-label="تحديث حالة الإشعارات"
        >
          <RefreshCw className={working === "refresh" ? "device-notify-spin" : ""} />
        </button>
      </div>
    </section>
  );
}

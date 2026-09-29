import { useEffect, useMemo, useRef, useState } from "react";
import {
  BellRing,
  CheckCircle2,
  Download,
  Loader2,
  ShieldCheck,
  Smartphone,
  Sparkles,
  X,
} from "lucide-react";
import { supabase } from "../../lib/supabase";
import {
  deviceNotificationsEnabled,
  isStandaloneDisplay,
  registerSadiqServiceWorker,
  requestDeviceNotifications,
  showDeviceNotification,
} from "../../lib/pwa";
import "./PwaExperience.css";

const INSTALL_DISMISS_KEY = "sadiq:pwa-install-dismissed";
const NOTIFY_DISMISS_KEY = "sadiq:notify-prompt-dismissed";
const DISMISS_TTL = 7 * 24 * 60 * 60 * 1000;

function recentlyDismissed(key) {
  try {
    const value = Number(localStorage.getItem(key) || 0);
    return value && Date.now() - value < DISMISS_TTL;
  } catch {
    return false;
  }
}

function dismissForNow(key) {
  try {
    localStorage.setItem(key, String(Date.now()));
  } catch {
    // Local storage is optional.
  }
}

function destinationForRole(role) {
  if (role === "student") return "/student/notifications";
  if (role === "teacher") return "/teacher/notifications";
  if (role === "supervisor") return "/admin/notifications";
  if (role === "admin") return "/system-admin";
  return "/";
}

function extractBody(row) {
  return (
    row?.body ||
    row?.message ||
    row?.description ||
    row?.content ||
    "لديك تحديث جديد داخل الصديق."
  );
}

export default function PwaExperience() {
  const [installEvent, setInstallEvent] = useState(null);
  const [installing, setInstalling] = useState(false);
  const [installed, setInstalled] = useState(isStandaloneDisplay);
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [showInstall, setShowInstall] = useState(false);
  const [showNotify, setShowNotify] = useState(false);
  const [notificationLoading, setNotificationLoading] = useState(false);
  const lastNotificationRef = useRef(new Set());

  const notificationsSupported =
    typeof window !== "undefined" &&
    "Notification" in window &&
    "serviceWorker" in navigator;

  useEffect(() => {
    registerSadiqServiceWorker();

    const onBeforeInstall = (event) => {
      event.preventDefault();
      setInstallEvent(event);

      if (!isStandaloneDisplay() && !recentlyDismissed(INSTALL_DISMISS_KEY)) {
        window.setTimeout(() => setShowInstall(true), 900);
      }
    };

    const onInstalled = () => {
      setInstalled(true);
      setShowInstall(false);
      setInstallEvent(null);
      try {
        localStorage.removeItem(INSTALL_DISMISS_KEY);
      } catch {
        // Ignore storage failures.
      }
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (mounted) setSession(data?.session || null);
    });

    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession || null);
    });

    return () => {
      mounted = false;
      data?.subscription?.unsubscribe?.();
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadProfile() {
      if (!session?.user?.id) {
        setProfile(null);
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("id, role, full_name")
        .eq("auth_user_id", session.user.id)
        .maybeSingle();

      if (!cancelled) {
        if (error) {
          console.warn("PWA profile lookup failed:", error);
          setProfile(null);
        } else {
          setProfile(data || null);
        }
      }
    }

    loadProfile();

    return () => {
      cancelled = true;
    };
  }, [session?.user?.id]);

  useEffect(() => {
    if (
      !session?.user?.id ||
      !notificationsSupported ||
      typeof Notification === "undefined" ||
      Notification.permission !== "default" ||
      recentlyDismissed(NOTIFY_DISMISS_KEY)
    ) {
      setShowNotify(false);
      return undefined;
    }

    const timer = window.setTimeout(() => {
      setShowNotify(true);
    }, 3200);

    return () => window.clearTimeout(timer);
  }, [session?.user?.id, notificationsSupported]);

  const notificationDestination = useMemo(
    () => destinationForRole(profile?.role),
    [profile?.role]
  );

  useEffect(() => {
    if (
      !profile?.id ||
      !deviceNotificationsEnabled() ||
      !notificationsSupported
    ) {
      return undefined;
    }

    function alreadyHandled(key) {
      if (!key) return false;
      if (lastNotificationRef.current.has(key)) return true;

      lastNotificationRef.current.add(key);
      if (lastNotificationRef.current.size > 80) {
        lastNotificationRef.current = new Set(
          [...lastNotificationRef.current].slice(-40)
        );
      }

      return false;
    }

    async function notify(row, source, custom = {}) {
      if (!row) return;

      if (source === "student_notifications") {
        if (
          row.student_id != null &&
          Number(row.student_id) !== Number(profile.id)
        ) {
          return;
        }
      }

      if (source === "internal_messages") {
        if (
          row.recipient_id != null &&
          Number(row.recipient_id) !== Number(profile.id)
        ) {
          return;
        }
      }

      const possibleRecipient =
        row.recipient_id ??
        row.profile_id ??
        row.user_id;

      if (
        source === "notification_recipients" &&
        possibleRecipient != null &&
        Number(possibleRecipient) !== Number(profile.id)
      ) {
        return;
      }

      const key = `${source}:${row.id || row.notification_id || row.created_at || Date.now()}`;
      if (alreadyHandled(key)) return;

      // Keep the in-app experience quiet while the user is already looking at it.
      if (document.visibilityState === "visible" && !isStandaloneDisplay()) {
        return;
      }

      await showDeviceNotification({
        title:
          custom.title ||
          row.title ||
          row.subject ||
          "إشعار جديد من الصديق",
        body: custom.body || extractBody(row),
        url:
          custom.url ||
          row.action_path ||
          row.action_url ||
          notificationDestination,
        tag: key,
        data: {
          source,
          id: row.id || null,
        },
      });
    }

    async function handleRecipientRow(row) {
      if (!row?.notification_id) {
        await notify(row, "notification_recipients");
        return;
      }

      try {
        const { data } = await supabase
          .from("notifications")
          .select("id, title, message, severity, action_url, action_label, created_at")
          .eq("id", row.notification_id)
          .maybeSingle();

        if (data) {
          await notify(row, "notification_recipients", {
            title: data.title || "إشعار جديد من الصديق",
            body: data.message || "لديك إشعار جديد.",
            url: data.action_url || notificationDestination,
          });
        }
      } catch (error) {
        console.warn("Could not hydrate notification recipient:", error);
      }
    }

    const channel = supabase
      .channel(`sadiq-device-alerts-${profile.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "student_notifications" },
        (payload) => notify(payload.new, "student_notifications")
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "internal_messages" },
        (payload) => notify(payload.new, "internal_messages")
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notification_recipients" },
        (payload) => handleRecipientRow(payload.new)
      )
      .subscribe((status) => {
        if (status === "CHANNEL_ERROR") {
          console.warn("Device notification realtime channel is unavailable.");
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [
    profile?.id,
    profile?.role,
    notificationDestination,
    notificationsSupported,
  ]);

  async function installApp() {
    if (!installEvent || installing) return;

    setInstalling(true);

    try {
      await installEvent.prompt();
      const choice = await installEvent.userChoice;

      if (choice?.outcome === "accepted") {
        setShowInstall(false);
      }
    } catch (error) {
      console.warn("PWA install prompt failed:", error);
    } finally {
      setInstalling(false);
    }
  }

  async function enableNotifications() {
    if (notificationLoading) return;

    setNotificationLoading(true);

    try {
      const result = await requestDeviceNotifications();

      if (result.permission === "granted") {
        setShowNotify(false);
        try {
          localStorage.removeItem(NOTIFY_DISMISS_KEY);
        } catch {
          // Ignore storage failures.
        }

        await showDeviceNotification({
          title: "تم تفعيل إشعارات الصديق",
          body: "سيظهر لك تنبيه الجهاز عند وصول تحديثات مهمة أثناء عمل التطبيق.",
          url: notificationDestination,
          tag: "sadiq-notifications-enabled",
        });
      } else if (result.permission === "denied") {
        setShowNotify(false);
        dismissForNow(NOTIFY_DISMISS_KEY);
      }
    } finally {
      setNotificationLoading(false);
    }
  }

  if (installed && !showNotify) return null;

  return (
    <>
      {showInstall && installEvent && !installed && (
        <div className="pwa-prompt pwa-prompt--install" role="dialog" aria-label="تثبيت تطبيق الصديق">
          <button
            type="button"
            className="pwa-prompt__close"
            onClick={() => {
              setShowInstall(false);
              dismissForNow(INSTALL_DISMISS_KEY);
            }}
            aria-label="إغلاق"
          >
            <X />
          </button>

          <div className="pwa-prompt__icon">
            <img src="/icon-192.png" alt="" />
          </div>

          <div className="pwa-prompt__copy">
            <span><Sparkles /> تجربة التطبيق</span>
            <strong>ثبّت الصديق على جهازك</strong>
            <small>فتح أسرع • شاشة كاملة • أيقونة مستقلة • جاهزية للعمل كتطبيق</small>
          </div>

          <button
            type="button"
            className="pwa-prompt__action"
            onClick={installApp}
            disabled={installing}
          >
            {installing ? <Loader2 className="pwa-spin" /> : <Download />}
            تثبيت
          </button>
        </div>
      )}

      {showNotify && session && (
        <div className="pwa-prompt pwa-prompt--notify" role="dialog" aria-label="تفعيل إشعارات الصديق">
          <button
            type="button"
            className="pwa-prompt__close"
            onClick={() => {
              setShowNotify(false);
              dismissForNow(NOTIFY_DISMISS_KEY);
            }}
            aria-label="لاحقًا"
          >
            <X />
          </button>

          <div className="pwa-prompt__icon is-bell">
            <BellRing />
          </div>

          <div className="pwa-prompt__copy">
            <span><ShieldCheck /> بإذنك فقط</span>
            <strong>فعّل إشعارات الجهاز</strong>
            <small>تنبيهات للرسائل والتحديثات المهمة دون عرض بيانات حساسة على الشاشة.</small>
          </div>

          <button
            type="button"
            className="pwa-prompt__action"
            onClick={enableNotifications}
            disabled={notificationLoading}
          >
            {notificationLoading ? (
              <Loader2 className="pwa-spin" />
            ) : (
              <CheckCircle2 />
            )}
            تفعيل
          </button>
        </div>
      )}
    </>
  );
}

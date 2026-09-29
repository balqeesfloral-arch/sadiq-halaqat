import { supabase } from "./supabase";

let registrationPromise = null;


function urlBase64ToUint8Array(value) {
  const padding = "=".repeat((4 - (value.length % 4)) % 4);
  const base64 = (value + padding)
    .replace(/-/g, "+")
    .replace(/_/g, "/");
  const raw = window.atob(base64);
  return Uint8Array.from([...raw].map((char) => char.charCodeAt(0)));
}

function subscriptionKeys(subscription) {
  const json = subscription?.toJSON?.() || {};

  return {
    endpoint: json.endpoint || subscription?.endpoint || "",
    p256dh: json.keys?.p256dh || "",
    auth: json.keys?.auth || "",
  };
}

export function backgroundPushConfigured() {
  return Boolean(String(import.meta.env.VITE_VAPID_PUBLIC_KEY || "").trim());
}

export async function syncPushSubscription() {
  if (
    !isPwaSupported() ||
    typeof Notification === "undefined" ||
    Notification.permission !== "granted"
  ) {
    return { ok: false, reason: "permission" };
  }

  const vapidPublicKey = String(
    import.meta.env.VITE_VAPID_PUBLIC_KEY || ""
  ).trim();

  if (!vapidPublicKey) {
    return { ok: false, reason: "vapid_not_configured" };
  }

  const { data: sessionData } = await supabase.auth.getSession();
  if (!sessionData?.session?.user?.id) {
    return { ok: false, reason: "auth_required" };
  }

  const registration = await getSadiqServiceWorker();
  if (!registration?.pushManager) {
    return { ok: false, reason: "push_manager_unavailable" };
  }

  let subscription = await registration.pushManager.getSubscription();

  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
    });
  }

  const keys = subscriptionKeys(subscription);

  if (!keys.endpoint || !keys.p256dh || !keys.auth) {
    throw new Error("تعذر قراءة بيانات اشتراك إشعارات الجهاز.");
  }

  const deviceLabel = [
    navigator.platform || "",
    navigator.userAgentData?.platform || "",
  ].filter(Boolean)[0] || "جهاز موثوق";

  const { error } = await supabase.rpc("save_my_push_subscription", {
    p_endpoint: keys.endpoint,
    p_p256dh: keys.p256dh,
    p_auth: keys.auth,
    p_user_agent: navigator.userAgent || null,
    p_device_label: deviceLabel,
  });

  if (error) throw error;

  localStorage.setItem("sadiq_background_push", "enabled");

  return {
    ok: true,
    subscription,
  };
}

export async function removeCurrentPushSubscription() {
  if (!isPwaSupported()) return false;

  const registration = await getSadiqServiceWorker();
  const subscription =
    await registration?.pushManager?.getSubscription?.();

  if (!subscription) {
    localStorage.removeItem("sadiq_background_push");
    return true;
  }

  const endpoint = subscription.endpoint;

  try {
    await supabase.rpc("remove_my_push_subscription", {
      p_endpoint: endpoint,
    });
  } catch {
    // The browser subscription should still be removable if the backend is unavailable.
  }

  await subscription.unsubscribe();
  localStorage.removeItem("sadiq_background_push");
  return true;
}

export function isStandaloneDisplay() {
  if (typeof window === "undefined") return false;

  return (
    window.matchMedia?.("(display-mode: standalone)")?.matches ||
    window.matchMedia?.("(display-mode: fullscreen)")?.matches ||
    window.navigator?.standalone === true
  );
}

export function isPwaSupported() {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator
  );
}

export async function registerSadiqServiceWorker() {
  if (!isPwaSupported()) return null;

  if (!registrationPromise) {
    registrationPromise = navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .then((registration) => {
        registration.update().catch(() => {});
        return registration;
      })
      .catch((error) => {
        registrationPromise = null;
        console.error("Sadiq service worker registration failed:", error);
        return null;
      });
  }

  return registrationPromise;
}

export async function getSadiqServiceWorker() {
  const registered = await registerSadiqServiceWorker();
  if (registered) return registered;

  if (!isPwaSupported()) return null;

  try {
    return await navigator.serviceWorker.ready;
  } catch {
    return null;
  }
}

export async function showDeviceNotification(payload) {
  if (
    typeof Notification === "undefined" ||
    Notification.permission !== "granted"
  ) {
    return false;
  }

  const registration = await getSadiqServiceWorker();
  if (!registration) return false;

  if (registration.active) {
    registration.active.postMessage({
      type: "SHOW_NOTIFICATION",
      payload,
    });
    return true;
  }

  await registration.showNotification(payload?.title || "الصديق", {
    body: payload?.body || payload?.message || "لديك إشعار جديد.",
    icon: payload?.icon || "/icon-192.png",
    badge: payload?.badge || "/icon-192.png",
    tag: payload?.tag || `sadiq-${Date.now()}`,
    dir: "rtl",
    lang: "ar",
    data: {
      ...(payload?.data || {}),
      url: payload?.url || payload?.action_path || "/",
    },
  });

  return true;
}

export async function requestDeviceNotifications() {
  if (typeof Notification === "undefined") {
    return {
      supported: false,
      permission: "unsupported",
    };
  }

  const permission = await Notification.requestPermission();

  if (permission === "granted") {
    localStorage.setItem("sadiq_device_notifications", "enabled");
    await registerSadiqServiceWorker();

    try {
      await syncPushSubscription();
    } catch (error) {
      console.warn("Background push subscription could not be synced:", error);
    }
  } else {
    localStorage.setItem("sadiq_device_notifications", permission);
  }

  return {
    supported: true,
    permission,
  };
}

export function deviceNotificationsEnabled() {
  if (typeof window === "undefined") return false;

  return (
    typeof Notification !== "undefined" &&
    Notification.permission === "granted" &&
    localStorage.getItem("sadiq_device_notifications") === "enabled"
  );
}

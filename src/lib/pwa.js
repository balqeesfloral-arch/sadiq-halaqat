let registrationPromise = null;

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

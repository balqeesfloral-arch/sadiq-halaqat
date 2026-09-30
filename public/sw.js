const CACHE_VERSION = "sadiq-pwa-v2-20260930";
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const RUNTIME_CACHE = `${CACHE_VERSION}-runtime`;

const CORE_ASSETS = [
  "/",
  "/offline.html",
  "/site.webmanifest",
  "/icon-192.png",
  "/icon-512.png",
  "/icon-maskable-512.png",
  "/favicon.ico",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll(CORE_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    Promise.all([
      caches
        .keys()
        .then((keys) =>
          Promise.all(
            keys
              .filter(
                (key) =>
                  key.startsWith("sadiq-pwa-") &&
                  key !== STATIC_CACHE &&
                  key !== RUNTIME_CACHE
              )
              .map((key) => caches.delete(key))
          )
        ),
      self.clients.claim(),
    ])
  );
});

function isAssetRequest(requestUrl) {
  return (
    requestUrl.pathname.startsWith("/assets/") ||
    /\.(?:png|jpg|jpeg|webp|svg|gif|ico|woff2?)$/i.test(requestUrl.pathname)
  );
}

async function networkFirstNavigation(request) {
  try {
    const response = await fetch(request);
    if (response && response.ok) {
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put("/", response.clone()).catch(() => {});
    }
    return response;
  } catch {
    return (
      (await caches.match(request)) ||
      (await caches.match("/")) ||
      (await caches.match("/offline.html"))
    );
  }
}

function isJavaScriptRequest(request, requestUrl) {
  return (
    request.destination === "script" ||
    /\.m?js$/i.test(requestUrl.pathname)
  );
}

function hasJavaScriptMime(response) {
  const contentType = response?.headers?.get("content-type") || "";
  return /(?:javascript|ecmascript)/i.test(contentType);
}

async function staleWhileRevalidate(request) {
  const requestUrl = new URL(request.url);
  const expectsJavaScript = isJavaScriptRequest(request, requestUrl);
  const cached = await caches.match(request);

  // Never serve an HTML SPA fallback as a JavaScript module. A stale hashed
  // chunk can disappear after deployment and Vercel may answer with index.html;
  // caching that response causes the browser MIME-type crash.
  const safeCached =
    cached && (!expectsJavaScript || hasJavaScriptMime(cached))
      ? cached
      : null;

  if (cached && !safeCached) {
    const cache = await caches.open(RUNTIME_CACHE);
    cache.delete(request).catch(() => {});
  }

  const networkPromise = fetch(request)
    .then(async (response) => {
      const safeResponse =
        response &&
        response.ok &&
        (!expectsJavaScript || hasJavaScriptMime(response));

      if (safeResponse) {
        const cache = await caches.open(RUNTIME_CACHE);
        cache.put(request, response.clone()).catch(() => {});
        return response;
      }

      // For scripts, an HTML response is not usable and must never enter cache.
      if (expectsJavaScript) {
        return Response.error();
      }

      return response;
    })
    .catch(() => null);

  return safeCached || networkPromise || Response.error();
}

self.addEventListener("fetch", (event) => {
  const request = event.request;

  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith(networkFirstNavigation(request));
    return;
  }

  if (isAssetRequest(url)) {
    event.respondWith(staleWhileRevalidate(request));
  }
});

function normalizeNotificationPayload(raw) {
  const payload = raw && typeof raw === "object" ? raw : {};

  return {
    title: payload.title || "الصديق",
    body: payload.body || payload.message || "لديك إشعار جديد.",
    icon: payload.icon || "/icon-192.png",
    badge: payload.badge || "/icon-192.png",
    tag: payload.tag || `sadiq-${Date.now()}`,
    url: payload.url || payload.action_path || payload.action_url || "/",
    data: payload.data || {},
    silent: Boolean(payload.silent),
  };
}

async function showSadiqNotification(raw) {
  const notification = normalizeNotificationPayload(raw);

  return self.registration.showNotification(notification.title, {
    body: notification.body,
    icon: notification.icon,
    badge: notification.badge,
    tag: notification.tag,
    renotify: true,
    silent: notification.silent,
    dir: "rtl",
    lang: "ar",
    vibrate: [90, 40, 90],
    data: {
      ...notification.data,
      url: notification.url,
    },
    actions: [
      { action: "open", title: "فتح الصديق" },
      { action: "dismiss", title: "لاحقًا" },
    ],
  });
}

self.addEventListener("push", (event) => {
  let payload = {};

  try {
    payload = event.data?.json?.() || {};
  } catch {
    payload = { body: event.data?.text?.() || "لديك إشعار جديد." };
  }

  event.waitUntil(showSadiqNotification(payload));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  if (event.action === "dismiss") return;

  const targetUrl = new URL(
    event.notification?.data?.url || "/",
    self.location.origin
  ).href;

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        try {
          const current = new URL(client.url);
          const target = new URL(targetUrl);

          if (current.origin === target.origin) {
            client.focus();
            client.navigate(targetUrl);
            return;
          }
        } catch {
          // Ignore malformed URLs from legacy notifications.
        }
      }

      return self.clients.openWindow(targetUrl);
    })
  );
});

self.addEventListener("message", (event) => {
  const data = event.data || {};

  if (data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }

  if (data.type === "SHOW_NOTIFICATION") {
    event.waitUntil(showSadiqNotification(data.payload || {}));
  }

  if (data.type === "GET_VERSION") {
    event.ports?.[0]?.postMessage?.({ version: CACHE_VERSION });
  }
});

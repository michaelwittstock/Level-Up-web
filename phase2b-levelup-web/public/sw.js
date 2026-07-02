/* Level Up service worker — offline shell + daily quote push */
const STATIC = "lu-static-v1";
const API = "lu-api-v1";

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(STATIC).then((c) => c.addAll(["/"])));
  self.skipWaiting();
});
self.addEventListener("activate", (e) => {
  e.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;

  // hashed build assets + icons: cache-first
  if (url.pathname.startsWith("/_next/static") || url.pathname.startsWith("/icon-")) {
    e.respondWith(
      caches.match(req).then((hit) => hit || fetch(req).then((res) => {
        const copy = res.clone();
        caches.open(STATIC).then((c) => c.put(req, copy));
        return res;
      }))
    );
    return;
  }
  // navigations: network-first, fall back to cached shell
  if (req.mode === "navigate") {
    e.respondWith(
      fetch(req).then((res) => {
        const copy = res.clone();
        caches.open(STATIC).then((c) => c.put("/", copy));
        return res;
      }).catch(() => caches.match("/"))
    );
    return;
  }
  // API GETs: network-first with cache fallback (offline mode)
  if (url.pathname.startsWith("/api/")) {
    e.respondWith(
      fetch(req).then((res) => {
        if (res.ok) {
          const copy = res.clone();
          caches.open(API).then((c) => c.put(req, copy));
        }
        return res;
      }).catch(() => caches.match(req))
    );
  }
});

self.addEventListener("push", (e) => {
  let data = {};
  try { data = e.data.json(); } catch {}
  e.waitUntil(
    self.registration.showNotification(data.title || "⚡ Level Up", {
      body: data.body || "Time to level up.",
      icon: "/icon-180.png",
      badge: "/icon-180.png",
      data: { url: "/" },
    })
  );
});
self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  e.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      for (const c of list) if ("focus" in c) return c.focus();
      return self.clients.openWindow("/");
    })
  );
});

// Service worker disabled. This file self-unregisters and clears all caches
// to ensure no stale content is served to clients that previously installed it.
// Do NOT call clients.navigate() — that forced a full reload on every activate
// (tab switch / mobile resume), which feels like the site keeps refreshing.
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    try {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
    } catch (e) {}
    try {
      await self.registration.unregister();
    } catch (e) {}
  })());
});

// Do not intercept any fetch requests — force network behavior.

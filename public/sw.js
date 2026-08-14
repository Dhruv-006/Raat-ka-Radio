self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  // A minimal fetch handler is required to pass the PWA installability criteria in Chrome.
  // This just passes the request to the network, and does nothing special on offline.
  event.respondWith(
    fetch(event.request).catch(() => {
      return new Response('You are offline.');
    })
  );
});

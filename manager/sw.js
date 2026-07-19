const CACHE_NAME = 'winebox-manager-v1';

const ASSETS_TO_CACHE = [
  '/manager/',
  '/manager/index.html'
];

self.addEventListener('install', (event) => {
  // @ts-ignore
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  // @ts-ignore
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  // @ts-ignore
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    })
  );
  // @ts-ignore
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // @ts-ignore
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      // @ts-ignore
      return fetch(event.request).then((response) => {
        return response;
      }).catch(() => {
        // Offline recovery
      });
    })
  );
});

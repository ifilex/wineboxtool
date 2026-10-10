// sw.js - Service Worker para GitHub Pages
const CACHE_NAME = 'winebox-v1';
const BASE_PATH = '/tool/';  // ← CAMBIA esto si tu repo tiene otro nombre

// Lista de archivos a cachear (con la ruta completa)
const urlsToCache = [
  BASE_PATH,
  BASE_PATH + 'index.html',
  BASE_PATH + 'manifest.json'
];

// Instalación
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('Cacheando archivos:', urlsToCache);
      return cache.addAll(urlsToCache).catch(err => {
        console.error('Error al cachear:', err);
        // Intentar uno por uno para identificar cuál falla
        urlsToCache.forEach(url => {
          fetch(url).then(response => {
            if (response.ok) cache.put(url, response);
            else console.error('No se pudo cachear:', url);
          }).catch(e => console.error('Error fetching:', url, e));
        });
      });
    })
  );
  self.skipWaiting();
});

// Fetch
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      if (response) {
        return response;
      }
      return fetch(event.request).then(response => {
        if (!response || response.status !== 200) {
          return response;
        }
        const url = new URL(event.request.url);
        if (url.pathname.match(/\.(js|css|png|jpg|jpeg|svg|ico|json|html)$/)) {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      });
    })
  );
});

// Activación
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          if (cache !== CACHE_NAME) {
            console.log('Eliminando caché antigua:', cache);
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim();
});
const CACHE_NAME = 'neuroterapia-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/webfonts/fa-solid-900.woff2',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/webfonts/fa-regular-400.woff2',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/webfonts/fa-brands-400.woff2'
];

// Instalación del service worker
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Instalando...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Cacheando assets iniciales');
        return cache.addAll(ASSETS_TO_CACHE);
      })
      .then(() => {
        console.log('[Service Worker] Instalación completada');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[Service Worker] Error en instalación:', error);
      })
  );
});

// Activación del service worker
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activando...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Eliminando caché antiguo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('[Service Worker] Activación completada');
      return self.clients.claim();
    })
  );
});

// Estrategia de caché: Stale-While-Revalidate para la mayoría de recursos
self.addEventListener('fetch', (event) => {
  // Ignorar solicitudes a extensiones de Chrome y otras URLs no HTTP
  if (!event.request.url.startsWith('http')) {
    return;
  }

  // Estrategia para archivos de la aplicación
  if (event.request.url.includes('/index.html') || event.request.url.endsWith('/')) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) {
          // Actualizar el caché en segundo plano
          fetch(event.request)
            .then((response) => {
              if (response && response.status === 200) {
                const responseToCache = response.clone();
                caches.open(CACHE_NAME).then((cache) => {
                  cache.put(event.request, responseToCache);
                });
              }
            })
            .catch(() => {
              // Silenciar errores de red
            });
          return cachedResponse;
        }
        
        // Si no está en caché, obtener de la red
        return fetch(event.request)
          .then((response) => {
            if (response && response.status === 200) {
              const responseToCache = response.clone();
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, responseToCache);
              });
            }
            return response;
          })
          .catch(() => {
            // Si todo falla, mostrar página offline básica
            return new Response(
              '<html><body><h1>Sin conexión</h1><p>No se pudo cargar la página. Verifica tu conexión a internet.</p></body></html>',
              { headers: { 'Content-Type': 'text/html' } }
            );
          });
      })
    );
    return;
  }

  // Para otros recursos (CSS, JS, imágenes, iconos)
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(event.request)
        .then((response) => {
          // Verificar que la respuesta sea válida
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          // Clonar la respuesta para caché
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            // No cachear solicitudes a localStorage o datos dinámicos
            if (!event.request.url.includes('chrome-extension')) {
              cache.put(event.request, responseToCache);
            }
          });

          return response;
        })
        .catch((error) => {
          console.error('[Service Worker] Error en fetch:', error);
          
          // Para solicitudes de imágenes, devolver una imagen por defecto
          if (event.request.destination === 'image') {
            return new Response(
              '<svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><rect width="100" height="100" fill="#cccccc"/><text x="10" y="55" font-family="Arial" font-size="14" fill="#666666">Sin imagen</text></svg>',
              { headers: { 'Content-Type': 'image/svg+xml' } }
            );
          }
          
          throw error;
        });
    })
  );
});

// Manejar sincronización en segundo plano para datos offline
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-data') {
    console.log('[Service Worker] Sincronizando datos en segundo plano');
    event.waitUntil(syncData());
  }
});

// Función para sincronizar datos (puedes personalizarla según necesidades)
async function syncData() {
  try {
    const cache = await caches.open(CACHE_NAME);
    const keys = await cache.keys();
    
    // Aquí puedes implementar lógica para sincronizar datos pendientes
    console.log('[Service Worker] Datos sincronizados:', keys.length, 'elementos en caché');
    
    // Notificar a los clientes que la sincronización se completó
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({
        type: 'SYNC_COMPLETED',
        timestamp: new Date().toISOString()
      });
    });
  } catch (error) {
    console.error('[Service Worker] Error en sincronización:', error);
  }
}
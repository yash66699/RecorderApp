const CACHE_NAME = 'audio-recorder-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/app.js',
  '/style.css',
  '/buzzer_generator.js',
  '/download_manager.js',
  '/session_manager.js',
  '/manifest.json'
];

self.addEventListener('install', event => {
  console.log('🔧 Service Worker installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('📦 Caching app resources');
        return Promise.all(
          urlsToCache.map(url => {
            if (url.startsWith('chrome-extension://') || url.startsWith('moz-extension://')) {
              return Promise.resolve();
            }
            return cache.add(url).catch(() => Promise.resolve());
          })
        );
      })
      .catch(err => console.error('Cache error:', err))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  console.log('🚀 Service Worker activating...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  if (url.protocol === 'chrome-extension:' || url.protocol === 'moz-extension:' || url.protocol === 'file:') {
    return;
  }

  if (url.origin !== location.origin) {
    return;
  }

  event.respondWith(
    caches.match(request)
      .then(response => {
        if (response) {
          return response;
        }

        return fetch(request)
          .then(response => {
            if (!response || response.status !== 200 || response.type === 'error') {
              return response;
            }

            if (request.method !== 'GET') {
              return response;
            }

            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(request, responseToCache).catch(() => {});
              });

            return response;
          })
          .catch(() => {
            return caches.match(request)
              .then(response => response || new Response('Offline', { status: 503 }));
          });
      })
  );
});

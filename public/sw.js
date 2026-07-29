const CACHE_NAME = 'kts-admin-cache-v3';

// Static assets to cache
const URLS_TO_CACHE = [
  '/',
  '/index.html',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(URLS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') {
    return;
  }
  
  // API requests and non-http(s)
  if (event.request.url.includes('/api/') || !(event.request.url.startsWith('http:') || event.request.url.startsWith('https:'))) {
    return;
  }

  // SPA navigation requests (e.g. /dashboard)
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response && response.ok) {
            return response;
          }
          return caches.match('/index.html').then((cached) => cached || fetch('/index.html'));
        })
        .catch(() => {
          return caches.match('/index.html').then((cached) => cached || fetch('/index.html'));
        })
    );
    return;
  }

  // Network First, fallback to cache for other assets
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response && response.status === 200 && response.type === 'basic') {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      })
      .catch(async () => {
        const cachedResponse = await caches.match(event.request);
        if (cachedResponse) return cachedResponse;
        return new Response('Network error', { status: 408, headers: { 'Content-Type': 'text/plain' } });
      })
  );
});


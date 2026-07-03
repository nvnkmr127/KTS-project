const CACHE_NAME = 'kts-admin-cache-v2';

// Static assets to cache
const URLS_TO_CACHE = [
  '/',
  '/index.html',
  // Normally we would list hashed CSS/JS files here, but since Vite handles hashing,
  // we will just implement a network-first strategy for all navigation and JS/CSS.
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
  // Only cache GET requests
  if (event.request.method !== 'GET') {
    return;
  }
  
  // API requests: Network only, do not cache.
  // In a real PWA we might use BackgroundSync for POST requests.
  if (event.request.url.includes('/api/') || !(event.request.url.startsWith('http:') || event.request.url.startsWith('https:'))) {
    return;
  }

  // Network First, fallback to cache for HTML/JS/CSS (App Shell)
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Clone and update cache
        if (response && response.status === 200 && response.type === 'basic') {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        // Fallback to cache if offline
        return caches.match(event.request).then((response) => {
          if (response) return response;
          // Return index.html for SPA routing if offline and navigation request
          if (event.request.mode === 'navigate') {
            return caches.match('/index.html');
          }
        });
      })
  );
});

const CACHE_NAME = 'splitease-v1';
const urlsToCache = [
  '/',
  '/dashboard',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
];

// Routes that should never be cached
const noCacheRoutes = [
  '/api/auth',
  '/auth',
  '/api/auth/session',
  '/api/auth/login',
  '/api/auth/logout',
  '/api/auth/redirect'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(urlsToCache);
      })
  );
});

// Skip waiting to ensure the new service worker activates immediately
self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Skip caching for auth-related routes
  const url = new URL(event.request.url);
  const shouldNotCache = noCacheRoutes.some(route => url.pathname.startsWith(route));
  
  if (shouldNotCache) {
    // For auth routes, always go to network and don't cache
    event.respondWith(fetch(event.request));
    return;
  }
  
  // For all other routes, use cache-first strategy
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Cache hit - return response
        if (response) {
          return response;
        }
        
        return fetch(event.request).then(
          (response) => {
            // Check if we received a valid response
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clone the response
            const responseToCache = response.clone();

            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });

            return response;
          }
        );
      })
  );
});

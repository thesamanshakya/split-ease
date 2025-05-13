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

// Helper function to check if a request is cacheable
function isCacheableRequest(request) {
  const url = new URL(request.url);

  // Don't cache chrome-extension:// URLs
  if (url.protocol === 'chrome-extension:') {
    return false;
  }

  // Don't cache POST requests or other non-GET requests
  if (request.method !== 'GET') {
    return false;
  }

  // Don't cache auth-related routes
  if (noCacheRoutes.some(route => url.pathname.startsWith(route))) {
    return false;
  }

  return true;
}

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
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  // First check if the request is cacheable
  if (!isCacheableRequest(event.request)) {
    // For non-cacheable requests, just use network
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

        // Clone the request because it's a one-time use stream
        const fetchRequest = event.request.clone();

        return fetch(fetchRequest).then(
          (response) => {
            // Check if we received a valid response
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clone the response
            const responseToCache = response.clone();

            // Don't block the response on cache operations
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              })
              .catch(err => {
                console.warn('Failed to cache response:', err);
              });

            return response;
          }
        );
      })
  );
});

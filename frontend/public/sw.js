// UdyamAI Progressive Web App (PWA) Service Worker
const CACHE_VERSION = 'udyam-v1';
const STATIC_CACHE = `udyam-static-${CACHE_VERSION}`;
const RUNTIME_CACHE = `udyam-runtime-${CACHE_VERSION}`;

// Pre-cached core app shell assets
const PRECACHE_ASSETS = [
  '/',
  '/offline.html',
  '/manifest.json',
  '/logo-icon.svg',
  '/icons/icon-192x192.svg',
  '/icons/icon-512x512.svg',
  '/icons/maskable-icon-512x512.svg',
  '/icons/apple-touch-icon.svg',
];

// Install Event: Precache static core assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll(PRECACHE_ASSETS))
      .then(() => self.skipWaiting())
      .catch((err) => {
        console.warn('[SW] Precache failed:', err);
      })
  );
});

// Activate Event: Purge outdated caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== STATIC_CACHE && key !== RUNTIME_CACHE)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

// Message Listener: Support explicit cache clearing on user logout (§7.1 Shared Device Security)
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'CLEAR_USER_CACHE') {
    caches.delete(RUNTIME_CACHE).then(() => {
      console.log('[SW] Runtime user cache purged on logout.');
    });
  }
});

// Helper: Determine if URL is a read-heavy cacheable API endpoint
function isCacheableApi(url) {
  const pathname = url.pathname;
  return (
    pathname.startsWith('/api/v1/schemes') ||
    pathname.startsWith('/api/v1/analysis')
  );
}

// Helper: Determine if URL is a live streaming / non-cacheable API
function isLiveAiOrAuthApi(url) {
  const pathname = url.pathname;
  return (
    pathname.startsWith('/api/v1/chat') ||
    pathname.startsWith('/api/v1/auth') ||
    pathname.startsWith('/webhooks')
  );
}

// Fetch Event
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Only handle GET requests
  if (request.method !== 'GET') {
    return;
  }

  const url = new URL(request.url);

  // 1. Bypass Service Worker for live AI streams, chat, and auth
  if (isLiveAiOrAuthApi(url)) {
    return;
  }

  // 2. Navigation (HTML Pages): Stale-While-Revalidate with offline fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(RUNTIME_CACHE).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return networkResponse;
        })
        .catch(async () => {
          const cachedResponse = await caches.match(request);
          if (cachedResponse) {
            return cachedResponse;
          }
          // Fallback to offline page
          const offlinePage = await caches.match('/offline.html');
          return offlinePage || new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
        })
    );
    return;
  }

  // 3. API Requests (Schemes & Feasibility Analysis): Network-First with Cache fallback
  if (url.origin === self.location.origin && isCacheableApi(url)) {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(RUNTIME_CACHE).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return networkResponse;
        })
        .catch(async () => {
          const cachedResponse = await caches.match(request);
          if (cachedResponse) {
            return cachedResponse;
          }
          return new Response(JSON.stringify({ error: 'Network unavailable', offline: true }), {
            status: 503,
            headers: { 'Content-Type': 'application/json' },
          });
        })
    );
    return;
  }

  // 4. Static Assets (_next/static, images, icons, fonts): Stale-While-Revalidate
  if (
    url.pathname.startsWith('/_next/static') ||
    url.pathname.startsWith('/icons/') ||
    url.pathname.endsWith('.svg') ||
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.woff2') ||
    url.pathname.endsWith('.css') ||
    url.pathname.endsWith('.js')
  ) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        const fetchPromise = fetch(request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              const responseClone = networkResponse.clone();
              caches.open(STATIC_CACHE).then((cache) => {
                cache.put(request, responseClone);
              });
            }
            return networkResponse;
          })
          .catch(() => cachedResponse);

        return cachedResponse || fetchPromise;
      })
    );
    return;
  }

  // Default: Network with Cache fallback
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      return (
        cachedResponse ||
        fetch(request).catch(() => {
          return new Response('', { status: 408, statusText: 'Request Timed Out' });
        })
      );
    })
  );
});

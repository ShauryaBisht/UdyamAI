// UdyamAI Progressive Web App (PWA) Service Worker
// Version: 1.1 - Secure shared-device isolation & resilient precaching
const CACHE_VERSION = 'udyam-v2';
const STATIC_CACHE = `udyam-static-${CACHE_VERSION}`;
const PUBLIC_API_CACHE = `udyam-public-api-${CACHE_VERSION}`;

// Pre-cached core app shell assets
const PRECACHE_ASSETS = [
  '/offline.html',
  '/manifest.json',
  '/logo-icon.svg',
  '/icons/icon-192x192.svg',
  '/icons/icon-512x512.svg',
  '/icons/maskable-icon-512x512.svg',
  '/icons/apple-touch-icon.svg',
];

// Install Event: Resilient individual precaching
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => {
        return Promise.allSettled(
          PRECACHE_ASSETS.map((asset) =>
            fetch(asset)
              .then((res) => {
                if (res.ok) return cache.put(asset, res);
                throw new Error(`Failed to fetch ${asset}`);
              })
              .catch((err) => console.warn(`[SW] Precache item failed: ${asset}`, err))
          )
        );
      })
      .then(() => self.skipWaiting())
  );
});

// Activate Event: Purge old cache versions
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== STATIC_CACHE && key !== PUBLIC_API_CACHE)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

// Message Listener: Support explicit cache clearing on user logout (§7.1 Shared Device Security)
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'CLEAR_USER_CACHE') {
    event.waitUntil(
      caches.delete(PUBLIC_API_CACHE).then(() => {
        console.log('[SW] Public API cache purged on logout.');
      })
    );
  }
});

// Helper: Determine if URL is a public, non-authenticated catalog endpoint safe to cache
function isPublicCatalogApi(url) {
  const pathname = url.pathname;
  // ONLY public schemes directory is cached in SW. Authenticated user analysis is NEVER stored in SW cache.
  return pathname.startsWith('/api/v1/schemes');
}

// Helper: Determine if URL is a live streaming, authenticated, or user-private endpoint
function isPrivateOrLiveApi(url) {
  const pathname = url.pathname;
  return (
    pathname.startsWith('/api/v1/chat') ||
    pathname.startsWith('/api/v1/auth') ||
    pathname.startsWith('/api/v1/analysis') ||
    pathname.startsWith('/api/v1/expenses') ||
    pathname.startsWith('/api/v1/finance') ||
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

  // 1. Bypass Service Worker for private user APIs, auth, and live AI streams
  if (isPrivateOrLiveApi(url)) {
    return;
  }

  // 2. Navigation (HTML Pages): Network first, fallback to offline.html
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(async () => {
        const offlinePage = await caches.match('/offline.html');
        return offlinePage || new Response('You are offline. Please reconnect.', { status: 503, statusText: 'Offline' });
      })
    );
    return;
  }

  // 3. Public Schemes Catalog API: Network-First with Cache Storage fallback
  if (url.origin === self.location.origin && isPublicCatalogApi(url)) {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(PUBLIC_API_CACHE).then((cache) => {
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

const CACHE_PREFIX = 'mathnote-';
const CACHE_NAME = '__CACHE_NAME__';
const PRECACHE_ASSETS = __PRECACHE_ASSETS__;
const APP_SHELL = new URL('./index.html', self.registration.scope).toString();

const scopedUrl = path => new URL(path, self.registration.scope).toString();

self.addEventListener('install', event => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then(cache => cache.addAll(PRECACHE_ASSETS.map(scopedUrl)))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches
      .keys()
      .then(keys =>
        Promise.all(
          keys
            .filter(key => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME)
            .map(key => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then(response => response)
        .catch(() => caches.match(APP_SHELL))
    );
    return;
  }

  event.respondWith(
    caches
      .match(request, { ignoreSearch: true })
      .then(cached => cached || fetch(request))
  );
});

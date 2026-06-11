const CACHE = 'kura-store-v3';
const FONT_CACHE = 'kura-fonts-v1';

const PRECACHE = [
  '/',
  '/index.html',
  '/dist/app.js',
  '/dist/styles.css',
];

const FONT_ORIGINS = ['fonts.googleapis.com', 'fonts.gstatic.com'];

self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(PRECACHE).catch(() => {}))
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE && k !== FONT_CACHE).map(k => caches.delete(k)))
    ).then(() => clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);

  // Cache-first for Google Fonts (stable, long-lived)
  if (FONT_ORIGINS.some(o => url.hostname.includes(o))) {
    e.respondWith(
      caches.open(FONT_CACHE).then(cache =>
        cache.match(e.request).then(cached => {
          if (cached) return cached;
          return fetch(e.request).then(res => {
            cache.put(e.request, res.clone());
            return res;
          }).catch(() => cached);
        })
      )
    );
    return;
  }

  // Network-first for app assets — force bypass HTTP cache so deploys are immediate
  const isAppAsset = url.origin === self.location.origin &&
    (url.pathname === '/' || url.pathname.endsWith('.html') ||
     url.pathname.endsWith('.js') || url.pathname.endsWith('.css'));
  const req = isAppAsset
    ? new Request(e.request.url, { cache: 'reload', credentials: 'same-origin' })
    : e.request;

  e.respondWith(
    fetch(req)
      .then(res => {
        const clone = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone));
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});

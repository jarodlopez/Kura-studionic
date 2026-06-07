const CACHE = 'kura-admin-v3';

const PRECACHE = [
  '/admin/',
  '/admin/index.html',
  '/admin/views/InventoryView.js',
  '/admin/views/OrdersView.js',
  '/admin/views/DesignView.js',
  '/admin/views/DiscountsView.js',
  '/admin/views/BannersView.js',
  '/admin/views/AnalyticsView.js',
  '/admin/icons/icon.svg',
];

self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(PRECACHE).catch(() => {}))
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => clients.claim())
  );
});

// Network-first: siempre datos frescos de Firebase
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request)
      .then(res => {
        const clone = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone));
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});

// Push notifications (requiere VAPID keys en el servidor)
// TODO: configurar servidor de push con web-push y VAPID keys
self.addEventListener('push', (e) => {
  if (!e.data) return;
  const data = e.data.json();
  e.waitUntil(
    self.registration.showNotification(data.title || 'KURA STUDIO', {
      body: data.body,
      icon: '/admin/icons/icon.svg',
      badge: '/admin/icons/icon.svg',
      tag: data.tag || 'kura-notif',
      data: { url: data.url || '/admin/' },
      actions: [
        { action: 'open', title: 'Ver en admin' },
        { action: 'close', title: 'Cerrar' },
      ],
    })
  );
});

self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  if (e.action === 'close') return;
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      const url = e.notification.data?.url || '/admin/';
      const existing = list.find(c => c.url.includes('/admin/'));
      if (existing) { existing.focus(); return existing.navigate(url); }
      return clients.openWindow(url);
    })
  );
});

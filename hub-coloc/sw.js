const CACHE_NAME = 'hub-coloc-v2.0.1';
const urlsToCache = [
  '/verifTOUT/hub-coloc/',
  '/verifTOUT/hub-coloc/index.html',
  '/verifTOUT/hub-coloc/manifest.json',
  '/verifTOUT/hub-coloc/icon-512.png',
  '/verifTOUT/hub-coloc/icon.png'
];
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return Promise.all(
          urlsToCache.map(url => {
            return cache.add(url).catch(err => {
              console.error(`❌ SW: Échec de mise en cache pour : ${url}`, err);
            });
          })
        );
      })
      .then(() => self.skipWaiting())
  );
});
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          if (cache !== CACHE_NAME) return caches.delete(cache);
        })
      );
    }).then(() => clients.claim())
  );
});
self.addEventListener('fetch', event => {
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});
self.addEventListener('push', event => {
  let title = 'Hub Coloc';
  let body = 'Nouvelle activité dans la colocation !';
  if (event.data) {
    try {
      const payload = event.data.json();
      title = payload.notification?.title || title;
      body = payload.notification?.body || body;
    } catch(e) {}
  }
  event.waitUntil(
    self.registration.showNotification(title, { body })
  );
});

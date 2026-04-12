const CACHE_NAME = 'hub-coloc-v2.0.0';

const urlsToCache = [
  '/HUB-COLOC/',
  '/HUB-COLOC/index.html',
  '/HUB-COLOC/manifest.json',
  '/HUB-COLOC/icon-512.png',
  '/HUB-COLOC/icon.png'
];

self.addEventListener('install', event => {
  console.log('SW: Installation...');
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
  console.log('SW: Activé');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          if (cache !== CACHE_NAME) {
            console.log('SW: Suppression ancien cache', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => clients.claim())
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    fetch(event.request).catch(() => {
      return caches.match(event.request);
    })
  );
});

self.addEventListener('push', event => {
  let title = 'Hub Coloc';
  let body = 'Nouvelle activité dans la colocation !';
  
  if (event.data) {
    try {
      const payload = event.data.json();
      if (payload.notification) {
        title = payload.notification.title || title;
        body = payload.notification.body || body;
      } else {
        title = payload.title || title;
        body = payload.body || body;
      }
    } catch (e) {
      body = event.data.text();
    }
  }

  const options = {
    body: body,
    icon: '/HUB-COLOC/icon-512.png',
    badge: '/HUB-COLOC/icon-512.png',
    vibrate: [100, 50, 100, 50, 100],
    data: { url: '/HUB-COLOC/' }
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then(windowClients => {
      for (let i = 0; i < windowClients.length; i++) {
        let client = windowClients[i];
        if (client.url.includes('/HUB-COLOC/') && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow('/HUB-COLOC/');
      }
    })
  );
});

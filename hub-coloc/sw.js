// Service Worker pour Hub Coloc - Notifications Push
// Ce fichier doit être à la racine du dossier coword

const CACHE_NAME = 'hub-coloc-v1';
const urlsToCache = [
  './',
  './index.html'
];

// Installation du Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('✅ Service Worker installé');
      return cache.addAll(urlsToCache);
    }).catch(err => {
      console.warn('Erreur cache SW:', err);
      // Continuer même si le cache échoue
    })
  );
  self.skipWaiting();
});

// Activation du Service Worker
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
    })
  );
  self.clients.claim();
});

// Récupération (Fetch) avec fallback offline
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((response) => {
      if (response) {
        return response;
      }
      return fetch(event.request).then((response) => {
        if (!response || response.status !== 200 || response.type === 'error') {
          return response;
        }
        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });
        return response;
      }).catch(() => {
        // Offline - retourner la version en cache
        return caches.match(event.request);
      });
    })
  );
});

// ─── GESTION DES NOTIFICATIONS PUSH ───
self.addEventListener('push', (event) => {
  console.log('📢 Notification reçue:', event);
  
  let notificationData = {
    title: '🔔 Hub Coloc',
    body: 'Nouvelle activité dans votre colocation',
    icon: './favicon.ico',
    badge: './favicon.ico',
    tag: 'hub-coloc',
    requireInteraction: false
  };

  if (event.data) {
    try {
      const data = event.data.json();
      notificationData = { ...notificationData, ...data };
    } catch (err) {
      notificationData.body = event.data.text();
    }
  }

  event.waitUntil(
    self.registration.showNotification(notificationData.title, {
      body: notificationData.body,
      icon: notificationData.icon,
      badge: notificationData.badge,
      tag: notificationData.tag,
      requireInteraction: notificationData.requireInteraction,
      vibrate: [200, 100, 200],
      data: { url: './' }
    })
  );
});

// Clic sur la notification
self.addEventListener('notificationclick', (event) => {
  console.log('👆 Notification cliquée');
  event.notification.close();

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Si l'app est déjà ouverte, la forcer au premier plan
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url === '/' || client.url.includes('/hub-coloc/')) {
          return client.focus();
        }
      }
      // Sinon, ouvrir l'app
      return clients.openWindow('./');
    })
  );
});

// Fermeture de la notification
self.addEventListener('notificationclose', (event) => {
  console.log('✕ Notification fermée');
});

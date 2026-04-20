// Service Worker pour Hub Coloc - Notifications Push
// Ce fichier doit être dans le dossier hub-coloc/ (même niveau que index.html)

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
    icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect fill="%232196F3" width="100" height="100"/><text x="50" y="70" font-size="60" text-anchor="middle" fill="white">💬</text></svg>',
    badge: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect fill="%232196F3" width="100" height="100"/><text x="50" y="70" font-size="60" text-anchor="middle" fill="white">💬</text></svg>',
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
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url === '/' || client.url.includes('/hub-coloc/')) {
          return client.focus();
        }
      }
      return clients.openWindow('./');
    })
  );
});

// Fermeture de la notification
self.addEventListener('notificationclose', (event) => {
  console.log('✕ Notification fermée');
});

// ─── MESSAGE DEPUIS L'APP POUR ENVOYER UNE NOTIF ───
// L'app envoie un message au SW quand elle reçoit un nouveau message
// Ça permet d'envoyer une notif même si l'app est en arrière-plan
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
    console.log('💬 Message reçu de l\'app:', event.data);
    self.registration.showNotification(event.data.title, {
      body: event.data.body,
      icon: event.data.icon || 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect fill="%232196F3" width="100" height="100"/><text x="50" y="70" font-size="60" text-anchor="middle" fill="white">💬</text></svg>',
      badge: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect fill="%232196F3" width="100" height="100"/><text x="50" y="70" font-size="60" text-anchor="middle" fill="white">💬</text></svg>',
      tag: 'hub-coloc-chat',
      requireInteraction: false,
      vibrate: [200, 100, 200]
    });
  }
});

// Service Worker pour Hub Coloc - Notifications Push
// Ultra simple et robuste

const CACHE_NAME = 'hub-coloc-v1';

// Installation
self.addEventListener('install', (event) => {
  console.log('✅ SW installé');
  self.skipWaiting();
});

// Activation
self.addEventListener('activate', (event) => {
  self.clients.claim();
});

// Fetch basique
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(fetch(event.request).catch(() => null));
});

// ─── MESSAGE DEPUIS L'APP POUR ENVOYER UNE NOTIF ───
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
    console.log('📱 Notif reçue:', event.data.title);
    
    self.registration.showNotification(event.data.title, {
      body: event.data.body || 'Nouveau message',
      icon: event.data.icon || 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect fill="%232196F3" width="100" height="100"/><text x="50" y="70" font-size="60" text-anchor="middle" fill="white">💬</text></svg>',
      tag: 'hub-coloc-chat',
      requireInteraction: false,
      vibrate: [200, 100, 200]
    }).catch(err => console.error('Erreur notif:', err));
  }
});

// Clic sur notif
self.addEventListener('notificationclick', (event) => {
  console.log('👆 Notif cliquée');
  event.notification.close();
  
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((list) => {
      for (let client of list) {
        if (client.url.includes('hub-coloc')) {
          return client.focus();
        }
      }
      return clients.openWindow('./');
    })
  );
});

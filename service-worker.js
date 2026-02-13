// public/service-worker.js

const CACHE_NAME = 'health-companion-cache-v1';
const URLS_TO_CACHE = [
  '/',
  '/index.html',
  '/index.tsx',
  'https://unpkg.com/recharts/umd/Recharts.min.js',
  '/pills.png',
  '/heart-alert.png',
];

self.addEventListener('install', (event) => {
  self.skipWaiting(); // Force the waiting service worker to become the active service worker
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(URLS_TO_CACHE).catch(err => {
          console.warn('Could not cache all assets during install:', err);
        });
      })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim()); // Take control of all open clients immediately
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

self.addEventListener('fetch', (event) => {
  // ONLY intercept GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  const url = event.request.url;

  // Skip ALL API and Firebase traffic
  if (
    url.includes('firestore.googleapis.com') || 
    url.includes('generativelanguage.googleapis.com') ||
    url.includes('firebase') ||
    url.includes('google-analytics') ||
    url.includes('vercel')
  ) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response;
        }
        return fetch(event.request);
      })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const urlToOpen = new URL(self.location.origin).href + (event.notification.data.url || '');

  event.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true,
    }).then((clientList) => {
      if (clientList.length > 0) {
        let client = clientList[0];
        for (let i = 0; i < clientList.length; i++) {
          if (clientList[i].focused) {
            client = clientList[i];
          }
        }
        client.navigate(urlToOpen);
        return client.focus();
      }
      return clients.openWindow(urlToOpen);
    })
  );
});

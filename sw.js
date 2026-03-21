// sw.js - Service Worker for Crunk Games PWA

const CACHE_NAME = 'crunk-games-v1.0.0';
const RUNTIME_CACHE = 'crunk-games-runtime';

// Assets to cache on install
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/home.html',
  '/tournaments.html',
  '/teams.html',
  '/leaderboard.html',
  '/team-create.html',
  '/league-create.html',
  '/league-view.html',
  '/league-dashboard.html',
  '/spin.html',
  '/nav.html',
  '/home.css',
  '/nav.css',
  '/tournaments.css',
  '/home.js',
  '/tournaments.js',
  '/nav.js',
  '/login.js',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
  'https://unpkg.com/boxicons@2.1.4/css/boxicons.min.css',
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap'
];

// Install event - cache core assets
self.addEventListener('install', event => {
  console.log('[Service Worker] Installing...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[Service Worker] Caching core assets');
        return cache.addAll(PRECACHE_ASSETS);
      })
      .then(() => {
        console.log('[Service Worker] Installation complete');
        return self.skipWaiting();
      })
      .catch(err => console.error('[Service Worker] Cache error:', err))
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('[Service Worker] Activating...');
  
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          if (cache !== CACHE_NAME && cache !== RUNTIME_CACHE) {
            console.log('[Service Worker] Deleting old cache:', cache);
            return caches.delete(cache);
          }
        })
      );
    })
  );
  
  return self.clients.claim();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;
  
  // Skip Firebase and Supabase requests
  if (url.hostname.includes('firebase') || 
      url.hostname.includes('supabase') ||
      url.hostname.includes('googleapis')) {
    return;
  }
  
  // Skip API requests
  if (url.pathname.includes('/api/')) {
    return;
  }
  
  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        // Return cached response if available
        if (cachedResponse) {
          return cachedResponse;
        }
        
        // Otherwise fetch from network
        return fetch(event.request)
          .then(networkResponse => {
            // Don't cache if not successful
            if (!networkResponse || networkResponse.status !== 200) {
              return networkResponse;
            }
            
            // Clone the response
            const responseToCache = networkResponse.clone();
            
            // Open runtime cache
            caches.open(RUNTIME_CACHE)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });
            
            return networkResponse;
          })
          .catch(error => {
            console.error('[Service Worker] Fetch error:', error);
            
            // Return offline page for navigation requests
            if (event.request.mode === 'navigate') {
              return caches.match('/offline.html');
            }
            
            return new Response('Offline - Please check your connection', {
              status: 503,
              statusText: 'Service Unavailable'
            });
          });
      })
  );
});

// Background sync for offline messages
self.addEventListener('sync', event => {
  console.log('[Service Worker] Sync event:', event.tag);
  
  if (event.tag === 'sync-messages') {
    event.waitUntil(syncMessages());
  }
});

async function syncMessages() {
  const pendingMessages = await getPendingMessages();
  
  for (const message of pendingMessages) {
    try {
      await sendMessageToServer(message);
      await removePendingMessage(message.id);
    } catch (error) {
      console.error('Failed to sync message:', error);
    }
  }
}

// Push notification event
self.addEventListener('push', event => {
  console.log('[Service Worker] Push notification received');
  
  let data = {
    title: 'Crunk Games',
    body: 'You have a new notification',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-icon.png'
  };
  
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data.body = event.data.text();
    }
  }
  
  const options = {
    body: data.body,
    icon: data.icon || '/icons/icon-192x192.png',
    badge: data.badge || '/icons/badge-icon.png',
    vibrate: [200, 100, 200],
    data: {
      url: data.url || '/',
      dateOfArrival: Date.now()
    },
    actions: [
      {
        action: 'open',
        title: 'Open',
        icon: '/icons/open-icon.png'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/icons/close-icon.png'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Notification click event
self.addEventListener('notificationclick', event => {
  console.log('[Service Worker] Notification clicked');
  
  event.notification.close();
  
  const urlToOpen = event.notification.data?.url || '/';
  
  event.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    }).then(windowClients => {
      // Check if there's already a window/tab open
      for (let client of windowClients) {
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      // If not, open a new window
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

// Helper functions for background sync
async function getPendingMessages() {
  // Get from IndexedDB or localStorage
  const messages = localStorage.getItem('pendingMessages');
  return messages ? JSON.parse(messages) : [];
}

async function sendMessageToServer(message) {
  // Implement your message sending logic here
  console.log('Sending message:', message);
  return Promise.resolve();
}

async function removePendingMessage(id) {
  const messages = await getPendingMessages();
  const filtered = messages.filter(m => m.id !== id);
  localStorage.setItem('pendingMessages', JSON.stringify(filtered));
}

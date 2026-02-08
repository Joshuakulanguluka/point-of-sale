// Service Worker for POS System
// Enables FULL offline functionality and app installation

const CACHE_NAME = 'pos-system-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/pages/dashboard.html',
  '/pages/sales.html',
  '/pages/Inventory.html',
  '/pages/expenses.html',
  '/pages/wallet.html',
  '/pages/reports.html',
  '/pages/profile.html',
  '/pages/settings.html',
  '/pages/notifications.html',
  '/pages/transaction_history.html',
  '/assets/css/styles.css',
  '/assets/js/data.js',
  '/assets/js/sync.js',
  '/assets/js/script.js',
  '/assets/js/pwa.js',
  '/assets/js/theme_toggle.js',
  '/assets/js/calculations.js',
  '/assets/js/settings.js',
  '/assets/componets/sidebar.html',
  '/assets/componets/topbar.html',
  '/manifest.json'
];

// Install event - cache ALL resources for offline use
self.addEventListener('install', event => {
  console.log('✅ Service Worker: Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('✅ Service Worker: Caching all files for offline use');
        return cache.addAll(urlsToCache).catch(err => {
          console.warn('⚠️ Some files failed to cache:', err);
          // Continue anyway - app will still work
        });
      })
      .then(() => {
        console.log('✅ Service Worker: Installation complete');
        return self.skipWaiting();
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('✅ Service Worker: Activating...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          if (cache !== CACHE_NAME) {
            console.log('🗑️ Service Worker: Clearing old cache:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => {
      console.log('✅ Service Worker: Activated and ready for offline use');
      return self.clients.claim();
    })
  );
});

// Fetch event - OFFLINE FIRST strategy
self.addEventListener('fetch', event => {
  event.respondWith(
    // Try cache first for instant offline support
    caches.match(event.request)
      .then(cachedResponse => {
        if (cachedResponse) {
          // Return cached version immediately
          return cachedResponse;
        }

        // Not in cache, try network
        return fetch(event.request)
          .then(networkResponse => {
            // Don't cache external resources or API calls
            const url = event.request.url;
            
            // Cache local resources only
            if (!url.includes('http://') && !url.includes('https://') || 
                url.includes(self.location.origin)) {
              
              // Skip API endpoints
              if (!url.includes('/api/')) {
                return caches.open(CACHE_NAME).then(cache => {
                  cache.put(event.request, networkResponse.clone());
                  return networkResponse;
                });
              }
            }
            
            return networkResponse;
          })
          .catch(error => {
            console.log('⚠️ Fetch failed, using offline fallback:', error);
            
            // For navigation requests, return index.html
            if (event.request.mode === 'navigate') {
              return caches.match('/index.html');
            }
            
            // For other requests, return a basic offline response
            return new Response('Offline - content not available', {
              status: 503,
              statusText: 'Service Unavailable',
              headers: new Headers({
                'Content-Type': 'text/plain'
              })
            });
          });
      })
  );
});

// Background sync event - sync data when connection restored
self.addEventListener('sync', event => {
  if (event.tag === 'sync-data') {
    console.log('🔄 Service Worker: Background sync triggered');
    event.waitUntil(syncData());
  }
});

// Sync data function
async function syncData() {
  try {
    console.log('🔄 Service Worker: Attempting to sync data...');
    
    // Notify all clients to sync
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({
        type: 'SYNC_REQUESTED',
        timestamp: new Date().toISOString()
      });
    });
    
    console.log('✅ Service Worker: Sync request sent to clients');
  } catch (error) {
    console.error('❌ Service Worker: Sync failed', error);
  }
}

// Push notification event (for future use)
self.addEventListener('push', event => {
  const options = {
    body: event.data ? event.data.text() : 'New notification from POS System',
    icon: '/assets/icons/icon-192x192.png',
    badge: '/assets/icons/icon-72x72.png',
    vibrate: [200, 100, 200],
    tag: 'pos-notification'
  };

  event.waitUntil(
    self.registration.showNotification('POS System', options)
  );
});

// Notification click event
self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow('/')
  );
});

// Message event - handle messages from clients
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

console.log('✅ Service Worker: Script loaded and ready');

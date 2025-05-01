// Service Worker for Push Notifications
// Version: 1.1.0

// Cache name for offline support
const CACHE_NAME = 'reasonote-cache-v1';
const DEBUG = true;

// Log helper
function log(...args) {
  if (DEBUG) {
    console.log('[Service Worker]', ...args);
  }
}

// Error log helper
function logError(...args) {
  console.error('[Service Worker Error]', ...args);
}

// Install event - cache essential files
self.addEventListener('install', (event) => {
  log('Installing Service Worker');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      log('Caching app shell and content');
      return cache.addAll([
        '/',
        '/favicon.ico',
        '/images/apple-touch-icon.png',
        '/manifest.json'
      ]);
    }).then(() => {
      log('Service Worker installed successfully');
      // Force the waiting service worker to become the active service worker
      return self.skipWaiting();
    }).catch(err => {
      logError('Service Worker installation failed', err);
    })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  log('Activating Service Worker');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            log('Clearing old cache', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      log('Service Worker activated successfully');
      // Ensure the service worker takes control of all clients as soon as it's activated
      return self.clients.claim();
    }).catch(err => {
      logError('Service Worker activation failed', err);
    })
  );
});

// Message event - handle messages from clients
self.addEventListener('message', (event) => {
  log('Received message', event.data);
  if (event.data && event.data.type === 'SKIP_WAITING') {
    log('Skip waiting message received');
    self.skipWaiting();
  }
});

// Push event - handle incoming push notifications
self.addEventListener('push', function(event) {
  log('Push notification received', event);
  
  let notificationData;
  
  try {
    if (event.data) {
      try {
        notificationData = event.data.json();
        log('Push data (JSON):', notificationData);
      } catch (e) {
        // If the data isn't JSON, use the text
        const text = event.data.text();
        log('Push data (Text):', text);
        try {
          // Try to parse the text as JSON
          notificationData = JSON.parse(text);
        } catch (e2) {
          // If that fails too, use the text as is
          notificationData = {
            title: 'Reasonote Notification',
            body: text
          };
        }
      }
    } else {
      log('Push event without data');
      notificationData = {
        title: 'Reasonote Notification',
        body: 'New notification from Reasonote'
      };
    }
  } catch (e) {
    logError('Error processing push data', e);
    // If all else fails, use a default
    notificationData = {
      title: 'Reasonote Notification',
      body: 'New notification from Reasonote'
    };
  }
  
  const options = {
    body: notificationData.body || 'New notification from Reasonote',
    icon: '/images/apple-touch-icon.png',
    badge: '/images/favicon-192x192.png',
    data: {
      url: notificationData.url || '/',
      timestamp: new Date().getTime()
    },
    // iOS specific options
    actions: notificationData.actions || [],
    vibrate: [100, 50, 100],
    tag: notificationData.tag || 'reasonote-notification',
    renotify: notificationData.renotify || false
  };
  
  log('Showing notification with options:', options);
  
  event.waitUntil(
    self.registration.showNotification(notificationData.title || 'Reasonote', options)
      .then(() => log('Notification shown successfully'))
      .catch(err => logError('Error showing notification', err))
  );
});

// Notification click event - handle user clicking on the notification
self.addEventListener('notificationclick', function(event) {
  log('Notification clicked', event);
  
  event.notification.close();
  
  // Get the notification data
  const data = event.notification.data || {};
  const urlToOpen = data.url || '/';
  
  log('Opening URL:', urlToOpen);
  
  // Open the app and navigate to the specified URL
  event.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    }).then(function(clientList) {
      log('Found clients:', clientList.length);
      
      // If we have a client already open, focus it and navigate
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        log('Checking client:', client.url);
        if ('focus' in client) {
          log('Focusing client');
          return client.focus().then(focusedClient => {
            if (focusedClient.url !== urlToOpen) {
              log('Navigating to', urlToOpen);
              return focusedClient.navigate(urlToOpen);
            }
          });
        }
      }
      
      // Otherwise open a new window
      if (clients.openWindow) {
        log('Opening new window to', urlToOpen);
        return clients.openWindow(urlToOpen);
      }
    }).catch(err => logError('Error handling notification click', err))
  );
});

// Fetch event - for offline support
self.addEventListener('fetch', (event) => {
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }
  
  // Network-first strategy for API requests
  if (event.request.url.includes('/api/')) {
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          return caches.match(event.request);
        })
    );
    return;
  }
  
  // Cache-first strategy for static assets
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request).then((fetchResponse) => {
        return caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, fetchResponse.clone());
          return fetchResponse;
        });
      });
    })
  );
});
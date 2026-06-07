const STATIC_CACHE = 'talentcrew-static-v1';
const DATA_CACHE = 'talentcrew-data-v1';
const OFFLINE_URL = '/offline.html';
const SYNC_TAG = 'sync-requests';
const DB_NAME = 'talentcrew-offline-sync';
const STORE_NAME = 'request-queue';

const STATIC_ASSETS = [
  '/',
  OFFLINE_URL,
  '/manifest.json',
  '/logo_black.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(STATIC_ASSETS))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => cacheName !== STATIC_CACHE && cacheName !== DATA_CACHE)
          .map((cacheName) => caches.delete(cacheName))
      );
    })
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const requestUrl = new URL(request.url);

  if (request.method !== 'GET') {
    return;
  }

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          return caches.open(STATIC_CACHE).then((cache) => {
            cache.put(request, response.clone());
            return response;
          });
        })
        .catch(() => caches.match(OFFLINE_URL))
    );
    return;
  }

  if (requestUrl.pathname.startsWith('/api/') || requestUrl.pathname.includes('/api/')) {
    event.respondWith(networkFirst(request));
    return;
  }

  if (
    request.destination === 'style' ||
    request.destination === 'script' ||
    request.destination === 'image' ||
    request.destination === 'font' ||
    request.destination === 'document'
  ) {
    event.respondWith(cacheFirst(request));
    return;
  }
});

self.addEventListener('message', (event) => {
  if (!event.data || !event.data.type) {
    return;
  }

  if (event.data.type === 'QUEUE_REQUEST') {
    event.waitUntil(storeRequest(event.data.request).then(() => {
      if ('sync' in self.registration) {
        return self.registration.sync.register(SYNC_TAG);
      }
      return Promise.resolve();
    }));
  }

  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('sync', (event) => {
  if (event.tag === SYNC_TAG) {
    event.waitUntil(replayQueuedRequests());
  }
});

self.addEventListener('push', (event) => {
  const payload = event.data?.json?.() || {
    title: 'New update available',
    body: 'Open TalentCrew to view the latest changes.',
    url: '/',
  };

  const title = payload.title || 'TalentCrew Notification';
  const options = {
    body: payload.body || 'You have a new notification.',
    icon: '/logo_black.png',
    badge: '/logo_black.png',
    data: {
      url: payload.url || '/',
    },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const clickResponsePromise = clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
    const url = event.notification.data?.url || '/';
    for (const client of clientList) {
      if ('focus' in client) {
        client.focus();
        return client.navigate(url);
      }
    }
    return clients.openWindow(url);
  });
  event.waitUntil(clickResponsePromise);
});

async function cacheFirst(request) {
  const cache = await caches.open(STATIC_CACHE);
  const cachedResponse = await cache.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    const response = await fetch(request);
    if (response && response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    return cachedResponse || caches.match(OFFLINE_URL);
  }
}

async function networkFirst(request) {
  const cache = await caches.open(DATA_CACHE);
  try {
    const response = await fetch(request);
    if (response && response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cachedResponse = await cache.match(request);
    return cachedResponse || caches.match(OFFLINE_URL);
  }
}

function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function withStore(mode: IDBTransactionMode, callback: (store: IDBObjectStore) => IDBRequest) {
  const db = (await openDatabase()) as IDBDatabase;
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, mode);
    const store = tx.objectStore(STORE_NAME);
    const request = callback(store);
    tx.oncomplete = () => resolve(request.result);
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}

async function storeRequest(request) {
  return withStore('readwrite', (store) => store.add(request));
}

async function getAllRequests() {
  return withStore('readonly', (store) => store.getAll());
}

async function deleteRequest(id) {
  return withStore('readwrite', (store) => store.delete(id));
}

async function replayQueuedRequests() {
  const queuedRequests = await getAllRequests();
  if (!queuedRequests || !queuedRequests.length) {
    return;
  }

  for (const queuedRequest of queuedRequests) {
    try {
      const headers = new Headers(queuedRequest.headers || {});
      const response = await fetch(queuedRequest.url, {
        method: queuedRequest.method,
        headers,
        body: queuedRequest.body || undefined,
        credentials: 'include',
      });

      if (response.ok) {
        await deleteRequest(queuedRequest.id);
      }
    } catch (error) {
      console.warn('Background sync replay failed for request', queuedRequest, error);
    }
  }
}

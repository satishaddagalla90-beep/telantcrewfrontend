export type BackgroundSyncRequest = {
  id?: number;
  url: string;
  method: 'POST' | 'PUT';
  headers?: Record<string, string>;
  body?: string | null;
  timestamp?: number;
};

export async function queueSyncRequest(request: BackgroundSyncRequest) {
  if (!('serviceWorker' in navigator) || !navigator.serviceWorker.controller) {
    throw new Error('Service worker is unavailable for background sync.');
  }

  const registration = await navigator.serviceWorker.ready;
  const requestPayload = {
    ...request,
    timestamp: Date.now(),
  };

  navigator.serviceWorker.controller.postMessage({
    type: 'QUEUE_REQUEST',
    request: requestPayload,
  });

  const syncRegistration = (registration as ServiceWorkerRegistration & {
    sync?: any;
  }).sync;

  if (syncRegistration) {
    try {
      await syncRegistration.register('sync-requests');
    } catch (err) {
      console.warn('Background sync registration failed:', err);
    }
  }
}

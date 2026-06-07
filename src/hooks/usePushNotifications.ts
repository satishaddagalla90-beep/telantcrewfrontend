import { useCallback, useEffect, useState } from 'react';
import { showErrorToast, showInfoToast } from '../utils/toast';

const VAPID_PUBLIC_KEY = process.env.REACT_APP_PUSH_PUBLIC_KEY || '';
const SUBSCRIBE_ENDPOINT = process.env.REACT_APP_PUSH_SUBSCRIPTION_URL || '/api/push/subscribe';

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}

export function usePushNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>(Notification.permission);
  const [isSubscribed, setIsSubscribed] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setPermission(Notification.permission);
  }, []);

  const subscribe = useCallback(async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      setError('Push notifications are not supported on this browser.');
      return;
    }

    if (!VAPID_PUBLIC_KEY) {
      setError('Missing push VAPID public key. Set REACT_APP_PUSH_PUBLIC_KEY.');
      return;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });

      const response = await fetch(SUBSCRIBE_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(subscription),
      });

      if (!response.ok) {
        throw new Error(`Push subscription registration failed with status ${response.status}`);
      }

      setIsSubscribed(true);
      showInfoToast('Push notifications enabled.');
    } catch (registrationError) {
      console.error('Push subscription failed:', registrationError);
      setError('Unable to subscribe to push notifications.');
      showErrorToast('Unable to subscribe to push notifications.');
    }
  }, []);

  const requestPermission = useCallback(async () => {
    if (!('Notification' in window)) {
      setError('Browser does not support notifications.');
      return;
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      if (result === 'granted') {
        await subscribe();
      }
    } catch (permissionError) {
      console.error('Notification permission request failed:', permissionError);
      setError('Notification permission request failed.');
    }
  }, [subscribe]);

  return {
    permission,
    isSubscribed,
    error,
    requestPermission,
    subscribe,
  };
}

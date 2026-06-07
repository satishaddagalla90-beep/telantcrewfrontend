import React from 'react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

const OfflineStatus: React.FC = () => {
  const { isOnline } = useOnlineStatus();

  if (isOnline) {
    return null;
  }

  return (
    <div className="fixed inset-x-0 top-0 z-50 bg-rose-600 px-4 py-3 text-center text-white shadow-md">
      <p className="mx-auto max-w-4xl font-medium">
        You are currently offline. New network requests are disabled, and any changes may sync automatically when you reconnect.
      </p>
    </div>
  );
};

export default OfflineStatus;

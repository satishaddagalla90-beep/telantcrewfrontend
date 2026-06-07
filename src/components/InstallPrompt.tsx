import React from 'react';
import { useInstallPrompt } from '../hooks/useInstallPrompt';

const InstallPrompt: React.FC = () => {
  const { canInstall, promptInstall, showIosBanner, dismissIosBanner } = useInstallPrompt();

  return (
    <div className="pwa-install-container fixed bottom-4 right-4 z-50 space-y-3 text-sm">
      {canInstall ? (
        <button
          type="button"
          onClick={promptInstall}
          className="rounded-full bg-sky-600 px-4 py-2 text-white shadow-lg transition hover:bg-sky-700"
        >
          Install App
        </button>
      ) : null}

      {showIosBanner ? (
        <div className="max-w-sm rounded-2xl border border-slate-200 bg-slate-50 p-4 shadow-xl">
          <div className="mb-2 font-semibold text-slate-900">Install on your iPhone or iPad</div>
          <p className="mb-3 text-slate-700">
            Tap Share, then Add to Home Screen to install the app.
          </p>
          <button
            type="button"
            onClick={dismissIosBanner}
            className="rounded-full bg-slate-900 px-3 py-1 text-white hover:bg-slate-700"
          >
            Got it
          </button>
        </div>
      ) : null}
    </div>
  );
};

export default InstallPrompt;

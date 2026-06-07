import { useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

const IOS_BANNER_KEY = 'talentcrew_pwa_ios_banner_seen';

export function useInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIosBanner, setShowIosBanner] = useState(false);

  useEffect(() => {
    const isIos = /iphone|ipad|ipod/i.test(window.navigator.userAgent);
    const isInStandaloneMode = ('standalone' in window.navigator && (window.navigator as any).standalone) || window.matchMedia('(display-mode: standalone)').matches;

    if (isIos && !isInStandaloneMode && !localStorage.getItem(IOS_BANNER_KEY)) {
      setShowIosBanner(true);
    }

    const beforeInstallHandler = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', beforeInstallHandler as EventListener);

    return () => {
      window.removeEventListener('beforeinstallprompt', beforeInstallHandler as EventListener);
    };
  }, []);

  const promptInstall = async (): Promise<boolean> => {
    if (!deferredPrompt) {
      return false;
    }

    try {
      await deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      setDeferredPrompt(null);
      return choiceResult.outcome === 'accepted';
    } catch (error) {
      console.error('Install prompt failed:', error);
      return false;
    }
  };

  const dismissIosBanner = () => {
    localStorage.setItem(IOS_BANNER_KEY, 'true');
    setShowIosBanner(false);
  };

  return {
    deferredPrompt,
    promptInstall,
    showIosBanner,
    dismissIosBanner,
    canInstall: Boolean(deferredPrompt),
  };
}

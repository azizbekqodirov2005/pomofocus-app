import { useCallback, useEffect, useMemo, useState } from 'react';

/** Chrome's install prompt event, which is not in the DOM lib yet. */
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

function isStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  const iosStandalone = (window.navigator as Navigator & { standalone?: boolean }).standalone;
  return window.matchMedia?.('(display-mode: standalone)').matches === true || iosStandalone === true;
}

function isIosSafariLike(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent;
  const iOS = /iphone|ipad|ipod/i.test(ua);
  // iPadOS reports a desktop UA, so fall back to the touch-capable Mac check.
  const iPadOS = navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;
  return iOS || iPadOS;
}

export interface InstallState {
  /** The browser offered a native install prompt. */
  canPrompt: boolean;
  /** No native prompt exists here, so the user needs the manual steps. */
  needsManualSteps: boolean;
  installed: boolean;
  prompt: () => Promise<'accepted' | 'dismissed' | 'unavailable'>;
}

/**
 * Wraps the install flow. Chrome and Edge fire `beforeinstallprompt`, which is
 * saved for a button press; iOS has no such event, so those users get the
 * Share-sheet steps instead.
 */
export function useInstallPrompt(): InstallState {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(isStandalone);

  useEffect(() => {
    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferred(event as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setDeferred(null);
    };

    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt);
    window.addEventListener('appinstalled', onInstalled);

    const query = window.matchMedia?.('(display-mode: standalone)');
    const onDisplayModeChange = (event: MediaQueryListEvent) => setInstalled(event.matches);
    query?.addEventListener('change', onDisplayModeChange);

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt);
      window.removeEventListener('appinstalled', onInstalled);
      query?.removeEventListener('change', onDisplayModeChange);
    };
  }, []);

  const prompt = useCallback(async (): Promise<'accepted' | 'dismissed' | 'unavailable'> => {
    if (!deferred) return 'unavailable';
    await deferred.prompt();
    const { outcome } = await deferred.userChoice;
    // The event can only be used once.
    setDeferred(null);
    return outcome;
  }, [deferred]);

  return useMemo(
    () => ({
      canPrompt: !installed && deferred !== null,
      needsManualSteps: !installed && deferred === null && isIosSafariLike(),
      installed,
      prompt,
    }),
    [installed, deferred, prompt],
  );
}

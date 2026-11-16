import { useEffect, useRef } from 'react';
import { registerSW } from 'virtual:pwa-register';
import { useToast } from '@/state/ToastProvider';
import { useI18n } from '@/i18n/useI18n';

/**
 * Registers the service worker and surfaces its lifecycle through toasts.
 * Updates are never applied silently: a running session would reload without
 * warning, so the user decides when to take the new version.
 */
export function usePwaUpdate(): void {
  const { notify } = useToast();
  const { t } = useI18n();

  const latest = useRef({ notify, t });
  latest.current = { notify, t };

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    const updateServiceWorker = registerSW({
      immediate: true,
      onNeedRefresh() {
        const { notify: toast, t: translate } = latest.current;
        toast(translate('toast.updateAvailable'), 'info', {
          persist: true,
          action: {
            label: translate('toast.updateAction'),
            onClick: () => {
              void updateServiceWorker(true);
            },
          },
        });
      },
      onOfflineReady() {
        const { notify: toast, t: translate } = latest.current;
        toast(translate('toast.offlineReady'), 'success');
      },
    });
  }, []);
}

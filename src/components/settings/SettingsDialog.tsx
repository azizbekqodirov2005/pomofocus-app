import { useCallback, useEffect, useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { NumberField } from '@/components/ui/NumberField';
import { Toggle } from '@/components/ui/Toggle';
import { SETTING_LIMITS, useSettings } from '@/state/SettingsProvider';
import { useToast } from '@/state/ToastProvider';
import { useI18n } from '@/i18n/useI18n';
import {
  notificationPermission,
  requestNotificationPermission,
} from '@/lib/notifications';
import { playChime, unlockAudio } from '@/lib/sound';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-b border-border-base py-1 last:border-b-0">
      <h3 className="pt-3 pb-1 text-[12px] font-medium tracking-[0.1em] text-faint uppercase">
        {title}
      </h3>
      <div className="divide-y divide-[color:var(--border)]">{children}</div>
    </section>
  );
}

export function SettingsDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { settings, update, restoreDefaults } = useSettings();
  const { notify } = useToast();
  const { t } = useI18n();
  const [confirmRestore, setConfirmRestore] = useState(false);
  const [permission, setPermission] = useState(notificationPermission);

  useEffect(() => {
    if (open) setPermission(notificationPermission());
  }, [open]);

  const onToggleNotifications = useCallback(
    async (next: boolean) => {
      if (!next) {
        update('notificationsEnabled', false);
        return;
      }
      const result = await requestNotificationPermission();
      setPermission(result);
      if (result === 'granted') {
        update('notificationsEnabled', true);
        notify(t('toast.notificationsOn'), 'success');
      } else {
        update('notificationsEnabled', false);
        notify(t('toast.notificationsDenied'), 'danger');
      }
    },
    [update, notify, t],
  );

  const unsupported = permission === 'unsupported';
  const blocked = permission === 'denied';

  return (
    <>
      <Modal
        open={open}
        title={t('settings.title')}
        onClose={onClose}
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmRestore(true)}>
              {t('settings.restoreDefaults')}
            </Button>
            <Button variant="secondary" onClick={onClose}>
              {t('common.close')}
            </Button>
          </>
        }
      >
        <Section title={t('settings.durations')}>
          <NumberField
            label={t('settings.focusDuration')}
            unit={t('settings.minutesUnit')}
            value={settings.focusMinutes}
            min={SETTING_LIMITS.focusMinutes.min}
            max={SETTING_LIMITS.focusMinutes.max}
            onCommit={(value) => update('focusMinutes', value)}
          />
          <NumberField
            label={t('settings.shortBreakDuration')}
            unit={t('settings.minutesUnit')}
            value={settings.shortBreakMinutes}
            min={SETTING_LIMITS.shortBreakMinutes.min}
            max={SETTING_LIMITS.shortBreakMinutes.max}
            onCommit={(value) => update('shortBreakMinutes', value)}
          />
          <NumberField
            label={t('settings.longBreakDuration')}
            unit={t('settings.minutesUnit')}
            value={settings.longBreakMinutes}
            min={SETTING_LIMITS.longBreakMinutes.min}
            max={SETTING_LIMITS.longBreakMinutes.max}
            onCommit={(value) => update('longBreakMinutes', value)}
          />
          <NumberField
            label={t('settings.sessionsBeforeLongBreak')}
            value={settings.sessionsBeforeLongBreak}
            min={SETTING_LIMITS.sessionsBeforeLongBreak.min}
            max={SETTING_LIMITS.sessionsBeforeLongBreak.max}
            onCommit={(value) => update('sessionsBeforeLongBreak', value)}
          />
          <NumberField
            label={t('settings.dailyGoal')}
            unit={t('settings.sessionsUnit')}
            value={settings.dailyGoal}
            min={SETTING_LIMITS.dailyGoal.min}
            max={SETTING_LIMITS.dailyGoal.max}
            onCommit={(value) => update('dailyGoal', value)}
          />
          <p className="py-2.5 text-[12.5px] text-faint">{t('settings.changeWhileRunning')}</p>
        </Section>

        <Section title={t('settings.behaviour')}>
          <Toggle
            label={t('settings.autoStartBreaks')}
            hint={t('settings.autoStartBreaksHint')}
            checked={settings.autoStartBreaks}
            onChange={(value) => update('autoStartBreaks', value)}
          />
          <Toggle
            label={t('settings.autoStartFocus')}
            hint={t('settings.autoStartFocusHint')}
            checked={settings.autoStartFocus}
            onChange={(value) => update('autoStartFocus', value)}
          />
        </Section>

        <Section title={t('settings.alerts')}>
          <Toggle
            label={t('settings.sound')}
            hint={t('settings.soundHint')}
            checked={settings.soundEnabled}
            onChange={(value) => {
              update('soundEnabled', value);
              if (value) {
                unlockAudio();
                playChime('breakEnd');
              }
            }}
          />
          <Toggle
            label={t('settings.notifications')}
            hint={t('settings.notificationsHint')}
            checked={settings.notificationsEnabled && permission === 'granted'}
            disabled={unsupported || blocked}
            note={
              unsupported
                ? t('settings.notificationsUnsupported')
                : blocked
                  ? t('settings.notificationsBlocked')
                  : undefined
            }
            onChange={(value) => {
              void onToggleNotifications(value);
            }}
          />
        </Section>
      </Modal>

      <ConfirmDialog
        open={confirmRestore}
        title={t('settings.restoreTitle')}
        body={t('settings.restoreBody')}
        confirmLabel={t('common.restore')}
        tone="primary"
        onCancel={() => setConfirmRestore(false)}
        onConfirm={() => {
          restoreDefaults();
          setConfirmRestore(false);
          notify(t('toast.settingsRestored'), 'success');
        }}
      />
    </>
  );
}

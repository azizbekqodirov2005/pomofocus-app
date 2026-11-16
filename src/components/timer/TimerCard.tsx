import { useMemo, useState } from 'react';
import type { SessionType } from '@/types';
import { useTimer } from '@/state/TimerProvider';
import { useSettings } from '@/state/SettingsProvider';
import { useTasks } from '@/state/TasksProvider';
import { useI18n } from '@/i18n/useI18n';
import { formatClock } from '@/lib/time';
import { cn } from '@/lib/cn';
import { SessionTabs } from './SessionTabs';
import { TimerControls } from './TimerControls';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

const SESSION_LABEL = {
  focus: 'session.focus',
  shortBreak: 'session.shortBreak',
  longBreak: 'session.longBreak',
} as const;

const MOTIVATION_KEYS = [
  'motivation.m1',
  'motivation.m2',
  'motivation.m3',
  'motivation.m4',
  'motivation.m5',
  'motivation.m6',
  'motivation.m7',
] as const;

export function TimerCard() {
  const { state, remainingMs, progress, nextType, toggle, reset, skip, selectType } = useTimer();
  const { settings } = useSettings();
  const { activeTask } = useTasks();
  const { t } = useI18n();
  const [pendingType, setPendingType] = useState<SessionType | null>(null);

  const clock = formatClock(remainingMs);
  const isFocus = state.type === 'focus';

  const motivation = useMemo(() => {
    const index = (state.cyclePosition + (isFocus ? 0 : 3)) % MOTIVATION_KEYS.length;
    return MOTIVATION_KEYS[index] ?? MOTIVATION_KEYS[0];
  }, [state.cyclePosition, isFocus]);

  const handleSelect = (type: SessionType) => {
    if (type === state.type) return;
    if (state.status === 'running') {
      setPendingType(type);
      return;
    }
    selectType(type);
  };

  const dots = Array.from({ length: settings.sessionsBeforeLongBreak }, (_, index) => index);

  return (
    <section
      aria-label={t(SESSION_LABEL[state.type])}
      className="flex flex-col items-center rounded-lg border border-border-base bg-surface px-5 py-8 shadow-subtle sm:px-10 sm:py-12"
    >
      <SessionTabs current={state.type} onSelect={handleSelect} />

      <p className="mt-7 text-[12px] font-medium tracking-[0.14em] text-muted uppercase">
        {t(SESSION_LABEL[state.type])}
        <span className="mx-2 text-faint">·</span>
        <span className="text-faint normal-case tracking-normal">{t(`status.${state.status}`)}</span>
      </p>

      <div
        className="clock-digits mt-2 text-[clamp(4.25rem,18vw,7.5rem)]"
        aria-live="off"
        aria-label={`${clock} ${t(SESSION_LABEL[state.type])}`}
      >
        {clock}
      </div>

      {/* Screen readers get a calmer, minute-level announcement. */}
      <p className="sr-only" aria-live="polite">
        {`${Math.ceil(remainingMs / 60000)} / ${Math.round(state.durationMs / 60000)}`}
      </p>

      <div className="mt-6 w-full max-w-md">
        <div
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(progress * 100)}
          aria-label={t(SESSION_LABEL[state.type])}
          className="h-[3px] w-full overflow-hidden rounded-full bg-track"
        >
          <div
            className="h-full rounded-full bg-accent transition-[width] duration-200 ease-linear"
            style={{ width: `${progress * 100}%` }}
          />
        </div>

        <div className="mt-4 flex items-center justify-between gap-3 text-[12.5px] text-muted">
          <span className="inline-flex items-center gap-1.5">
            <span className="text-faint">{t('session.cycle')}</span>
            <span className="flex items-center gap-1" aria-hidden="true">
              {dots.map((index) => (
                <span
                  key={index}
                  className={cn(
                    'size-[6px] rounded-full transition-colors duration-200',
                    index < state.cyclePosition ? 'bg-accent' : 'bg-track',
                  )}
                />
              ))}
            </span>
            <span className="tnum sr-only">
              {t('session.cycleValue', {
                current: state.cyclePosition,
                total: settings.sessionsBeforeLongBreak,
              })}
            </span>
          </span>

          <span className="truncate">
            <span className="text-faint">{t('session.nextUp')}: </span>
            {t(SESSION_LABEL[nextType])}
          </span>
        </div>
      </div>

      <div className="mt-8">
        <TimerControls
          status={state.status}
          canReset={state.status !== 'idle' || remainingMs !== state.durationMs}
          onToggle={toggle}
          onReset={reset}
          onSkip={skip}
        />
      </div>

      <div className="mt-7 min-h-10 w-full max-w-md text-center">
        {activeTask ? (
          <p className="truncate text-[13px] text-muted">
            <span className="text-faint">{t('tasks.activeLabel')}: </span>
            <span className="font-medium text-text">{activeTask.title}</span>
          </p>
        ) : (
          <p className="text-[13px] text-faint">{t('tasks.noActive')}</p>
        )}
        {isFocus && state.status === 'running' ? (
          <p className="animate-fade mt-1.5 text-[13px] text-faint italic">{t(motivation)}</p>
        ) : null}
      </div>

      <ConfirmDialog
        open={pendingType !== null}
        title={t('controls.switchTitle')}
        body={t('controls.switchBody')}
        confirmLabel={t('common.confirm')}
        onCancel={() => setPendingType(null)}
        onConfirm={() => {
          if (pendingType) selectType(pendingType);
          setPendingType(null);
        }}
      />
    </section>
  );
}

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type { SessionType, Settings, TimerState } from '@/types';
import { readStorage, StorageKeys, writeStorage } from '@/lib/storage';
import { playChime, unlockAudio } from '@/lib/sound';
import { showNotification } from '@/lib/notifications';
import { useSettings } from './SettingsProvider';
import { useStats } from './StatsProvider';
import { useTasks } from './TasksProvider';
import { useToast } from './ToastProvider';
import { useI18n } from '@/i18n/useI18n';
import { formatClock } from '@/lib/time';

/** How often the countdown is re-derived from wall-clock time. */
const TICK_MS = 250;

export function durationFor(type: SessionType, settings: Settings): number {
  switch (type) {
    case 'focus':
      return settings.focusMinutes * 60_000;
    case 'shortBreak':
      return settings.shortBreakMinutes * 60_000;
    case 'longBreak':
      return settings.longBreakMinutes * 60_000;
  }
}

function freshState(type: SessionType, settings: Settings, cyclePosition: number): TimerState {
  const durationMs = durationFor(type, settings);
  return { type, status: 'idle', durationMs, remainingMs: durationMs, endsAt: null, cyclePosition };
}

function sanitizeTimerState(input: unknown, settings: Settings): TimerState {
  const fallback = freshState('focus', settings, 0);
  if (!input || typeof input !== 'object') return fallback;
  const raw = input as Partial<Record<keyof TimerState, unknown>>;
  const type = raw.type;
  if (type !== 'focus' && type !== 'shortBreak' && type !== 'longBreak') return fallback;
  const status = raw.status;
  if (status !== 'idle' && status !== 'running' && status !== 'paused') return fallback;

  const durationMs = Number(raw.durationMs);
  const remainingMs = Number(raw.remainingMs);
  const endsAt = raw.endsAt === null ? null : Number(raw.endsAt);
  const cyclePosition = Number(raw.cyclePosition);

  const safeDuration =
    Number.isFinite(durationMs) && durationMs > 0 ? durationMs : durationFor(type, settings);

  return {
    type,
    status,
    durationMs: safeDuration,
    remainingMs: Number.isFinite(remainingMs)
      ? Math.min(safeDuration, Math.max(0, remainingMs))
      : safeDuration,
    endsAt: status === 'running' && endsAt !== null && Number.isFinite(endsAt) ? endsAt : null,
    cyclePosition: Number.isFinite(cyclePosition) ? Math.max(0, Math.round(cyclePosition)) : 0,
  };
}

interface TimerContextValue {
  state: TimerState;
  /** Milliseconds left right now — recomputed from timestamps, never accumulated. */
  remainingMs: number;
  progress: number;
  nextType: SessionType;
  start: () => void;
  pause: () => void;
  toggle: () => void;
  reset: () => void;
  skip: () => void;
  selectType: (type: SessionType) => void;
}

const TimerContext = createContext<TimerContextValue | null>(null);

export function TimerProvider({ children }: { children: ReactNode }) {
  const { settings } = useSettings();
  const { recordSession, stats } = useStats();
  const { activeTask, incrementActivePomodoro } = useTasks();
  const { notify } = useToast();
  const { t } = useI18n();

  const [state, setState] = useState<TimerState>(() =>
    sanitizeTimerState(readStorage<unknown>(StorageKeys.timer, null), settings),
  );
  const [remainingMs, setRemainingMs] = useState<number>(() =>
    state.status === 'running' && state.endsAt !== null
      ? Math.max(0, state.endsAt - Date.now())
      : state.remainingMs,
  );

  // Latest values for use inside timers and event listeners.
  const latest = useRef({ state, settings, activeTask, stats, recordSession, incrementActivePomodoro, notify, t });
  latest.current = { state, settings, activeTask, stats, recordSession, incrementActivePomodoro, notify, t };

  useEffect(() => {
    writeStorage(StorageKeys.timer, state);
  }, [state]);

  useEffect(() => {
    document.documentElement.dataset.phase =
      state.type === 'focus' ? 'focus' : state.type === 'shortBreak' ? 'short' : 'long';
  }, [state.type]);

  /** Decide which session follows the one that just ended. */
  const computeNext = useCallback(
    (finished: TimerState, counted: boolean, config: Settings) => {
      if (finished.type === 'focus') {
        const cycle = counted ? finished.cyclePosition + 1 : finished.cyclePosition;
        const longDue = counted && cycle >= config.sessionsBeforeLongBreak;
        return {
          type: (longDue ? 'longBreak' : 'shortBreak') as SessionType,
          cyclePosition: cycle,
        };
      }
      return {
        type: 'focus' as SessionType,
        cyclePosition: finished.type === 'longBreak' ? 0 : finished.cyclePosition,
      };
    },
    [],
  );

  /**
   * Finish the current session. `counted` is false when the user skips, so a
   * skipped session never pollutes the statistics.
   */
  const finishSession = useCallback(
    (counted: boolean) => {
      const {
        state: current,
        settings: config,
        activeTask: task,
        stats: today,
        recordSession: record,
        incrementActivePomodoro: bump,
        notify: toast,
        t: translate,
      } = latest.current;

      const wasFocus = current.type === 'focus';

      if (counted) {
        record(current.type, current.durationMs, wasFocus ? (task?.title ?? null) : null);
        if (wasFocus) bump();
        if (config.soundEnabled) playChime(wasFocus ? 'focusEnd' : 'breakEnd');
      }

      const next = computeNext(current, counted, config);

      if (counted) {
        const message = wasFocus ? translate('toast.focusDone') : translate('toast.breakDone');
        toast(message, 'success');
        if (config.notificationsEnabled) {
          showNotification(
            translate('app.name'),
            `${message} · ${translate(
              next.type === 'focus'
                ? 'session.focus'
                : next.type === 'shortBreak'
                  ? 'session.shortBreak'
                  : 'session.longBreak',
            )} ${formatClock(durationFor(next.type, config))}`,
          );
        }
        if (wasFocus && today.completedFocusSessions + 1 === config.dailyGoal) {
          toast(translate('toast.goalReached'), 'success');
        }
      } else {
        toast(translate('toast.skipped'), 'info');
      }

      const autoStart = next.type === 'focus' ? config.autoStartFocus : config.autoStartBreaks;
      const durationMs = durationFor(next.type, config);

      if (autoStart) {
        const endsAt = Date.now() + durationMs;
        setState({
          type: next.type,
          status: 'running',
          durationMs,
          remainingMs: durationMs,
          endsAt,
          cyclePosition: next.cyclePosition,
        });
        setRemainingMs(durationMs);
      } else {
        setState(freshState(next.type, config, next.cyclePosition));
        setRemainingMs(durationMs);
      }
    },
    [computeNext],
  );

  const finishRef = useRef(finishSession);
  finishRef.current = finishSession;

  /** Guards against completing the same deadline twice (React Strict Mode, re-entrancy). */
  const handledDeadline = useRef<number | null>(null);

  /**
   * The countdown is derived from `endsAt` on every evaluation, so throttled
   * intervals, a sleeping laptop or a backgrounded tab cannot cause drift.
   * A deadline timeout runs alongside the interval so the alert lands on time
   * even while the interval is being throttled.
   */
  useEffect(() => {
    if (state.status !== 'running' || state.endsAt === null) {
      setRemainingMs(state.remainingMs);
      return;
    }

    const endsAt = state.endsAt;
    let finished = false;

    const evaluate = () => {
      if (finished) return;
      const left = endsAt - Date.now();
      if (left <= 0) {
        finished = true;
        setRemainingMs(0);
        if (handledDeadline.current !== endsAt) {
          handledDeadline.current = endsAt;
          finishRef.current(true);
        }
        return;
      }
      setRemainingMs(left);
    };

    evaluate();
    const interval = window.setInterval(evaluate, TICK_MS);
    const deadline = window.setTimeout(evaluate, Math.max(0, endsAt - Date.now()) + 40);
    const onVisibility = () => {
      if (document.visibilityState === 'visible') evaluate();
    };
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('focus', evaluate);

    return () => {
      window.clearInterval(interval);
      window.clearTimeout(deadline);
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('focus', evaluate);
    };
  }, [state.status, state.endsAt, state.remainingMs]);

  // Duration changes only apply to a session that has not started yet.
  useEffect(() => {
    setState((current) => {
      if (current.status !== 'idle') return current;
      const durationMs = durationFor(current.type, settings);
      if (durationMs === current.durationMs) return current;
      return { ...current, durationMs, remainingMs: durationMs };
    });
  }, [settings]);

  const start = useCallback(() => {
    unlockAudio();
    setState((current) => {
      if (current.status === 'running') return current;
      const left = current.remainingMs > 0 ? current.remainingMs : current.durationMs;
      return { ...current, status: 'running', endsAt: Date.now() + left, remainingMs: left };
    });
  }, []);

  const pause = useCallback(() => {
    setState((current) => {
      if (current.status !== 'running' || current.endsAt === null) return current;
      const left = Math.max(0, current.endsAt - Date.now());
      return { ...current, status: 'paused', remainingMs: left, endsAt: null };
    });
  }, []);

  const toggle = useCallback(() => {
    if (latest.current.state.status === 'running') pause();
    else start();
  }, [pause, start]);

  const reset = useCallback(() => {
    const { state: current, settings: config, notify: toast, t: translate } = latest.current;
    setState(freshState(current.type, config, current.cyclePosition));
    setRemainingMs(durationFor(current.type, config));
    toast(translate('toast.timerReset'), 'info');
  }, []);

  const skip = useCallback(() => {
    finishRef.current(false);
  }, []);

  const selectType = useCallback((type: SessionType) => {
    const { state: current, settings: config } = latest.current;
    if (current.type === type && current.status === 'idle') return;
    setState(freshState(type, config, current.cyclePosition));
    setRemainingMs(durationFor(type, config));
  }, []);

  const nextType = useMemo(
    () => computeNext(state, true, settings).type,
    [computeNext, state, settings],
  );

  const progress = state.durationMs > 0 ? 1 - remainingMs / state.durationMs : 0;

  const value = useMemo<TimerContextValue>(
    () => ({
      state,
      remainingMs,
      progress: Math.min(1, Math.max(0, progress)),
      nextType,
      start,
      pause,
      toggle,
      reset,
      skip,
      selectType,
    }),
    [state, remainingMs, progress, nextType, start, pause, toggle, reset, skip, selectType],
  );

  return <TimerContext.Provider value={value}>{children}</TimerContext.Provider>;
}

export function useTimer(): TimerContextValue {
  const context = useContext(TimerContext);
  if (!context) throw new Error('useTimer must be used inside <TimerProvider>');
  return context;
}

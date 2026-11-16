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
import type { DailyStats, HistoryEntry, SessionType } from '@/types';
import { readStorage, StorageKeys, writeStorage } from '@/lib/storage';
import { createId, msUntilNextLocalMidnight, todayKey } from '@/lib/time';

const MAX_HISTORY = 60;

function emptyStats(date: string = todayKey()): DailyStats {
  return { date, completedFocusSessions: 0, focusedMs: 0, completedBreaks: 0, history: [] };
}

function sanitizeEntry(input: unknown): HistoryEntry | null {
  if (!input || typeof input !== 'object') return null;
  const raw = input as Partial<Record<keyof HistoryEntry, unknown>>;
  const type = raw.type;
  if (type !== 'focus' && type !== 'shortBreak' && type !== 'longBreak') return null;
  const endedAt = Number(raw.endedAt);
  const durationMs = Number(raw.durationMs);
  if (!Number.isFinite(endedAt) || !Number.isFinite(durationMs)) return null;
  return {
    id: typeof raw.id === 'string' && raw.id ? raw.id : createId(),
    type,
    endedAt,
    durationMs: Math.max(0, durationMs),
    taskTitle: typeof raw.taskTitle === 'string' ? raw.taskTitle : null,
  };
}

/** Persisted stats are only trusted when they belong to the current local day. */
function sanitizeStats(input: unknown): DailyStats {
  if (!input || typeof input !== 'object') return emptyStats();
  const raw = input as Partial<Record<keyof DailyStats, unknown>>;
  if (typeof raw.date !== 'string' || raw.date !== todayKey()) return emptyStats();
  const history = Array.isArray(raw.history)
    ? raw.history.map(sanitizeEntry).filter((entry): entry is HistoryEntry => entry !== null)
    : [];
  const focusSessions = Number(raw.completedFocusSessions);
  const focusedMs = Number(raw.focusedMs);
  const breaks = Number(raw.completedBreaks);
  return {
    date: raw.date,
    completedFocusSessions: Number.isFinite(focusSessions) ? Math.max(0, focusSessions) : 0,
    focusedMs: Number.isFinite(focusedMs) ? Math.max(0, focusedMs) : 0,
    completedBreaks: Number.isFinite(breaks) ? Math.max(0, breaks) : 0,
    history: history.slice(-MAX_HISTORY),
  };
}

interface StatsContextValue {
  stats: DailyStats;
  recordSession: (type: SessionType, durationMs: number, taskTitle: string | null) => void;
  resetToday: () => void;
}

const StatsContext = createContext<StatsContextValue | null>(null);

export function StatsProvider({
  children,
  onNewDay,
}: {
  children: ReactNode;
  onNewDay?: () => void;
}) {
  const [stats, setStats] = useState<DailyStats>(() =>
    sanitizeStats(readStorage<unknown>(StorageKeys.stats, null)),
  );
  const onNewDayRef = useRef(onNewDay);
  onNewDayRef.current = onNewDay;

  useEffect(() => {
    writeStorage(StorageKeys.stats, stats);
  }, [stats]);

  // Roll over at local midnight, when the tab becomes visible again, and on a
  // slow safety interval — a laptop can sleep through the scheduled timeout.
  useEffect(() => {
    let midnightTimer = 0;

    const rollIfNeeded = () => {
      const today = todayKey();
      setStats((current) => {
        if (current.date === today) return current;
        onNewDayRef.current?.();
        return emptyStats(today);
      });
    };

    const scheduleMidnight = () => {
      window.clearTimeout(midnightTimer);
      midnightTimer = window.setTimeout(() => {
        rollIfNeeded();
        scheduleMidnight();
      }, msUntilNextLocalMidnight());
    };

    const onVisibility = () => {
      if (document.visibilityState === 'visible') rollIfNeeded();
    };

    scheduleMidnight();
    const interval = window.setInterval(rollIfNeeded, 60_000);
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      window.clearTimeout(midnightTimer);
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  const recordSession = useCallback(
    (type: SessionType, durationMs: number, taskTitle: string | null) => {
      const entry: HistoryEntry = {
        id: createId(),
        type,
        endedAt: Date.now(),
        durationMs: Math.max(0, durationMs),
        taskTitle,
      };
      setStats((current) => {
        const today = todayKey();
        const base = current.date === today ? current : emptyStats(today);
        const isFocus = type === 'focus';
        return {
          ...base,
          completedFocusSessions: base.completedFocusSessions + (isFocus ? 1 : 0),
          focusedMs: base.focusedMs + (isFocus ? entry.durationMs : 0),
          completedBreaks: base.completedBreaks + (isFocus ? 0 : 1),
          history: [...base.history, entry].slice(-MAX_HISTORY),
        };
      });
    },
    [],
  );

  const resetToday = useCallback(() => setStats(emptyStats()), []);

  const value = useMemo<StatsContextValue>(
    () => ({ stats, recordSession, resetToday }),
    [stats, recordSession, resetToday],
  );

  return <StatsContext.Provider value={value}>{children}</StatsContext.Provider>;
}

export function useStats(): StatsContextValue {
  const context = useContext(StatsContext);
  if (!context) throw new Error('useStats must be used inside <StatsProvider>');
  return context;
}

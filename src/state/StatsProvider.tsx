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
import type { DailyStats, DayRecord, HistoryEntry, SessionType } from '@/types';
import { readStorage, StorageKeys, writeStorage } from '@/lib/storage';
import { createId, msUntilNextLocalMidnight, recentDayKeys, todayKey } from '@/lib/time';

const MAX_HISTORY = 60;
/** Finished days kept for the weekly and monthly views. */
const MAX_ARCHIVE_DAYS = 120;

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

const DAY_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function sanitizeDayRecord(input: unknown): DayRecord | null {
  if (!input || typeof input !== 'object') return null;
  const raw = input as Partial<Record<keyof DayRecord, unknown>>;
  if (typeof raw.date !== 'string' || !DAY_KEY_PATTERN.test(raw.date)) return null;
  const focusSessions = Number(raw.completedFocusSessions);
  const focusedMs = Number(raw.focusedMs);
  const breaks = Number(raw.completedBreaks);
  return {
    date: raw.date,
    completedFocusSessions: Number.isFinite(focusSessions) ? Math.max(0, focusSessions) : 0,
    focusedMs: Number.isFinite(focusedMs) ? Math.max(0, focusedMs) : 0,
    completedBreaks: Number.isFinite(breaks) ? Math.max(0, breaks) : 0,
  };
}

function sanitizeArchive(input: unknown): DayRecord[] {
  if (!Array.isArray(input)) return [];
  const byDate = new Map<string, DayRecord>();
  for (const item of input) {
    const record = sanitizeDayRecord(item);
    if (record) byDate.set(record.date, record);
  }
  return [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date)).slice(-MAX_ARCHIVE_DAYS);
}

function toDayRecord(stats: DailyStats): DayRecord {
  return {
    date: stats.date,
    completedFocusSessions: stats.completedFocusSessions,
    focusedMs: stats.focusedMs,
    completedBreaks: stats.completedBreaks,
  };
}

function hasActivity(stats: DailyStats): boolean {
  return stats.completedFocusSessions > 0 || stats.completedBreaks > 0;
}

function mergeDay(archive: DayRecord[], record: DayRecord): DayRecord[] {
  const next = archive.filter((day) => day.date !== record.date);
  next.push(record);
  next.sort((a, b) => a.date.localeCompare(b.date));
  return next.slice(-MAX_ARCHIVE_DAYS);
}

export interface RangeTotals {
  sessions: number;
  focusedMs: number;
  activeDays: number;
}

interface StatsContextValue {
  stats: DailyStats;
  /** Finished days, oldest first. Today is not included. */
  archive: DayRecord[];
  /** Today plus the previous `days - 1` days, oldest first, gaps filled with zeros. */
  recentDays: (days: number) => DayRecord[];
  totals: (days: number) => RangeTotals;
  recordSession: (type: SessionType, durationMs: number, taskTitle: string | null) => void;
  resetToday: () => void;
  clearArchive: () => void;
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
  const [archive, setArchive] = useState<DayRecord[]>(() =>
    sanitizeArchive(readStorage<unknown>(StorageKeys.archive, [])),
  );

  const onNewDayRef = useRef(onNewDay);
  onNewDayRef.current = onNewDay;
  const statsRef = useRef(stats);
  statsRef.current = stats;

  useEffect(() => {
    writeStorage(StorageKeys.stats, stats);
  }, [stats]);

  useEffect(() => {
    writeStorage(StorageKeys.archive, archive);
  }, [archive]);

  /**
   * A finished day is archived before today's counters are cleared, so weekly
   * and monthly totals survive the daily reset.
   */
  const rollIfNeeded = useCallback((silent = false) => {
    const today = todayKey();
    const current = statsRef.current;
    if (current.date === today) return;
    if (hasActivity(current)) {
      setArchive((previous) => mergeDay(previous, toDayRecord(current)));
    }
    setStats(emptyStats(today));
    if (!silent) onNewDayRef.current?.();
  }, []);

  // A page that was left open must notice midnight: a scheduled timeout, a
  // slow safety interval (a sleeping laptop misses the timeout) and a check
  // whenever the tab becomes visible again.
  useEffect(() => {
    let midnightTimer = 0;

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
    const interval = window.setInterval(() => rollIfNeeded(), 60_000);
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      window.clearTimeout(midnightTimer);
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [rollIfNeeded]);

  const recordSession = useCallback(
    (type: SessionType, durationMs: number, taskTitle: string | null) => {
      // A session can land after midnight on a tab that never rolled over.
      rollIfNeeded(true);

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
    [rollIfNeeded],
  );

  const resetToday = useCallback(() => setStats(emptyStats()), []);
  const clearArchive = useCallback(() => setArchive([]), []);

  /** Today plus previous days, oldest first; days with no activity read as zero. */
  const recentDays = useCallback(
    (days: number): DayRecord[] => {
      const byDate = new Map(archive.map((day) => [day.date, day]));
      byDate.set(stats.date, toDayRecord(stats));
      return recentDayKeys(days).map(
        (date) =>
          byDate.get(date) ?? { date, completedFocusSessions: 0, focusedMs: 0, completedBreaks: 0 },
      );
    },
    [archive, stats],
  );

  const totals = useCallback(
    (days: number): RangeTotals =>
      recentDays(days).reduce<RangeTotals>(
        (sum, day) => ({
          sessions: sum.sessions + day.completedFocusSessions,
          focusedMs: sum.focusedMs + day.focusedMs,
          activeDays: sum.activeDays + (day.completedFocusSessions > 0 ? 1 : 0),
        }),
        { sessions: 0, focusedMs: 0, activeDays: 0 },
      ),
    [recentDays],
  );

  const value = useMemo<StatsContextValue>(
    () => ({ stats, archive, recentDays, totals, recordSession, resetToday, clearArchive }),
    [stats, archive, recentDays, totals, recordSession, resetToday, clearArchive],
  );

  return <StatsContext.Provider value={value}>{children}</StatsContext.Provider>;
}

export function useStats(): StatsContextValue {
  const context = useContext(StatsContext);
  if (!context) throw new Error('useStats must be used inside <StatsProvider>');
  return context;
}

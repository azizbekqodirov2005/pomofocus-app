import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { Settings } from '@/types';
import { readStorage, StorageKeys, writeStorage } from '@/lib/storage';

export const DEFAULT_SETTINGS: Settings = {
  focusMinutes: 25,
  shortBreakMinutes: 5,
  longBreakMinutes: 15,
  sessionsBeforeLongBreak: 4,
  dailyGoal: 8,
  soundEnabled: true,
  notificationsEnabled: false,
  autoStartBreaks: false,
  autoStartFocus: false,
};

export interface NumericLimit {
  min: number;
  max: number;
}

export const SETTING_LIMITS: Record<
  'focusMinutes' | 'shortBreakMinutes' | 'longBreakMinutes' | 'sessionsBeforeLongBreak' | 'dailyGoal',
  NumericLimit
> = {
  focusMinutes: { min: 1, max: 180 },
  shortBreakMinutes: { min: 1, max: 60 },
  longBreakMinutes: { min: 1, max: 120 },
  sessionsBeforeLongBreak: { min: 2, max: 12 },
  dailyGoal: { min: 1, max: 40 },
};

function clampInt(value: unknown, limit: NumericLimit, fallback: number): number {
  const parsed = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(limit.max, Math.max(limit.min, Math.round(parsed)));
}

function asBoolean(value: unknown, fallback: boolean): boolean {
  return typeof value === 'boolean' ? value : fallback;
}

/** Never trust persisted data: coerce and clamp everything back into range. */
export function sanitizeSettings(input: unknown): Settings {
  const raw = (input ?? {}) as Partial<Record<keyof Settings, unknown>>;
  return {
    focusMinutes: clampInt(raw.focusMinutes, SETTING_LIMITS.focusMinutes, DEFAULT_SETTINGS.focusMinutes),
    shortBreakMinutes: clampInt(
      raw.shortBreakMinutes,
      SETTING_LIMITS.shortBreakMinutes,
      DEFAULT_SETTINGS.shortBreakMinutes,
    ),
    longBreakMinutes: clampInt(
      raw.longBreakMinutes,
      SETTING_LIMITS.longBreakMinutes,
      DEFAULT_SETTINGS.longBreakMinutes,
    ),
    sessionsBeforeLongBreak: clampInt(
      raw.sessionsBeforeLongBreak,
      SETTING_LIMITS.sessionsBeforeLongBreak,
      DEFAULT_SETTINGS.sessionsBeforeLongBreak,
    ),
    dailyGoal: clampInt(raw.dailyGoal, SETTING_LIMITS.dailyGoal, DEFAULT_SETTINGS.dailyGoal),
    soundEnabled: asBoolean(raw.soundEnabled, DEFAULT_SETTINGS.soundEnabled),
    notificationsEnabled: asBoolean(raw.notificationsEnabled, DEFAULT_SETTINGS.notificationsEnabled),
    autoStartBreaks: asBoolean(raw.autoStartBreaks, DEFAULT_SETTINGS.autoStartBreaks),
    autoStartFocus: asBoolean(raw.autoStartFocus, DEFAULT_SETTINGS.autoStartFocus),
  };
}

interface SettingsContextValue {
  settings: Settings;
  update: <K extends keyof Settings>(key: K, value: Settings[K]) => void;
  restoreDefaults: () => void;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(() =>
    sanitizeSettings(readStorage<unknown>(StorageKeys.settings, DEFAULT_SETTINGS)),
  );

  useEffect(() => {
    writeStorage(StorageKeys.settings, settings);
  }, [settings]);

  const update = useCallback(<K extends keyof Settings>(key: K, value: Settings[K]) => {
    setSettings((current) => sanitizeSettings({ ...current, [key]: value }));
  }, []);

  const restoreDefaults = useCallback(() => setSettings({ ...DEFAULT_SETTINGS }), []);

  const value = useMemo<SettingsContextValue>(
    () => ({ settings, update, restoreDefaults }),
    [settings, update, restoreDefaults],
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings(): SettingsContextValue {
  const context = useContext(SettingsContext);
  if (!context) throw new Error('useSettings must be used inside <SettingsProvider>');
  return context;
}

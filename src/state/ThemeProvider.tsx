import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { ThemeMode } from '@/types';
import { readStorage, StorageKeys, writeStorage } from '@/lib/storage';

interface ThemeContextValue {
  mode: ThemeMode;
  /** The theme actually on screen once "system" has been resolved. */
  resolved: 'light' | 'dark';
  setMode: (mode: ThemeMode) => void;
  toggle: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

const DARK_QUERY = '(prefers-color-scheme: dark)';

function isThemeMode(value: unknown): value is ThemeMode {
  return value === 'light' || value === 'dark' || value === 'system';
}

function systemPrefersDark(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia(DARK_QUERY).matches;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>(() => {
    const stored = readStorage<unknown>(StorageKeys.theme, null);
    return isThemeMode(stored) ? stored : 'system';
  });
  const [systemDark, setSystemDark] = useState<boolean>(systemPrefersDark);

  // Track the OS preference so "system" mode stays live.
  useEffect(() => {
    if (!window.matchMedia) return;
    const query = window.matchMedia(DARK_QUERY);
    const onChange = (event: MediaQueryListEvent) => setSystemDark(event.matches);
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, []);

  const resolved: 'light' | 'dark' = mode === 'system' ? (systemDark ? 'dark' : 'light') : mode;

  useEffect(() => {
    document.documentElement.dataset.theme = resolved;
    const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]:not([media])');
    if (meta) meta.content = resolved === 'dark' ? '#101013' : '#faf9f7';
  }, [resolved]);

  useEffect(() => {
    writeStorage(StorageKeys.theme, mode);
  }, [mode]);

  const setMode = useCallback((next: ThemeMode) => setModeState(next), []);
  const toggle = useCallback(() => {
    setModeState(resolved === 'dark' ? 'light' : 'dark');
  }, [resolved]);

  const value = useMemo<ThemeContextValue>(
    () => ({ mode, resolved, setMode, toggle }),
    [mode, resolved, setMode, toggle],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used inside <ThemeProvider>');
  return context;
}

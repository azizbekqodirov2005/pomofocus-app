/**
 * Thin, defensive wrapper around localStorage.
 * Every call is guarded: private browsing modes, disabled storage and quota
 * errors must never take the application down.
 */

const PREFIX = 'fokus.';

export const StorageKeys = {
  settings: `${PREFIX}settings`,
  theme: `${PREFIX}theme`,
  language: `${PREFIX}language`,
  tasks: `${PREFIX}tasks`,
  activeTask: `${PREFIX}activeTask`,
  stats: `${PREFIX}stats`,
  archive: `${PREFIX}archive`,
  timer: `${PREFIX}timer`,
  notificationsAsked: `${PREFIX}notificationsAsked`,
  installHintSeen: `${PREFIX}installHintSeen`,
} as const;

let available: boolean | null = null;

export function isStorageAvailable(): boolean {
  if (available !== null) return available;
  try {
    const probe = `${PREFIX}__probe__`;
    window.localStorage.setItem(probe, '1');
    window.localStorage.removeItem(probe);
    available = true;
  } catch {
    available = false;
  }
  return available;
}

export function readStorage<T>(key: string, fallback: T): T {
  if (!isStorageAvailable()) return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (raw === null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function writeStorage(key: string, value: unknown): boolean {
  if (!isStorageAvailable()) return false;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export function removeStorage(key: string): void {
  if (!isStorageAvailable()) return;
  try {
    window.localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}

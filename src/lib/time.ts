/** Formats milliseconds as MM:SS (hours roll into minutes, e.g. 90:00). */
export function formatClock(ms: number): string {
  const safe = Math.max(0, Math.round(ms / 1000));
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

/** Human-readable focused time, e.g. "1 s 25 d" / "25 d". */
export function formatDuration(ms: number, hourLabel: string, minuteLabel: string): string {
  const totalMinutes = Math.floor(Math.max(0, ms) / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes} ${minuteLabel}`;
  return `${hours} ${hourLabel} ${minutes} ${minuteLabel}`;
}

/** Local calendar day key — not UTC, so the day flips at the user's midnight. */
export function todayKey(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatTimeOfDay(epochMs: number, locale: string): string {
  try {
    return new Intl.DateTimeFormat(locale, { hour: '2-digit', minute: '2-digit' }).format(
      new Date(epochMs),
    );
  } catch {
    const d = new Date(epochMs);
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  }
}

/** Milliseconds until the next local midnight. */
export function msUntilNextLocalMidnight(from: Date = new Date()): number {
  const next = new Date(from.getFullYear(), from.getMonth(), from.getDate() + 1, 0, 0, 1, 0);
  return next.getTime() - from.getTime();
}

/** The last `count` local day keys, oldest first, ending with today. */
export function recentDayKeys(count: number, from: Date = new Date()): string[] {
  const keys: string[] = [];
  for (let offset = count - 1; offset >= 0; offset -= 1) {
    const day = new Date(from.getFullYear(), from.getMonth(), from.getDate() - offset);
    keys.push(todayKey(day));
  }
  return keys;
}

/** Short weekday name for a YYYY-MM-DD key, localised. */
export function weekdayLabel(dayKey: string, locale: string): string {
  const [year, month, day] = dayKey.split('-').map(Number);
  const date = new Date(year ?? 1970, (month ?? 1) - 1, day ?? 1);
  try {
    return new Intl.DateTimeFormat(locale, { weekday: 'short' }).format(date);
  } catch {
    return String(date.getDate());
  }
}

/** Localised short date, e.g. "14 Nov". */
export function shortDateLabel(dayKey: string, locale: string): string {
  const [year, month, day] = dayKey.split('-').map(Number);
  const date = new Date(year ?? 1970, (month ?? 1) - 1, day ?? 1);
  try {
    return new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short' }).format(date);
  } catch {
    return dayKey;
  }
}

export function createId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

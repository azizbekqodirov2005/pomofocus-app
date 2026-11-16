export type SessionType = 'focus' | 'shortBreak' | 'longBreak';

export type TimerStatus = 'idle' | 'running' | 'paused';

export type ThemeMode = 'light' | 'dark' | 'system';

export type Language = 'uz' | 'en' | 'ru';

export interface Settings {
  focusMinutes: number;
  shortBreakMinutes: number;
  longBreakMinutes: number;
  sessionsBeforeLongBreak: number;
  dailyGoal: number;
  soundEnabled: boolean;
  notificationsEnabled: boolean;
  autoStartBreaks: boolean;
  autoStartFocus: boolean;
}

/** Serialisable timer state. Persisted so a refresh never loses a session. */
export interface TimerState {
  type: SessionType;
  status: TimerStatus;
  /** Full length of the current session in milliseconds. */
  durationMs: number;
  /** Milliseconds left — authoritative while idle or paused. */
  remainingMs: number;
  /** Epoch ms at which the session ends — authoritative while running. */
  endsAt: number | null;
  /** Completed focus sessions inside the current long-break cycle. */
  cyclePosition: number;
}

export interface Task {
  id: string;
  title: string;
  estimatedPomodoros: number;
  completedPomodoros: number;
  done: boolean;
  createdAt: number;
}

export interface HistoryEntry {
  id: string;
  type: SessionType;
  /** Epoch ms when the session ended. */
  endedAt: number;
  /** Length of the finished session in milliseconds. */
  durationMs: number;
  taskTitle: string | null;
}

/** One finished day, kept so weekly and monthly totals survive the daily reset. */
export interface DayRecord {
  /** Local calendar day as YYYY-MM-DD. */
  date: string;
  completedFocusSessions: number;
  focusedMs: number;
  completedBreaks: number;
}

export interface DailyStats {
  /** Local calendar day as YYYY-MM-DD. */
  date: string;
  completedFocusSessions: number;
  focusedMs: number;
  completedBreaks: number;
  history: HistoryEntry[];
}

export type ToastVariant = 'info' | 'success' | 'danger';

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface Toast {
  id: string;
  message: string;
  variant: ToastVariant;
  /** Optional button inside the toast, e.g. "Reload". */
  action?: ToastAction;
  /** A sticky toast waits for the user instead of timing out. */
  persist?: boolean;
}

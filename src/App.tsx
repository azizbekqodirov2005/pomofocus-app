import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { I18nProvider } from '@/i18n/I18nProvider';
import { useI18n } from '@/i18n/useI18n';
import { ThemeProvider, useTheme } from '@/state/ThemeProvider';
import { ToastProvider, useToast } from '@/state/ToastProvider';
import { SettingsProvider } from '@/state/SettingsProvider';
import { TasksProvider } from '@/state/TasksProvider';
import { StatsProvider } from '@/state/StatsProvider';
import { TimerProvider, useTimer } from '@/state/TimerProvider';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { TimerCard } from '@/components/timer/TimerCard';
import { TaskList } from '@/components/tasks/TaskList';
import { StatsPanel } from '@/components/stats/StatsPanel';
import { SettingsDialog } from '@/components/settings/SettingsDialog';
import { ShortcutsDialog } from '@/components/settings/ShortcutsDialog';
import { Toaster } from '@/components/ui/Toaster';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { isStorageAvailable } from '@/lib/storage';
import { formatClock } from '@/lib/time';
import { cn } from '@/lib/cn';
import { ChartIcon, ClockIcon, ListIcon } from '@/components/ui/Icon';

type MobileView = 'timer' | 'tasks' | 'stats';

const SESSION_LABEL = {
  focus: 'session.focus',
  shortBreak: 'session.shortBreak',
  longBreak: 'session.longBreak',
} as const;

/** StatsProvider needs toasts and translations, so it sits one layer deeper. */
function StatsLayer({ children }: { children: ReactNode }) {
  const { notify } = useToast();
  const { t } = useI18n();
  const onNewDay = useCallback(() => notify(t('toast.newDay'), 'info'), [notify, t]);
  return <StatsProvider onNewDay={onNewDay}>{children}</StatsProvider>;
}

function MobileNav({
  view,
  onChange,
}: {
  view: MobileView;
  onChange: (view: MobileView) => void;
}) {
  const { t } = useI18n();

  const items = useMemo(
    () =>
      [
        { id: 'timer' as const, label: t('nav.timer'), icon: <ClockIcon width={16} height={16} /> },
        { id: 'tasks' as const, label: t('nav.tasks'), icon: <ListIcon width={16} height={16} /> },
        { id: 'stats' as const, label: t('nav.stats'), icon: <ChartIcon width={16} height={16} /> },
      ],
    [t],
  );

  return (
    <nav
      aria-label={t('app.tagline')}
      className="sticky top-14 z-20 -mx-4 mb-5 border-b border-border-base bg-bg/90 px-4 backdrop-blur-sm lg:hidden"
    >
      <div className="flex items-stretch gap-1">
        {items.map((item) => {
          const selected = view === item.id;
          return (
            <button
              key={item.id}
              type="button"
              aria-current={selected ? 'page' : undefined}
              onClick={() => onChange(item.id)}
              className={cn(
                'inline-flex flex-1 items-center justify-center gap-1.5 border-b-2 px-1.5 py-3',
                'text-[13px] font-medium whitespace-nowrap transition-colors',
                selected
                  ? 'border-accent text-text'
                  : 'border-transparent text-muted hover:text-text',
              )}
            >
              {item.icon}
              {item.label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

function Workspace() {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [view, setView] = useState<MobileView>('timer');

  const { state, remainingMs, toggle, reset, skip } = useTimer();
  const { toggle: toggleTheme } = useTheme();
  const { notify } = useToast();
  const { t } = useI18n();

  const dialogOpen = settingsOpen || shortcutsOpen;

  useDocumentTitle(
    `${formatClock(remainingMs)} · ${t(SESSION_LABEL[state.type])} — ${t('app.name')}`,
  );

  const handlers = useMemo(
    () => ({
      onToggleTimer: toggle,
      onReset: reset,
      onSkip: skip,
      onToggleTheme: toggleTheme,
      onOpenSettings: () => setSettingsOpen(true),
      onOpenShortcuts: () => setShortcutsOpen(true),
    }),
    [toggle, reset, skip, toggleTheme],
  );

  useKeyboardShortcuts(handlers, !dialogOpen);

  // Tell the user once if persistence is impossible (private mode, blocked storage).
  useEffect(() => {
    if (!isStorageAvailable()) notify(t('toast.storageUnavailable'), 'danger');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex min-h-dvh flex-col">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:z-50 focus:rounded-md focus:bg-surface focus:px-3 focus:py-2 focus:text-[13px] focus:shadow-card"
      >
        {t('app.skipToContent')}
      </a>

      <Header
        onOpenSettings={() => setSettingsOpen(true)}
        onOpenShortcuts={() => setShortcutsOpen(true)}
      />

      <main id="main" className="mx-auto w-full max-w-5xl flex-1 px-4 pt-5 pb-12 sm:px-6 sm:pt-8">
        <MobileNav view={view} onChange={setView} />

        <div className="space-y-5">
          <div className={cn(view === 'timer' ? 'block' : 'hidden', 'lg:block')}>
            <TimerCard />
          </div>

          <div className="grid gap-5 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
            <div className={cn(view === 'tasks' ? 'block' : 'hidden', 'lg:block')}>
              <TaskList />
            </div>
            <div className={cn(view === 'stats' ? 'block' : 'hidden', 'lg:block')}>
              <StatsPanel />
            </div>
          </div>
        </div>
      </main>

      <Footer />
      <Toaster />

      <SettingsDialog open={settingsOpen} onClose={() => setSettingsOpen(false)} />
      <ShortcutsDialog open={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <I18nProvider>
        <ToastProvider>
          <SettingsProvider>
            <TasksProvider>
              <StatsLayer>
                <TimerProvider>
                  <Workspace />
                </TimerProvider>
              </StatsLayer>
            </TasksProvider>
          </SettingsProvider>
        </ToastProvider>
      </I18nProvider>
    </ThemeProvider>
  );
}

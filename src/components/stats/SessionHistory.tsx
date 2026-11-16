import type { HistoryEntry } from '@/types';
import { useI18n } from '@/i18n/useI18n';
import { formatTimeOfDay } from '@/lib/time';
import { EmptyState } from '@/components/ui/EmptyState';
import { ClockIcon } from '@/components/ui/Icon';
import { cn } from '@/lib/cn';

const LABEL = {
  focus: 'session.focus',
  shortBreak: 'session.shortBreak',
  longBreak: 'session.longBreak',
} as const;

export function SessionHistory({ entries }: { entries: HistoryEntry[] }) {
  const { t, locale } = useI18n();

  if (entries.length === 0) {
    return (
      <EmptyState
        icon={<ClockIcon width={18} height={18} />}
        title={t('stats.historyEmpty')}
        hint={t('stats.historyEmptyHint')}
      />
    );
  }

  return (
    <ul className="divide-y divide-[color:var(--border)]">
      {[...entries].reverse().map((entry) => (
        <li key={entry.id} className="flex items-center gap-3 px-4 py-2.5">
          <span
            aria-hidden="true"
            className={cn(
              'size-1.5 shrink-0 rounded-full',
              entry.type === 'focus' ? 'bg-accent' : 'bg-border-strong',
            )}
          />
          <span className="min-w-0 flex-1 truncate text-[13px]">
            {entry.taskTitle ? (
              <span className="text-text">{entry.taskTitle}</span>
            ) : (
              <span className="text-muted">{t(LABEL[entry.type])}</span>
            )}
          </span>
          <span className="tnum shrink-0 text-[12.5px] text-faint">
            {Math.round(entry.durationMs / 60000)} {t('stats.minute')}
          </span>
          <span className="tnum shrink-0 text-[12.5px] text-faint">
            {formatTimeOfDay(entry.endedAt, locale)}
          </span>
        </li>
      ))}
    </ul>
  );
}

import type { SessionType } from '@/types';
import { useI18n } from '@/i18n/useI18n';
import { cn } from '@/lib/cn';

const ORDER: ReadonlyArray<SessionType> = ['focus', 'shortBreak', 'longBreak'];

const LABEL_KEY = {
  focus: 'session.focus',
  shortBreak: 'session.shortBreak',
  longBreak: 'session.longBreak',
} as const;

interface SessionTabsProps {
  current: SessionType;
  onSelect: (type: SessionType) => void;
}

export function SessionTabs({ current, onSelect }: SessionTabsProps) {
  const { t } = useI18n();

  return (
    <div
      role="tablist"
      aria-label={t('session.focus')}
      className="inline-flex items-center gap-0.5 rounded-md border border-border-base bg-bg-subtle p-0.5"
    >
      {ORDER.map((type) => {
        const selected = current === type;
        return (
          <button
            key={type}
            role="tab"
            type="button"
            aria-selected={selected}
            onClick={() => onSelect(type)}
            className={cn(
              'rounded-sm px-3 py-1.5 text-[13px] font-medium whitespace-nowrap transition-colors duration-150',
              selected
                ? 'bg-surface text-text shadow-subtle'
                : 'text-muted hover:text-text',
            )}
          >
            {t(LABEL_KEY[type])}
          </button>
        );
      })}
    </div>
  );
}

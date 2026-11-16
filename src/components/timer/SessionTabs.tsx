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
      className="grid w-full grid-cols-3 gap-0.5 rounded-md border border-border-base bg-bg-subtle p-0.5 sm:inline-flex sm:w-auto sm:items-center"
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
              'rounded-sm px-1.5 py-1.5 text-[11.5px] leading-tight font-medium transition-colors duration-150',
              'sm:px-3 sm:text-[13px] sm:whitespace-nowrap',
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

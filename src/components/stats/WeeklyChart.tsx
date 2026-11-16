import { useId } from 'react';
import type { DayRecord } from '@/types';
import { useI18n } from '@/i18n/useI18n';
import { shortDateLabel, weekdayLabel } from '@/lib/time';
import { cn } from '@/lib/cn';

interface WeeklyChartProps {
  days: DayRecord[];
  /** Label for the accessible summary, e.g. "Daily focus sessions". */
  label: string;
}

/**
 * Seven-day magnitude chart: one measure, one hue, no legend needed.
 * Bars are plain elements rather than SVG so they stay crisp and fluid at any
 * container width. A zero day keeps a baseline stub so the week reads as seven
 * days, not as a gap.
 */
export function WeeklyChart({ days, label }: WeeklyChartProps) {
  const { t, locale } = useI18n();
  const tableId = useId();

  const peak = Math.max(1, ...days.map((day) => day.completedFocusSessions));
  const lastIndex = days.length - 1;

  return (
    <figure className="m-0">
      <div
        className="flex h-24 items-stretch gap-1.5"
        role="img"
        aria-labelledby={tableId}
        aria-label={label}
      >
        {days.map((day, index) => {
          const value = day.completedFocusSessions;
          const isToday = index === lastIndex;
          const isPeak = value > 0 && value === peak;
          // Selective labels: the best day and today, never a number on every bar.
          const showValue = value > 0 && (isPeak || isToday);
          const heightPercent = Math.max(8, (value / peak) * 100);

          return (
            <div key={day.date} className="flex h-full min-w-0 flex-1 flex-col items-center gap-1.5">
              <span
                className={cn(
                  'tnum text-[11px] leading-none',
                  showValue ? (isToday ? 'text-text' : 'text-muted') : 'text-transparent',
                )}
                aria-hidden="true"
              >
                {value > 0 ? value : '0'}
              </span>

              <div className="flex min-h-0 w-full flex-1 items-end justify-center">
                <div
                  title={`${shortDateLabel(day.date, locale)} · ${value}`}
                  style={value === 0 ? undefined : { height: `${heightPercent}%` }}
                  className={cn(
                    'w-full max-w-7 transition-[height,background-color] duration-300',
                    value === 0
                      ? 'h-[2px] rounded-[1px] bg-track'
                      : isToday
                        ? 'rounded-t-[3px] bg-accent'
                        : 'rounded-t-[3px] bg-accent/55 hover:bg-accent/80',
                  )}
                />
              </div>

              <span
                className={cn(
                  'w-full truncate text-center text-[11px] leading-none',
                  isToday ? 'font-medium text-text' : 'text-faint',
                )}
                aria-hidden="true"
              >
                {isToday ? t('stats.today') : weekdayLabel(day.date, locale)}
              </span>
            </div>
          );
        })}
      </div>

      {/* The same numbers as text, for screen readers and copy-paste. */}
      <figcaption id={tableId} className="sr-only">
        {label}:{' '}
        {days
          .map(
            (day) => `${shortDateLabel(day.date, locale)} — ${day.completedFocusSessions}`,
          )
          .join('; ')}
      </figcaption>
    </figure>
  );
}

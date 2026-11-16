import { useMemo, useState } from 'react';
import { useStats } from '@/state/StatsProvider';
import { useSettings } from '@/state/SettingsProvider';
import { useToast } from '@/state/ToastProvider';
import { useI18n } from '@/i18n/useI18n';
import { formatDuration } from '@/lib/time';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { CheckIcon, TargetIcon } from '@/components/ui/Icon';
import { SessionHistory } from './SessionHistory';
import { WeeklyChart } from './WeeklyChart';

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="px-4 py-3.5">
      <p className="text-[12px] font-medium tracking-[0.1em] text-faint uppercase">{label}</p>
      <p className="tnum mt-1 text-[22px] leading-none font-light tracking-tight">{value}</p>
    </div>
  );
}

export function StatsPanel() {
  const { stats, recentDays, totals, resetToday } = useStats();
  const { settings } = useSettings();
  const { notify } = useToast();
  const { t } = useI18n();
  const [confirming, setConfirming] = useState(false);

  const done = stats.completedFocusSessions;
  const goal = settings.dailyGoal;
  const ratio = goal > 0 ? Math.min(1, done / goal) : 0;
  const remaining = Math.max(0, goal - done);
  const reached = remaining === 0;

  const week = useMemo(() => recentDays(7), [recentDays]);
  const weekTotals = useMemo(() => totals(7), [totals]);
  const monthTotals = useMemo(() => totals(30), [totals]);
  const hasRange = monthTotals.sessions > 0;

  return (
    <section
      aria-labelledby="stats-heading"
      className="rounded-lg border border-border-base bg-surface shadow-subtle"
    >
      <header className="flex items-center justify-between gap-3 border-b border-border-base px-4 py-3.5">
        <h2 id="stats-heading" className="text-sm font-semibold tracking-tight">
          {t('stats.title')}
        </h2>
        {done > 0 || stats.history.length > 0 ? (
          <Button size="sm" variant="ghost" onClick={() => setConfirming(true)}>
            {t('stats.reset')}
          </Button>
        ) : null}
      </header>

      <div className="grid grid-cols-2 divide-x divide-[color:var(--border)] border-b border-border-base">
        <Metric label={t('stats.completedSessions')} value={String(done)} />
        <Metric
          label={t('stats.focusedTime')}
          value={formatDuration(stats.focusedMs, t('stats.hour'), t('stats.minute'))}
        />
      </div>

      <div className="border-b border-border-base px-4 py-4">
        <div className="flex items-center justify-between gap-3">
          <p className="inline-flex items-center gap-2 text-[13px] font-medium">
            {reached ? (
              <CheckIcon width={15} height={15} className="text-success" />
            ) : (
              <TargetIcon width={15} height={15} className="text-faint" />
            )}
            {t('stats.goal')}
          </p>
          <p className="tnum text-[13px] text-muted">
            {t('stats.goalProgress', { done, total: goal })}
          </p>
        </div>

        <div
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={goal}
          aria-valuenow={Math.min(done, goal)}
          aria-label={t('stats.goal')}
          className="mt-3 h-[3px] w-full overflow-hidden rounded-full bg-track"
        >
          <div
            className="h-full rounded-full bg-accent transition-[width] duration-300"
            style={{ width: `${ratio * 100}%` }}
          />
        </div>

        <p className="mt-2.5 text-[12.5px] text-faint">
          {reached ? t('stats.goalReached') : t('stats.goalRemaining', { count: remaining })}
        </p>
      </div>

      <div className="border-b border-border-base px-4 py-4">
        <div className="flex items-baseline justify-between gap-3">
          <h3 className="text-[12px] font-medium tracking-[0.1em] text-faint uppercase">
            {t('stats.week')}
          </h3>
          {hasRange ? (
            <p className="text-[12px] text-faint">
              {t('stats.activeDays', { count: weekTotals.activeDays })}
            </p>
          ) : null}
        </div>

        <div className="mt-3">
          <WeeklyChart days={week} label={t('stats.chartLabel')} />
        </div>

        <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-1 border-t border-border-base pt-3">
          <div className="flex items-baseline justify-between gap-2">
            <dt className="text-[12.5px] text-muted">{t('stats.weekTotal')}</dt>
            <dd className="tnum text-[13px] font-medium">
              {weekTotals.sessions}
              <span className="ml-1 text-[11.5px] font-normal text-faint">
                {t('stats.sessionsShort')}
              </span>
            </dd>
          </div>
          <div className="flex items-baseline justify-between gap-2">
            <dt className="text-[12.5px] text-muted">{t('stats.monthTotal')}</dt>
            <dd className="tnum text-[13px] font-medium">
              {monthTotals.sessions}
              <span className="ml-1 text-[11.5px] font-normal text-faint">
                {t('stats.sessionsShort')}
              </span>
            </dd>
          </div>
          <div className="flex items-baseline justify-between gap-2">
            <dt className="sr-only">{`${t('stats.weekTotal')} — ${t('stats.focusedTime')}`}</dt>
            <dd className="tnum text-[12px] text-faint">
              {formatDuration(weekTotals.focusedMs, t('stats.hour'), t('stats.minute'))}
            </dd>
          </div>
          <div className="flex items-baseline justify-between gap-2">
            <dt className="sr-only">{`${t('stats.monthTotal')} — ${t('stats.focusedTime')}`}</dt>
            <dd className="tnum text-[12px] text-faint">
              {formatDuration(monthTotals.focusedMs, t('stats.hour'), t('stats.minute'))}
            </dd>
          </div>
        </dl>
      </div>

      <div>
        <h3 className="px-4 pt-3.5 pb-1 text-[12px] font-medium tracking-[0.1em] text-faint uppercase">
          {t('stats.history')}
        </h3>
        <SessionHistory entries={stats.history} />
      </div>

      <ConfirmDialog
        open={confirming}
        title={t('stats.resetTitle')}
        body={t('stats.resetBody')}
        confirmLabel={t('common.clear')}
        onCancel={() => setConfirming(false)}
        onConfirm={() => {
          resetToday();
          setConfirming(false);
          notify(t('toast.statsReset'), 'info');
        }}
      />
    </section>
  );
}

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { PlusIcon } from '@/components/ui/Icon';
import { useI18n } from '@/i18n/useI18n';
import { TASK_LIMITS } from '@/state/TasksProvider';
import { cn } from '@/lib/cn';

interface TaskComposerProps {
  onAdd: (title: string, estimate: number) => void;
}

export function TaskComposer({ onAdd }: TaskComposerProps) {
  const { t } = useI18n();
  const [title, setTitle] = useState('');
  const [estimate, setEstimate] = useState(1);
  const [error, setError] = useState(false);

  const submit = () => {
    if (!title.trim()) {
      setError(true);
      return;
    }
    onAdd(title, estimate);
    setTitle('');
    setEstimate(1);
    setError(false);
  };

  return (
    <form
      className="flex flex-col gap-2 sm:flex-row sm:items-start"
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
    >
      <div className="min-w-0 flex-1">
        <input
          value={title}
          maxLength={TASK_LIMITS.titleMax}
          onChange={(event) => {
            setTitle(event.target.value);
            if (error) setError(false);
          }}
          placeholder={t('tasks.placeholder')}
          aria-label={t('tasks.placeholder')}
          aria-invalid={error}
          className={cn(
            'h-10 w-full rounded-md border bg-surface px-3 text-sm',
            'placeholder:text-faint focus:border-accent focus:outline-none',
            error ? 'border-danger' : 'border-border-strong',
          )}
        />
        {error ? (
          <p role="alert" className="mt-1.5 text-[12.5px] text-danger">
            {t('tasks.titleRequired')}
          </p>
        ) : null}
      </div>

      <div className="flex items-center gap-2">
        <input
          type="number"
          min={TASK_LIMITS.estimateMin}
          max={TASK_LIMITS.estimateMax}
          value={estimate}
          onChange={(event) => {
            const next = Number(event.target.value);
            if (!Number.isFinite(next)) return;
            setEstimate(
              Math.min(TASK_LIMITS.estimateMax, Math.max(TASK_LIMITS.estimateMin, Math.round(next))),
            );
          }}
          aria-label={t('tasks.estimateLabel')}
          title={t('tasks.estimateLabel')}
          className="tnum h-10 w-16 rounded-md border border-border-strong bg-surface text-center text-sm focus:border-accent focus:outline-none"
        />
        <Button type="submit" variant="secondary" className="shrink-0">
          <PlusIcon width={16} height={16} />
          {t('tasks.add')}
        </Button>
      </div>
    </form>
  );
}

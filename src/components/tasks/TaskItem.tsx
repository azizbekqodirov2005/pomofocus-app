import { useState } from 'react';
import type { Task } from '@/types';
import { IconButton } from '@/components/ui/IconButton';
import { Button } from '@/components/ui/Button';
import { CheckIcon, PencilIcon, TrashIcon } from '@/components/ui/Icon';
import { useI18n } from '@/i18n/useI18n';
import { TASK_LIMITS } from '@/state/TasksProvider';
import { cn } from '@/lib/cn';

interface TaskItemProps {
  task: Task;
  active: boolean;
  onToggleDone: () => void;
  onSetActive: () => void;
  onEdit: (title: string, estimate: number) => void;
  onRequestDelete: () => void;
}

export function TaskItem({
  task,
  active,
  onToggleDone,
  onSetActive,
  onEdit,
  onRequestDelete,
}: TaskItemProps) {
  const { t } = useI18n();
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(task.title);
  const [estimate, setEstimate] = useState(task.estimatedPomodoros);

  const save = () => {
    if (!title.trim()) return;
    onEdit(title, estimate);
    setEditing(false);
  };

  const cancel = () => {
    setTitle(task.title);
    setEstimate(task.estimatedPomodoros);
    setEditing(false);
  };

  if (editing) {
    return (
      <li className="border-b border-border-base px-3 py-3 last:border-b-0">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <input
            autoFocus
            value={title}
            maxLength={TASK_LIMITS.titleMax}
            onChange={(event) => setTitle(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') save();
              if (event.key === 'Escape') cancel();
            }}
            aria-label={t('tasks.edit')}
            className="h-9 min-w-0 flex-1 rounded-sm border border-border-strong bg-surface px-2.5 text-sm focus:border-accent focus:outline-none"
          />
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
                  Math.min(
                    TASK_LIMITS.estimateMax,
                    Math.max(TASK_LIMITS.estimateMin, Math.round(next)),
                  ),
                );
              }}
              aria-label={t('tasks.estimateLabel')}
              className="tnum h-9 w-14 rounded-sm border border-border-strong bg-surface text-center text-sm focus:border-accent focus:outline-none"
            />
            <Button size="sm" variant="primary" onClick={save}>
              {t('tasks.save')}
            </Button>
            <Button size="sm" variant="ghost" onClick={cancel}>
              {t('common.cancel')}
            </Button>
          </div>
        </div>
      </li>
    );
  }

  return (
    <li
      className={cn(
        'group relative flex items-center gap-3 border-b border-border-base px-3 py-2.5 last:border-b-0',
        'transition-colors duration-150 hover:bg-bg-subtle',
      )}
    >
      {active ? (
        <span
          aria-hidden="true"
          className="absolute inset-y-1.5 left-0 w-[2px] rounded-full bg-accent"
        />
      ) : null}

      <button
        type="button"
        role="checkbox"
        aria-checked={task.done}
        aria-label={task.done ? t('tasks.markUndone') : t('tasks.markDone')}
        onClick={onToggleDone}
        className={cn(
          'inline-flex size-[18px] shrink-0 items-center justify-center rounded-[4px] border transition-colors duration-150',
          task.done
            ? 'border-success bg-success text-white'
            : 'border-border-strong hover:border-accent',
        )}
      >
        {task.done ? <CheckIcon width={12} height={12} strokeWidth={2.6} /> : null}
      </button>

      <button
        type="button"
        onClick={onSetActive}
        title={t('tasks.setActive')}
        className="min-w-0 flex-1 text-left"
      >
        <span
          className={cn(
            'block truncate text-sm',
            task.done ? 'text-faint line-through' : 'text-text',
          )}
        >
          {task.title}
        </span>
        <span className="tnum mt-0.5 block text-[12px] text-faint">
          {t('tasks.progress', { done: task.completedPomodoros, total: task.estimatedPomodoros })}
          {active ? <span className="ml-2 text-accent">· {t('tasks.activeBadge')}</span> : null}
        </span>
      </button>

      <div className="flex shrink-0 items-center gap-0.5 opacity-100 sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
        <IconButton label={t('tasks.edit')} onClick={() => setEditing(true)} className="size-8">
          <PencilIcon width={15} height={15} />
        </IconButton>
        <IconButton
          label={t('tasks.delete')}
          tone="danger"
          onClick={onRequestDelete}
          className="size-8"
        >
          <TrashIcon width={15} height={15} />
        </IconButton>
      </div>
    </li>
  );
}

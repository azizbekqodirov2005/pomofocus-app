import { useMemo, useState } from 'react';
import { useTasks } from '@/state/TasksProvider';
import { useToast } from '@/state/ToastProvider';
import { useI18n } from '@/i18n/useI18n';
import { EmptyState } from '@/components/ui/EmptyState';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Button } from '@/components/ui/Button';
import { ListIcon } from '@/components/ui/Icon';
import { TaskComposer } from './TaskComposer';
import { TaskItem } from './TaskItem';

export function TaskList() {
  const {
    tasks,
    activeTaskId,
    addTask,
    editTask,
    removeTask,
    toggleDone,
    setActiveTask,
    clearCompleted,
  } = useTasks();
  const { notify } = useToast();
  const { t } = useI18n();

  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  const [clearing, setClearing] = useState(false);

  const completedCount = useMemo(() => tasks.filter((task) => task.done).length, [tasks]);
  const pendingTask = tasks.find((task) => task.id === pendingDelete) ?? null;

  // Unfinished tasks first, newest last — the natural working order.
  const ordered = useMemo(
    () => [...tasks].sort((a, b) => Number(a.done) - Number(b.done) || a.createdAt - b.createdAt),
    [tasks],
  );

  return (
    <section
      aria-labelledby="tasks-heading"
      className="rounded-lg border border-border-base bg-surface shadow-subtle"
    >
      <header className="flex items-center justify-between gap-3 border-b border-border-base px-4 py-3.5">
        <h2 id="tasks-heading" className="text-sm font-semibold tracking-tight">
          {t('tasks.title')}
          {tasks.length > 0 ? (
            <span className="tnum ml-2 text-[12.5px] font-normal text-faint">
              {t('tasks.completedCount', { count: completedCount })}
            </span>
          ) : null}
        </h2>
        {completedCount > 0 ? (
          <Button size="sm" variant="ghost" onClick={() => setClearing(true)}>
            {t('tasks.clearCompleted')}
          </Button>
        ) : null}
      </header>

      <div className="border-b border-border-base px-4 py-3.5">
        <TaskComposer onAdd={addTask} />
      </div>

      {ordered.length === 0 ? (
        <EmptyState
          icon={<ListIcon width={18} height={18} />}
          title={t('tasks.empty')}
          hint={t('tasks.emptyHint')}
        />
      ) : (
        <ul className="py-1">
          {ordered.map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              active={task.id === activeTaskId}
              onToggleDone={() => toggleDone(task.id)}
              onSetActive={() => setActiveTask(task.id === activeTaskId ? null : task.id)}
              onEdit={(title, estimate) => editTask(task.id, title, estimate)}
              onRequestDelete={() => setPendingDelete(task.id)}
            />
          ))}
        </ul>
      )}

      <ConfirmDialog
        open={pendingTask !== null}
        title={t('tasks.deleteTitle')}
        body={t('tasks.deleteBody', { title: pendingTask?.title ?? '' })}
        confirmLabel={t('common.delete')}
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => {
          if (pendingDelete) removeTask(pendingDelete);
          setPendingDelete(null);
          notify(t('toast.taskDeleted'), 'info');
        }}
      />

      <ConfirmDialog
        open={clearing}
        title={t('tasks.clearCompletedTitle')}
        body={t('tasks.clearCompletedBody', { count: completedCount })}
        confirmLabel={t('common.clear')}
        onCancel={() => setClearing(false)}
        onConfirm={() => {
          clearCompleted();
          setClearing(false);
          notify(t('toast.completedCleared'), 'info');
        }}
      />
    </section>
  );
}

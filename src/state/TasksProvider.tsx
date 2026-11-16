import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { Task } from '@/types';
import { readStorage, StorageKeys, writeStorage } from '@/lib/storage';
import { createId } from '@/lib/time';

export const TASK_LIMITS = { titleMax: 120, estimateMin: 1, estimateMax: 20 } as const;

function sanitizeTask(input: unknown): Task | null {
  if (!input || typeof input !== 'object') return null;
  const raw = input as Partial<Record<keyof Task, unknown>>;
  const title = typeof raw.title === 'string' ? raw.title.trim().slice(0, TASK_LIMITS.titleMax) : '';
  if (!title) return null;
  const estimate = Number(raw.estimatedPomodoros);
  const completed = Number(raw.completedPomodoros);
  return {
    id: typeof raw.id === 'string' && raw.id ? raw.id : createId(),
    title,
    estimatedPomodoros: Number.isFinite(estimate)
      ? Math.min(TASK_LIMITS.estimateMax, Math.max(TASK_LIMITS.estimateMin, Math.round(estimate)))
      : 1,
    completedPomodoros: Number.isFinite(completed) ? Math.max(0, Math.round(completed)) : 0,
    done: raw.done === true,
    createdAt: typeof raw.createdAt === 'number' ? raw.createdAt : Date.now(),
  };
}

function sanitizeTasks(input: unknown): Task[] {
  if (!Array.isArray(input)) return [];
  return input.map(sanitizeTask).filter((task): task is Task => task !== null);
}

interface TasksContextValue {
  tasks: Task[];
  activeTaskId: string | null;
  activeTask: Task | null;
  addTask: (title: string, estimatedPomodoros: number) => void;
  editTask: (id: string, title: string, estimatedPomodoros: number) => void;
  removeTask: (id: string) => void;
  toggleDone: (id: string) => void;
  setActiveTask: (id: string | null) => void;
  clearCompleted: () => void;
  incrementActivePomodoro: () => void;
}

const TasksContext = createContext<TasksContextValue | null>(null);

export function TasksProvider({ children }: { children: ReactNode }) {
  const [tasks, setTasks] = useState<Task[]>(() =>
    sanitizeTasks(readStorage<unknown>(StorageKeys.tasks, [])),
  );
  const [activeTaskId, setActiveTaskId] = useState<string | null>(() => {
    const stored = readStorage<unknown>(StorageKeys.activeTask, null);
    return typeof stored === 'string' ? stored : null;
  });

  useEffect(() => {
    writeStorage(StorageKeys.tasks, tasks);
  }, [tasks]);

  useEffect(() => {
    writeStorage(StorageKeys.activeTask, activeTaskId);
  }, [activeTaskId]);

  // Drop a stale active id (e.g. the task was removed in another tab).
  useEffect(() => {
    if (activeTaskId && !tasks.some((task) => task.id === activeTaskId)) {
      setActiveTaskId(null);
    }
  }, [tasks, activeTaskId]);

  const addTask = useCallback((title: string, estimatedPomodoros: number) => {
    const clean = title.trim().slice(0, TASK_LIMITS.titleMax);
    if (!clean) return;
    const task: Task = {
      id: createId(),
      title: clean,
      estimatedPomodoros: Math.min(
        TASK_LIMITS.estimateMax,
        Math.max(TASK_LIMITS.estimateMin, Math.round(estimatedPomodoros) || 1),
      ),
      completedPomodoros: 0,
      done: false,
      createdAt: Date.now(),
    };
    setTasks((current) => [...current, task]);
    setActiveTaskId((current) => current ?? task.id);
  }, []);

  const editTask = useCallback((id: string, title: string, estimatedPomodoros: number) => {
    const clean = title.trim().slice(0, TASK_LIMITS.titleMax);
    if (!clean) return;
    setTasks((current) =>
      current.map((task) =>
        task.id === id
          ? {
              ...task,
              title: clean,
              estimatedPomodoros: Math.min(
                TASK_LIMITS.estimateMax,
                Math.max(TASK_LIMITS.estimateMin, Math.round(estimatedPomodoros) || 1),
              ),
            }
          : task,
      ),
    );
  }, []);

  const removeTask = useCallback((id: string) => {
    setTasks((current) => current.filter((task) => task.id !== id));
    setActiveTaskId((current) => (current === id ? null : current));
  }, []);

  const toggleDone = useCallback((id: string) => {
    setTasks((current) =>
      current.map((task) => (task.id === id ? { ...task, done: !task.done } : task)),
    );
  }, []);

  const clearCompleted = useCallback(() => {
    setTasks((current) => current.filter((task) => !task.done));
  }, []);

  const incrementActivePomodoro = useCallback(() => {
    setActiveTaskId((currentId) => {
      if (currentId) {
        setTasks((current) =>
          current.map((task) =>
            task.id === currentId
              ? { ...task, completedPomodoros: task.completedPomodoros + 1 }
              : task,
          ),
        );
      }
      return currentId;
    });
  }, []);

  const setActiveTask = useCallback((id: string | null) => setActiveTaskId(id), []);

  const activeTask = useMemo(
    () => tasks.find((task) => task.id === activeTaskId) ?? null,
    [tasks, activeTaskId],
  );

  const value = useMemo<TasksContextValue>(
    () => ({
      tasks,
      activeTaskId,
      activeTask,
      addTask,
      editTask,
      removeTask,
      toggleDone,
      setActiveTask,
      clearCompleted,
      incrementActivePomodoro,
    }),
    [
      tasks,
      activeTaskId,
      activeTask,
      addTask,
      editTask,
      removeTask,
      toggleDone,
      setActiveTask,
      clearCompleted,
      incrementActivePomodoro,
    ],
  );

  return <TasksContext.Provider value={value}>{children}</TasksContext.Provider>;
}

export function useTasks(): TasksContextValue {
  const context = useContext(TasksContext);
  if (!context) throw new Error('useTasks must be used inside <TasksProvider>');
  return context;
}

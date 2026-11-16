import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  useEffect,
  type ReactNode,
} from 'react';
import type { Toast, ToastAction, ToastVariant } from '@/types';
import { createId } from '@/lib/time';

export interface NotifyOptions {
  action?: ToastAction;
  /** Keep the toast until the user dismisses it or uses its action. */
  persist?: boolean;
}

interface ToastContextValue {
  toasts: Toast[];
  notify: (message: string, variant?: ToastVariant, options?: NotifyOptions) => void;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const VISIBLE_MS = 4200;
const MAX_VISIBLE = 3;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timers = useRef(new Map<string, number>());

  const dismiss = useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
    const handle = timers.current.get(id);
    if (handle !== undefined) {
      window.clearTimeout(handle);
      timers.current.delete(id);
    }
  }, []);

  const notify = useCallback(
    (message: string, variant: ToastVariant = 'info', options?: NotifyOptions) => {
      const id = createId();
      const toast: Toast = {
        id,
        message,
        variant,
        ...(options?.action ? { action: options.action } : {}),
        ...(options?.persist ? { persist: true } : {}),
      };
      setToasts((current) => [...current, toast].slice(-MAX_VISIBLE));
      if (!options?.persist) {
        const handle = window.setTimeout(() => dismiss(id), VISIBLE_MS);
        timers.current.set(id, handle);
      }
    },
    [dismiss],
  );

  useEffect(() => {
    const handles = timers.current;
    return () => {
      handles.forEach((handle) => window.clearTimeout(handle));
      handles.clear();
    };
  }, []);

  const value = useMemo<ToastContextValue>(() => ({ toasts, notify, dismiss }), [toasts, notify, dismiss]);

  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>;
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used inside <ToastProvider>');
  return context;
}

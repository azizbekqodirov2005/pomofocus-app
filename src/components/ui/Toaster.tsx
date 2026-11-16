import { useToast } from '@/state/ToastProvider';
import { useI18n } from '@/i18n/useI18n';
import { cn } from '@/lib/cn';
import { CloseIcon } from './Icon';

export function Toaster() {
  const { toasts, dismiss } = useToast();
  const { t } = useI18n();

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex flex-col items-center gap-2 px-4 pb-4 sm:items-end sm:px-6 sm:pb-6"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={cn(
            'animate-toast pointer-events-auto flex w-full max-w-sm items-start gap-3',
            'rounded-md border bg-surface-raised px-3.5 py-3 shadow-card',
            toast.variant === 'success'
              ? 'border-border-base'
              : toast.variant === 'danger'
                ? 'border-danger'
                : 'border-border-base',
          )}
        >
          <span
            aria-hidden="true"
            className={cn(
              'mt-1.5 size-1.5 shrink-0 rounded-full',
              toast.variant === 'success'
                ? 'bg-success'
                : toast.variant === 'danger'
                  ? 'bg-danger'
                  : 'bg-accent',
            )}
          />
          <p className="min-w-0 flex-1 text-[13px] leading-relaxed">{toast.message}</p>
          <button
            type="button"
            onClick={() => dismiss(toast.id)}
            aria-label={t('common.close')}
            className="-mr-1 -mt-0.5 inline-flex size-6 shrink-0 items-center justify-center rounded-sm text-faint transition-colors hover:bg-bg-subtle hover:text-text"
          >
            <CloseIcon width={14} height={14} />
          </button>
        </div>
      ))}
    </div>
  );
}

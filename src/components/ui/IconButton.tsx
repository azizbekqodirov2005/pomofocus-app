import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/cn';

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  children: ReactNode;
  tone?: 'default' | 'danger';
}

export function IconButton({
  label,
  children,
  className,
  tone = 'default',
  type = 'button',
  ...rest
}: IconButtonProps) {
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      className={cn(
        'inline-flex size-9 shrink-0 items-center justify-center rounded-md border border-transparent',
        'transition-colors duration-150 disabled:pointer-events-none disabled:opacity-40',
        tone === 'danger'
          ? 'text-faint hover:bg-danger-tint hover:text-danger'
          : 'text-muted hover:bg-bg-subtle hover:text-text',
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}

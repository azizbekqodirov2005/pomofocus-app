import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/cn';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  children: ReactNode;
}

const variants: Record<Variant, string> = {
  primary:
    'bg-accent text-accent-contrast hover:bg-accent-hover border border-transparent shadow-subtle',
  secondary:
    'bg-surface text-text border border-border-strong hover:bg-bg-subtle',
  ghost: 'bg-transparent text-muted border border-transparent hover:bg-bg-subtle hover:text-text',
  danger: 'bg-transparent text-danger border border-transparent hover:bg-danger-tint',
};

const sizes: Record<Size, string> = {
  sm: 'h-8 px-3 text-[13px] rounded-sm gap-1.5',
  md: 'h-10 px-4 text-sm rounded-md gap-2',
  lg: 'h-12 px-7 text-[15px] rounded-md gap-2',
};

export function Button({
  variant = 'secondary',
  size = 'md',
  className,
  type = 'button',
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        'inline-flex items-center justify-center font-medium select-none',
        'transition-[background-color,color,border-color,transform] duration-150',
        'active:translate-y-px disabled:pointer-events-none disabled:opacity-45',
        variants[variant],
        sizes[size],
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}

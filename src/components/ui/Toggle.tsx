import { useId } from 'react';
import { cn } from '@/lib/cn';

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  hint?: string;
  disabled?: boolean;
  note?: string;
}

export function Toggle({ checked, onChange, label, hint, disabled, note }: ToggleProps) {
  const id = useId();
  const hintId = `${id}-hint`;

  return (
    <div className="flex items-start justify-between gap-4 py-3">
      <div className="min-w-0">
        <label htmlFor={id} className={cn('text-sm font-medium', disabled && 'text-faint')}>
          {label}
        </label>
        {hint ? (
          <p id={hintId} className="mt-0.5 text-[12.5px] leading-relaxed text-muted">
            {hint}
          </p>
        ) : null}
        {note ? <p className="mt-1 text-[12.5px] leading-relaxed text-danger">{note}</p> : null}
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-describedby={hint ? hintId : undefined}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative mt-0.5 inline-flex h-[22px] w-[38px] shrink-0 items-center rounded-full',
          'border transition-colors duration-200 disabled:pointer-events-none disabled:opacity-40',
          checked ? 'border-accent bg-accent' : 'border-border-strong bg-track',
        )}
      >
        <span
          className={cn(
            'pointer-events-none ml-0.5 block size-[16px] rounded-full bg-white shadow-subtle',
            'transition-transform duration-200',
            checked ? 'translate-x-[16px]' : 'translate-x-0',
          )}
        />
      </button>
    </div>
  );
}

import { useEffect, useId, useState } from 'react';
import { cn } from '@/lib/cn';
import { useI18n } from '@/i18n/useI18n';

interface NumberFieldProps {
  label: string;
  value: number;
  min: number;
  max: number;
  unit?: string;
  onCommit: (value: number) => void;
}

/**
 * Numeric input that lets the user type freely but can only ever commit a
 * valid, clamped integer. Out-of-range input shows an inline message.
 */
export function NumberField({ label, value, min, max, unit, onCommit }: NumberFieldProps) {
  const id = useId();
  const errorId = `${id}-error`;
  const { t } = useI18n();
  const [draft, setDraft] = useState(String(value));
  const [invalid, setInvalid] = useState(false);

  useEffect(() => {
    setDraft(String(value));
    setInvalid(false);
  }, [value]);

  const commit = (raw: string) => {
    const parsed = Number(raw);
    if (raw.trim() === '' || !Number.isFinite(parsed)) {
      setDraft(String(value));
      setInvalid(false);
      return;
    }
    const rounded = Math.round(parsed);
    if (rounded < min || rounded > max) {
      setInvalid(true);
      const clamped = Math.min(max, Math.max(min, rounded));
      setDraft(String(clamped));
      onCommit(clamped);
      return;
    }
    setInvalid(false);
    onCommit(rounded);
  };

  const step = (delta: number) => {
    const next = Math.min(max, Math.max(min, value + delta));
    setInvalid(false);
    setDraft(String(next));
    onCommit(next);
  };

  return (
    <div className="py-3">
      <div className="flex items-center justify-between gap-4">
        <label htmlFor={id} className="text-sm font-medium">
          {label}
          {unit ? <span className="ml-1.5 text-[12.5px] font-normal text-faint">{unit}</span> : null}
        </label>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => step(-1)}
            disabled={value <= min}
            aria-label={`${label} −1`}
            className="inline-flex size-8 items-center justify-center rounded-sm border border-border-strong text-muted transition-colors hover:bg-bg-subtle hover:text-text disabled:pointer-events-none disabled:opacity-40"
          >
            −
          </button>
          <input
            id={id}
            type="number"
            inputMode="numeric"
            min={min}
            max={max}
            value={draft}
            aria-invalid={invalid}
            aria-describedby={invalid ? errorId : undefined}
            onChange={(event) => setDraft(event.target.value)}
            onBlur={(event) => commit(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                commit(draft);
                event.currentTarget.blur();
              }
            }}
            className={cn(
              'tnum h-8 w-14 rounded-sm border bg-surface text-center text-sm',
              'transition-colors focus:border-accent focus:outline-none',
              invalid ? 'border-danger' : 'border-border-strong',
            )}
          />
          <button
            type="button"
            onClick={() => step(1)}
            disabled={value >= max}
            aria-label={`${label} +1`}
            className="inline-flex size-8 items-center justify-center rounded-sm border border-border-strong text-muted transition-colors hover:bg-bg-subtle hover:text-text disabled:pointer-events-none disabled:opacity-40"
          >
            +
          </button>
        </div>
      </div>
      {invalid ? (
        <p id={errorId} role="alert" className="mt-1.5 text-[12.5px] text-danger">
          {t('settings.invalid', { min, max })}
        </p>
      ) : null}
    </div>
  );
}

import { cn } from '@/lib/cn';

/** The product mark: a ring with a filled quadrant — one pomodoro in progress. */
export function BrandMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 28 28"
      width="26"
      height="26"
      aria-hidden="true"
      focusable="false"
      className={cn('shrink-0', className)}
    >
      <circle cx="14" cy="14" r="11" fill="none" stroke="currentColor" strokeWidth="1.6" opacity="0.28" />
      <path
        d="M14 3a11 11 0 0 1 11 11h-3.2A7.8 7.8 0 0 0 14 6.2V3Z"
        fill="currentColor"
      />
      <circle cx="14" cy="14" r="2" fill="currentColor" />
    </svg>
  );
}

export function Brand({ name, tagline }: { name: string; tagline?: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <BrandMark className="text-accent" />
      <div className="leading-tight">
        <p className="text-[15px] font-semibold tracking-tight">{name}</p>
        {tagline ? <p className="text-[12px] text-faint">{tagline}</p> : null}
      </div>
    </div>
  );
}

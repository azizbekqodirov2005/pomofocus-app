import type { ReactNode } from 'react';

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  hint?: string;
}

export function EmptyState({ icon, title, hint }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-10 text-center">
      <span className="mb-3 inline-flex size-10 items-center justify-center rounded-full border border-border-base bg-bg-subtle text-faint">
        {icon}
      </span>
      <p className="text-sm font-medium text-text">{title}</p>
      {hint ? <p className="mt-1 max-w-[34ch] text-[12.5px] leading-relaxed text-muted">{hint}</p> : null}
    </div>
  );
}

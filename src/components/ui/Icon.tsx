import type { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement>;

function Base({ children, ...rest }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      {children}
    </svg>
  );
}

export const PlayIcon = (props: IconProps) => (
  <Base {...props}>
    <path d="M7 4.5v15l12-7.5-12-7.5Z" fill="currentColor" stroke="none" />
  </Base>
);

export const PauseIcon = (props: IconProps) => (
  <Base {...props}>
    <rect x="7" y="5" width="3.5" height="14" rx="1" fill="currentColor" stroke="none" />
    <rect x="13.5" y="5" width="3.5" height="14" rx="1" fill="currentColor" stroke="none" />
  </Base>
);

export const ResetIcon = (props: IconProps) => (
  <Base {...props}>
    <path d="M3 12a9 9 0 1 0 3.2-6.9" />
    <path d="M3 4.5V10h5.5" />
  </Base>
);

export const SkipIcon = (props: IconProps) => (
  <Base {...props}>
    <path d="M6 5.5v13l9-6.5-9-6.5Z" fill="currentColor" stroke="none" />
    <path d="M18 5v14" />
  </Base>
);

export const SunIcon = (props: IconProps) => (
  <Base {...props}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.1 5.1l1.4 1.4M17.5 17.5l1.4 1.4M18.9 5.1l-1.4 1.4M6.5 17.5l-1.4 1.4" />
  </Base>
);

export const MoonIcon = (props: IconProps) => (
  <Base {...props}>
    <path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5Z" />
  </Base>
);

export const SettingsIcon = (props: IconProps) => (
  <Base {...props}>
    <path d="M4 7h10M18 7h2M4 17h2M10 17h10" />
    <circle cx="16" cy="7" r="2.2" />
    <circle cx="8" cy="17" r="2.2" />
  </Base>
);

export const KeyboardIcon = (props: IconProps) => (
  <Base {...props}>
    <rect x="2.5" y="6" width="19" height="12" rx="2" />
    <path d="M6.5 10h.01M10 10h.01M13.5 10h.01M17 10h.01M8 14h8" />
  </Base>
);

export const CheckIcon = (props: IconProps) => (
  <Base {...props}>
    <path d="M4.5 12.5l4.5 4.5L19.5 6.5" />
  </Base>
);

export const TrashIcon = (props: IconProps) => (
  <Base {...props}>
    <path d="M4 7h16M9 7V4.5h6V7M6.5 7l.8 12a1.5 1.5 0 0 0 1.5 1.4h6.4a1.5 1.5 0 0 0 1.5-1.4L17.5 7" />
  </Base>
);

export const PencilIcon = (props: IconProps) => (
  <Base {...props}>
    <path d="M4 20h4l10-10-4-4L4 16v4Z" />
    <path d="M13.5 5.5l4 4" />
  </Base>
);

export const PlusIcon = (props: IconProps) => (
  <Base {...props}>
    <path d="M12 5v14M5 12h14" />
  </Base>
);

export const TargetIcon = (props: IconProps) => (
  <Base {...props}>
    <circle cx="12" cy="12" r="8.5" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="12" cy="12" r="0.8" fill="currentColor" stroke="none" />
  </Base>
);

export const ClockIcon = (props: IconProps) => (
  <Base {...props}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7.5V12l3 2" />
  </Base>
);

export const CloseIcon = (props: IconProps) => (
  <Base {...props}>
    <path d="M6 6l12 12M18 6L6 18" />
  </Base>
);

export const GlobeIcon = (props: IconProps) => (
  <Base {...props}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M3.5 12h17M12 3.5c2.2 2.3 3.4 5.3 3.4 8.5 0 3.2-1.2 6.2-3.4 8.5-2.2-2.3-3.4-5.3-3.4-8.5 0-3.2 1.2-6.2 3.4-8.5Z" />
  </Base>
);

export const ChevronDownIcon = (props: IconProps) => (
  <Base {...props}>
    <path d="M6 9.5l6 6 6-6" />
  </Base>
);

export const ListIcon = (props: IconProps) => (
  <Base {...props}>
    <path d="M4 6.5h16M4 12h16M4 17.5h10" />
  </Base>
);

export const ChartIcon = (props: IconProps) => (
  <Base {...props}>
    <path d="M4 20V4" />
    <path d="M4 20h16" />
    <path d="M8.5 20v-6M13 20V8.5M17.5 20v-9" />
  </Base>
);

import { useEffect } from 'react';

export interface ShortcutHandlers {
  onToggleTimer: () => void;
  onReset: () => void;
  onSkip: () => void;
  onToggleTheme: () => void;
  onOpenSettings: () => void;
  onOpenShortcuts: () => void;
}

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return (
    tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target.isContentEditable === true
  );
}

/**
 * Global timer shortcuts. Disabled while the user is typing or while a dialog
 * is open, so they can never fire unexpectedly.
 */
export function useKeyboardShortcuts(handlers: ShortcutHandlers, enabled: boolean): void {
  useEffect(() => {
    if (!enabled) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (isTypingTarget(event.target)) return;

      switch (event.key) {
        case ' ':
        case 'Spacebar':
          event.preventDefault();
          handlers.onToggleTimer();
          break;
        case 'r':
        case 'R':
          event.preventDefault();
          handlers.onReset();
          break;
        case 's':
        case 'S':
          event.preventDefault();
          handlers.onSkip();
          break;
        case 't':
        case 'T':
          event.preventDefault();
          handlers.onToggleTheme();
          break;
        case ',':
          event.preventDefault();
          handlers.onOpenSettings();
          break;
        case '?':
          event.preventDefault();
          handlers.onOpenShortcuts();
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handlers, enabled]);
}

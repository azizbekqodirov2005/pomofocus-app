import { useCallback, useEffect, useId, useRef, useState } from 'react';
import type { Language } from '@/types';
import { LANGUAGES } from '@/i18n';
import { useI18n } from '@/i18n/useI18n';
import { CheckIcon, ChevronDownIcon, GlobeIcon } from '@/components/ui/Icon';
import { cn } from '@/lib/cn';

/**
 * Language picker as a small in-page menu rather than a native <select>:
 * a select hands mobile browsers their own full-screen picker, which breaks
 * out of the app's design entirely.
 */
export function LanguageMenu() {
  const { language, setLanguage, t } = useI18n();
  const [open, setOpen] = useState(false);
  // Moving focus into the menu is right for keyboard users, but it draws a
  // focus ring that looks out of place when the menu was opened by a click.
  const [openedByKeyboard, setOpenedByKeyboard] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const itemRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const menuId = useId();

  const current = LANGUAGES.find((entry) => entry.code === language) ?? LANGUAGES[0];
  const activeIndex = LANGUAGES.findIndex((entry) => entry.code === language);

  const close = useCallback((returnFocus = true) => {
    setOpen(false);
    setOpenedByKeyboard(false);
    if (returnFocus) triggerRef.current?.focus();
  }, []);

  // Dismiss on an outside press or Escape, wherever focus happens to be.
  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        close();
      }
    };

    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown, true);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown, true);
    };
  }, [open, close]);

  // Open with the current language focused, so arrow keys start in the right place.
  useEffect(() => {
    if (!open || !openedByKeyboard) return;
    const frame = window.requestAnimationFrame(() => {
      itemRefs.current[Math.max(0, activeIndex)]?.focus();
    });
    return () => window.cancelAnimationFrame(frame);
  }, [open, openedByKeyboard, activeIndex]);

  const moveFocus = (from: number, delta: number) => {
    const next = (from + delta + LANGUAGES.length) % LANGUAGES.length;
    itemRefs.current[next]?.focus();
  };

  const choose = (code: Language) => {
    setLanguage(code);
    close();
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        aria-label={`${t('language.label')}: ${current?.label ?? ''}`}
        onClick={() => {
          setOpenedByKeyboard(false);
          setOpen((value) => !value);
        }}
        onKeyDown={(event) => {
          if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            event.preventDefault();
            setOpenedByKeyboard(true);
            if (open) {
              itemRefs.current[Math.max(0, activeIndex)]?.focus();
            } else {
              setOpen(true);
            }
          }
        }}
        className={cn(
          'inline-flex h-9 items-center gap-1.5 rounded-md border border-transparent px-2',
          'text-[13px] font-medium transition-colors',
          open ? 'bg-bg-subtle text-text' : 'text-muted hover:bg-bg-subtle hover:text-text',
        )}
      >
        <GlobeIcon width={15} height={15} />
        <span className="hidden sm:inline">{current?.label}</span>
        <span className="sm:hidden">{current?.short}</span>
        <ChevronDownIcon
          width={13}
          height={13}
          className={cn('transition-transform duration-200', open && 'rotate-180')}
        />
      </button>

      {open ? (
        <div
          id={menuId}
          role="menu"
          aria-label={t('language.label')}
          className="animate-rise absolute right-0 z-40 mt-1.5 min-w-[11rem] overflow-hidden rounded-md border border-border-base bg-surface-raised p-1 shadow-card"
        >
          {LANGUAGES.map((entry, index) => {
            const selected = entry.code === language;
            return (
              <button
                key={entry.code}
                ref={(node) => {
                  itemRefs.current[index] = node;
                }}
                type="button"
                role="menuitemradio"
                aria-checked={selected}
                onClick={() => choose(entry.code)}
                onKeyDown={(event) => {
                  if (event.key === 'ArrowDown') {
                    event.preventDefault();
                    moveFocus(index, 1);
                  } else if (event.key === 'ArrowUp') {
                    event.preventDefault();
                    moveFocus(index, -1);
                  } else if (event.key === 'Home') {
                    event.preventDefault();
                    itemRefs.current[0]?.focus();
                  } else if (event.key === 'End') {
                    event.preventDefault();
                    itemRefs.current[LANGUAGES.length - 1]?.focus();
                  } else if (event.key === 'Tab') {
                    setOpen(false);
                  }
                }}
                className={cn(
                  'flex w-full items-center justify-between gap-3 rounded-sm px-2.5 py-2 text-left',
                  'text-[13px] transition-colors',
                  selected ? 'text-text' : 'text-muted hover:bg-bg-subtle hover:text-text',
                )}
              >
                <span className="flex items-center gap-2.5">
                  <span className="tnum w-6 text-[11px] font-medium text-faint">{entry.short}</span>
                  {entry.label}
                </span>
                {selected ? <CheckIcon width={14} height={14} className="text-accent" /> : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

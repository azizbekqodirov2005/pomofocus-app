import { Modal } from '@/components/ui/Modal';
import { useI18n } from '@/i18n/useI18n';
import type { TranslationKey } from '@/i18n';

const ROWS: ReadonlyArray<{ keys: string; labelKey: TranslationKey }> = [
  { keys: 'Space', labelKey: 'shortcuts.space' },
  { keys: 'R', labelKey: 'shortcuts.reset' },
  { keys: 'S', labelKey: 'shortcuts.skip' },
  { keys: 'T', labelKey: 'shortcuts.theme' },
  { keys: ',', labelKey: 'shortcuts.settings' },
  { keys: '?', labelKey: 'shortcuts.help' },
  { keys: 'Esc', labelKey: 'shortcuts.close' },
];

export function ShortcutsDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useI18n();

  return (
    <Modal open={open} title={t('shortcuts.title')} onClose={onClose} size="sm">
      <dl className="divide-y divide-[color:var(--border)]">
        {ROWS.map((row) => (
          <div key={row.keys} className="flex items-center justify-between gap-4 py-2.5">
            <dt className="text-[13px] text-muted">{t(row.labelKey)}</dt>
            <dd>
              <kbd className="rounded-sm border border-border-strong bg-bg-subtle px-2 py-0.5 font-sans text-[12px] font-medium text-text">
                {row.keys}
              </kbd>
            </dd>
          </div>
        ))}
      </dl>
    </Modal>
  );
}

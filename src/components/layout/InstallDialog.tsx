import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { useI18n } from '@/i18n/useI18n';

/**
 * iOS has no programmatic install, so the Share-sheet route is spelled out.
 */
export function InstallDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useI18n();

  const steps = [t('install.step1'), t('install.step2'), t('install.step3')];

  return (
    <Modal
      open={open}
      title={t('install.title')}
      description={t('install.intro')}
      onClose={onClose}
      size="sm"
      footer={
        <Button variant="secondary" onClick={onClose}>
          {t('common.close')}
        </Button>
      }
    >
      <ol className="space-y-3">
        {steps.map((step, index) => (
          <li key={step} className="flex gap-3">
            <span className="tnum mt-px inline-flex size-5 shrink-0 items-center justify-center rounded-full border border-border-strong text-[11px] font-medium text-muted">
              {index + 1}
            </span>
            <p className="text-[13px] leading-relaxed">{step}</p>
          </li>
        ))}
      </ol>
      <p className="mt-4 text-[12.5px] leading-relaxed text-faint">{t('install.benefit')}</p>
    </Modal>
  );
}

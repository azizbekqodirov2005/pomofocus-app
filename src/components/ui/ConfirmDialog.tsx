import { Modal } from './Modal';
import { Button } from './Button';
import { useI18n } from '@/i18n/useI18n';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  body: string;
  confirmLabel?: string;
  tone?: 'danger' | 'primary';
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  body,
  confirmLabel,
  tone = 'danger',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const { t } = useI18n();

  return (
    <Modal
      open={open}
      title={title}
      description={body}
      onClose={onCancel}
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onCancel}>
            {t('common.cancel')}
          </Button>
          <Button
            variant="primary"
            onClick={onConfirm}
            className={tone === 'danger' ? 'bg-danger text-white hover:bg-danger hover:opacity-90' : ''}
          >
            {confirmLabel ?? t('common.confirm')}
          </Button>
        </>
      }
    />
  );
}

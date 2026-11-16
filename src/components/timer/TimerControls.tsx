import { Button } from '@/components/ui/Button';
import { IconButton } from '@/components/ui/IconButton';
import { PauseIcon, PlayIcon, ResetIcon, SkipIcon } from '@/components/ui/Icon';
import { useI18n } from '@/i18n/useI18n';
import type { TimerStatus } from '@/types';

interface TimerControlsProps {
  status: TimerStatus;
  canReset: boolean;
  onToggle: () => void;
  onReset: () => void;
  onSkip: () => void;
}

export function TimerControls({ status, canReset, onToggle, onReset, onSkip }: TimerControlsProps) {
  const { t } = useI18n();
  const running = status === 'running';
  const label = running
    ? t('controls.pause')
    : status === 'paused'
      ? t('controls.resume')
      : t('controls.start');

  return (
    <div className="flex items-center justify-center gap-2">
      <IconButton label={t('controls.resetTitle')} onClick={onReset} disabled={!canReset}>
        <ResetIcon />
      </IconButton>

      <Button variant="primary" size="lg" onClick={onToggle} className="min-w-[9.5rem]">
        {running ? <PauseIcon width={16} height={16} /> : <PlayIcon width={16} height={16} />}
        {label}
      </Button>

      <IconButton label={t('controls.skipTitle')} onClick={onSkip}>
        <SkipIcon />
      </IconButton>
    </div>
  );
}

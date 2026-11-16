import { IconButton } from '@/components/ui/IconButton';
import { KeyboardIcon, MoonIcon, SettingsIcon, SunIcon } from '@/components/ui/Icon';
import { useTheme } from '@/state/ThemeProvider';
import { useI18n } from '@/i18n/useI18n';
import { Brand } from './Brand';
import { LanguageSelect } from './LanguageSelect';

interface HeaderProps {
  onOpenSettings: () => void;
  onOpenShortcuts: () => void;
}

export function Header({ onOpenSettings, onOpenShortcuts }: HeaderProps) {
  const { resolved, toggle } = useTheme();
  const { t } = useI18n();

  return (
    <header className="sticky top-0 z-30 border-b border-border-base bg-bg/85 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-3 px-4 sm:px-6">
        <Brand name={t('app.name')} tagline={t('app.tagline')} />

        <nav aria-label={t('settings.title')} className="flex items-center gap-0.5">
          <LanguageSelect />
          <IconButton
            label={resolved === 'dark' ? t('theme.toLight') : t('theme.toDark')}
            onClick={toggle}
          >
            {resolved === 'dark' ? <SunIcon /> : <MoonIcon />}
          </IconButton>
          <IconButton
            label={t('shortcuts.open')}
            onClick={onOpenShortcuts}
            className="hidden sm:inline-flex"
          >
            <KeyboardIcon />
          </IconButton>
          <IconButton label={t('settings.open')} onClick={onOpenSettings}>
            <SettingsIcon />
          </IconButton>
        </nav>
      </div>
    </header>
  );
}

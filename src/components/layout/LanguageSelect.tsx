import type { Language } from '@/types';
import { LANGUAGES } from '@/i18n';
import { useI18n } from '@/i18n/useI18n';
import { ChevronDownIcon, GlobeIcon } from '@/components/ui/Icon';

export function LanguageSelect() {
  const { language, setLanguage, t } = useI18n();

  return (
    <div className="relative inline-flex items-center">
      <GlobeIcon
        width={15}
        height={15}
        className="pointer-events-none absolute left-2.5 text-muted"
      />
      <select
        value={language}
        aria-label={t('language.label')}
        onChange={(event) => setLanguage(event.target.value as Language)}
        className="h-9 cursor-pointer appearance-none rounded-md border border-transparent bg-transparent pr-7 pl-8 text-[13px] font-medium text-text transition-colors hover:bg-bg-subtle focus:border-accent focus:outline-none"
      >
        {LANGUAGES.map((entry) => (
          <option key={entry.code} value={entry.code}>
            {entry.label}
          </option>
        ))}
      </select>
      <ChevronDownIcon
        width={14}
        height={14}
        className="pointer-events-none absolute right-2 text-faint"
      />
    </div>
  );
}

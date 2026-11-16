import { useI18n } from '@/i18n/useI18n';
import { useTheme } from '@/state/ThemeProvider';
import { BRAND } from '@/config/brand';

/**
 * Footer brand lockup. The wordmark is swapped per theme so it keeps full
 * contrast on both backgrounds; the files live in `public/`.
 */
export function Footer() {
  const { t } = useI18n();
  const { resolved } = useTheme();
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-border-base bg-bg-subtle">
      <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <a
          href={BRAND.url}
          target="_blank"
          rel="noreferrer noopener"
          aria-label={`${BRAND.name} — ${BRAND.url.replace('https://', '')}`}
          className="inline-flex w-fit items-center rounded-md transition-opacity hover:opacity-70"
        >
          <img
            src={resolved === 'dark' ? BRAND.logoDarkSrc : BRAND.logoSrc}
            alt={t('footer.brandAlt', { brand: BRAND.name })}
            width={626}
            height={150}
            loading="lazy"
            decoding="async"
            className="h-8 w-auto"
          />
        </a>

        <div className="text-[12.5px] leading-relaxed text-muted sm:text-right">
          <p>{t('footer.builtWith')}</p>
          <p className="mt-0.5 text-faint">
            © {year} {BRAND.name}. {t('footer.rights')}
          </p>
          <p className="mt-0.5 text-faint">{t('footer.dataNote')}</p>
        </div>
      </div>
    </footer>
  );
}

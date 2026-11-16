import { useI18n } from '@/i18n/useI18n';
import { BRAND } from '@/config/brand';

/**
 * Footer brand lockup. The logo is served from /logo.svg so it can be swapped
 * without touching the code; the text mark is a styled fallback if it fails.
 */
export function Footer() {
  const { t } = useI18n();
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-border-base bg-bg-subtle">
      <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex items-center gap-3">
          <a
            href={BRAND.url}
            target="_blank"
            rel="noreferrer noopener"
            className="inline-flex items-center gap-3 rounded-md transition-opacity hover:opacity-80"
          >
            <img
              src={BRAND.logoSrc}
              alt={t('footer.brandAlt', { brand: BRAND.name })}
              width={32}
              height={32}
              loading="lazy"
              decoding="async"
              className="size-8 shrink-0 object-contain"
            />
            <span className="leading-tight">
              <span className="block text-[13px] font-semibold tracking-tight text-text">
                {BRAND.name}
              </span>
              <span className="block text-[12px] text-faint">{BRAND.role}</span>
            </span>
          </a>
        </div>

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

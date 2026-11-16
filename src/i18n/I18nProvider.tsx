import { createContext, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Language } from '@/types';
import { readStorage, StorageKeys, writeStorage } from '@/lib/storage';
import {
  DEFAULT_LANGUAGE,
  dictionaries,
  INTL_LOCALES,
  isLanguage,
  type TranslationKey,
  type TranslationVars,
} from './index';

export interface I18nContextValue {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: TranslationKey, vars?: TranslationVars) => string;
  locale: string;
}

export const I18nContext = createContext<I18nContextValue | null>(null);

function resolve(dictionary: unknown, key: string): string | undefined {
  const value = key
    .split('.')
    .reduce<unknown>(
      (node, part) =>
        node && typeof node === 'object' ? (node as Record<string, unknown>)[part] : undefined,
      dictionary,
    );
  return typeof value === 'string' ? value : undefined;
}

function interpolate(template: string, vars?: TranslationVars): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in vars ? String(vars[name]) : match,
  );
}

function initialLanguage(): Language {
  const stored = readStorage<unknown>(StorageKeys.language, null);
  if (isLanguage(stored)) return stored;
  return DEFAULT_LANGUAGE;
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(initialLanguage);

  useEffect(() => {
    document.documentElement.lang = language;
    writeStorage(StorageKeys.language, language);
  }, [language]);

  const setLanguage = useCallback((next: Language) => {
    setLanguageState(next);
  }, []);

  const t = useCallback(
    (key: TranslationKey, vars?: TranslationVars) => {
      const template =
        resolve(dictionaries[language], key) ?? resolve(dictionaries[DEFAULT_LANGUAGE], key) ?? key;
      return interpolate(template, vars);
    },
    [language],
  );

  const value = useMemo<I18nContextValue>(
    () => ({ language, setLanguage, t, locale: INTL_LOCALES[language] }),
    [language, setLanguage, t],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

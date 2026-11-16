import type { Language } from '@/types';
import type { Dictionary } from './types';
import { uz } from './uz';
import { en } from './en';
import { ru } from './ru';

export const dictionaries: Record<Language, Dictionary> = {
  uz: uz as Dictionary,
  en,
  ru,
};

export const LANGUAGES: ReadonlyArray<{ code: Language; label: string; short: string }> = [
  { code: 'uz', label: 'O‘zbekcha', short: 'UZ' },
  { code: 'en', label: 'English', short: 'EN' },
  { code: 'ru', label: 'Русский', short: 'RU' },
];

export const DEFAULT_LANGUAGE: Language = 'uz';

/** BCP 47 tags used for Intl formatting. */
export const INTL_LOCALES: Record<Language, string> = {
  uz: 'uz-UZ',
  en: 'en-GB',
  ru: 'ru-RU',
};

export function isLanguage(value: unknown): value is Language {
  return value === 'uz' || value === 'en' || value === 'ru';
}

export type { Dictionary, TranslationKey, TranslationVars } from './types';

import type { uz } from './uz';

/** The Uzbek dictionary is the source of truth; every other locale must match it. */
type Mutable<T> = {
  -readonly [K in keyof T]: T[K] extends string ? string : Mutable<T[K]>;
};

export type Dictionary = Mutable<typeof uz>;

/** Dot-separated paths to every string in the dictionary, e.g. "tasks.title". */
type Leaves<T, Prefix extends string = ''> = {
  [K in keyof T & string]: T[K] extends string
    ? `${Prefix}${K}`
    : Leaves<T[K], `${Prefix}${K}.`>;
}[keyof T & string];

export type TranslationKey = Leaves<Dictionary>;

export type TranslationVars = Record<string, string | number>;

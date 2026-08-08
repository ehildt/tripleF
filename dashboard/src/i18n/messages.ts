import type { LocaleCode } from './locale-codes';
import type { LocaleMessages } from './locale-messages.types';
import { locales } from './locale-registry';

/**
 * The default locale bundle (English), statically available so the app boots
 * instantly with working translations. Derived from the auto-discovered
 * registry.
 */
export const defaultMessages: LocaleMessages = locales.find(
  (l) => l.code === 'en',
)!.messages;

/**
 * Lazy loaders for every supported locale. Each returns the locale's message
 * bundle. Derived from the auto-discovered registry, so adding a locale file
 * registers it here automatically.
 */
export const localeLoaders: Record<LocaleCode, () => Promise<LocaleMessages>> =
  Object.fromEntries(
    locales.map((l) => [l.code, () => Promise.resolve(l.messages)]),
  ) as Record<LocaleCode, () => Promise<LocaleMessages>>;

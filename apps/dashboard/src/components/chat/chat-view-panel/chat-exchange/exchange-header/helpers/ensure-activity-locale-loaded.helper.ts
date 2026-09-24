import { i18n } from '@/i18n/i18n';
import { isLocaleCode } from '@/i18n/locale-codes';
import { localeLoaders } from '@/i18n/messages';

/**
 * Ensure the message bundle for a locale is registered so `t(key, …, locale)`
 * can translate activity labels in the model's chosen language — WITHOUT
 * switching the active UI locale. Only locales the app supports are loaded;
 * anything else (e.g. a code the model picked that we don't ship) is a no-op
 * so the caller falls back to the active locale.
 */
export function ensureActivityLocaleLoaded(code: string): Promise<void> {
  if (!isLocaleCode(code)) return Promise.resolve();
  if (i18n.global.getLocaleMessage(code)) return Promise.resolve();
  return localeLoaders[code]().then((messages) => {
    i18n.global.setLocaleMessage(code, messages);
  });
}

import { type LocaleMessages, localeSchema } from '../locale-schema';
import { resolveNativeLanguageName } from '../resolve-native-language-name';

/** Validate and project one locale module into the registry shape. */
export function mapLocaleModule([path, mod]: [
  string,
  { default: LocaleMessages },
]) {
  const parsed = localeSchema.safeParse(mod.default);
  if (!parsed.success) {
    throw new Error(`Invalid locale file "${path}": ${parsed.error.message}`);
  }
  const messages = parsed.data;
  return {
    code: messages.languageCode,
    countryCode: messages.countryCode,
    name: resolveNativeLanguageName(messages.languageCode),
    messages,
  };
}

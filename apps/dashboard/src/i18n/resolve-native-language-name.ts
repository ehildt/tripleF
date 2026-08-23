/**
 * Resolve a language's native (endonym) name — e.g. "de" → "Deutsch" — via
 * `Intl.DisplayNames`. Requesting the language's own locale as the display
 * locale yields the name in that language, so we do not need to hardcode a
 * name table.
 */
export function resolveNativeLanguageName(code: string): string {
  try {
    const displayNames = new Intl.DisplayNames([code], { type: 'language' });
    return displayNames.of(code) ?? code;
  } catch {
    return code;
  }
}

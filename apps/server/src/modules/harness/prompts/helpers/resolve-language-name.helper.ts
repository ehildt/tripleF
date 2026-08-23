/**
 * Resolve the English display name for an ISO-639 language code so the model
 * sees both the code and the full language name ("de" (German)). Smaller
 * models follow full names far more reliably than bare codes.
 */
export function resolveLanguageName(code: string): string {
  try {
    const displayNames = new Intl.DisplayNames(['en'], { type: 'language' });
    return displayNames.of(code) ?? code;
  } catch {
    return code;
  }
}

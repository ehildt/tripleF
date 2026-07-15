/**
 * Resolve the English display name for an ISO-639 language code so the model
 * sees both the code and the full language name ("de" (German)). Smaller
 * models follow full names far more reliably than bare codes.
 */
function resolveLanguageName(code: string): string {
  try {
    const displayNames = new Intl.DisplayNames(['en'], { type: 'language' });
    return displayNames.of(code) ?? code;
  } catch {
    return code;
  }
}

export function buildLanguageRule(language: string = 'en'): string {
  const code = language.trim().toLowerCase() || 'en';
  const name = resolveLanguageName(code);
  const label = name === code ? `"${code}"` : `"${code}" (${name})`;

  return `LANGUAGE (ABSOLUTE)
- The user's most recent message is written in ${label}.
- You MUST respond entirely in ${label}.
- All text, titles, summaries, captions, questions, and clarifications must be in ${label}.
- Your entire thinking, reasoning, and chain-of-thought process MUST also be in ${label}. Do not reason in English first and translate afterwards.
- Never switch to English or any other language, even for examples or explanations.
- No other language.`;
}

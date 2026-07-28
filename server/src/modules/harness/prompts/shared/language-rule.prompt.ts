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

/**
 * Language rule for the response step. When the intent classifier detected
 * the user's language, the rule names it explicitly; otherwise the model
 * picks the language of the user's latest message itself — the pipeline
 * never defaults to English.
 */
export function buildLanguageRule(language?: string): string {
  const code = language?.trim().toLowerCase() ?? '';

  if (!code) {
    return `LANGUAGE (ABSOLUTE)
- Respond entirely in the language of the user's most recent message.
- Judge that language by the DOMINANT language of the full message — individual foreign words, loanwords, technical or scientific terms, and proper names do not change it. Do not mirror single foreign words.
- All text, titles, summaries, captions, questions, and clarifications must be in that language.
- Your entire thinking, reasoning, and chain-of-thought process MUST also be in that language. Do not reason in English first and translate afterwards.
- Never switch to another language unless the user does.`;
  }

  const name = resolveLanguageName(code);
  const label = name === code ? `"${code}"` : `"${code}" (${name})`;

  return `LANGUAGE (ABSOLUTE)
- The user's most recent message is written in ${label}.
- You MUST respond entirely in ${label}.
- Respond in ${label} even when the message contains individual foreign words, loanwords, technical or scientific terms, or proper names — do not mirror them; the dominant language of the full message decides.
- All text, titles, summaries, captions, questions, and clarifications must be in ${label}.
- Your entire thinking, reasoning, and chain-of-thought process MUST also be in ${label}. Do not reason in English first and translate afterwards.
- Never switch to English or any other language, even for examples or explanations.
- No other language.`;
}

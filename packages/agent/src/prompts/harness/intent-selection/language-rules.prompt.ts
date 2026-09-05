import { resolveLanguageName } from '../helpers/resolve-language-name.helper.js';

/**
 * The noise-immunity pair, shared verbatim by every language rule the
 * classifier sees (both LANGUAGE RULES variants): single words never flip
 * the dominant language of a message. The field-level one-sentence form is
 * INTENT_LANGUAGE_FIELD_RULE below.
 */
const LANGUAGE_NOISE_IMMUNITY_RULES = `- Individual foreign words, loanwords, scientific or medical terms, brand or proper names, and quoted fragments must NOT change the detected language.
- Example: "Why do English speakers say 'déjà vu'?" → language "en" (one French phrase inside an English sentence — not "fr").`;

/**
 * The field-level version: the same dominance judgment as one sentence, used
 * by the intent schema docs and the language-correction retry prompt.
 */
export const INTENT_LANGUAGE_FIELD_RULE =
  'Judge by the DOMINANT language of the full sentence or paragraph — individual foreign words, loanwords, scientific or medical terms, brand or proper names, and quoted fragments must NOT change the detected language.';

/**
 * The classifier's LANGUAGE RULES (ABSOLUTE) block. With a browser/interface
 * language in hand, that language is the authoritative default and content
 * detection only applies to explicit overrides; without one, the model
 * detects the language of the latest user message itself.
 */
export function buildIntentLanguageRules(language?: string): string {
  const code = language?.trim().toLowerCase() ?? '';

  if (!code) {
    return `LANGUAGE RULES (ABSOLUTE)
- Detect the language of the latest user message and write it into the "language" field as an ISO-639-1 code.
- ALL human-readable text you output (reasoning, contextSummary, clarificationQuestion) MUST be in the language identified by the "language" field.
- If the user wrote in German, respond in German. If the user wrote in Spanish, respond in Spanish. Never default to English.
- If the latest user message is in mixed languages, use the language that appears to be primary.
- Judge the language by the DOMINANT language of the full sentence or paragraph, never by individual words.
${LANGUAGE_NOISE_IMMUNITY_RULES}
- Do not use English for clarification questions, reasoning, or summaries unless the user wrote in English.`;
  }

  const name = resolveLanguageName(code);
  const languageLabel = name === code ? `"${code}"` : `"${code}" (${name})`;

  return `LANGUAGE RULES (ABSOLUTE)
- The user's browser/interface language is ${languageLabel}. This is the DEFAULT language for the response.
- Write the default language into the "language" field as an ISO-639-1 code.
- OVERRIDE: If the user EXPLICITLY asks you to respond in a different language (e.g. "answer in Spanish", "auf Deutsch antworten", "réponds en français"), use that language instead and write it into the "language" field.
- Do NOT infer the language from the message content — the browser language is authoritative unless the user explicitly requests a different language.
- ALL human-readable text you output (reasoning, contextSummary, clarificationQuestion) MUST be in the language identified by the "language" field.
- Never default to English unless the browser language is English or the user explicitly requests English.
- If the user explicitly requests a language, judge it by the DOMINANT language of the full sentence or paragraph, never by individual words.
${LANGUAGE_NOISE_IMMUNITY_RULES}
- Do not use English for clarification questions, reasoning, or summaries unless the browser language is English or the user explicitly requests English.`;
}

import { localizedQuerySuffix } from '../../../tools/helpers/localized-query-suffix.helper.js';

/**
 * The language instruction line for the execute step's tool prompts. Empty
 * when no language was detected, so the tool model mirrors the user's
 * message. `queryLanguageName` additionally decorates the line with the
 * language's own name (CLDR) — a strong query-localization bias the
 * image-task prompt deliberately skips.
 */
export function buildExecuteLanguageInstruction(language?: string, options?: { queryLanguageName?: boolean }): string {
  if (!language) return '';
  const langSuffix = options?.queryLanguageName ? localizedQuerySuffix(language) : '';
  const suffix = langSuffix ? ` ("${langSuffix}")` : '';
  const videoSuffix = langSuffix
    ? ` For video queries, append the language name "${langSuffix}" so results match the user's language.`
    : '';
  return `Detected user language: ${language}${suffix}. Use this language in all search queries and pass it to tools that accept a language/locale parameter (e.g. search_lang, hl, gl) when available. EXCEPTION: do NOT pass a language/locale to *ImageSearch tools — images are visual and language-agnostic, so a locale parameter only narrows results; omit it unless the user explicitly asked for images of a specific language.${videoSuffix}`;
}

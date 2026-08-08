/**
 * Article-like context entry. `lang` starts unset and is filled later by
 * language tagging (see sanitize step) — upstream result payloads carry no
 * language flag except the dedicated YouTube search.
 */
export type ExtractedArticle = Record<string, unknown> & { lang?: string };

/**
 * Whether a marker text looks like an all-time/52-week extreme annotation
 * ("ATH @ 236.54", "52W HIGH @ …", "12y LOW @ …", "All-Time High @ …"). The
 * chart generates its own range-based HIGH/LOW markers, so model-emitted
 * extreme annotations are dropped to avoid duplicates.
 */
const EXTREME_ANNOTATION_PATTERN = /\b(ATH|ATL|52W|HIGH|LOW)\b|all[- ]?time/i;

export function isExtremeAnnotation(text: string | undefined | null): boolean {
  if (!text) return false;
  return EXTREME_ANNOTATION_PATTERN.test(text);
}

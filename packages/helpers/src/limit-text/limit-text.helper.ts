const truncationMarker = (shown: number, total: number): string =>
  `\n[TRUNCATED — showing ${shown} of ${total} chars. Do not infer the omitted remainder.]`;

/**
 * Cap LLM-facing text without a silent cut. `maxChars` undefined/<=0 ⇒ text
 * unchanged (default = no loss); fits ⇒ unchanged; exceeds ⇒ hard slice + an
 * explicit marker so the model knows content is incomplete.
 */
export function limitText(text: string, maxChars?: number): string {
  if (!maxChars || maxChars <= 0) return text;
  if (text.length <= maxChars) return text;
  return `${text.slice(0, maxChars)}${truncationMarker(maxChars, text.length)}`;
}

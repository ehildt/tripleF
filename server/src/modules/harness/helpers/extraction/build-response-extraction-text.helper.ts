/**
 * Builds the plain text the memory extractor reads for a completed turn.
 *
 * Structured templates (article, news, product, evaluation, shoplist) stream
 * a JSON document with title/summary/keyFindings/sections — feeding the raw
 * JSON to the extractor once produced junk "facts" from keys and URL
 * fragments ("heroVideoCaption", "com/watch?"). Text templates have plain
 * content already.
 *
 * This helper flattens the parsed response into human sentences only: known
 * prose fields, never metadata keys or media URLs. Unknown shapes fall back
 * to the raw content string (which for text templates IS the answer).
 */
export function buildResponseExtractionText(params: {
  content?: string;
  data?: Record<string, unknown>;
}): string | undefined {
  const { content, data } = params;
  if (!data) return content;

  const parts: string[] = [];
  const push = (value: unknown) => {
    if (typeof value === 'string' && value.trim().length > 0)
      parts.push(value.trim());
  };

  push(data.title);
  push(data.subtitle);
  push(data.summary);
  push(data.headline);
  push(data.lead);

  for (const key of ['keyFindings', 'sections', 'pros', 'cons'] as const) {
    const list = data[key];
    if (!Array.isArray(list)) continue;
    for (const item of list) {
      if (typeof item === 'string') push(item);
      else if (item && typeof item === 'object') {
        const rec = item as Record<string, unknown>;
        push(rec.text ?? rec.title ?? rec.finding ?? rec.point ?? rec.body);
      }
    }
  }

  // Text/evaluation fall back to the raw streamed answer when the JSON shape
  // didn't yield prose (e.g. extraction-less templates).
  return parts.length > 0 ? parts.join('. ') : content;
}

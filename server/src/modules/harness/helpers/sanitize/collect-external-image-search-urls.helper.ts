type ToolResult = { toolName: string; result: unknown };

/**
 * External image URLs in image-search results that were not rewritten to
 * local storage — the client would fetch them from their origin, which
 * the pipeline could not ingest. They are blanked as broken media.
 */
export function collectExternalImageSearchUrls(
  toolResults: ToolResult[],
  keptSourceUrls: string[],
): Set<string> {
  const keptUrls = new Set(keptSourceUrls);
  const droppedUrls = new Set<string>();

  for (const tr of toolResults) {
    if (!tr.toolName.endsWith('ImageSearch')) continue;
    const results = (
      tr.result as { results?: Array<{ imageUrl?: string }> } | undefined
    )?.results;
    if (!Array.isArray(results)) continue;

    for (const r of results) {
      const imageUrl = typeof r?.imageUrl === 'string' ? r.imageUrl.trim() : '';
      if (imageUrl.startsWith('http') && !keptUrls.has(imageUrl)) {
        droppedUrls.add(imageUrl);
      }
    }
  }

  return droppedUrls;
}

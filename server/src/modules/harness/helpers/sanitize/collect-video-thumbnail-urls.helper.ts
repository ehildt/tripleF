type ToolResult = { toolName: string; result: unknown };

/** Thumbnail URLs on video candidates from video/web/news search results. */
export function collectVideoThumbnailUrls(toolResults: ToolResult[]): string[] {
  const urls = new Set<string>();

  for (const tr of toolResults) {
    if (
      !tr.toolName.endsWith('VideoSearch') &&
      tr.toolName !== 'webSearch' &&
      !tr.toolName.endsWith('WebSearch') &&
      !tr.toolName.endsWith('NewsSearch')
    )
      continue;

    const data = tr.result as
      { results?: Array<{ thumbnailUrl?: string }> } | undefined;
    if (!data?.results) continue;

    for (const r of data.results) {
      if (typeof r.thumbnailUrl === 'string' && r.thumbnailUrl.trim()) {
        urls.add(r.thumbnailUrl.trim());
      }
    }
  }

  return Array.from(urls);
}

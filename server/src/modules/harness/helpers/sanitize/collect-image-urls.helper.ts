type ToolResult = { toolName: string; result: unknown };

/** Collect every `imageUrl` across tool results. */
export function collectImageUrls(toolResults: ToolResult[]): string[] {
  const urls = new Set<string>();

  for (const tr of toolResults) {
    const data = tr.result as
      | {
          results?: Array<{
            imageUrl?: string;
          }>;
        }
      | undefined;
    if (!data?.results) continue;

    for (const r of data.results) {
      if (typeof r.imageUrl === 'string' && r.imageUrl.trim()) {
        urls.add(r.imageUrl.trim());
      }
    }
  }

  return Array.from(urls);
}

type ToolResult = { toolName: string; result: unknown };

/** An image URL found in tool results, plus whether it must skip the 720p gate. */
export interface ImageUrlEntry {
  url: string;
  skipDimensionCheck: boolean;
}

/** Collect every `imageUrl` across tool results with its dimension-gate flag. */
export function collectImageUrls(toolResults: ToolResult[]): ImageUrlEntry[] {
  const byUrl = new Map<string, boolean>();

  for (const tr of toolResults) {
    const data = tr.result as
      | {
          results?: Array<{
            imageUrl?: string;
          }>;
        }
      | undefined;
    if (!data?.results) continue;

    // Bright Data returns no pixel dimensions and we trust its Google-side
    // `tbs` size filter, so its image URLs must not be held to 1280×720.
    const skipDimensionCheck =
      tr.toolName.startsWith('brightData') &&
      tr.toolName.endsWith('ImageSearch');

    for (const r of data.results) {
      if (typeof r.imageUrl === 'string' && r.imageUrl.trim()) {
        const url = r.imageUrl.trim();
        byUrl.set(url, (byUrl.get(url) ?? false) || skipDimensionCheck);
      }
    }
  }

  return Array.from(byUrl, ([url, skipDimensionCheck]) => ({
    url,
    skipDimensionCheck,
  }));
}

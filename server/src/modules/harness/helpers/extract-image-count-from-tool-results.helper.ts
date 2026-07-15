export function extractImageCountFromToolResults(
  toolResults: Array<{ toolName: string; result: unknown }>,
): number {
  let count = 0;
  for (const tr of toolResults ?? []) {
    if (!tr.toolName.endsWith('ImageSearch')) continue;
    const data = tr.result as
      { results?: Array<{ imageUrl?: string }> } | undefined;
    count += data?.results?.length ?? 0;
  }
  return count;
}

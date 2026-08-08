export function extractVideoCountFromToolResults(
  toolResults: Array<{ toolName: string; result: unknown }>,
): number {
  let count = 0;
  for (const tr of toolResults ?? []) {
    if (!tr.toolName.endsWith('VideoSearch')) continue;
    const data = tr.result as { results?: Array<unknown> } | undefined;
    count += data?.results?.length ?? 0;
  }
  return count;
}

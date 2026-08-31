/** Normalize a cognition insight into the snapshot shape. */
export function mapInsight(
  insight: { id?: string; text?: unknown; path?: string },
  index: number,
) {
  return {
    id: insight.id ?? `insight-${index}`,
    text: insight.text as string,
    path: insight.path,
  };
}

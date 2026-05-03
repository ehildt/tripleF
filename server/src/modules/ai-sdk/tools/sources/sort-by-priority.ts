export type ResultItem = {
  title: string;
  snippet: string;
  url: string;
  source: string;
};

const SOURCE_PRIORITY: Record<string, number> = {
  serper: 0,
  brave: 1,
};

export function sortByPriority(
  results: ResultItem[],
  priority: Record<string, number> = SOURCE_PRIORITY,
): ResultItem[] {
  return [...results].sort(
    (a, b) => (priority[a.source] ?? 99) - (priority[b.source] ?? 99),
  );
}

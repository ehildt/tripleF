/**
 * Format a raw view count for compact display: 932 → "932", 12_300 → "12.3K",
 * 4_600_000 → "4.6M".
 */
export function formatViewCount(views: number): string {
  if (views >= 1_000_000) {
    return `${(views / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
  }
  if (views >= 1_000) {
    return `${(views / 1_000).toFixed(1).replace(/\.0$/, '')}K`;
  }
  return String(views);
}

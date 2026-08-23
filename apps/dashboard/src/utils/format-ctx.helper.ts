export function formatCtx(n: number): string {
  if (n >= 1073741824)
    return `${(n / 1073741824).toFixed(1).replace(/\.0$/, '')}g`;
  if (n >= 1048576) return `${(n / 1048576).toFixed(1).replace(/\.0$/, '')}m`;
  if (n >= 1024) return `${(n / 1024).toFixed(1).replace(/\.0$/, '')}k`;
  return String(n);
}

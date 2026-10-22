/**
 * Storage key for a streamed chart-data block. `tool:ticker` distinguishes
 * one history call per instrument; `tool:ticker:function` keeps concurrent
 * technical-indicator calls (rsi, macd, …) for the same ticker apart instead
 * of overwriting each other.
 */
export function buildChartDataKey(toolName: string, data: unknown): string {
  if (!data || typeof data !== 'object') return toolName;
  const ticker = (data as { ticker?: unknown }).ticker;
  const fn = (data as { function?: unknown }).function;
  const parts = [toolName];
  if (typeof ticker === 'string') parts.push(ticker);
  if (typeof fn === 'string') parts.push(fn);
  return parts.join(':');
}

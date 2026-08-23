export type ChartDataHandler = (toolName: string, chartData: unknown) => void;

/**
 * Wrap each tool so any `chartData` field in its result is streamed to the
 * client and stripped from what the model sees. EODHD tools return large
 * numeric series (OHLCV, technical indicators) that would pollute the LLM
 * context — the model only needs the compact `summary`, while the client
 * renders the full series from the streamed chartData.
 */
export function wrapToolsWithChartStreaming(
  tools: Record<string, unknown>,
  onChartData?: ChartDataHandler,
): Record<string, unknown> {
  if (!onChartData) return tools;

  const wrapped: Record<string, unknown> = {};
  for (const [name, toolDef] of Object.entries(tools)) {
    const execute = (toolDef as { execute?: (...args: any[]) => unknown })
      ?.execute;
    if (typeof execute !== 'function') {
      wrapped[name] = toolDef;
      continue;
    }
    wrapped[name] = {
      ...(toolDef as object),
      execute: async (...args: any[]) => {
        const result = await execute(...args);
        if (result && typeof result === 'object' && 'chartData' in result) {
          const { chartData, ...rest } = result as Record<string, unknown>;
          onChartData(name, chartData);
          return rest;
        }
        return result;
      },
    };
  }
  return wrapped;
}

/** EODHD tools that need a resolved ticker and feed the quote/chart data. */
const EODHD_DATA_TOOLS = new Set([
  'eodhdQuote',
  'eodhdHistory',
  'eodhdTechnical',
  'eodhdNews',
  'eodhdFundamentals',
  'eodhdIntraday',
]);

/** Whether a tool is an EODHD data tool that requires a ticker input. */
export function isEodhdDataTool(toolName: string): boolean {
  return EODHD_DATA_TOOLS.has(toolName);
}

/**
 * Build a fallback input for an EODHD data tool given a resolved ticker, so
 * the harness can invoke it directly when the model skips it. Returns
 * undefined for tools it does not know how to drive.
 */
export function buildEodhdFallbackInput(
  toolName: string,
  ticker: string,
): unknown | undefined {
  switch (toolName) {
    case 'eodhdQuote':
      return { tickers: [ticker] };
    case 'eodhdHistory':
      return { ticker, period: 'd' };
    case 'eodhdTechnical':
      return { ticker, function: 'rsi' };
    case 'eodhdNews':
      return { ticker, limit: 6 };
    case 'eodhdFundamentals':
      return { ticker };
    case 'eodhdIntraday':
      return { ticker, interval: '1h', days: 30 };
    default:
      return undefined;
  }
}

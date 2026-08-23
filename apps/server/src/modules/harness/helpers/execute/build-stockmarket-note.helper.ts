/**
 * Prompt note reinforcing that stock-market charts render only from the series
 * streamed by eodhdHistory, so the model must call it for every instrument.
 */
export function buildStockmarketNote(template: string | undefined): string {
  if (template !== 'stockmarketitem' && template !== 'stockmarketlist') {
    return '';
  }
  return `\nSTOCK MARKET: the client chart renders ONLY from the series streamed by eodhdHistory (and eodhdIntraday for the volume profile). You MUST call eodhdHistory for every instrument so the chart is not empty — do not skip it because you think the quote or narrative is enough.\nWEB SEARCH: issue SEVERAL *WebSearch queries in parallel, each with a distinct angle (latest company news, earnings/guidance, partners/suppliers/customers, sector outlook) — one generic query is not enough for a market answer.`;
}

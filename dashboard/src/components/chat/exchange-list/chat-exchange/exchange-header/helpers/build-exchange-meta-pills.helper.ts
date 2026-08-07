import type { HarnessResponseData } from '@/types/harness-response-data.model';

export interface ExchangeMetaPill {
  text: string;
  variant?: 'accent';
}

/**
 * Build the assistant exchange's meta-bar pills from the structured response
 * data. The bar lives in the exchange header (after the copy action), so the
 * pills here are the generic metadata fields shared across templates:
 * category (accent), publish date, read time, author, and a news byline line.
 */
export function buildExchangeMetaPills(
  data?: HarnessResponseData,
): ExchangeMetaPill[] {
  if (!data) return [];
  const pills: ExchangeMetaPill[] = [];
  if (data.category) pills.push({ text: data.category, variant: 'accent' });
  if (data.publishDate) pills.push({ text: data.publishDate });
  if (data.readTime) pills.push({ text: data.readTime });
  if (data.author) pills.push({ text: data.author });
  if (data.dateline || data.byline) {
    pills.push({
      text: data.dateline
        ? `${data.dateline} · ${data.byline}`
        : (data.byline as string),
    });
  }
  return pills;
}

import { z } from 'zod';

/**
 * Raw EODHD REST payloads, verified against the live API and the official
 * docs (https://eodhd.com/financial-apis/). The API mixes naming styles per
 * endpoint — PascalCase for search, snake_case for quotes/history — so every
 * response is parsed here and normalized into the camelCase domain types of
 * `eodhd-client.ts`. Parsing is per item and lenient: one malformed row must
 * not drop the whole series.
 */

// --- Search API (PascalCase) ------------------------------------------------

export const eodhdSearchApiResultSchema = z.object({
  Code: z.string(),
  Exchange: z.string().optional(),
  Name: z.string().optional(),
  Type: z.string().optional(),
  Country: z.string().optional(),
  Currency: z.string().optional(),
  ISIN: z.string().nullable().optional(),
  previousClose: z.number().nullable().optional(),
  previousCloseDate: z.string().nullable().optional(),
  isPrimary: z.boolean().optional(),
});

// --- Real-time quote API (snake_case for change_p) --------------------------

export const eodhdQuoteApiResultSchema = z.object({
  code: z.string(),
  timestamp: z.number().optional(),
  gmtoffset: z.number().optional(),
  open: z.number().optional(),
  high: z.number().optional(),
  low: z.number().optional(),
  close: z.number().optional(),
  volume: z.number().optional(),
  previousClose: z.number().optional(),
  change: z.number().optional(),
  change_p: z.number().optional(),
});

// --- End-of-day history API -------------------------------------------------

export const eodhdHistoryApiPointSchema = z.object({
  date: z.string(),
  open: z.number(),
  high: z.number(),
  low: z.number(),
  close: z.number(),
  adjusted_close: z.number().optional(),
  volume: z.number(),
});

// --- Intraday API -----------------------------------------------------------

export const eodhdIntradayApiPointSchema = z.looseObject({
  datetime: z.string(),
  open: z.number(),
  high: z.number(),
  low: z.number(),
  close: z.number(),
  volume: z.number().optional(),
});

// --- Financial news API -----------------------------------------------------

export const eodhdNewsApiArticleSchema = z.object({
  date: z.string().optional(),
  title: z.string().optional(),
  /** Full article body — large; consumers must truncate before prompting. */
  content: z.string().optional(),
  link: z.string(),
  symbols: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  sentiment: z
    .object({
      polarity: z.number().optional(),
      neg: z.number().optional(),
      neu: z.number().optional(),
      pos: z.number().optional(),
    })
    .optional(),
});

// --- Fundamentals API (deeply nested, PascalCase sections) ------------------

export const eodhdFundamentalsApiSchema = z.looseObject({
  General: z.looseObject({}).optional(),
  Highlights: z.looseObject({}).optional(),
  Valuation: z.looseObject({}).optional(),
});

/** Parse a JSON array item-by-item, dropping rows that fail validation. */
export function parseApiArray<S extends z.ZodType>(
  schema: S,
  data: unknown,
): Array<z.infer<S>> {
  if (!Array.isArray(data)) return [];
  const parsed: Array<z.infer<S>> = [];
  for (const item of data) {
    const result = schema.safeParse(item);
    if (result.success) parsed.push(result.data);
  }
  return parsed;
}

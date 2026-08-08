import type { StockmarketFundamentals } from '@/types/harness-response-data.model';

/** A display-ready label/value pair for the fundamentals grid. */
export interface FundamentalEntry {
  key: string;
  label: string;
  value: string;
}

const LABELS: Record<keyof StockmarketFundamentals, string> = {
  name: 'Name',
  sector: 'Sector',
  industry: 'Industry',
  marketCap: 'Market Cap',
  peRatio: 'P/E Ratio',
  revenue: 'Revenue',
  profitMargin: 'Profit Margin',
};

/** Compact large magnitudes: 1_240_000_000 -> "1.24B". */
function compactNumber(value: number): string {
  if (value >= 1e12) return `${(value / 1e12).toFixed(2)}T`;
  if (value >= 1e9) return `${(value / 1e9).toFixed(2)}B`;
  if (value >= 1e6) return `${(value / 1e6).toFixed(2)}M`;
  if (value >= 1e3) return `${(value / 1e3).toFixed(1)}K`;
  return String(value);
}

/** How to format a numeric value per field (strings pass through untouched). */
const FIELD_FORMATTERS: Partial<
  Record<keyof StockmarketFundamentals, (n: number) => string>
> = {
  marketCap: compactNumber,
  revenue: compactNumber,
  peRatio: (n) => n.toFixed(2),
  profitMargin: (n) => `${n}%`,
};

/**
 * Flatten the fundamentals object into an ordered list of display-ready
 * entries. Empty fields are skipped; already-formatted string values (e.g.
 * "$5.6T") pass through as-is, while numeric values are formatted per field.
 */
export function buildFundamentalEntries(
  fundamentals: StockmarketFundamentals | undefined,
): FundamentalEntry[] {
  if (!fundamentals) return [];
  return (Object.keys(LABELS) as Array<keyof StockmarketFundamentals>).flatMap(
    (key) => {
      const raw = fundamentals[key];
      if (raw === undefined || raw === null || raw === '') return [];
      const value =
        typeof raw === 'number'
          ? (FIELD_FORMATTERS[key]?.(raw) ?? String(raw))
          : String(raw);
      return [{ key, label: LABELS[key], value }];
    },
  );
}

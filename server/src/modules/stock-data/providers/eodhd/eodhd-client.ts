import { fetchWithTimeout } from '../../../ai-sdk/tools/sources/fetch-with-timeout.js';
import { SEARCH_TIMEOUT_MS } from '../../../ai-sdk/tools/sources/search-timeout.js';

import {
  eodhdFundamentalsApiSchema,
  eodhdHistoryApiPointSchema,
  eodhdIntradayApiPointSchema,
  eodhdNewsApiArticleSchema,
  eodhdQuoteApiResultSchema,
  eodhdSearchApiResultSchema,
  parseApiArray,
} from './eodhd-api.types.js';

/** Base URL for the EODHD REST API. */
const EODHD_BASE_URL = 'https://eodhd.com/api';

/** Raised when EODHD reports a rate-limit or daily-quota exhaustion. */
export class EodhdRateLimitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'EodhdRateLimitError';
  }
}

/** Raised for any other EODHD failure (auth, not found, upstream 5xx). */
export class EodhdApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = 'EodhdApiError';
  }
}

interface EodhdSearchResult {
  code: string;
  name?: string;
  exchange?: string;
  type?: string;
  country?: string;
  currency?: string;
  isin?: string | null;
  previousClose?: number | null;
  previousCloseDate?: string | null;
  isPrimary?: boolean;
}

interface EodhdQuote {
  code: string;
  timestamp?: number;
  open?: number;
  high?: number;
  low?: number;
  close?: number;
  volume?: number;
  previousClose?: number;
  change?: number;
  changeP?: number;
}

interface EodhdHistoryPoint {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  adjustedClose?: number;
  volume: number;
}

interface EodhdTechnicalPoint {
  date: string;
  value: number;
}

export interface EodhdIntradayPoint {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

interface EodhdNewsArticle {
  title?: string;
  link: string;
  date?: string;
  /** Full article body — large; consumers must truncate before prompting. */
  content?: string;
  symbols?: string[];
  tags?: string[];
}

interface EodhdFundamentals {
  general?: Record<string, unknown>;
  highlights?: Record<string, unknown>;
  valuation?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface EodhdUserInfo {
  name?: string;
  email?: string;
  subscriptionType?: string;
  paymentMethod?: string;
  apiRequests?: number;
  apiRequestsDate?: string;
  dailyRateLimit?: number;
  extraLimit?: number;
  subscriptionMode?: string;
  availableDataFeeds?: string[];
}

/**
 * Minimal typed client for the EODHD REST API. Every response is validated
 * against the zod schemas in `eodhd-api.types.js` and normalized into the
 * camelCase domain shapes above — the raw API mixes PascalCase (search) and
 * snake_case (quotes, history) per endpoint. Uses the same fetch-with-timeout
 * helper as the other search sources and detects rate-limit / daily quota
 * exhaustion so the caller can surface a clear message instead of a silent
 * empty result.
 */
export class EodhdClient {
  constructor(private readonly apiKey: string) {}

  /** Resolve a company/index name to ticker candidates. */
  async search(query: string, limit = 10): Promise<EodhdSearchResult[]> {
    const data = await this.get<unknown>(
      `/search/${encodeURIComponent(query)}`,
      {
        limit: String(limit),
      },
    );
    return parseApiArray(eodhdSearchApiResultSchema, data).map((r) => ({
      code: r.Code,
      name: r.Name,
      exchange: r.Exchange,
      type: r.Type,
      country: r.Country,
      currency: r.Currency,
      isin: r.ISIN,
      previousClose: r.previousClose,
      previousCloseDate: r.previousCloseDate,
      isPrimary: r.isPrimary,
    }));
  }

  /** Live (delayed) quote for one or more tickers. */
  async quote(tickers: string[]): Promise<EodhdQuote[]> {
    const symbols = tickers.map((t) => encodeURIComponent(t)).join(',');
    const data = await this.get<unknown>(`/real-time/${symbols}`);
    const rows = Array.isArray(data) ? data : data ? [data] : [];
    return parseApiArray(eodhdQuoteApiResultSchema, rows).map(
      ({ change_p, ...rest }) => ({ ...rest, changeP: change_p }),
    );
  }

  /** End-of-day OHLCV history for a ticker. */
  async history(
    ticker: string,
    opts: { period?: 'd' | 'w' | 'm'; from?: string; to?: string } = {},
  ): Promise<EodhdHistoryPoint[]> {
    const params: Record<string, string> = { period: opts.period ?? 'd' };
    if (opts.from) params.from = opts.from;
    if (opts.to) params.to = opts.to;
    const data = await this.get<unknown>(
      `/eod/${encodeURIComponent(ticker)}`,
      params,
    );
    return parseApiArray(eodhdHistoryApiPointSchema, data).map(
      ({ adjusted_close, ...rest }) => ({
        ...rest,
        adjustedClose: adjusted_close,
      }),
    );
  }

  /** A technical indicator series (SMA, EMA, RSI, MACD, ADX, …). */
  async technical(
    ticker: string,
    fn: string,
    period = 14,
    opts: { from?: string; to?: string } = {},
  ): Promise<EodhdTechnicalPoint[]> {
    const params: Record<string, string> = {
      function: fn,
      period: String(period),
    };
    if (opts.from) params.from = opts.from;
    if (opts.to) params.to = opts.to;
    const data = await this.get<unknown>(
      `/technical/${encodeURIComponent(ticker)}`,
      params,
    );
    if (!Array.isArray(data)) return [];
    // EODHD returns the value under the function-name key (e.g. `rsi`, `sma`),
    // not a generic `value` field — read that key and normalize to {date, value}.
    return data
      .map((p) => {
        const row = p as Record<string, unknown>;
        const value = Number(row[fn] ?? row[fn.toLowerCase()] ?? NaN);
        return { date: String(row.date), value };
      })
      .filter((p) => !Number.isNaN(p.value));
  }

  /** Intraday OHLCV bars (e.g. 5-minute) for a ticker. */
  async intraday(
    ticker: string,
    opts: { interval?: string; from?: number; to?: number } = {},
  ): Promise<EodhdIntradayPoint[]> {
    const params: Record<string, string> = {
      interval: opts.interval ?? '5m',
    };
    if (opts.from) params.from = String(opts.from);
    if (opts.to) params.to = String(opts.to);
    const data = await this.get<unknown>(
      `/intraday/${encodeURIComponent(ticker)}`,
      params,
    );
    return parseApiArray(eodhdIntradayApiPointSchema, data).map((p) => ({
      time: p.datetime,
      open: p.open,
      high: p.high,
      low: p.low,
      close: p.close,
      volume: p.volume,
    }));
  }

  /** Financial news for a ticker. */
  async news(ticker: string, limit = 10): Promise<EodhdNewsArticle[]> {
    const data = await this.get<unknown>('/news', {
      s: ticker,
      limit: String(limit),
    });
    return parseApiArray(eodhdNewsApiArticleSchema, data).map((a) => ({
      title: a.title,
      link: a.link,
      date: a.date,
      content: a.content,
      symbols: a.symbols,
      tags: a.tags,
    }));
  }

  /** Company fundamentals (general, highlights, valuation). */
  async fundamentals(ticker: string): Promise<EodhdFundamentals> {
    const data = await this.get<unknown>(
      `/fundamentals/${encodeURIComponent(ticker)}`,
    );
    const parsed = eodhdFundamentalsApiSchema.safeParse(data);
    if (!parsed.success) return {};
    const { General, Highlights, Valuation, ...rest } = parsed.data;
    return {
      general: General,
      highlights: Highlights,
      valuation: Valuation,
      ...rest,
    };
  }

  /**
   * Account / subscription info for this key: daily call quota, usage, and
   * the list of data feeds the plan actually includes. Used to discover
   * which EODHD endpoints are reachable without hardcoding plan rules.
   */
  async getUserInfo(): Promise<EodhdUserInfo> {
    const data = await this.get<EodhdUserInfo>('/internal-user');
    return data ?? {};
  }

  /**
   * GET an EODHD endpoint, appending the api_token + fmt=json params and
   * translating rate-limit / quota responses into a typed error.
   */
  private async get<T>(
    path: string,
    params: Record<string, string> = {},
  ): Promise<T> {
    const url = new URL(`${EODHD_BASE_URL}${path}`);
    url.searchParams.set('api_token', this.apiKey);
    url.searchParams.set('fmt', 'json');
    for (const [key, value] of Object.entries(params)) {
      if (value) url.searchParams.set(key, value);
    }

    const res = await fetchWithTimeout(
      url.toString(),
      { method: 'GET' },
      {
        timeoutMs: SEARCH_TIMEOUT_MS,
      },
    );

    if (res.status === 429) {
      throw new EodhdRateLimitError(
        'EODHD rate limit or daily API quota reached. Try again later or raise the plan limit.',
      );
    }

    if (!res.ok) {
      if (res.status === 403) {
        throw new EodhdApiError(
          'EODHD returned HTTP 403 — your API key does not have access to this endpoint. Technical indicators, fundamentals, and several feeds are paid add-ons; check your EODHD plan.',
          res.status,
        );
      }
      throw new EodhdApiError(`EODHD returned HTTP ${res.status}`, res.status);
    }

    const data = (await res.json()) as unknown;
    if (this.isRateLimitBody(data)) {
      throw new EodhdRateLimitError(
        'EODHD daily API quota reached. Try again later or raise the plan limit.',
      );
    }
    return data as T;
  }

  /** EODHD sometimes returns a JSON error body instead of a 429 status. */
  private isRateLimitBody(data: unknown): boolean {
    if (!data || typeof data !== 'object') return false;
    const message = String(
      (data as Record<string, unknown>).message ??
        (data as Record<string, unknown>).error ??
        '',
    ).toLowerCase();
    return (
      message.includes('rate limit') ||
      message.includes('quota') ||
      message.includes('daily limit') ||
      message.includes('too many requests')
    );
  }
}

import type { EodhdEndpointKey } from '../services/eodhd-discovery.service.types.js';

/** The EODHD endpoint keys the app models, in stable display/logging order. */
export const EODHD_ENDPOINT_KEYS: readonly EodhdEndpointKey[] = [
  'search',
  'quote',
  'history',
  'technical',
  'intraday',
  'news',
  'fundamentals',
];

/** Which EODHD data-feed names (from /internal-user) unlock each endpoint. */
export const EODHD_FEED_TO_ENDPOINT: Record<EodhdEndpointKey, string[]> = {
  search: ['Search API'],
  quote: ['Live (delayed) Data API', 'Bulk Live (delayed) Data API'],
  history: ['EOD Historical Data'],
  technical: ['Technical API Data'],
  intraday: ['Intraday Data API'],
  news: ['News API'],
  fundamentals: ['Fundamental Data'],
};

/** A daily limit of 20/day marks EODHD's free plan. */
export const EODHD_FREE_PLAN_DAILY_LIMIT = 20;

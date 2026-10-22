/**
 * The EODHD capability model: the endpoint taxonomy this app reasons about
 * plus the account snapshot discovered from a key. The raw wire source is
 * EODHD's `/internal-user` response (`EodhdUserInfo` from
 * `../../stock-data/providers/eodhd/eodhd-client.js`); these shapes are the
 * app's derived, cached view of it.
 */

/** The six EODHD data APIs the app models — the capability taxonomy keys. */
export type EodhdEndpointKey =
  | 'search'
  | 'quote'
  | 'history'
  | 'technical'
  | 'intraday'
  | 'news'
  | 'fundamentals';

/** Account snapshot discovered from the REST API, cached with a TTL. */
export interface EodhdCapabilities {
  /** Human-readable plan label inferred from the daily quota. */
  plan?: string;
  /** Subscription tier reported by EODHD. */
  subscriptionType?: string;
  /** Billing cadence reported by EODHD (e.g. monthly). */
  subscriptionMode?: string;
  /** Payment channel reported by EODHD. */
  paymentMethod?: string;
  /** Account holder name reported by EODHD. */
  name?: string;
  /** Account holder email reported by EODHD. */
  email?: string;
  /** API calls used on the latest active day (resets at midnight GMT). */
  apiRequests?: number;
  /** Date the `apiRequests` counter belongs to. */
  apiRequestsDate?: string;
  /** Configured daily call limit. */
  dailyRateLimit?: number;
  /** Remaining purchased buffer calls (used only after the daily limit). */
  extraLimit?: number;
  /** Which of the modeled endpoints the plan actually includes. */
  endpoints: Record<EodhdEndpointKey, boolean>;
  /** Feeds reported by EODHD (raw), for reference. */
  availableDataFeeds?: string[];
  /** When the capability check last succeeded. */
  checkedAt?: string;
}

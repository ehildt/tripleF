/**
 * Capabilities discovered from a Serper account key. Wire-mirrors the
 * fields this app reads from Serper's POST `/account` response (partial
 * mirror — only the fields the app consumes).
 */

/** Account snapshot discovered from the REST API, cached with a TTL. */
export interface SerperCapabilities {
  /** Remaining paid/free credits on the account. */
  remainingCredits?: number;
  /** Per-minute request limit. */
  rateLimit?: number;
  /** When the capability check last succeeded. */
  checkedAt?: string;
}

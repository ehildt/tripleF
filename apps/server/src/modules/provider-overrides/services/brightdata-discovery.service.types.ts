/**
 * Capabilities discovered from a BrightData account key. Wire-mirrors the
 * fields this app reads from BrightData's `/status` and `/customer/balance`
 * endpoints (partial mirror — only the fields the app consumes).
 */

/** Account status and billing snapshot discovered from the REST API. */
export interface BrightDataCapabilities {
  /** Account status string reported by /status. */
  status?: string;
  /** Customer name reported by /status. */
  customer?: string;
  /** Whether the key is allowed to make crawl requests. */
  canMakeRequests?: boolean;
  /** Auth failure explanation reported by /status, when access is denied. */
  authFailReason?: string;
  /** Available account balance (money), when the key has billing permission. */
  balance?: number;
  /** Account credit amount reported by /customer/balance. */
  credit?: number;
  /** Prepayment amount reported by /customer/balance. */
  prepayment?: number;
  /** Outstanding pending costs reported by /customer/balance. */
  pendingCosts?: number;
  /** Set when the balance endpoint is not readable (e.g. missing permission). */
  balanceError?: string;
  /** When the capability check last succeeded. */
  checkedAt?: string;
}

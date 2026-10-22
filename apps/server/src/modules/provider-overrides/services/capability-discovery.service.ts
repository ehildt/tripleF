import { Logger } from '@nestjs/common';

/** How long a capability snapshot stays fresh before re-checking. */
const CAPABILITIES_TTL_MS = 6 * 60 * 60 * 1000;

/**
 * Shared TTL-cached, single-flighted capability probe for provider
 * discovery services: `refresh()` guards against redundant or concurrent
 * checks for the same key and never throws; `fetchCapabilities()` — the
 * only per-provider part — fetches and builds the snapshot. Failures keep
 * any stale snapshot so the UI still has something to show.
 */
export abstract class CapabilityDiscoveryService<T> {
  /** Logger context is the concrete subclass name. */
  protected readonly logger = new Logger(this.constructor.name);

  private cached?: T;
  private cachedKey?: string;
  private lastRefreshAt = 0;
  private refreshInFlight?: Promise<void>;

  /** Current cached capabilities, without triggering a call. */
  getCached(): T | undefined {
    return this.cached;
  }

  /**
   * Fire-and-forget capability check for a key. Skips when the cache is
   * still fresh for the same key, when a check is already in flight, or when
   * no key is configured. Never throws to the caller.
   */
  refresh(key?: string): void {
    if (!key) return;
    if (this.refreshInFlight) return;
    if (
      this.cachedKey === key &&
      this.cached &&
      Date.now() - this.lastRefreshAt < CAPABILITIES_TTL_MS
    )
      return;

    this.refreshInFlight = this.fetchCapabilities(key)
      .then((capabilities) => {
        this.cached = capabilities;
        this.cachedKey = key;
        this.lastRefreshAt = Date.now();
      })
      .catch((error) => {
        this.logger.warn(
          `Capability check failed: ${error instanceof Error ? error.message : error}`,
        );
      })
      .finally(() => {
        this.refreshInFlight = undefined;
      });
  }

  /**
   * Fetch and build this provider's capability snapshot for the key —
   * including the success log line. May throw; the failure semantics live
   * in `refresh()`.
   */
  protected abstract fetchCapabilities(key: string): Promise<T>;
}

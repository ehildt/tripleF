import type { MediaValidationResult } from './media-url-validator.service.js';
import type { CacheEntry } from './media-validation-cache.types.js';

const CACHE_MAX_ENTRIES = 1000;
const CACHE_HIT_TTL_MS = 5 * 60_000;
const CACHE_MISS_TTL_MS = 60_000;

/**
 * Short-TTL result cache keyed by URL + dimension options. Dedupes repeated
 * probes within one sanitize pass (image URLs are collected twice) and
 * across follow-up requests in the same conversation. Plain stateful class —
 * no NestJS dependencies.
 */
export class MediaValidationCache {
  private readonly entries = new Map<string, CacheEntry>();

  buildKey(
    url: string,
    options: {
      checkImageDimensions?: boolean;
      minWidth?: number;
      minHeight?: number;
    },
  ): string {
    const dimensions = options.checkImageDimensions
      ? `${options.minWidth ?? 1280}x${options.minHeight ?? 720}`
      : 'no-dimensions';
    return `${dimensions}|${url}`;
  }

  read(key: string): MediaValidationResult | undefined {
    const entry = this.entries.get(key);
    if (!entry) return undefined;
    if (entry.expiresAt <= Date.now()) {
      this.entries.delete(key);
      return undefined;
    }
    return entry.result;
  }

  write(key: string, result: MediaValidationResult): void {
    if (this.entries.size >= CACHE_MAX_ENTRIES) {
      const oldestKey = this.entries.keys().next().value;
      if (oldestKey) this.entries.delete(oldestKey);
    }
    const ttl =
      result.kind === 'broken' || result.kind === 'unknown'
        ? CACHE_MISS_TTL_MS
        : CACHE_HIT_TTL_MS;
    this.entries.set(key, { result, expiresAt: Date.now() + ttl });
  }
}

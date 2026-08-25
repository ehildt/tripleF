import { hasBlockedImageHost } from '@triplef/agent/schemas';

/**
 * Recursively traverse a parsed JSON object and replace any string value that
 * points to a blocked image host with an empty string.
 */
export function sanitizeBlockedImageUrls(value: unknown): unknown {
  if (typeof value === 'string') {
    return hasBlockedImageHost(value) ? '' : value;
  }

  if (Array.isArray(value)) {
    return value.map((item) => sanitizeBlockedImageUrls(item));
  }

  if (value !== null && typeof value === 'object') {
    const sanitized: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value)) {
      sanitized[key] = sanitizeBlockedImageUrls(val);
    }
    return sanitized;
  }

  return value;
}

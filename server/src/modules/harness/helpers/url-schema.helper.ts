import { z } from 'zod';

import { isTrustedUrl } from './is-trusted-url.helper.js';

/**
 * Zod schema for article / source / related story / card URLs.
 *
 * In addition to syntactic URL validation, it rejects non-http(s) schemes,
 * static asset URLs, known bad hosts, and YouTube non-video paths. This is
 * stricter than `z.string().url()` which happily accepts `javascript:`,
 * `data:`, and YouTube JS asset URLs such as `/s/_/ytembeds/_/js/...`.
 */
export function safeUrl(
  message: string | { message: string } = 'must be a safe URL',
) {
  const text = typeof message === 'string' ? message : message.message;
  return z
    .string()
    .url({ message: 'must be a valid URL' })
    .refine((value) => isTrustedUrl(value, { allowPrivate: false }), {
      message: text,
    });
}

/**
 * Same-origin storage path pattern: `/api/v1/storage/<session>/<chat>/<hash>`.
 * The pipeline rewrites ingested response images to these relative URLs; the
 * dashboard proxies them to the server, so they never carry a scheme.
 */
const LOCAL_STORAGE_URL_PATTERN =
  /^\/api\/v1\/storage\/[A-Za-z0-9_-]+\/[A-Za-z0-9_-]+\/[A-Za-z0-9]+$/;

/**
 * Parseable absolute http(s) URL — matches the leniency `z.string().url()`
 * used to give these fields, minus non-http schemes. Trust membership is
 * enforced separately (source policy + enforceAvailableMediaUrls).
 */
function isAbsoluteHttpUrl(value: string): boolean {
  try {
    const protocol = new URL(value).protocol;
    return protocol === 'http:' || protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Zod schema for model-emitted VIDEO URLs: an absolute http(s) URL only.
 * Video URLs are always external — the pipeline never rewrites them to
 * storage paths — and plain `z.url()` would happily accept `javascript:`,
 * `data:`, or `file:` schemes, which then land in dashboard links and
 * iframe/video sources.
 */
export function safeVideoUrl(
  message: string | { message: string } = 'must be a safe video URL',
) {
  const text = typeof message === 'string' ? message : message.message;
  return z.string().refine(isAbsoluteHttpUrl, { message: text });
}

/**
 * Zod schema that accepts an empty string OR a safe video URL.
 */
export function safeVideoUrlOrEmpty(
  message: string | { message: string } = 'must be a safe video URL',
) {
  return safeVideoUrl(message).optional().or(z.literal(''));
}

/**
 * Zod schema for model-emitted IMAGE URLs: an absolute http(s) URL or a
 * same-origin storage path produced by the pipeline's image ingestion
 * (relative, proxied by the dashboard). Plain `z.string().url()` would
 * reject the relative storage paths and burn all JSON retries on valid output.
 */
export function safeMediaUrl(
  message: string | { message: string } = 'must be a safe media URL',
) {
  const text = typeof message === 'string' ? message : message.message;
  return z
    .string()
    .refine(
      (value) =>
        LOCAL_STORAGE_URL_PATTERN.test(value) || isAbsoluteHttpUrl(value),
      { message: text },
    );
}

/**
 * Zod schema that accepts an empty string OR a safe media URL.
 */
export function safeMediaUrlOrEmpty(
  message: string | { message: string } = 'must be a safe media URL',
) {
  return safeMediaUrl(message).optional().or(z.literal(''));
}

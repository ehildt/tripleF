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
 * Zod schema that accepts an empty string OR a safe URL.
 */
export function safeUrlOrEmpty(
  message: string | { message: string } = 'must be a safe URL',
) {
  return safeUrl(message).optional().or(z.literal(''));
}

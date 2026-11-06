import { z } from 'zod';

import { isAbsoluteHttpUrl } from './is-absolute-http-url.helper.js';

/**
 * Same-origin object-storage path pattern:
 * `/api/v1/object-storage/<session>/<chat>/<hash>`.
 * The pipeline rewrites ingested response images to these relative URLs; the
 * dashboard proxies them to the server, so they never carry a scheme.
 */
const OBJECT_STORAGE_URL_PATTERN = /^\/api\/v1\/object-storage\/[A-Za-z0-9_-]+\/[A-Za-z0-9_-]+\/[A-Za-z0-9]+$/;

/**
 * Zod schema for model-emitted IMAGE URLs: an absolute http(s) URL or a
 * same-origin object-storage path produced by the pipeline's image ingestion
 * (relative, proxied by the dashboard). Plain `z.string().url()` would
 * reject the relative object-storage paths and burn all JSON retries on valid output.
 */
export function safeMediaUrl(message: string | { message: string } = 'must be a safe media URL') {
  const text = typeof message === 'string' ? message : message.message;
  return z
    .string()
    .refine((value) => OBJECT_STORAGE_URL_PATTERN.test(value) || isAbsoluteHttpUrl(value), { message: text });
}

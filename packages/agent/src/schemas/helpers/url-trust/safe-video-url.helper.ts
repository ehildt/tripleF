import { z } from 'zod';

import { isAbsoluteHttpUrl } from './is-absolute-http-url.helper.js';

/**
 * Zod schema for model-emitted VIDEO URLs: an absolute http(s) URL only.
 * Video URLs are always external — the pipeline never rewrites them to
 * storage paths — and plain `z.url()` would happily accept `javascript:`,
 * `data:`, or `file:` schemes, which then land in dashboard links and
 * iframe/video sources.
 */
export function safeVideoUrl(message: string | { message: string } = 'must be a safe video URL') {
  const text = typeof message === 'string' ? message : message.message;
  return z.string().refine(isAbsoluteHttpUrl, { message: text });
}

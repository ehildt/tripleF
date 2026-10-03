import { z } from 'zod';

import { safeMediaUrl } from './safe-media-url.helper.js';

/**
 * Zod schema that accepts an empty string OR a safe media URL.
 */
export function safeMediaUrlOrEmpty(message: string | { message: string } = 'must be a safe media URL') {
  return safeMediaUrl(message).optional().or(z.literal(''));
}

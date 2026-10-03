import { z } from 'zod';

import { safeVideoUrl } from './safe-video-url.helper.js';

/**
 * Zod schema that accepts an empty string OR a safe video URL.
 */
export function safeVideoUrlOrEmpty(message: string | { message: string } = 'must be a safe video URL') {
  return safeVideoUrl(message).optional().or(z.literal(''));
}

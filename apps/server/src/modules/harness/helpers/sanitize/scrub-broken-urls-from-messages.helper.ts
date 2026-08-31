import type { InputMessage } from '@triplef/ai-sdk';

import { mapUrlToReplacement } from './helpers/map-url-to-replacement.helper.js';
import { scrubMessage } from './helpers/scrub-message.helper.js';

/** Blank broken image URLs out of string message contents. */
export function scrubBrokenUrlsFromMessages(
  messages: InputMessage[],
  brokenImageUrls: Set<string>,
): InputMessage[] {
  if (brokenImageUrls.size === 0) return messages;

  const replacements = Array.from(brokenImageUrls).map(mapUrlToReplacement);

  return messages.map((message) => scrubMessage(message, replacements));
}

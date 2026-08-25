import type { InputMessage } from '@triplef/ai-sdk';

import { videoUrlKeys } from '../url-trust/video-url-keys.helper.js';

const SECTION_MARKER = 'Previously shown videos';
const URL_PATTERN = /\((https?:\/\/[^)\s]+)\)/g;

/**
 * Collect the dedupe keys of every video URL that earlier assistant
 * responses already showed to the user. The client appends a "Previously
 * shown videos" section to structured responses; URLs after that marker are
 * all video URLs (the sources section precedes it).
 */
export function collectHistoryVideoUrls(messages: InputMessage[]): Set<string> {
  const keys = new Set<string>();

  for (const message of messages) {
    if (message.role !== 'assistant') continue;

    const markerIndex = message.content.indexOf(SECTION_MARKER);
    if (markerIndex === -1) continue;

    for (const match of message.content
      .slice(markerIndex)
      .matchAll(URL_PATTERN)) {
      for (const key of videoUrlKeys(match[1])) keys.add(key);
    }
  }

  return keys;
}

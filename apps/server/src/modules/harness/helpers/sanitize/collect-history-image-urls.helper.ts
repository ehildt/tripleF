import type { InputMessage } from '@triplef/ai-sdk';

const SECTION_MARKER = 'Previously shown images';
const URL_PATTERN = /\((\/api\/v1\/storage\/[^)\s]+)\)/g;

/**
 * Collect the storage URLs of every image that earlier imagelist responses
 * already showed to the user. Legacy fallback for conversations that predate
 * the persisted shown-media registry: the client appends a "Previously shown
 * images" section to imagelist responses, and URLs after that marker are all
 * storage URLs.
 */
export function collectHistoryImageUrls(messages: InputMessage[]): Set<string> {
  const urls = new Set<string>();

  for (const message of messages) {
    if (message.role !== 'assistant') continue;

    const markerIndex = message.content.indexOf(SECTION_MARKER);
    if (markerIndex === -1) continue;

    for (const match of message.content
      .slice(markerIndex)
      .matchAll(URL_PATTERN)) {
      urls.add(match[1]);
    }
  }

  return urls;
}

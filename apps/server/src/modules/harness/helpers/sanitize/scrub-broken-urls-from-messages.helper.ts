import type { InputMessage } from '../../../ai-sdk/types/ai-sdk-messages.types.js';

/** Blank broken image URLs out of string message contents. */
export function scrubBrokenUrlsFromMessages(
  messages: InputMessage[],
  brokenImageUrls: Set<string>,
): InputMessage[] {
  if (brokenImageUrls.size === 0) return messages;

  const replacements = Array.from(brokenImageUrls).map((url) => ({
    url,
    escaped: url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
  }));

  return messages.map((message) => {
    if (typeof message.content !== 'string') return message;
    let content = message.content;
    for (const { escaped } of replacements) {
      content = content.replace(new RegExp(escaped, 'g'), ' ');
    }
    return { ...message, content };
  });
}

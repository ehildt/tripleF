import type { InputMessage } from '@triplef/ai-sdk';

/** Blank every broken URL out of a single message's string content. */
export function scrubMessage(
  message: InputMessage,
  replacements: Array<{ escaped: string }>,
): InputMessage {
  if (typeof message.content !== 'string') return message;
  let content = message.content;
  for (const { escaped } of replacements) {
    content = content.replace(new RegExp(escaped, 'g'), ' ');
  }
  return { ...message, content };
}

import type { InputMessage } from '@triplef/ai-sdk';

export function stripImagesFromMessages(
  messages: InputMessage[],
): InputMessage[] {
  return messages.map((message) =>
    message.images?.length ? { ...message, images: undefined } : message,
  );
}

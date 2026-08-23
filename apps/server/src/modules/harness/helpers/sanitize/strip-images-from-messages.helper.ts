import type { InputMessage } from '../../../ai-sdk/types/ai-sdk-messages.types.js';

export function stripImagesFromMessages(
  messages: InputMessage[],
): InputMessage[] {
  return messages.map((message) =>
    message.images?.length ? { ...message, images: undefined } : message,
  );
}

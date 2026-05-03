import type {
  AiSdkContentPart,
  AiSdkMessage,
  AiSdkMessageRole,
  InputMessage,
} from './ai-sdk-message.models.js';
import { toFilePart } from './to-file-part.helper.js';

export function toAiSdkMessage(message: InputMessage): AiSdkMessage {
  if (!message.images || message.images.length === 0) {
    return { role: message.role as AiSdkMessageRole, content: message.content };
  }

  const content: AiSdkContentPart[] = [];
  if (message.content) {
    content.push({ type: 'text', text: message.content });
  }

  for (const image of message.images) {
    const part = toFilePart(image);
    content.push(part);
  }

  return { role: message.role as AiSdkMessageRole, content };
}

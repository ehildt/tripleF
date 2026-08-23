import type {
  AiSdkMessages,
  InputMessage,
} from '../types/ai-sdk-messages.types.js';

import { toAiSdkMessage } from './to-ai-sdk-message.helper.js';

function isSystemMessage(message: InputMessage): boolean {
  return message.role === 'system';
}

function extractSystemPrompt(messages: InputMessage[]): string | undefined {
  const systemContents = messages
    .filter(isSystemMessage)
    .map((message) => message.content);

  if (systemContents.length === 0) return undefined;

  return systemContents.join('\n\n');
}

export function toAiSdkMessages(messages: InputMessage[]): AiSdkMessages {
  const system = extractSystemPrompt(messages);

  const convertedMessages = messages
    .filter((message) => !isSystemMessage(message))
    .map(toAiSdkMessage);

  return { system, messages: convertedMessages };
}

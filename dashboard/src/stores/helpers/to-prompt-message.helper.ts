import type { HarnessResponseData } from '@/types/harness-response-data.model';

import { harnessDataToPromptText } from './harness-data-to-prompt-text.helper';

interface PromptExchange {
  role: string;
  content: string;
  text?: string;
  harnessData?: HarnessResponseData;
}

export interface PromptMessage {
  role: string;
  content: string;
}

/**
 * Convert an exchange into a text-only prompt message for the LLM.
 *
 * For assistant exchanges with structured responses, the rich data in
 * `harnessData` (or the plain `text` field) is used instead of the fallback
 * `content`, so follow-up requests can reference actual prior answers.
 */
export function toPromptMessage(exchange: PromptExchange): PromptMessage {
  let content = exchange.content;

  if (exchange.role === 'assistant') {
    if (exchange.text?.trim()) {
      content = exchange.text.trim();
    } else if (exchange.harnessData) {
      const fromData = harnessDataToPromptText(exchange.harnessData);
      if (fromData.trim()) content = fromData;
    }
  }

  return {
    role: exchange.role,
    content: typeof content === 'string' ? content : '',
  };
}

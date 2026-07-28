import { harnessResponseToText } from '@/components/chat/exchange-list/chat-exchange/exchange-content/assistant-response/composables/helpers/harness-response-to-text.helper';
import type { HarnessResponseData } from '@/types/harness-response-data.model';

interface PromptExchange {
  role: string;
  content: string;
  text?: string;
  harnessTemplate?: string;
  harnessData?: HarnessResponseData;
  images?: Array<{ name: string; hash: string }>;
}

export interface PromptMessage {
  role: string;
  content: string;
}

/**
 * Exchanges persisted before structured data was tracked may carry the raw
 * response JSON as their content. Parse it back into an object so it can be
 * flattened; returns undefined for non-JSON content and unreadable JSON.
 */
function parseJsonContent(content: string): HarnessResponseData | undefined {
  const trimmed = content.trim();
  if (!trimmed.startsWith('{')) return undefined;
  try {
    const parsed: unknown = JSON.parse(trimmed);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed as HarnessResponseData;
    }
  } catch {
    /* fall through */
  }
  return undefined;
}

/**
 * Convert an exchange into a text-only prompt message for the LLM.
 *
 * For assistant exchanges with structured responses, the template-specific
 * transform (or the plain `text` field) is used instead of the fallback
 * `content`, so follow-up requests can reference actual prior answers.
 * Assistant content that looks like corrupted response JSON is dropped
 * rather than leaked into the history.
 */
export function toPromptMessage(exchange: PromptExchange): PromptMessage {
  let content = exchange.content;

  if (exchange.role === 'assistant') {
    if (exchange.text?.trim()) {
      content = exchange.text.trim();
    } else if (exchange.harnessData) {
      const fromData = harnessResponseToText(
        exchange.harnessTemplate,
        exchange.harnessData,
      );
      if (fromData.trim()) content = fromData;
    } else if (typeof content === 'string') {
      const parsed = parseJsonContent(content);
      if (parsed) {
        content = harnessResponseToText(exchange.harnessTemplate, parsed);
      } else if (content.trim().startsWith('{')) {
        content = '';
      }
    }
  }

  // Note image attachments on user turns so follow-ups can reference them.
  if (exchange.role === 'user' && exchange.images?.length) {
    const names = exchange.images
      .map((image) => image.name)
      .filter(Boolean)
      .join(', ');
    if (names) content = `${content}\n\n[Attached images: ${names}]`;
  }

  return {
    role: exchange.role,
    content: typeof content === 'string' ? content : '',
  };
}

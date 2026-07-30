import { harnessResponseToText } from '@/components/chat/exchange-list/chat-exchange/exchange-content/assistant-response/composables/helpers/harness-response-to-text.helper';
import type { HarnessResponseData } from '@/types/harness-response-data.model';

import { withTemplateMarker } from './with-template-marker.helper';

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
 * Resolve an assistant exchange's textual content: prefer the plain text
 * field, fall back to the structured harness data flattened to text, and
 * parse legacy raw-JSON content. Content that looks like corrupted response
 * JSON is dropped rather than leaked into the history.
 */
function resolveAssistantContent(exchange: PromptExchange): unknown {
  if (exchange.text?.trim()) return exchange.text.trim();

  if (exchange.harnessData) {
    const fromData = harnessResponseToText(
      exchange.harnessTemplate,
      exchange.harnessData,
    );
    if (fromData.trim()) return fromData;
    return exchange.content;
  }

  if (typeof exchange.content !== 'string') return exchange.content;

  const parsed = parseJsonContent(exchange.content);
  if (parsed) return harnessResponseToText(exchange.harnessTemplate, parsed);
  return exchange.content.trim().startsWith('{') ? '' : exchange.content;
}

/** Note image attachments on user turns so follow-ups can reference them. */
function appendImageNames(content: string, exchange: PromptExchange): string {
  const names = exchange.images
    ?.map((image) => image.name)
    .filter(Boolean)
    .join(', ');
  return names ? `${content}\n\n[Attached images: ${names}]` : content;
}

export interface ToPromptMessageOptions {
  /**
   * Prefix structured assistant answers with their `[Template: <name>]`
   * marker so the intent classifier can resolve follow-ups against the
   * template that produced them (default true). The free-form `text`
   * template is never marked — it is the default routing anyway.
   */
  includeTemplateMarker?: boolean;
}

/**
 * Convert an exchange into a text-only prompt message for the LLM.
 *
 * For assistant exchanges with structured responses, the template-specific
 * transform (or the plain `text` field) is used instead of the fallback
 * `content`, so follow-up requests can reference actual prior answers.
 * Structured assistant answers are prefixed with a `[Template: <name>]`
 * marker so the intent classifier can resolve follow-ups against the
 * template that produced them (e.g. compact shopping lists for repeated
 * product questions). Assistant content that looks like corrupted response
 * JSON is dropped rather than leaked into the history.
 */
export function toPromptMessage(
  exchange: PromptExchange,
  options: ToPromptMessageOptions = {},
): PromptMessage {
  let content: unknown =
    exchange.role === 'assistant'
      ? resolveAssistantContent(exchange)
      : exchange.content;

  if (exchange.role === 'user' && exchange.images?.length) {
    content = appendImageNames(`${content ?? ''}`, exchange);
  }

  let text = typeof content === 'string' ? content : '';
  if (
    options.includeTemplateMarker !== false &&
    exchange.role === 'assistant'
  ) {
    text = withTemplateMarker(text, exchange.harnessTemplate);
  }

  return { role: exchange.role, content: text };
}

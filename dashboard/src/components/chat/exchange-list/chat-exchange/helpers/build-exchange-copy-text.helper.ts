import type { Exchange } from '@/stores/conversation';
import { toPromptMessage } from '@/stores/helpers/to-prompt-message.helper';

/**
 * The clipboard text of an exchange. User messages copy verbatim. Assistant
 * responses carry structured data (article, news, product, videolist, …)
 * whose visible `content` is only a fallback — reuse the model-history
 * formatting so the copy contains the full response: sections, findings,
 * sources, offers, and media references.
 */
export function buildExchangeCopyText(exchange: Exchange): string {
  if (exchange.role !== 'assistant') return exchange.content;
  return toPromptMessage(exchange).content;
}

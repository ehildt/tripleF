import type { Exchange } from '@/stores/conversation/conversation.model';
import { toPromptMessage } from '@/stores/conversation/helpers/to-prompt-message.helper';

/**
 * One embedded exchange's material. Assistant answers carry their FULL
 * structured JSON (the exact snippet fields the client rendered — subjects,
 * comparison, videoGalleryItems, galleryItems, cards, keyFindings,
 * sectionContent, sources) so the model can merge every field; the to-text
 * history flatteners deliberately drop media and detail, which is exactly
 * the information a merge must consolidate. User requests stay plain text.
 */
export function toMergeMaterial(exchange: Exchange): string {
  if (exchange.role === 'assistant' && exchange.responseData) {
    return JSON.stringify({
      template: exchange.responseTemplate ?? null,
      data: exchange.responseData,
    });
  }
  const message = toPromptMessage(exchange);
  return message.content && message.content.trim().length > 0
    ? message.content
    : '(no content)';
}

import type { InputMessage } from '@triplef/ai-sdk';

import type { DocumentSection } from './documents/document-section.types.js';

/**
 * Build the model-facing message carrying extracted document text, one
 * labeled section per file (mirrors the client's historical
 * buildAttachedDocumentsMessage format), then splice it in directly before
 * the last user message so the model reads the file content as context for
 * the current turn. Returns the messages untouched when there is nothing to
 * attach, appending after the last user message when none exists.
 */
export function injectDocumentsMessage(
  messages: InputMessage[],
  documentSections: DocumentSection[],
): InputMessage[] {
  if (documentSections.length === 0) return messages;

  const documentsMessage = `The user attached the following files:\n\n${documentSections
    .map((section) => `=== ${section.name} ===\n${section.text}`)
    .join('\n\n')}`;

  const documentMessage: InputMessage = {
    role: 'user' as const,
    content: documentsMessage,
  };

  const lastUserIndex = messages.findLastIndex((m) => m.role === 'user');
  const result = [...messages];
  if (lastUserIndex >= 0) {
    result.splice(lastUserIndex, 0, documentMessage);
  } else {
    result.push(documentMessage);
  }
  return result;
}

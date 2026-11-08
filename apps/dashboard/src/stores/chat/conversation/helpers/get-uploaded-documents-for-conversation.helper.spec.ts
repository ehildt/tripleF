import { describe, expect, it } from 'vitest';

import { createConversation } from './create-conversation.helper';
import { getUploadedDocumentsForConversation } from './get-uploaded-documents-for-conversation.helper';

describe('getUploadedDocumentsForConversation', () => {
  it('selects only the requested context and preserves legacy document fallback', () => {
    const conversation = createConversation('Chat', {
      conversationId: 'current',
    });
    conversation.uploadedDocuments = [
      {
        name: 'legacy.txt',
        hash: 'legacy',
        type: 'text/plain',
        uploadedAt: 1,
      },
      {
        name: 'other.txt',
        hash: 'other',
        type: 'text/plain',
        uploadedAt: 1,
        conversationId: 'other',
      },
    ];

    expect(getUploadedDocumentsForConversation(conversation)).toHaveLength(1);
    expect(
      getUploadedDocumentsForConversation(conversation, 'other').map(
        (document) => document.hash,
      ),
    ).toEqual(['legacy', 'other']);
    expect(getUploadedDocumentsForConversation(undefined)).toEqual([]);
  });
});

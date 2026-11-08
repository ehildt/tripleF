import { describe, expect, it } from 'vitest';

import { createConversation } from './create-conversation.helper';
import { getUploadedImagesForConversation } from './get-uploaded-images-for-conversation.helper';

describe('getUploadedImagesForConversation', () => {
  it('selects only the requested context and preserves legacy image fallback', () => {
    const conversation = createConversation('Chat', {
      conversationId: 'current',
    });
    conversation.uploadedImages = [
      { name: 'legacy', hash: 'legacy', uploadedAt: 1 },
      { name: 'other', hash: 'other', uploadedAt: 1, conversationId: 'other' },
    ];

    expect(getUploadedImagesForConversation(conversation)).toHaveLength(1);
    expect(
      getUploadedImagesForConversation(conversation, 'other').map(
        (image) => image.hash,
      ),
    ).toEqual(['legacy', 'other']);
    expect(getUploadedImagesForConversation(undefined)).toEqual([]);
  });
});

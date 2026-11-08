import { describe, expect, it } from 'vitest';

import { createConversation } from './create-conversation.helper';
import { hasUploadedImageReference } from './has-uploaded-image-reference.helper';

describe('hasUploadedImageReference', () => {
  it('finds matching hashes and honors the excluded conversation context', () => {
    const conversation = createConversation('Chat');
    conversation.uploadedImages = [
      {
        name: 'image',
        hash: 'shared',
        uploadedAt: 1,
        conversationId: 'current',
      },
    ];

    expect(hasUploadedImageReference(conversation, 'shared')).toBe(true);
    expect(hasUploadedImageReference(conversation, 'shared', 'current')).toBe(
      false,
    );
    expect(hasUploadedImageReference(undefined, 'shared')).toBe(false);
  });
});

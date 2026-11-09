import { describe, expect, it } from 'vitest';

import type { Exchange, UploadedImage } from '../conversation.model';
import { createConversation } from './create-conversation.helper';
import { partitionConversationContext } from './partition-conversation-context.helper';

function exchange(id: string, conversationId?: string): Exchange {
  return {
    id,
    role: 'user',
    content: id,
    status: 'done',
    timestamp: 1,
    conversationId,
  };
}

function image(hash: string, conversationId: string): UploadedImage {
  return {
    name: hash,
    hash,
    uploadedAt: 1,
    conversationId,
  };
}

describe('partitionConversationContext', () => {
  it('partitions retained and removed data without mutating the record', () => {
    const conversation = createConversation('Chat', {
      conversationId: 'current',
    });
    conversation.exchanges = [
      exchange('current-explicit', 'current'),
      exchange('current-legacy'),
      exchange('other', 'other'),
    ];
    conversation.uploadedImages = [
      image('current-image', 'current'),
      image('other-image', 'other'),
    ];
    const originalExchanges = conversation.exchanges;
    const originalImages = conversation.uploadedImages;

    const result = partitionConversationContext(conversation, 'current');

    expect(result.exchanges.map((entry) => entry.id)).toEqual(['other']);
    expect(result.uploadedImages.map((entry) => entry.hash)).toEqual([
      'other-image',
    ]);
    expect(result.removedImages.map((entry) => entry.hash)).toEqual([
      'current-image',
    ]);
    expect(conversation.exchanges).toBe(originalExchanges);
    expect(conversation.exchanges).toHaveLength(3);
    expect(conversation.uploadedImages).toBe(originalImages);
    expect(conversation.uploadedImages).toHaveLength(2);
  });

  it('returns empty retained collections when only the selected context exists', () => {
    const conversation = createConversation('Chat', {
      conversationId: 'current',
    });
    conversation.exchanges = [exchange('current', 'current')];
    conversation.uploadedImages = [image('current', 'current')];

    const result = partitionConversationContext(conversation, 'current');

    expect(result.exchanges).toEqual([]);
    expect(result.uploadedImages).toEqual([]);
    expect(result.removedImages).toHaveLength(1);
  });

  it('retains everything when the selected context is absent', () => {
    const conversation = createConversation('Chat', {
      conversationId: 'current',
    });
    conversation.exchanges = [exchange('other', 'other')];
    conversation.uploadedImages = [image('other', 'other')];

    const result = partitionConversationContext(conversation, 'missing');

    expect(result.exchanges.map((entry) => entry.id)).toEqual(['other']);
    expect(result.uploadedImages.map((entry) => entry.hash)).toEqual(['other']);
    expect(result.removedImages).toEqual([]);
  });
});

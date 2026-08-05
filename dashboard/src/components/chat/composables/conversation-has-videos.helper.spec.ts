import { describe, expect, it } from 'vitest';

import type { Conversation } from '@/stores/conversation';

import { conversationHasVideos } from './conversation-has-videos.helper';

function makeConversation(exchanges: Conversation['exchanges']): Conversation {
  return {
    id: 'c1',
    title: 'Test',
    exchanges,
    files: [],
    savedFileInfos: [],
    uploadedImages: [],
    imageSelectionSnapshot: {},
    conversationId: 'conv-1',
    model: 'model',
    numCtx: '4096',
    think: 'medium',
    event: 'event',
    roomId: 'room',
    stream: true,
    subscriptions: [],
    type: 'temporary',
    createdAt: 0,
    updatedAt: 0,
  };
}

describe('conversationHasVideos', () => {
  it('returns false for a null conversation', () => {
    expect(conversationHasVideos(null)).toBe(false);
  });

  it('returns false for a conversation without video data', () => {
    const conversation = makeConversation([
      {
        id: 'e1',
        role: 'assistant',
        content: 'text',
        status: 'done',
        timestamp: 0,
      },
    ]);
    expect(conversationHasVideos(conversation)).toBe(false);
  });

  it('returns true when a response has videoGalleryItems', () => {
    const conversation = makeConversation([
      {
        id: 'e1',
        role: 'assistant',
        content: 'text',
        status: 'done',
        timestamp: 0,
        harnessData: {
          videoGalleryItems: [{ videoUrl: 'https://youtu.be/abc' }],
        },
      },
    ]);
    expect(conversationHasVideos(conversation)).toBe(true);
  });

  it('returns true when a response has a heroVideoUrl', () => {
    const conversation = makeConversation([
      {
        id: 'e1',
        role: 'assistant',
        content: 'text',
        status: 'done',
        timestamp: 0,
        harnessData: { heroVideoUrl: 'https://youtu.be/abc' },
      },
    ]);
    expect(conversationHasVideos(conversation)).toBe(true);
  });

  it('returns false for an empty videoGalleryItems array', () => {
    const conversation = makeConversation([
      {
        id: 'e1',
        role: 'assistant',
        content: 'text',
        status: 'done',
        timestamp: 0,
        harnessData: { videoGalleryItems: [] },
      },
    ]);
    expect(conversationHasVideos(conversation)).toBe(false);
  });
});

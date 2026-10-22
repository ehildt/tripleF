import { describe, expect, it } from 'vitest';

import type { Conversation } from '@/stores/conversation/conversation.model';

import { conversationHasVideos } from './conversation-has-videos.helper';

function conversation(
  responseData: Conversation['exchanges'][number]['responseData'],
): Conversation {
  return {
    exchanges: [{ responseData }],
  } as unknown as Conversation;
}

describe('conversationHasVideos', () => {
  it('returns false for a null conversation', () => {
    expect(conversationHasVideos(null)).toBe(false);
  });

  it('returns false when no exchange carries video media', () => {
    expect(conversationHasVideos(conversation({}))).toBe(false);
  });

  it('returns true for a populated video gallery', () => {
    expect(
      conversationHasVideos(
        conversation({
          videoGalleryItems: [{ videoUrl: 'https://youtu.be/x' }],
        }),
      ),
    ).toBe(true);
  });

  it('returns true for a hero video', () => {
    expect(
      conversationHasVideos(
        conversation({ heroVideoUrl: 'https://youtu.be/x' }),
      ),
    ).toBe(true);
  });

  it('returns false for an empty video gallery', () => {
    expect(conversationHasVideos(conversation({ videoGalleryItems: [] }))).toBe(
      false,
    );
  });
});

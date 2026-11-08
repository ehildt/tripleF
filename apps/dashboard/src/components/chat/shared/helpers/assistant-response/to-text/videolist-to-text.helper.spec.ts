import { describe, expect, it } from 'vitest';

import type { AssistantResponseData } from '@/types/assistant-response-data.model';

import { videolistToText } from './videolist-to-text.helper';

describe('videolistToText', () => {
  it('emits the skip marker and parenthesized URLs', () => {
    const data: AssistantResponseData = {
      videoGalleryItems: [{ videoUrl: 'https://youtu.be/x', title: 'Vid' }],
    };
    const text = videolistToText(data);
    expect(text).toContain('Previously shown videos (skip these videoUrls):');
    expect(text).toContain('- Vid (https://youtu.be/x)');
  });

  it('falls back to "video" when no title is present', () => {
    const data: AssistantResponseData = {
      videoGalleryItems: [{ videoUrl: 'https://youtu.be/x' }],
    };
    expect(videolistToText(data)).toContain('- video (https://youtu.be/x)');
  });

  it('omits the marker when there is no video gallery', () => {
    expect(videolistToText({})).toBe('');
  });
});

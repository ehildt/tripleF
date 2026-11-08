import { describe, expect, it } from 'vitest';

import type { AssistantResponseData } from '@/types/assistant-response-data.model';

import { imagelistToText } from './imagelist-to-text.helper';

describe('imagelistToText', () => {
  it('emits the previously-shown marker and parenthesized URLs', () => {
    const data: AssistantResponseData = {
      galleryItems: [{ imageUrl: '/storage/a.jpg', title: 'Pic' }],
    };
    expect(imagelistToText(data)).toContain('Previously shown images:');
    expect(imagelistToText(data)).toContain('- Pic (/storage/a.jpg)');
  });

  it('falls back to "image" when no label is present', () => {
    const data: AssistantResponseData = {
      galleryItems: [{ imageUrl: '/storage/a.jpg' }],
    };
    expect(imagelistToText(data)).toContain('- image (/storage/a.jpg)');
  });

  it('omits the marker when there is no gallery', () => {
    expect(imagelistToText({})).toBe('');
  });
});

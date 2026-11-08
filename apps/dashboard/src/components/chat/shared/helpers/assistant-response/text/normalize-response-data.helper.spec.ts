import { describe, expect, it } from 'vitest';

import type { AssistantStreamEvent } from '@/types/assistant-stream-event.model';

import { normalizeResponseData } from './normalize-response-data.helper';

function event(
  overrides: Partial<AssistantStreamEvent> = {},
): AssistantStreamEvent {
  return { ...overrides };
}

describe('normalizeResponseData', () => {
  it('returns null for non-record input', () => {
    expect(normalizeResponseData('x', event())).toBeNull();
    expect(normalizeResponseData([1], event())).toBeNull();
  });

  it('returns null when the data has no renderable content', () => {
    expect(normalizeResponseData({}, event())).toBeNull();
  });

  it('returns normalized data for a titled payload', () => {
    const result = normalizeResponseData({ title: 'Hello' }, event());
    expect(result?.title).toBe('Hello');
  });

  it('migrates legacy news keyPoints onto keyFindings', () => {
    const result = normalizeResponseData(
      { keyPoints: [{ text: 'takeaway' }] },
      event({ template: 'news' }),
      'news',
    );
    expect(result?.keyFindings).toEqual([{ text: 'takeaway' }]);
    expect(result?.keyPoints).toBeUndefined();
  });

  it('merges uploaded images into the gallery for non-image tasks', () => {
    const result = normalizeResponseData(
      { title: 'Has gallery' },
      event({
        images: [{ imageUrl: '/storage/uploaded.jpg' }],
      }),
      'article',
    );
    expect(result?.galleryItems?.[0].imageUrl).toBe('/storage/uploaded.jpg');
  });

  it('does not merge uploaded images on image tasks', () => {
    const result = normalizeResponseData(
      { title: 'Reference only' },
      event({ images: [{ imageUrl: '/storage/uploaded.jpg' }] }),
      'describe',
    );
    expect(result?.galleryItems).toBeUndefined();
  });

  it('clears an untrusted hero image', () => {
    const result = normalizeResponseData(
      { title: 'T', heroImageUrl: 'javascript:alert(1)' },
      event(),
    );
    expect(result?.heroImageUrl).toBeUndefined();
  });
});

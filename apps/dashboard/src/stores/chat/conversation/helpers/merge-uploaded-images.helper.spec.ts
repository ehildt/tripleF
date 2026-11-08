import { describe, expect, it } from 'vitest';

import type { UploadedImage } from '../conversation.model';
import { mergeUploadedImages } from './merge-uploaded-images.helper';

function makeImage(
  overrides: Partial<UploadedImage> & { hash: string },
): UploadedImage {
  return {
    name: `${overrides.hash}.png`,
    uploadedAt: 1,
    conversationId: 'conv-1',
    ...overrides,
  };
}

describe('mergeUploadedImages', () => {
  it('appends genuinely new uploads', () => {
    const merged = mergeUploadedImages(
      [makeImage({ hash: 'a' })],
      [makeImage({ hash: 'b' })],
      'conv-1',
    );

    expect(merged.map((i) => i.hash)).toEqual(['a', 'b']);
    expect(merged[1].selected).toBe(true);
  });

  it('deduplicates and keeps the existing selection state', () => {
    const merged = mergeUploadedImages(
      [makeImage({ hash: 'a', selected: false })],
      [makeImage({ hash: 'a' })],
      'conv-1',
    );

    expect(merged).toHaveLength(1);
    expect(merged[0].selected).toBe(false);
  });

  it('adopts the default conversation id for entries without one', () => {
    const merged = mergeUploadedImages(
      [],
      [{ name: 'x.png', hash: 'x', uploadedAt: 1 } as UploadedImage],
      'conv-9',
    );

    expect(merged[0].conversationId).toBe('conv-9');
  });

  it('treats the same hash in another conversation as distinct', () => {
    const merged = mergeUploadedImages(
      [makeImage({ hash: 'a', conversationId: 'conv-2' })],
      [makeImage({ hash: 'a', conversationId: 'conv-1' })],
      'conv-1',
    );

    expect(merged).toHaveLength(2);
  });

  it('keeps the stored source for duplicates and cloud otherwise', () => {
    // Duplicate of an existing local entry: first occurrence (stored) wins.
    expect(
      mergeUploadedImages(
        [makeImage({ hash: 'a', source: 'local' })],
        [makeImage({ hash: 'a', source: 'cloud' })],
        'conv-1',
      )[0].source,
    ).toBe('local');

    expect(
      mergeUploadedImages(
        [makeImage({ hash: 'a', source: 'cloud' })],
        [makeImage({ hash: 'a', source: 'local' })],
        'conv-1',
      )[0].source,
    ).toBe('cloud');

    // A fresh incoming entry reports cloud directly.
    expect(
      mergeUploadedImages(
        [],
        [makeImage({ hash: 'a', source: 'cloud' })],
        'conv-1',
      )[0].source,
    ).toBe('cloud');
  });
});

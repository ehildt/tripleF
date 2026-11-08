import { describe, expect, it } from 'vitest';

import { restoreUploadedImageSelections } from './restore-uploaded-image-selections.helper';

describe('restoreUploadedImageSelections', () => {
  it('restores matching images and leaves other images and the input unchanged', () => {
    const current = {
      name: 'current',
      hash: 'current',
      uploadedAt: 1,
      selected: false,
    };
    const other = {
      name: 'other',
      hash: 'other',
      uploadedAt: 1,
      selected: false,
      conversationId: 'other',
    };
    const images = [current, other];

    const restored = restoreUploadedImageSelections(
      images,
      { current: true },
      'server-current',
    );

    expect(restored[0].selected).toBe(true);
    expect(restored[1]).toBe(other);
    expect(current.selected).toBe(false);
  });
});

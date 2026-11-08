import { describe, expect, it } from 'vitest';

import { toggleUploadedImageSelection } from './toggle-uploaded-image-selection.helper';

describe('toggleUploadedImageSelection', () => {
  it('toggles only the matching scoped image and reports missing images', () => {
    const images = [
      { name: 'current', hash: 'image', uploadedAt: 1, selected: true },
      {
        name: 'other',
        hash: 'image',
        uploadedAt: 1,
        selected: true,
        conversationId: 'other',
      },
    ];

    const toggled = toggleUploadedImageSelection(images, 'image', 'current');
    expect(toggled?.[0].selected).toBe(false);
    expect(toggled?.[1].selected).toBe(true);
    expect(images[0].selected).toBe(true);
    expect(
      toggleUploadedImageSelection(images, 'missing', 'current'),
    ).toBeNull();
  });
});

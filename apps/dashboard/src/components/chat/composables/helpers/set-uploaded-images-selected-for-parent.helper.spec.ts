import { describe, expect, it } from 'vitest';

import { setUploadedImagesSelectedForParent } from './set-uploaded-images-selected-for-parent.helper';

describe('setUploadedImagesSelectedForParent', () => {
  it('updates the matching page group and reports an unmatched group', () => {
    const images = [
      {
        name: 'page-1',
        hash: 'page-1',
        parentHash: 'pdf',
        uploadedAt: 1,
        selected: true,
      },
      {
        name: 'page-2',
        hash: 'page-2',
        parentHash: 'pdf',
        uploadedAt: 1,
        selected: true,
      },
    ];

    const updated = setUploadedImagesSelectedForParent(
      images,
      'pdf',
      false,
      'current',
    );
    expect(updated?.every((image) => !image.selected)).toBe(true);
    expect(images.every((image) => image.selected)).toBe(true);
    expect(
      setUploadedImagesSelectedForParent(images, 'missing', false, 'current'),
    ).toBeNull();
  });
});

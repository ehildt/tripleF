import { describe, expect, it } from 'vitest';

import type { UploadedImageGroup } from '../helpers/group-uploaded-images.helper';
import { mapUploadedImageGallery } from './map-uploaded-image-gallery.helper';

describe('mapUploadedImageGallery', () => {
  const group: UploadedImageGroup = {
    parentHash: 'hash-1',
    parentName: 'document.pdf',
    isSelected: true,
    pages: [
      { name: 'page 1', hash: 'p1' },
      { name: 'page 2', hash: 'p2' },
    ],
  } as UploadedImageGroup;

  it('maps a page group to a gallery attachment item', () => {
    expect(mapUploadedImageGallery(group)).toEqual({
      id: 'gallery-hash-1',
      name: 'document.pdf',
      hash: 'hash-1',
      previewUrl: '',
      isUploaded: true,
      isSelected: true,
      pendingIndex: null,
      source: 'local',
      kind: 'gallery',
      pages: [
        { name: 'page 1', hash: 'p1' },
        { name: 'page 2', hash: 'p2' },
      ],
    });
  });
});

import { describe, expect, it } from 'vitest';

import { mapPendingAttachment } from './map-pending-attachment.helper';

describe('mapPendingAttachment', () => {
  it('normalizes a pending attached file with its stable identity', () => {
    expect(
      mapPendingAttachment({
        id: 'entry-1',
        file: { name: 'img.png' } as File,
        isSelected: true,
        objectUrl: 'blob:1',
        hash: 'h1',
        conversationId: 'c1',
        kind: 'image',
      }),
    ).toEqual({
      id: 'entry-1',
      name: 'img.png',
      hash: 'h1',
      previewUrl: 'blob:1',
      isUploaded: false,
      isSelected: true,
      source: 'local',
      kind: 'image',
    });
  });
});

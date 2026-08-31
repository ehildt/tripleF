import { describe, expect, it } from 'vitest';

import { mapPendingAttachment } from './map-pending-attachment.helper';

describe('mapPendingAttachment', () => {
  it('normalizes a pending attached file', () => {
    expect(
      mapPendingAttachment(
        {
          file: { name: 'img.png' } as File,
          isSelected: true,
          objectUrl: 'blob:1',
          hash: 'h1',
          conversationId: 'c1',
          kind: 'image',
        },
        2,
      ),
    ).toEqual({
      id: 'pending-h1-2',
      name: 'img.png',
      hash: 'h1',
      previewUrl: 'blob:1',
      isUploaded: false,
      isSelected: true,
      pendingIndex: 2,
      source: 'local',
      kind: 'image',
    });
  });
});

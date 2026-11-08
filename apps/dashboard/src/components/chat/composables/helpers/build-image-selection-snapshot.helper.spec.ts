import { describe, expect, it } from 'vitest';

import { buildImageSelectionSnapshot } from './build-image-selection-snapshot.helper';

describe('buildImageSelectionSnapshot', () => {
  it('captures explicit and default selection only for the current context', () => {
    expect(
      buildImageSelectionSnapshot(
        [
          { name: 'selected', hash: 'selected', uploadedAt: 1 },
          {
            name: 'deselected',
            hash: 'deselected',
            uploadedAt: 1,
            selected: false,
          },
          {
            name: 'other',
            hash: 'other',
            uploadedAt: 1,
            conversationId: 'other',
          },
        ],
        'current',
      ),
    ).toEqual({ selected: true, deselected: false });
  });
});

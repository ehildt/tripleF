import { describe, expect, it } from 'vitest';

import { mapErrorTile } from './map-error-tile.helper';

describe('mapErrorTile', () => {
  it('builds an error-state tile', () => {
    expect(mapErrorTile('disk')).toEqual({
      key: 'disk',
      status: 'unknown',
      loading: false,
      error: true,
    });
  });
});

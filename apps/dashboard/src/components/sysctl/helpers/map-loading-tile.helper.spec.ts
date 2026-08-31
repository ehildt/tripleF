import { describe, expect, it } from 'vitest';

import { mapLoadingTile } from './map-loading-tile.helper';

describe('mapLoadingTile', () => {
  it('builds a loading-state tile', () => {
    expect(mapLoadingTile('disk')).toEqual({
      key: 'disk',
      status: 'loading',
      loading: true,
      error: false,
    });
  });
});

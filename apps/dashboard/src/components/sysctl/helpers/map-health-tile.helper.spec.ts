import { describe, expect, it } from 'vitest';

import { mapHealthTile } from './map-health-tile.helper';

describe('mapHealthTile', () => {
  it('builds a tile from the health buckets', () => {
    expect(
      mapHealthTile(
        'disk',
        { disk: { status: 'up' } },
        { disk: { status: 'up' } },
        {},
      ),
    ).toEqual({ key: 'disk', status: 'up', loading: false, error: false });
  });

  it('marks a key present in errors as errored', () => {
    expect(mapHealthTile('disk', {}, {}, { disk: { status: 'down' } })).toEqual(
      { key: 'disk', status: 'down', loading: false, error: true },
    );
  });
});

import { describe, expect, it } from 'vitest';

import { resolveHealthTileIcon } from './resolve-health-tile-icon.helper';

describe('resolveHealthTileIcon', () => {
  it('maps each known tile name to its icon', () => {
    for (const name of [
      'disk',
      'ollama',
      'memory_heap',
      'memory_rss',
      'postgres',
      'minio',
      'service',
    ]) {
      expect(resolveHealthTileIcon(name)).toBeTypeOf('function');
    }
  });

  it('falls back to the server icon for unknown names', () => {
    expect(resolveHealthTileIcon('unknown')).toBe(
      resolveHealthTileIcon('another-unknown'),
    );
  });
});

import { describe, expect, it } from 'vitest';

import { parsePlaylistMode } from './parse-playlist-mode.helper';

describe('parsePlaylistMode', () => {
  it('preserves the supported panel and floating modes', () => {
    expect(parsePlaylistMode('panel')).toBe('panel');
    expect(parsePlaylistMode('floating')).toBe('floating');
  });

  it('falls back to panel for missing or invalid values', () => {
    expect(parsePlaylistMode(null)).toBe('panel');
    expect(parsePlaylistMode('invalid')).toBe('panel');
  });
});

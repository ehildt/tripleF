import { describe, expect, it } from 'vitest';

import { PLAYLIST_ANCHORS } from '../playlist-settings.constant';
import { parsePlaylistAnchor } from './parse-playlist-anchor.helper';

describe('parsePlaylistAnchor', () => {
  it.each(PLAYLIST_ANCHORS)('preserves the supported %s anchor', (anchor) => {
    expect(parsePlaylistAnchor(anchor)).toBe(anchor);
  });

  it('falls back to top-right for missing or invalid values', () => {
    expect(parsePlaylistAnchor(null)).toBe('top-right');
    expect(parsePlaylistAnchor('elsewhere')).toBe('top-right');
  });
});

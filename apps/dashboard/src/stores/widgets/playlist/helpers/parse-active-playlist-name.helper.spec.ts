import { describe, expect, it } from 'vitest';

import { parseActivePlaylistName } from './parse-active-playlist-name.helper';

describe('parseActivePlaylistName', () => {
  it('preserves saved names and uses an empty selection when absent', () => {
    expect(parseActivePlaylistName('main')).toBe('main');
    expect(parseActivePlaylistName('')).toBe('');
    expect(parseActivePlaylistName(null)).toBe('');
  });
});

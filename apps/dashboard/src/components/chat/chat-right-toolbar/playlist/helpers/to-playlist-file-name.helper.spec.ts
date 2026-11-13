import { describe, expect, it } from 'vitest';

import { toPlaylistFileName } from './to-playlist-file-name.helper';

describe('toPlaylistFileName', () => {
  it('retains ordinary playlist names and appends the JSON extension', () => {
    expect(toPlaylistFileName('  Focus mix #1  ')).toBe('Focus mix #1.json');
  });

  it('replaces cross-platform filename and control characters', () => {
    expect(toPlaylistFileName('a/b\\c:d*e?f"g<h>i|j')).toBe(
      'a_b_c_d_e_f_g_h_i_j.json',
    );
    expect(toPlaylistFileName('first\nsecond')).toBe('first_second.json');
  });

  it('removes trailing dots and spaces', () => {
    expect(toPlaylistFileName('Focus...  ')).toBe('Focus.json');
  });

  it.each(['CON', 'prn', 'aux', 'NUL', 'com1', 'LPT9'])(
    'prefixes reserved Windows filename %s',
    (name) => {
      expect(toPlaylistFileName(name)).toBe(`_${name}.json`);
    },
  );

  it.each(['', ' ', '.', '..'])('uses a fallback for %j', (name) => {
    expect(toPlaylistFileName(name)).toBe('playlist.json');
  });
});

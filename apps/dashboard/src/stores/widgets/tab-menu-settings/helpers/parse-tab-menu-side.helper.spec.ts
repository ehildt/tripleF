import { describe, expect, it } from 'vitest';

import { parseTabMenuSide } from './parse-tab-menu-side.helper';

describe('parseTabMenuSide', () => {
  it.each(['left', 'right'] as const)('accepts %s', (side) => {
    expect(parseTabMenuSide(side)).toBe(side);
  });

  it.each([null, '', 'diagonal', 'LEFT'])(
    'falls back to right for invalid value %s',
    (saved) => {
      expect(parseTabMenuSide(saved)).toBe('right');
    },
  );
});

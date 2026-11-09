import { describe, expect, it } from 'vitest';

import { parseScrollMode } from './parse-scroll-mode.helper';

describe('parseScrollMode', () => {
  it('preserves native mode and defaults all other values to carousel', () => {
    expect(parseScrollMode('native')).toBe('native');
    expect(parseScrollMode('carousel')).toBe('carousel');
    expect(parseScrollMode(null)).toBe('carousel');
    expect(parseScrollMode('invalid')).toBe('carousel');
  });
});

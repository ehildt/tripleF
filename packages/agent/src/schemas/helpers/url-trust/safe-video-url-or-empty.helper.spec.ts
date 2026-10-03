import { describe, expect, it } from 'vitest';

import { safeVideoUrlOrEmpty } from './safe-video-url-or-empty.helper.js';

describe('safeVideoUrlOrEmpty', () => {
  it('accepts an empty string', () => {
    expect(safeVideoUrlOrEmpty().safeParse('').success).toBe(true);
  });

  it('accepts a safe video URL', () => {
    expect(safeVideoUrlOrEmpty().safeParse('https://www.youtube.com/watch?v=abc123').success).toBe(true);
  });

  it('rejects an unsafe value', () => {
    expect(safeVideoUrlOrEmpty().safeParse('not-a-url').success).toBe(false);
    expect(safeVideoUrlOrEmpty().safeParse('javascript:alert(1)').success).toBe(false);
  });
});

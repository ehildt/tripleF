import { describe, expect, it } from 'vitest';

import { formatCtx } from './format-ctx.helper';

describe('formatCtx', () => {
  it('formats bytes', () => {
    expect(formatCtx(512)).toBe('512');
  });

  it('formats kilobytes', () => {
    expect(formatCtx(1024)).toBe('1k');
  });

  it('formats megabytes', () => {
    expect(formatCtx(1048576)).toBe('1m');
    expect(formatCtx(5242880)).toBe('5m');
  });

  it('formats gigabytes', () => {
    expect(formatCtx(1073741824)).toBe('1g');
  });

  it('strips trailing zero', () => {
    expect(formatCtx(2048)).toBe('2k');
  });
});

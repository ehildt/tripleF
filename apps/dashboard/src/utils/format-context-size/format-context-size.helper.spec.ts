import { describe, expect, it } from 'vitest';

import { formatContextSize } from './format-context-size.helper';

describe('formatContextSize', () => {
  it('formats bytes', () => {
    expect(formatContextSize(512)).toBe('512');
  });

  it('formats kilobytes', () => {
    expect(formatContextSize(1024)).toBe('1k');
  });

  it('formats megabytes', () => {
    expect(formatContextSize(1048576)).toBe('1m');
    expect(formatContextSize(5242880)).toBe('5m');
  });

  it('formats gigabytes', () => {
    expect(formatContextSize(1073741824)).toBe('1g');
  });

  it('strips trailing zero', () => {
    expect(formatContextSize(2048)).toBe('2k');
  });
});

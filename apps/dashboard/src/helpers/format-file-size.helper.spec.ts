import { describe, expect, it } from 'vitest';

import { formatFileSize } from './format-file-size.helper';

describe('formatFileSize', () => {
  it('formats bytes', () => {
    expect(formatFileSize(0)).toBe('0 B');
    expect(formatFileSize(512)).toBe('512 B');
  });

  it('formats kilobytes and megabytes', () => {
    expect(formatFileSize(1024)).toBe('1 KB');
    expect(formatFileSize(1536)).toBe('1.5 KB');
    expect(formatFileSize(10 * 1024 * 1024)).toBe('10 MB');
  });

  it('keeps one decimal below 10 units and rounds above', () => {
    expect(formatFileSize(3 * 1024 * 1024)).toBe('3 MB');
    expect(formatFileSize(12 * 1024 * 1024)).toBe('12 MB');
  });

  it('returns an empty string for missing or negative sizes', () => {
    expect(formatFileSize(undefined)).toBe('');
    expect(formatFileSize(-1)).toBe('');
  });
});

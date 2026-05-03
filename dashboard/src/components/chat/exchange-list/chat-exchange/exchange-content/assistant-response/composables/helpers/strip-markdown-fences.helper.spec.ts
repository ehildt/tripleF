import { describe, expect, it } from 'vitest';

import { stripMarkdownFences } from './strip-markdown-fences.helper';

describe('stripMarkdownFences', () => {
  it('strips JSON code fences', () => {
    expect(stripMarkdownFences('```json\n{"a":1}\n```')).toBe('{"a":1}');
  });

  it('strips plain code fences', () => {
    expect(stripMarkdownFences('```\nhello\n```')).toBe('hello');
  });

  it('returns plain text unchanged', () => {
    expect(stripMarkdownFences('{"a":1}')).toBe('{"a":1}');
  });

  it('trims whitespace', () => {
    expect(stripMarkdownFences('  hello  ')).toBe('hello');
  });
});

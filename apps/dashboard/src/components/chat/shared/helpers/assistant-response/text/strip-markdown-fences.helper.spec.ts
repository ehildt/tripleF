import { describe, expect, it } from 'vitest';

import { stripMarkdownFences } from './strip-markdown-fences.helper';

describe('stripMarkdownFences', () => {
  it('strips a ```json opening fence', () => {
    expect(stripMarkdownFences('```json\n{"a":1}')).toBe('{"a":1}');
  });

  it('strips a plain ``` opening fence', () => {
    expect(stripMarkdownFences('```\ntext')).toBe('text');
  });

  it('strips a trailing fence', () => {
    expect(stripMarkdownFences('text\n```')).toBe('text');
  });

  it('leaves plain text untouched', () => {
    expect(stripMarkdownFences('no fences here')).toBe('no fences here');
  });
});

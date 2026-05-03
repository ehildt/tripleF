import { describe, expect, it } from 'vitest';

import { stripHtml } from './strip-html.helper';

describe('stripHtml', () => {
  it('strips HTML tags', () => {
    expect(stripHtml('<p>Hello <b>world</b></p>')).toBe('Hello world');
  });

  it('returns plain text unchanged', () => {
    expect(stripHtml('plain text')).toBe('plain text');
  });

  it('handles empty string', () => {
    expect(stripHtml('')).toBe('');
  });
});

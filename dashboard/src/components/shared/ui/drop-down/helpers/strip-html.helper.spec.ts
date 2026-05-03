import { describe, expect, it } from 'vitest';

import { stripHtml } from './strip-html.helper';

describe('stripHtml', () => {
  it('removes html tags', () => {
    expect(stripHtml('<b>bold</b>')).toBe('bold');
  });

  it('returns plain text unchanged', () => {
    expect(stripHtml('plain')).toBe('plain');
  });
});

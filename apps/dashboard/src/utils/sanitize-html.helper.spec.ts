import { describe, expect, it } from 'vitest';

import { sanitizeHtml } from './sanitize-html.helper';

describe('sanitizeHtml', () => {
  it('allows basic text', () => {
    expect(sanitizeHtml('hello')).toBe('hello');
  });

  it('removes unsafe tags', () => {
    expect(sanitizeHtml('<script>alert(1)</script>')).not.toContain('script');
  });

  it('adds img error handler', () => {
    expect(sanitizeHtml('<img src="x" />')).toContain(
      'onerror="this.style.display=\'none\'"',
    );
  });
});

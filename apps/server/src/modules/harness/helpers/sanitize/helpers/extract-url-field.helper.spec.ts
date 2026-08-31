import { describe, expect, it } from 'vitest';

import { extractUrlField } from './extract-url-field.helper.js';

describe('extractUrlField', () => {
  it('reads the primary key first', () => {
    expect(
      extractUrlField(
        { imageUrl: 'https://a.com', url: 'https://b.com' },
        'imageUrl',
      ),
    ).toBe('https://a.com');
  });

  it('falls back to url and link', () => {
    expect(extractUrlField({ link: 'https://c.com' }, 'imageUrl')).toBe(
      'https://c.com',
    );
  });

  it('returns undefined when no url field is present', () => {
    expect(extractUrlField({}, 'imageUrl')).toBeUndefined();
  });
});

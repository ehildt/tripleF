import { describe, expect, it } from 'vitest';

import { resolveLanguageName } from './resolve-language-name.helper.ts';

describe('resolveLanguageName', () => {
  it('resolves a language code to its English display name', () => {
    expect(resolveLanguageName('de')).toBe('German');
    expect(resolveLanguageName('ja')).toBe('Japanese');
  });

  it('falls back to the code for an unknown language', () => {
    expect(resolveLanguageName('zz')).toBe('zz');
  });

  it('falls back to the code when Intl.DisplayNames is unavailable', () => {
    const descriptor = Object.getOwnPropertyDescriptor(Intl, 'DisplayNames');
    Object.defineProperty(Intl, 'DisplayNames', {
      value: undefined,
      configurable: true,
    });

    try {
      expect(resolveLanguageName('de')).toBe('de');
    } finally {
      if (descriptor) Object.defineProperty(Intl, 'DisplayNames', descriptor);
    }
  });
});

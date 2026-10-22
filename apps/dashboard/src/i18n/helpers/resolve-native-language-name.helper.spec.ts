import { describe, expect, it } from 'vitest';

import { resolveNativeLanguageName } from './resolve-native-language-name.helper';

describe('resolveNativeLanguageName', () => {
  it('resolves the endonym for a language code', () => {
    expect(resolveNativeLanguageName('de')).toBe('Deutsch');
    expect(resolveNativeLanguageName('en')).toBe('English');
  });

  it('falls back to the code for an unknown language', () => {
    expect(resolveNativeLanguageName('xx')).toBe('xx');
  });
});

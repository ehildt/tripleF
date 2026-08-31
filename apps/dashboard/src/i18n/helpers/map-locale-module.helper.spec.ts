import { describe, expect, it } from 'vitest';

import en from '../locales/en';
import { mapLocaleModule } from './map-locale-module.helper';

describe('mapLocaleModule', () => {
  it('projects a valid locale module into the registry shape', () => {
    const result = mapLocaleModule(['./locales/en.ts', { default: en }]);
    expect(result).toMatchObject({ code: 'en', countryCode: 'us' });
    expect(result.name).toBeTruthy();
  });

  it('throws on an invalid locale module', () => {
    expect(() =>
      mapLocaleModule(['./locales/bad.ts', { default: { languageCode: 1 } }]),
    ).toThrow(/Invalid locale file/);
  });
});

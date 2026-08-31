import { describe, expect, it } from 'vitest';

import { mapLocaleToOption } from './map-locale-to-option.helper';

describe('mapLocaleToOption', () => {
  it('projects a locale into the option shape', () => {
    expect(
      mapLocaleToOption({ code: 'en', name: 'English', countryCode: 'US' }),
    ).toEqual({ code: 'en', name: 'English', flag: 'US' });
  });
});

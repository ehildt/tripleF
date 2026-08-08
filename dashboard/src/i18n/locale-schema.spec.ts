import { describe, expect, it } from 'vitest';

import { locales } from './locale-registry';
import { localeSchema } from './locale-schema';

/**
 * Localization validation. Every locale file in `./locales` is auto-discovered
 * by the registry and must satisfy the Zod schema — missing required keys,
 * wrong types, or unknown identity keys fail here. English is the source of
 * truth and is always present.
 */
describe('localization', () => {
  it('discovers at least one locale', () => {
    expect(locales.length).toBeGreaterThan(0);
  });

  it('includes English as the source of truth', () => {
    expect(locales.map((l) => l.code)).toContain('en');
  });

  it('validates every locale against the schema', () => {
    for (const locale of locales) {
      const result = localeSchema.safeParse(locale.messages);
      expect(
        result.success,
        `"${locale.code}" failed schema validation: ${
          result.success ? '' : result.error.message
        }`,
      ).toBe(true);
    }
  });

  it('gives every locale a language code and a flag country code', () => {
    for (const locale of locales) {
      expect(locale.code, `"${locale.code}" missing languageCode`).toBeTruthy();
      expect(
        locale.countryCode,
        `"${locale.code}" missing countryCode`,
      ).toBeTruthy();
    }
  });
});

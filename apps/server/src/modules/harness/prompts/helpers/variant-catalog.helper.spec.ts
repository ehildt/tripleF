import { describe, expect, it } from 'vitest';

import {
  formatVariantCatalog,
  TEMPLATE_VARIANTS,
} from './variant-catalog.helper.js';

describe('formatVariantCatalog', () => {
  it('lists every template with its variants', () => {
    const catalog = formatVariantCatalog();

    expect(catalog).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/^\s+article: default$/),
        expect.stringMatching(/^\s+describe: default, detailed, concise$/),
        expect.stringMatching(/^\s+compare: default, visual$/),
        expect.stringMatching(/^\s+ocr: default, verbatim$/),
        expect.stringMatching(/^\s+text: default, coding, familiarity$/),
      ]),
    );
  });

  it('covers all classifier-selectable templates', () => {
    expect(formatVariantCatalog().length).toBe(
      Object.keys(TEMPLATE_VARIANTS).length,
    );
  });
});

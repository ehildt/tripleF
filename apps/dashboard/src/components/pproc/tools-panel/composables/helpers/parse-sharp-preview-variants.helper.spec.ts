import { describe, expect, it } from 'vitest';

import { parseSharpPreviewVariants } from './parse-sharp-preview-variants.helper';

const variant = {
  variant: 'grayscale',
  name: 'image.png',
  description: 'Grayscale',
  dataUrl: 'data:image/png;base64,abc',
};

describe('parseSharpPreviewVariants', () => {
  it('accepts valid variants and preserves their order', () => {
    expect(
      parseSharpPreviewVariants([variant, { ...variant, variant: 'clahe' }]),
    ).toEqual([variant, { ...variant, variant: 'clahe' }]);
  });

  it('accepts an empty list for the workflow to handle', () => {
    expect(parseSharpPreviewVariants([])).toEqual([]);
  });

  it.each([null, {}, 'preview', [null], [{ ...variant, dataUrl: 42 }]])(
    'rejects malformed payload %#',
    (payload) => {
      expect(() => parseSharpPreviewVariants(payload)).toThrow(
        'Invalid preprocessing preview response',
      );
    },
  );
});

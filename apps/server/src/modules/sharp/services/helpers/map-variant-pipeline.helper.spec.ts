import { describe, expect, it } from 'vitest';

import { mapVariantPipeline } from './map-variant-pipeline.helper.js';

describe('mapVariantPipeline', () => {
  it('builds a variant pipeline pair', () => {
    const result = mapVariantPipeline('grayscale', {
      blurSigma: 1,
      sharpenSigma: 1,
      sharpenM1: 1,
      sharpenM2: 2,
      claheWidth: 8,
      claheHeight: 8,
      claheMaxSlope: 3,
    });
    expect(result.variant).toBe('grayscale');
    expect(typeof result.pipeline).toBe('function');
  });
});

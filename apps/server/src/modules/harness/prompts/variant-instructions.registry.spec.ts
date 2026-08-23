import { describe, expect, it } from 'vitest';

import {
  DEFAULT_VARIANT_ID,
  resolveVariantInstructions,
  TEMPLATE_VARIANTS,
} from './variant-instructions.registry.js';

describe('TEMPLATE_VARIANTS', () => {
  it('contains a default variant for every template', () => {
    for (const [, variants] of Object.entries(TEMPLATE_VARIANTS)) {
      expect(variants).toContain(DEFAULT_VARIANT_ID);
      expect(variants.length).toBeGreaterThan(0);
      expect(new Set(variants).size).toBe(variants.length);
    }
  });
});

describe('resolveVariantInstructions', () => {
  it('returns instructions for a known template and variant', () => {
    expect(resolveVariantInstructions('describe', 'detailed')).toContain(
      'exhaustive visual detail',
    );
  });

  it('falls back to the default variant when an unknown variant is requested', () => {
    const fallback = resolveVariantInstructions('describe', 'unknown');

    expect(fallback).toBe(
      resolveVariantInstructions('describe', DEFAULT_VARIANT_ID),
    );
    expect(fallback.length).toBeGreaterThan(0);
  });

  it('returns an empty string when the template is unknown', () => {
    expect(resolveVariantInstructions('nonexistent', DEFAULT_VARIANT_ID)).toBe(
      '',
    );
  });
});

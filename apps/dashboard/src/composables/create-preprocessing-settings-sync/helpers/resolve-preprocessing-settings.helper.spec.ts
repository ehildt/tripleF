import { describe, expect, it } from 'vitest';

import { DEFAULT_PREPROCESSING_SETTINGS } from '@/stores/preprocessing-settings/preprocessing-settings.constant';

import { resolvePreprocessingSettings } from './resolve-preprocessing-settings.helper';

describe('resolvePreprocessingSettings', () => {
  it('uses independent defaults for absent or non-record sources', () => {
    const result = resolvePreprocessingSettings(null, []);

    expect(result).toEqual(DEFAULT_PREPROCESSING_SETTINGS);
    expect(result.resize).not.toBe(DEFAULT_PREPROCESSING_SETTINGS.resize);
    expect(result.variants).not.toBe(DEFAULT_PREPROCESSING_SETTINGS.variants);
    expect(result.parameters).not.toBe(
      DEFAULT_PREPROCESSING_SETTINGS.parameters,
    );
  });

  it('overlays global then session values per field', () => {
    const result = resolvePreprocessingSettings(
      {
        enabled: false,
        resize: { maxWidth: 512, maxHeight: 900, withoutEnlargement: false },
        variants: { grayscale: true },
        parameters: { blurSigma: 2, contrastLevel: 1.8 },
      },
      {
        enabled: true,
        resize: { maxWidth: 1024 },
        parameters: { blurSigma: 3 },
      },
    );

    expect(result.enabled).toBe(true);
    expect(result.resize).toEqual({
      maxWidth: 1024,
      maxHeight: 900,
      withoutEnlargement: false,
    });
    expect(result.variants.grayscale).toBe(true);
    expect(result.parameters.blurSigma).toBe(3);
    expect(result.parameters).not.toHaveProperty('contrastLevel');
  });

  it('preserves valid global fields when session fields are malformed', () => {
    const result = resolvePreprocessingSettings(
      { enabled: false, resize: { maxWidth: 512 } },
      { enabled: 'yes', resize: { maxWidth: 513 } },
    );

    expect(result.enabled).toBe(false);
    expect(result.resize.maxWidth).toBe(512);
  });

  it('validates resize values against the server contract', () => {
    const result = resolvePreprocessingSettings(
      {
        resize: {
          maxWidth: 300,
          maxHeight: 63.5,
          withoutEnlargement: 'false',
        },
      },
      null,
    );

    expect(result.resize).toEqual(DEFAULT_PREPROCESSING_SETTINGS.resize);
    expect(
      resolvePreprocessingSettings({ resize: { maxHeight: 64 } }, null).resize
        .maxHeight,
    ).toBe(64);
  });

  it('validates every parameter using server types and ranges', () => {
    const result = resolvePreprocessingSettings(
      {
        parameters: {
          blurSigma: -1,
          sharpenSigma: 11,
          sharpenM1: Number.NaN,
          sharpenM2: '2',
          brightnessLevel: 0,
          claheWidth: 1.5,
          claheHeight: 65,
          claheMaxSlope: 0,
          normalizeLower: -1,
          normalizeUpper: 101,
        },
      },
      null,
    );

    expect(result.parameters).toEqual(
      DEFAULT_PREPROCESSING_SETTINGS.parameters,
    );
  });

  it('accepts valid fractional parameters and integer CLAHE dimensions', () => {
    const result = resolvePreprocessingSettings(null, {
      parameters: {
        blurSigma: 0.25,
        brightnessLevel: 1.5,
        claheWidth: 12,
        claheHeight: 16,
      },
    });

    expect(result.parameters.blurSigma).toBe(0.25);
    expect(result.parameters.brightnessLevel).toBe(1.5);
    expect(result.parameters.claheWidth).toBe(12);
    expect(result.parameters.claheHeight).toBe(16);
  });
});

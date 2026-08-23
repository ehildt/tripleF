import { SharpDefaults } from '../configs/sharp-config.adapter.js';

import { parsePreprocessingPayload } from './sharp-options.helper.js';

describe('parsePreprocessingPayload', () => {
  const defaults: SharpDefaults = {
    enabled: false,
    resize: {
      maxWidth: 768,
      maxHeight: null,
      withoutEnlargement: true,
    },
    variants: {
      original: true,
      grayscale: true,
      denoised: true,
      sharpened: false,
      clahe: true,
    },
    parameters: {
      blurSigma: 0.5,
      sharpenSigma: 1,
      sharpenM1: 1,
      sharpenM2: 2,
      contrastLevel: 1.3,
      brightnessLevel: 1.2,
      claheWidth: 8,
      claheHeight: 8,
      claheMaxSlope: 3,
      normalizeLower: 1,
      normalizeUpper: 99,
    },
  };

  it('returns undefined when the payload is missing', () => {
    expect(parsePreprocessingPayload(undefined, defaults)).toBeUndefined();
  });

  it('returns undefined when preprocessing is disabled', () => {
    expect(
      parsePreprocessingPayload({ enabled: false }, defaults),
    ).toBeUndefined();
  });

  it('returns options with defaults when enabled without overrides', () => {
    expect(parsePreprocessingPayload({ enabled: true }, defaults)).toEqual({
      enabled: true,
      resize: defaults.resize,
      variants: defaults.variants,
      parameters: {
        blurSigma: defaults.parameters.blurSigma,
        sharpenSigma: defaults.parameters.sharpenSigma,
        sharpenM1: defaults.parameters.sharpenM1,
        sharpenM2: defaults.parameters.sharpenM2,
        brightnessLevel: defaults.parameters.brightnessLevel,
        claheWidth: defaults.parameters.claheWidth,
        claheHeight: defaults.parameters.claheHeight,
        claheMaxSlope: defaults.parameters.claheMaxSlope,
        normalizeLower: defaults.parameters.normalizeLower,
        normalizeUpper: defaults.parameters.normalizeUpper,
      },
    });
  });

  it('overrides defaults with payload values', () => {
    expect(
      parsePreprocessingPayload(
        {
          enabled: true,
          resize: {
            maxWidth: 512,
            maxHeight: 384,
            withoutEnlargement: false,
          },
          variants: {
            original: false,
            grayscale: false,
            denoised: false,
            sharpened: true,
            clahe: false,
          },
          parameters: {
            blurSigma: 1.5,
            sharpenSigma: 2,
            sharpenM1: 3,
            sharpenM2: 4,
            brightnessLevel: 1.5,
            claheWidth: 16,
            claheHeight: 16,
            claheMaxSlope: 5,
            normalizeLower: 2,
            normalizeUpper: 98,
          },
        },
        defaults,
      ),
    ).toEqual({
      enabled: true,
      resize: {
        maxWidth: 512,
        maxHeight: 384,
        withoutEnlargement: false,
      },
      variants: {
        original: false,
        grayscale: false,
        denoised: false,
        sharpened: true,
        clahe: false,
      },
      parameters: {
        blurSigma: 1.5,
        sharpenSigma: 2,
        sharpenM1: 3,
        sharpenM2: 4,
        brightnessLevel: 1.5,
        claheWidth: 16,
        claheHeight: 16,
        claheMaxSlope: 5,
        normalizeLower: 2,
        normalizeUpper: 98,
      },
    });
  });

  it('keeps maxHeight null when not provided', () => {
    const options = parsePreprocessingPayload(
      { enabled: true, resize: { maxWidth: 512 } },
      defaults,
    );

    expect(options!.resize.maxWidth).toBe(512);
    expect(options!.resize.maxHeight).toBeNull();
  });
});

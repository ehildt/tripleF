import { HarnessStreamQueryDto } from '../../harness/dtos/harness-stream-query.dto.js';
import { SharpDefaults } from '../configs/sharp-config.adapter.js';

import { buildSharpOptions } from './sharp-options.helper.js';

describe('buildSharpOptions', () => {
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

  it('returns undefined when preprocessing is disabled', () => {
    const query: HarnessStreamQueryDto = {
      requestId: 'req-1',
      stream: false,
      event: 'harness',
      think: 'medium',
      pproc_enabled: false,
    };

    expect(buildSharpOptions(query, defaults)).toBeUndefined();
  });

  it('returns options with defaults when enabled without overrides', () => {
    const query: HarnessStreamQueryDto = {
      requestId: 'req-1',
      stream: false,
      event: 'harness',
      think: 'medium',
      pproc_enabled: true,
    };

    expect(buildSharpOptions(query, defaults)).toEqual({
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

  it('overrides defaults with query params', () => {
    const query: HarnessStreamQueryDto = {
      requestId: 'req-1',
      stream: false,
      event: 'harness',
      think: 'medium',
      pproc_enabled: true,
      pproc_resize_maxWidth: 512,
      pproc_resize_maxHeight: 384,
      pproc_resize_withoutEnlargement: false,
      pproc_original: false,
      pproc_grayscale: false,
      pproc_denoised: false,
      pproc_sharpened: true,
      pproc_clahe: false,
      pproc_blurSigma: 1.5,
      pproc_sharpenSigma: 2,
      pproc_sharpenM1: 3,
      pproc_sharpenM2: 4,
      pproc_brightnessLevel: 1.5,
      pproc_claheWidth: 16,
      pproc_claheHeight: 16,
      pproc_claheMaxSlope: 5,
      pproc_normalizeLower: 2,
      pproc_normalizeUpper: 98,
    };

    expect(buildSharpOptions(query, defaults)).toEqual({
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
    const query: HarnessStreamQueryDto = {
      requestId: 'req-1',
      stream: false,
      event: 'harness',
      think: 'medium',
      pproc_enabled: true,
    };

    const options = buildSharpOptions(query, defaults);

    expect(options!.resize.maxHeight).toBeNull();
  });
});

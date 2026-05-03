import { HarnessStreamQueryDto } from '../../harness/dtos/harness-stream-query.dto.js';
import { SharpDefaults } from '../configs/sharp-config.adapter.js';
import type { SharpSize } from '../constants/sharp.constants.js';
import { SharpOptions } from '../dtos/sharp-options.dto.js';

/**
 * Build preprocessing options from flat query parameters.
 * Query values override env-backed defaults. Returns undefined when disabled.
 */
export function buildSharpOptions(
  query: HarnessStreamQueryDto,
  defaults: SharpDefaults,
): SharpOptions | undefined {
  if (!query.pproc_enabled) {
    return undefined;
  }

  return {
    enabled: true,
    resize: {
      maxWidth:
        (query.pproc_resize_maxWidth as SharpSize | undefined) ??
        defaults.resize.maxWidth,
      maxHeight: query.pproc_resize_maxHeight ?? defaults.resize.maxHeight,
      withoutEnlargement:
        query.pproc_resize_withoutEnlargement ??
        defaults.resize.withoutEnlargement,
    },
    variants: {
      original: query.pproc_original ?? defaults.variants.original,
      grayscale: query.pproc_grayscale ?? defaults.variants.grayscale,
      denoised: query.pproc_denoised ?? defaults.variants.denoised,
      sharpened: query.pproc_sharpened ?? defaults.variants.sharpened,
      clahe: query.pproc_clahe ?? defaults.variants.clahe,
    },
    parameters: {
      blurSigma: query.pproc_blurSigma ?? defaults.parameters.blurSigma,
      sharpenSigma:
        query.pproc_sharpenSigma ?? defaults.parameters.sharpenSigma,
      sharpenM1: query.pproc_sharpenM1 ?? defaults.parameters.sharpenM1,
      sharpenM2: query.pproc_sharpenM2 ?? defaults.parameters.sharpenM2,
      brightnessLevel:
        query.pproc_brightnessLevel ?? defaults.parameters.brightnessLevel,
      claheWidth: query.pproc_claheWidth ?? defaults.parameters.claheWidth,
      claheHeight: query.pproc_claheHeight ?? defaults.parameters.claheHeight,
      claheMaxSlope:
        query.pproc_claheMaxSlope ?? defaults.parameters.claheMaxSlope,
      normalizeLower:
        query.pproc_normalizeLower ?? defaults.parameters.normalizeLower,
      normalizeUpper:
        query.pproc_normalizeUpper ?? defaults.parameters.normalizeUpper,
    },
  };
}

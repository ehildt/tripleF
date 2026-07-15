import { SharpDefaults } from '../configs/sharp-config.adapter.js';
import type { SharpSize } from '../constants/sharp.constants.js';
import { PreprocessingPayload } from '../dtos/preprocessing-payload.dto.js';
import { SharpOptions } from '../dtos/sharp-options.dto.js';

/**
 * Parse preprocessing options from a JSON payload.
 * Payload values override env-backed defaults. Returns undefined when disabled.
 */
export function parsePreprocessingPayload(
  payload: PreprocessingPayload | undefined,
  defaults: SharpDefaults,
): SharpOptions | undefined {
  if (!payload?.enabled) {
    return undefined;
  }

  return {
    enabled: true,
    resize: {
      maxWidth:
        (payload.resize?.maxWidth as SharpSize | undefined) ??
        defaults.resize.maxWidth,
      maxHeight: payload.resize?.maxHeight ?? defaults.resize.maxHeight,
      withoutEnlargement:
        payload.resize?.withoutEnlargement ??
        defaults.resize.withoutEnlargement,
    },
    variants: {
      original: payload.variants?.original ?? defaults.variants.original,
      grayscale: payload.variants?.grayscale ?? defaults.variants.grayscale,
      denoised: payload.variants?.denoised ?? defaults.variants.denoised,
      sharpened: payload.variants?.sharpened ?? defaults.variants.sharpened,
      clahe: payload.variants?.clahe ?? defaults.variants.clahe,
    },
    parameters: {
      blurSigma: payload.parameters?.blurSigma ?? defaults.parameters.blurSigma,
      sharpenSigma:
        payload.parameters?.sharpenSigma ?? defaults.parameters.sharpenSigma,
      sharpenM1: payload.parameters?.sharpenM1 ?? defaults.parameters.sharpenM1,
      sharpenM2: payload.parameters?.sharpenM2 ?? defaults.parameters.sharpenM2,
      brightnessLevel:
        payload.parameters?.brightnessLevel ??
        defaults.parameters.brightnessLevel,
      claheWidth:
        payload.parameters?.claheWidth ?? defaults.parameters.claheWidth,
      claheHeight:
        payload.parameters?.claheHeight ?? defaults.parameters.claheHeight,
      claheMaxSlope:
        payload.parameters?.claheMaxSlope ?? defaults.parameters.claheMaxSlope,
      normalizeLower:
        payload.parameters?.normalizeLower ??
        defaults.parameters.normalizeLower,
      normalizeUpper:
        payload.parameters?.normalizeUpper ??
        defaults.parameters.normalizeUpper,
    },
  };
}

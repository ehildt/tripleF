import { getBooleanEnv } from '@ehildt/ckir-helpers/get-boolean-env';
import { getNumberEnv } from '@ehildt/ckir-helpers/get-number-env';

import { SHARP_SIZES, type SharpSize } from '../constants/sharp.constants.js';
import { SharpOptions } from '../dtos/sharp-options.dto.js';

export type SharpDefaults = Required<
  Pick<SharpOptions, 'enabled' | 'resize' | 'variants' | 'parameters'>
>;

export function resolveSize(
  value: number | undefined,
  fallback: SharpSize,
): SharpSize {
  if (value === undefined) return fallback;
  if (SHARP_SIZES.includes(value as SharpSize)) {
    return value as SharpSize;
  }
  return fallback;
}

export function SharpConfigAdapter(env = process.env): SharpDefaults {
  return {
    enabled: getBooleanEnv(env.PPROC_ENABLED, false)!,
    resize: {
      maxWidth: resolveSize(
        getNumberEnv(env.PPROC_RESIZE_MAX_WIDTH, 768) as number,
        768,
      ),
      maxHeight: env.PPROC_RESIZE_MAX_HEIGHT
        ? (getNumberEnv(env.PPROC_RESIZE_MAX_HEIGHT, 0) as number)
        : null,
      withoutEnlargement: getBooleanEnv(
        env.PPROC_RESIZE_WITHOUT_ENLARGEMENT,
        true,
      )!,
    },
    variants: {
      original: getBooleanEnv(env.PPROC_VARIANT_ORIGINAL, true)!,
      grayscale: getBooleanEnv(env.PPROC_VARIANT_GRAYSCALE, true)!,
      denoised: getBooleanEnv(env.PPROC_VARIANT_DENOISED, true)!,
      sharpened: getBooleanEnv(env.PPROC_VARIANT_SHARPENED, false)!,
      clahe: getBooleanEnv(env.PPROC_VARIANT_CLAHE, true)!,
    },
    parameters: {
      blurSigma: getNumberEnv(env.PPROC_BLUR_SIGMA, 0.5) as number,
      sharpenSigma: getNumberEnv(env.PPROC_SHARPEN_SIGMA, 1) as number,
      sharpenM1: getNumberEnv(env.PPROC_SHARPEN_M1, 1) as number,
      sharpenM2: getNumberEnv(env.PPROC_SHARPEN_M2, 2) as number,
      contrastLevel: getNumberEnv(env.PPROC_CONTRAST_LEVEL, 1.3) as number,
      brightnessLevel: getNumberEnv(env.PPROC_BRIGHTNESS_LEVEL, 1.2) as number,
      claheWidth: getNumberEnv(env.PPROC_CLAHE_WIDTH, 8) as number,
      claheHeight: getNumberEnv(env.PPROC_CLAHE_HEIGHT, 8) as number,
      claheMaxSlope: getNumberEnv(env.PPROC_CLAHE_MAX_SLOPE, 3) as number,
      normalizeLower: getNumberEnv(env.PPROC_NORMALIZE_LOWER, 1) as number,
      normalizeUpper: getNumberEnv(env.PPROC_NORMALIZE_UPPER, 99) as number,
    },
  };
}

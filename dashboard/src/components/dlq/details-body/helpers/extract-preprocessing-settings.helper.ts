import type { DlqEntry } from '@/types/dlq-entry.model';

import {
  DEFAULT_PREPROCESSING_SETTINGS,
  type PreprocessingSettings,
} from '../../../../stores/preprocessing';
import { getDlqFilters } from './get-dlq-filters.helper';

export function extractPreprocessingSettings(
  entry: DlqEntry | null,
): PreprocessingSettings {
  const f = getDlqFilters(entry);
  const raw = f?.preprocessing as Record<string, unknown> | undefined;

  if (!raw) {
    return { ...DEFAULT_PREPROCESSING_SETTINGS };
  }

  return {
    enabled: raw.enabled === true,
    resize: {
      maxWidth: ((raw.resize as { maxWidth?: number } | undefined)?.maxWidth ??
        DEFAULT_PREPROCESSING_SETTINGS.resize
          .maxWidth) as PreprocessingSettings['resize']['maxWidth'],
      maxHeight:
        (raw.resize as { maxHeight?: number | null } | undefined)?.maxHeight ??
        DEFAULT_PREPROCESSING_SETTINGS.resize.maxHeight,
      withoutEnlargement:
        (raw.resize as { withoutEnlargement?: boolean } | undefined)
          ?.withoutEnlargement ??
        DEFAULT_PREPROCESSING_SETTINGS.resize.withoutEnlargement,
    },
    variants: {
      original:
        (raw.variants as { original?: boolean } | undefined)?.original ??
        DEFAULT_PREPROCESSING_SETTINGS.variants.original,
      grayscale:
        (raw.variants as { grayscale?: boolean } | undefined)?.grayscale ??
        DEFAULT_PREPROCESSING_SETTINGS.variants.grayscale,
      denoised:
        (raw.variants as { denoised?: boolean } | undefined)?.denoised ??
        DEFAULT_PREPROCESSING_SETTINGS.variants.denoised,
      sharpened:
        (raw.variants as { sharpened?: boolean } | undefined)?.sharpened ??
        DEFAULT_PREPROCESSING_SETTINGS.variants.sharpened,
      clahe:
        (raw.variants as { clahe?: boolean } | undefined)?.clahe ??
        DEFAULT_PREPROCESSING_SETTINGS.variants.clahe,
    },
    parameters: {
      blurSigma:
        (raw.parameters as { blurSigma?: number } | undefined)?.blurSigma ??
        DEFAULT_PREPROCESSING_SETTINGS.parameters.blurSigma,
      sharpenSigma:
        (raw.parameters as { sharpenSigma?: number } | undefined)
          ?.sharpenSigma ??
        DEFAULT_PREPROCESSING_SETTINGS.parameters.sharpenSigma,
      sharpenM1:
        (raw.parameters as { sharpenM1?: number } | undefined)?.sharpenM1 ??
        DEFAULT_PREPROCESSING_SETTINGS.parameters.sharpenM1,
      sharpenM2:
        (raw.parameters as { sharpenM2?: number } | undefined)?.sharpenM2 ??
        DEFAULT_PREPROCESSING_SETTINGS.parameters.sharpenM2,
      brightnessLevel:
        (raw.parameters as { brightnessLevel?: number } | undefined)
          ?.brightnessLevel ??
        DEFAULT_PREPROCESSING_SETTINGS.parameters.brightnessLevel,
      claheWidth:
        (raw.parameters as { claheWidth?: number } | undefined)?.claheWidth ??
        DEFAULT_PREPROCESSING_SETTINGS.parameters.claheWidth,
      claheHeight:
        (raw.parameters as { claheHeight?: number } | undefined)?.claheHeight ??
        DEFAULT_PREPROCESSING_SETTINGS.parameters.claheHeight,
      claheMaxSlope:
        (raw.parameters as { claheMaxSlope?: number } | undefined)
          ?.claheMaxSlope ??
        DEFAULT_PREPROCESSING_SETTINGS.parameters.claheMaxSlope,
      normalizeLower:
        (raw.parameters as { normalizeLower?: number } | undefined)
          ?.normalizeLower ??
        DEFAULT_PREPROCESSING_SETTINGS.parameters.normalizeLower,
      normalizeUpper:
        (raw.parameters as { normalizeUpper?: number } | undefined)
          ?.normalizeUpper ??
        DEFAULT_PREPROCESSING_SETTINGS.parameters.normalizeUpper,
    },
  };
}

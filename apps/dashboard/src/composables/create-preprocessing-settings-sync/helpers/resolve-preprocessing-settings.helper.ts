import { clonePreprocessingSettings } from '@/stores/preprocessing-settings/helpers/clone-preprocessing-settings.helper';
import {
  DEFAULT_PREPROCESSING_SETTINGS,
  PREPROCESSING_SIZES,
} from '@/stores/preprocessing-settings/preprocessing-settings.constant';
import type {
  PreprocessingSettings,
  PreprocessingSize,
} from '@/types/preprocessing.model';

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function readBoolean(
  record: Record<string, unknown>,
  key: string,
): boolean | undefined {
  const value = record[key];
  return typeof value === 'boolean' ? value : undefined;
}

function readNumber(
  record: Record<string, unknown>,
  key: string,
  minimum: number,
  maximum: number,
  integer = false,
): number | undefined {
  const value = record[key];
  if (
    typeof value !== 'number' ||
    !Number.isFinite(value) ||
    value < minimum ||
    value > maximum ||
    (integer && !Number.isInteger(value))
  ) {
    return undefined;
  }
  return value;
}

function isPreprocessingSize(value: unknown): value is PreprocessingSize {
  return (
    typeof value === 'number' &&
    PREPROCESSING_SIZES.some((size) => size === value)
  );
}

function mergeResizePatch(
  result: PreprocessingSettings,
  source: unknown,
): void {
  const resize = asRecord(source);
  if (!resize) return;
  if (isPreprocessingSize(resize.maxWidth)) {
    result.resize.maxWidth = resize.maxWidth;
  }
  if (resize.maxHeight === null) {
    result.resize.maxHeight = null;
  } else {
    const maxHeight = readNumber(resize, 'maxHeight', 64, 4096, true);
    if (maxHeight !== undefined) result.resize.maxHeight = maxHeight;
  }
  const withoutEnlargement = readBoolean(resize, 'withoutEnlargement');
  if (withoutEnlargement !== undefined) {
    result.resize.withoutEnlargement = withoutEnlargement;
  }
}

function mergeVariantPatch(
  result: PreprocessingSettings,
  source: unknown,
): void {
  const variants = asRecord(source);
  if (!variants) return;
  for (const key of Object.keys(result.variants) as Array<
    keyof PreprocessingSettings['variants']
  >) {
    const value = readBoolean(variants, key);
    if (value !== undefined) result.variants[key] = value;
  }
}

function mergeParameterPatch(
  result: PreprocessingSettings,
  source: unknown,
): void {
  const parameters = asRecord(source);
  if (!parameters) return;

  const blurSigma = readNumber(parameters, 'blurSigma', 0, 10);
  if (blurSigma !== undefined) result.parameters.blurSigma = blurSigma;
  const sharpenSigma = readNumber(parameters, 'sharpenSigma', 0, 10);
  if (sharpenSigma !== undefined) result.parameters.sharpenSigma = sharpenSigma;
  const sharpenM1 = readNumber(parameters, 'sharpenM1', 0, 10);
  if (sharpenM1 !== undefined) result.parameters.sharpenM1 = sharpenM1;
  const sharpenM2 = readNumber(parameters, 'sharpenM2', 0, 10);
  if (sharpenM2 !== undefined) result.parameters.sharpenM2 = sharpenM2;
  const brightnessLevel = readNumber(parameters, 'brightnessLevel', 0.1, 5);
  if (brightnessLevel !== undefined) {
    result.parameters.brightnessLevel = brightnessLevel;
  }
  const claheWidth = readNumber(parameters, 'claheWidth', 1, 64, true);
  if (claheWidth !== undefined) result.parameters.claheWidth = claheWidth;
  const claheHeight = readNumber(parameters, 'claheHeight', 1, 64, true);
  if (claheHeight !== undefined) result.parameters.claheHeight = claheHeight;
  const claheMaxSlope = readNumber(parameters, 'claheMaxSlope', 1, 10);
  if (claheMaxSlope !== undefined) {
    result.parameters.claheMaxSlope = claheMaxSlope;
  }
  const normalizeLower = readNumber(parameters, 'normalizeLower', 0, 100);
  if (normalizeLower !== undefined) {
    result.parameters.normalizeLower = normalizeLower;
  }
  const normalizeUpper = readNumber(parameters, 'normalizeUpper', 0, 100);
  if (normalizeUpper !== undefined) {
    result.parameters.normalizeUpper = normalizeUpper;
  }
}

/** Overlay one validated patch, preserving the prior value for every absent or invalid field. */
function mergePreprocessingPatch(
  base: PreprocessingSettings,
  patch: unknown,
): PreprocessingSettings {
  const result = clonePreprocessingSettings(base);
  const source = asRecord(patch);
  if (!source) return result;

  const enabled = readBoolean(source, 'enabled');
  if (enabled !== undefined) result.enabled = enabled;
  mergeResizePatch(result, source.resize);
  mergeVariantPatch(result, source.variants);
  mergeParameterPatch(result, source.parameters);
  return result;
}

/** Resolve defaults, global overrides, then session overrides with per-field precedence. */
export function resolvePreprocessingSettings(
  globalSettings: unknown,
  sessionSettings: unknown,
): PreprocessingSettings {
  const withGlobalSettings = mergePreprocessingPatch(
    DEFAULT_PREPROCESSING_SETTINGS,
    globalSettings,
  );
  return mergePreprocessingPatch(withGlobalSettings, sessionSettings);
}

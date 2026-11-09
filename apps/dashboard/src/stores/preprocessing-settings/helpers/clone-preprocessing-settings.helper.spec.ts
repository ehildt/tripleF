import { describe, expect, it } from 'vitest';

import { DEFAULT_PREPROCESSING_SETTINGS } from '../preprocessing-settings.constant';
import { clonePreprocessingSettings } from './clone-preprocessing-settings.helper';

describe('clonePreprocessingSettings', () => {
  it('copies every value and nested group', () => {
    const clone = clonePreprocessingSettings(DEFAULT_PREPROCESSING_SETTINGS);

    expect(clone).toEqual(DEFAULT_PREPROCESSING_SETTINGS);
    expect(clone).not.toBe(DEFAULT_PREPROCESSING_SETTINGS);
    expect(clone.resize).not.toBe(DEFAULT_PREPROCESSING_SETTINGS.resize);
    expect(clone.variants).not.toBe(DEFAULT_PREPROCESSING_SETTINGS.variants);
    expect(clone.parameters).not.toBe(
      DEFAULT_PREPROCESSING_SETTINGS.parameters,
    );
  });

  it('does not mutate the source when a clone changes', () => {
    const clone = clonePreprocessingSettings(DEFAULT_PREPROCESSING_SETTINGS);

    clone.resize.maxWidth = 256;
    clone.variants.grayscale = true;
    clone.parameters.blurSigma = 4;

    expect(DEFAULT_PREPROCESSING_SETTINGS.resize.maxWidth).toBe(768);
    expect(DEFAULT_PREPROCESSING_SETTINGS.variants.grayscale).toBe(false);
    expect(DEFAULT_PREPROCESSING_SETTINGS.parameters.blurSigma).toBe(0.5);
  });
});

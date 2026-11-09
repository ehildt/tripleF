import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it } from 'vitest';

import {
  DEFAULT_PREPROCESSING_SETTINGS,
  PREPROCESSING_SIZES,
  VARIANT_DESCRIPTIONS,
} from './preprocessing-settings.constant';
import { usePreprocessingSettingsStore } from './preprocessing-settings.store';

describe('constants', () => {
  it('PREPROCESSING_SIZES has expected values', () => {
    expect(PREPROCESSING_SIZES).toEqual([256, 384, 512, 640, 768, 1024]);
  });

  it('VARIANT_DESCRIPTIONS has descriptions for all variants', () => {
    expect(Object.keys(VARIANT_DESCRIPTIONS)).toEqual([
      'original',
      'grayscale',
      'denoised',
      'sharpened',
      'clahe',
    ]);
  });
});

describe('usePreprocessingSettingsStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('initializes with independent default settings', () => {
    const store = usePreprocessingSettingsStore();
    expect(store.enabled).toBe(true);
    expect(store.settings).toEqual(DEFAULT_PREPROCESSING_SETTINGS);
    expect(store.settings.resize).not.toBe(
      DEFAULT_PREPROCESSING_SETTINGS.resize,
    );
    expect(store.settings.variants).not.toBe(
      DEFAULT_PREPROCESSING_SETTINGS.variants,
    );
    expect(store.settings.parameters).not.toBe(
      DEFAULT_PREPROCESSING_SETTINGS.parameters,
    );
  });

  it('toggles enabled', () => {
    const store = usePreprocessingSettingsStore();
    store.setEnabled(false);
    expect(store.enabled).toBe(false);
    store.setEnabled(true);
    expect(store.enabled).toBe(true);
  });

  it('updates maxWidth', () => {
    const store = usePreprocessingSettingsStore();
    store.setMaxWidth(512);
    expect(store.resize.maxWidth).toBe(512);
  });

  it('updates maxHeight', () => {
    const store = usePreprocessingSettingsStore();
    store.setMaxHeight(1024);
    expect(store.resize.maxHeight).toBe(1024);
    store.setMaxHeight(null);
    expect(store.resize.maxHeight).toBeNull();
  });

  it('updates withoutEnlargement', () => {
    const store = usePreprocessingSettingsStore();
    store.setWithoutEnlargement(false);
    expect(store.resize.withoutEnlargement).toBe(false);
  });

  it('sets variant', () => {
    const store = usePreprocessingSettingsStore();
    store.setVariant('grayscale', true);
    expect(store.variants.grayscale).toBe(true);
  });

  it('sets parameter', () => {
    const store = usePreprocessingSettingsStore();
    store.setParameter('blurSigma', 2);
    expect(store.parameters.blurSigma).toBe(2);
  });

  it('applies hydrated settings without retaining the input references', () => {
    const store = usePreprocessingSettingsStore();
    const hydrated = structuredClone(DEFAULT_PREPROCESSING_SETTINGS);
    hydrated.enabled = false;
    hydrated.variants.grayscale = true;

    store.applySettings(hydrated);
    hydrated.variants.grayscale = false;

    expect(store.enabled).toBe(false);
    expect(store.variants.grayscale).toBe(true);
  });

  it('resetToDefaults restores every nested group without mutating defaults', () => {
    const store = usePreprocessingSettingsStore();
    store.setVariant('grayscale', true);
    store.setParameter('blurSigma', 99);
    store.setMaxWidth(256);

    store.resetToDefaults();

    expect(store.settings).toEqual(DEFAULT_PREPROCESSING_SETTINGS);
    expect(DEFAULT_PREPROCESSING_SETTINGS.variants.grayscale).toBe(false);
    expect(DEFAULT_PREPROCESSING_SETTINGS.parameters.blurSigma).toBe(0.5);
  });

  it('detects whether a parameter differs from its default', () => {
    const store = usePreprocessingSettingsStore();
    expect(store.isParameterModified('blurSigma')).toBe(false);
    store.setParameter('blurSigma', 5);
    expect(store.isParameterModified('blurSigma')).toBe(true);
    store.setParameter('blurSigma', 0.5);
    expect(store.isParameterModified('blurSigma')).toBe(false);
  });
});

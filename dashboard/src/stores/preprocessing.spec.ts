import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it } from 'vitest';

import {
  DEFAULT_PREPROCESSING_SETTINGS,
  PREPROCESSING_SIZES,
  usePreprocessingStore,
  VARIANT_DESCRIPTIONS,
} from './preprocessing';

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

describe('usePreprocessingStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    localStorage.clear();
  });

  it('initializes with default settings', () => {
    const store = usePreprocessingStore();
    expect(store.enabled).toBe(true);
    expect(store.settings).toMatchObject(DEFAULT_PREPROCESSING_SETTINGS);
  });

  it('toggles enabled', () => {
    const store = usePreprocessingStore();
    store.setEnabled(false);
    expect(store.enabled).toBe(false);
    store.setEnabled(true);
    expect(store.enabled).toBe(true);
  });

  it('updates maxWidth', () => {
    const store = usePreprocessingStore();
    store.setMaxWidth(512);
    expect(store.resize.maxWidth).toBe(512);
  });

  it('updates maxHeight', () => {
    const store = usePreprocessingStore();
    store.setMaxHeight(1024);
    expect(store.resize.maxHeight).toBe(1024);
    store.setMaxHeight(null);
    expect(store.resize.maxHeight).toBeNull();
  });

  it('updates withoutEnlargement', () => {
    const store = usePreprocessingStore();
    store.setWithoutEnlargement(false);
    expect(store.resize.withoutEnlargement).toBe(false);
  });

  it('sets variant', () => {
    const store = usePreprocessingStore();
    store.setVariant('grayscale', true);
    expect(store.variants.grayscale).toBe(true);
  });

  it('sets parameter', () => {
    const store = usePreprocessingStore();
    store.setParameter('blurSigma', 2);
    expect(store.parameters.blurSigma).toBe(2);
  });

  it('isEffectivelyEnabled is false when enabled is false', () => {
    const store = usePreprocessingStore();
    store.setEnabled(false);
    expect(store.isEffectivelyEnabled).toBe(false);
  });

  it('isEffectivelyEnabled is false when no variants selected', () => {
    const store = usePreprocessingStore();
    store.setVariant('original', false);
    expect(store.isEffectivelyEnabled).toBe(false);
  });

  it('isParameterHighlighted reflects hovered variant', () => {
    const store = usePreprocessingStore();
    store.setHoveredVariant('denoised');
    expect(store.isParameterHighlighted('blurSigma')).toBe(true);
    expect(store.isParameterHighlighted('claheWidth')).toBe(false);
  });

  it('isVariantHighlighted reflects hovered parameter', () => {
    const store = usePreprocessingStore();
    store.setHoveredParameter('blurSigma');
    expect(store.isVariantHighlighted('denoised')).toBe(true);
    expect(store.isVariantHighlighted('sharpened')).toBe(false);
  });

  it('resetToDefaults restores all defaults', () => {
    const store = usePreprocessingStore();
    store.setVariant('grayscale', true);
    store.setParameter('blurSigma', 99);
    store.resetToDefaults();
    expect(store.variants.grayscale).toBe(false);
    expect(store.parameters.blurSigma).toBe(0.5);
  });

  describe('getSummary', () => {
    it('returns Disabled when off', () => {
      const store = usePreprocessingStore();
      store.setEnabled(false);
      expect(store.getSummary()).toBe('Disabled');
    });

    it('lists active variants and size', () => {
      const store = usePreprocessingStore();
      store.setVariant('grayscale', true);
      expect(store.getSummary()).toContain('768');
      expect(store.getSummary()).toContain('grayscale');
    });
  });

  describe('resetParameter / isParameterModified', () => {
    it('detects modified parameters', () => {
      const store = usePreprocessingStore();
      expect(store.isParameterModified('blurSigma')).toBe(false);
      store.setParameter('blurSigma', 5);
      expect(store.isParameterModified('blurSigma')).toBe(true);
      store.resetParameter('blurSigma');
      expect(store.isParameterModified('blurSigma')).toBe(false);
    });
  });
});

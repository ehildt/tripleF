import { resolveSize, SharpConfigAdapter } from './sharp-config.adapter.js';

describe('SharpConfigAdapter', () => {
  it('returns defaults when env is empty', () => {
    const config = SharpConfigAdapter({});

    expect(config.enabled).toBe(true);
    expect(config.resize).toEqual({
      maxWidth: 768,
      maxHeight: null,
      withoutEnlargement: true,
    });
    expect(config.variants).toEqual({
      original: true,
      grayscale: false,
      denoised: false,
      sharpened: false,
      clahe: false,
    });
    expect(config.parameters).toEqual({
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
    });
  });

  it('overrides defaults from env', () => {
    const config = SharpConfigAdapter({
      PPROC_ENABLED: 'true',
      PPROC_RESIZE_MAX_WIDTH: '1024',
      PPROC_RESIZE_MAX_HEIGHT: '640',
      PPROC_RESIZE_WITHOUT_ENLARGEMENT: 'false',
      PPROC_VARIANT_ORIGINAL: 'false',
      PPROC_VARIANT_GRAYSCALE: 'false',
      PPROC_VARIANT_DENOISED: 'false',
      PPROC_VARIANT_SHARPENED: 'true',
      PPROC_VARIANT_CLAHE: 'false',
      PPROC_BLUR_SIGMA: '1.5',
      PPROC_SHARPEN_SIGMA: '2',
      PPROC_SHARPEN_M1: '3',
      PPROC_SHARPEN_M2: '4',
      PPROC_CONTRAST_LEVEL: '2',
      PPROC_BRIGHTNESS_LEVEL: '1.5',
      PPROC_CLAHE_WIDTH: '16',
      PPROC_CLAHE_HEIGHT: '16',
      PPROC_CLAHE_MAX_SLOPE: '5',
      PPROC_NORMALIZE_LOWER: '2',
      PPROC_NORMALIZE_UPPER: '98',
    });

    expect(config.enabled).toBe(true);
    expect(config.resize).toEqual({
      maxWidth: 1024,
      maxHeight: 640,
      withoutEnlargement: false,
    });
    expect(config.variants).toEqual({
      original: false,
      grayscale: false,
      denoised: false,
      sharpened: true,
      clahe: false,
    });
    expect(config.parameters).toEqual({
      blurSigma: 1.5,
      sharpenSigma: 2,
      sharpenM1: 3,
      sharpenM2: 4,
      contrastLevel: 2,
      brightnessLevel: 1.5,
      claheWidth: 16,
      claheHeight: 16,
      claheMaxSlope: 5,
      normalizeLower: 2,
      normalizeUpper: 98,
    });
  });

  it('ignores invalid resize widths and falls back', () => {
    const config = SharpConfigAdapter({
      PPROC_RESIZE_MAX_WIDTH: '999',
    });

    expect(config.resize.maxWidth).toBe(768);
  });

  it('sets maxHeight to null when env value is empty', () => {
    const config = SharpConfigAdapter({
      PPROC_RESIZE_MAX_HEIGHT: '',
    });

    expect(config.resize.maxHeight).toBeNull();
  });
});

describe('resolveSize', () => {
  it('returns fallback for undefined value', () => {
    expect(resolveSize(undefined, 512)).toBe(512);
  });

  it('returns valid size', () => {
    expect(resolveSize(256, 768)).toBe(256);
  });

  it('returns fallback for invalid size', () => {
    expect(resolveSize(100, 768)).toBe(768);
  });
});

import { describe, expect, it, vi } from 'vitest';

import { FastifyMultipartMeta } from '../../harness/dtos/harness-job.dto.js';
import { SharpOptions } from '../dtos/sharp-options.dto.js';

import {
  buildVariantMeta,
  getEnabledVariants,
  getVariantDescription,
  getVariantPipeline,
} from './image-variant.helper.js';

describe('image-variant helpers', () => {
  const parameters: Required<SharpOptions>['parameters'] = {
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
  };

  const meta: FastifyMultipartMeta = {
    name: 'upload.png',
    type: 'image/png',
    hash: 'abc123',
  };

  describe('getEnabledVariants', () => {
    it('returns only enabled variants', () => {
      const variants: Required<SharpOptions>['variants'] = {
        original: true,
        grayscale: false,
        denoised: true,
        sharpened: false,
        clahe: true,
      };

      expect(getEnabledVariants(variants)).toEqual([
        'original',
        'denoised',
        'clahe',
      ]);
    });

    it('returns an empty array when all variants are disabled', () => {
      const variants: Required<SharpOptions>['variants'] = {
        original: false,
        grayscale: false,
        denoised: false,
        sharpened: false,
        clahe: false,
      };

      expect(getEnabledVariants(variants)).toEqual([]);
    });
  });

  describe('getVariantPipeline', () => {
    const mockPipeline = () =>
      ({
        grayscale: vi.fn().mockReturnThis(),
        blur: vi.fn().mockReturnThis(),
        sharpen: vi.fn().mockReturnThis(),
        clahe: vi.fn().mockReturnThis(),
      }) as unknown as ReturnType<typeof import('sharp').default>;

    it('original leaves the pipeline unchanged', () => {
      const pipeline = mockPipeline();
      const transformer = getVariantPipeline('original', parameters);

      expect(transformer(pipeline)).toBe(pipeline);
      expect(pipeline.grayscale).not.toHaveBeenCalled();
    });

    it('grayscale applies grayscale', () => {
      const pipeline = mockPipeline();
      const transformer = getVariantPipeline('grayscale', parameters);

      transformer(pipeline);

      expect(pipeline.grayscale).toHaveBeenCalled();
    });

    it('denoised applies blur with configured sigma without grayscale', () => {
      const pipeline = mockPipeline();
      const transformer = getVariantPipeline('denoised', parameters);

      transformer(pipeline);

      expect(pipeline.grayscale).not.toHaveBeenCalled();
      expect(pipeline.blur).toHaveBeenCalledWith(parameters.blurSigma);
    });

    it('sharpened applies sharpen with configured parameters', () => {
      const pipeline = mockPipeline();
      const transformer = getVariantPipeline('sharpened', parameters);

      transformer(pipeline);

      expect(pipeline.sharpen).toHaveBeenCalledWith({
        sigma: parameters.sharpenSigma,
        m1: parameters.sharpenM1,
        m2: parameters.sharpenM2,
      });
    });

    it('clahe applies grayscale and clahe with configured parameters', () => {
      const pipeline = mockPipeline();
      const transformer = getVariantPipeline('clahe', parameters);

      transformer(pipeline);

      expect(pipeline.grayscale).toHaveBeenCalled();
      expect(pipeline.clahe).toHaveBeenCalledWith({
        width: parameters.claheWidth,
        height: parameters.claheHeight,
        maxSlope: parameters.claheMaxSlope,
      });
    });
  });

  describe('buildVariantMeta', () => {
    it('builds metadata with the variant suffix', () => {
      expect(buildVariantMeta(meta, 'grayscale')).toEqual({
        name: 'upload_grayscale.png',
        type: 'image/png',
        hash: 'abc123_grayscale',
        variant: 'grayscale',
      });
    });

    it('falls back to png extension when the name has no extension', () => {
      expect(buildVariantMeta({ ...meta, name: 'upload' }, 'original')).toEqual(
        {
          name: 'upload_original.png',
          type: 'image/png',
          hash: 'abc123_original',
          variant: 'original',
        },
      );
    });
  });

  describe('getVariantDescription', () => {
    it('returns the description for a known variant', () => {
      expect(getVariantDescription('grayscale')).toContain('grayscale');
    });

    it('falls back to the variant name for unknown variants', () => {
      expect(getVariantDescription('unknown' as any)).toBe('unknown');
    });
  });
});

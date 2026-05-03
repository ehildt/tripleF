import { Test, TestingModule } from '@nestjs/testing';
import { Sharp } from 'sharp';
import { describe, expect, it, vi } from 'vitest';

import { FastifyMultipartMeta } from '../../harness/dtos/harness-job.dto.js';
import { SharpOptions } from '../dtos/sharp-options.dto.js';

import { ImageVariantProcessor } from './image-variant-processor.service.js';

describe('ImageVariantProcessor', () => {
  let processor: ImageVariantProcessor;

  const resize: Required<SharpOptions>['resize'] = {
    maxWidth: 768,
    maxHeight: null,
    withoutEnlargement: true,
  };

  const meta: FastifyMultipartMeta = {
    name: 'test.png',
    type: 'image/png',
    hash: 'hash-1',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ImageVariantProcessor],
    }).compile();

    processor = module.get<ImageVariantProcessor>(ImageVariantProcessor);
  });

  it('should be defined', () => {
    expect(processor).toBeDefined();
  });

  describe('process', () => {
    it('executes the pipeline and returns a packaged variant', async () => {
      const outputBuffer = Buffer.from('processed');
      const pipeline = {
        clone: vi.fn().mockReturnThis(),
        png: vi.fn().mockReturnThis(),
        toBuffer: vi.fn().mockResolvedValue(outputBuffer),
      } as unknown as Sharp;

      const variantPipeline = (p: Sharp) => p;

      const result = await processor.process(
        pipeline,
        meta,
        'grayscale',
        variantPipeline,
      );

      expect(result.buffer).toBe(outputBuffer);
      expect(result.variant).toBe('grayscale');
      expect(result.meta).toEqual({
        name: 'test_grayscale.png',
        type: 'image/png',
        hash: 'hash-1_grayscale',
        variant: 'grayscale',
      });
      expect(result.description).toContain('grayscale');
    });
  });

  describe('createOriginal', () => {
    it('returns the resized image when sharp succeeds', async () => {
      const result = await processor.createOriginal(
        Buffer.from('image'),
        meta,
        resize,
      );

      expect(result.variant).toBe('original');
      expect(result.meta.variant).toBe('original');
      expect(Buffer.isBuffer(result.buffer)).toBe(true);
    });

    it('falls back to the raw buffer when sharp fails', async () => {
      const invalidBuffer = Buffer.from('not-an-image');
      const result = await processor.createOriginal(
        invalidBuffer,
        meta,
        resize,
      );

      expect(result.buffer).toBe(invalidBuffer);
      expect(result.variant).toBe('original');
    });
  });
});

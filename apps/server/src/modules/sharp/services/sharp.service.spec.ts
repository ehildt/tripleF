import { Logger } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { describe, expect, it, type Mocked, vi } from 'vitest';

// Negative-path cases exercise failure logging — silence the logger so the
// expected errors don't pollute CI output.
vi.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);

import type { FastifyMultipartMeta } from '../../harness/dtos/harness-job.dto.js';
import { SharpConfigService } from '../configs/sharp-config.service.js';
import { PreprocessedImage, SharpOptions } from '../dtos/sharp-options.dto.js';

import { ImagePipelineFactory } from './image-pipeline-factory.service.js';
import { ImageVariantProcessor } from './image-variant-processor.service.js';
import { SharpService } from './sharp.service.js';
import { SharpOverridesService } from './sharp-overrides.service.js';

describe('SharpService', () => {
  let service: SharpService;
  let sharpOverrides: Mocked<SharpOverridesService>;
  let pipelineFactory: Mocked<ImagePipelineFactory>;
  let variantProcessor: Mocked<ImageVariantProcessor>;

  const defaults = {
    enabled: true,
    resize: {
      maxWidth: 768,
      maxHeight: null,
      withoutEnlargement: true,
    },
    variants: {
      original: true,
      grayscale: true,
      denoised: true,
      sharpened: false,
      clahe: true,
    },
    parameters: {
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
    },
  };

  const meta: FastifyMultipartMeta[] = [
    {
      name: 'test.png',
      type: 'image/png',
      hash: 'hash-1',
    },
  ];

  const buffer = Buffer.from('test');

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SharpService,
        {
          provide: SharpConfigService,
          useValue: { defaults },
        },
        {
          provide: SharpOverridesService,
          useValue: {
            buildOptions: vi.fn(),
          },
        },
        {
          provide: ImagePipelineFactory,
          useValue: {
            createBasePipeline: vi.fn(),
            buildVariantPipelines: vi.fn(),
          },
        },
        {
          provide: ImageVariantProcessor,
          useValue: {
            process: vi.fn(),
            createOriginal: vi.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<SharpService>(SharpService);
    sharpOverrides = module.get(SharpOverridesService);
    pipelineFactory = module.get(ImagePipelineFactory);
    variantProcessor = module.get(ImageVariantProcessor);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('buildOptions', () => {
    it('delegates to the sharp overrides service', () => {
      const expected: SharpOptions = { enabled: true };

      sharpOverrides.buildOptions.mockReturnValue(expected);

      expect(service.buildOptions()).toBe(expected);
      expect(sharpOverrides.buildOptions).toHaveBeenCalledWith();
    });
  });

  describe('preprocessImages', () => {
    it('returns only resized originals when preprocessing is disabled', async () => {
      const original: PreprocessedImage = {
        buffer,
        meta: { ...meta[0], variant: 'original' },
        variant: 'original',
        description: 'original',
      };

      variantProcessor.createOriginal.mockResolvedValue(original);

      const result = await service.preprocessImages([buffer], meta, {
        enabled: false,
      });

      expect(result).toEqual([original]);
      expect(variantProcessor.createOriginal).toHaveBeenCalledWith(
        buffer,
        meta[0],
        defaults.resize,
      );
      expect(pipelineFactory.buildVariantPipelines).not.toHaveBeenCalled();
    });

    it('creates all enabled variants for each image', async () => {
      const basePipeline = {} as any;
      const variantPipelines = [
        { variant: 'original' as const, pipeline: vi.fn() },
        { variant: 'grayscale' as const, pipeline: vi.fn() },
      ];
      const original: PreprocessedImage = {
        buffer,
        meta: { ...meta[0], variant: 'original' },
        variant: 'original',
        description: 'original',
      };
      const grayscale: PreprocessedImage = {
        buffer,
        meta: { ...meta[0], variant: 'grayscale' },
        variant: 'grayscale',
        description: 'grayscale',
      };

      pipelineFactory.createBasePipeline.mockReturnValue(basePipeline);
      pipelineFactory.buildVariantPipelines.mockReturnValue(variantPipelines);
      variantProcessor.process
        .mockResolvedValueOnce(original)
        .mockResolvedValueOnce(grayscale);

      const result = await service.preprocessImages([buffer], meta, {
        enabled: true,
      });

      expect(result).toEqual([original, grayscale]);
      expect(pipelineFactory.createBasePipeline).toHaveBeenCalledWith(
        buffer,
        defaults.resize,
      );
      expect(variantProcessor.process).toHaveBeenNthCalledWith(
        1,
        basePipeline,
        meta[0],
        'original',
        variantPipelines[0].pipeline,
      );
      expect(variantProcessor.process).toHaveBeenNthCalledWith(
        2,
        basePipeline,
        meta[0],
        'grayscale',
        variantPipelines[1].pipeline,
      );
    });

    it('falls back to original when a variant batch fails', async () => {
      const basePipeline = {} as any;
      const variantPipelines = [
        { variant: 'original' as const, pipeline: vi.fn() },
      ];
      const fallback: PreprocessedImage = {
        buffer,
        meta: { ...meta[0], variant: 'original' },
        variant: 'original',
        description: 'original',
      };

      pipelineFactory.createBasePipeline.mockReturnValue(basePipeline);
      pipelineFactory.buildVariantPipelines.mockReturnValue(variantPipelines);
      variantProcessor.process.mockRejectedValue(new Error('pipeline failed'));
      variantProcessor.createOriginal.mockResolvedValue(fallback);

      const result = await service.preprocessImages([buffer], meta, {
        enabled: true,
      });

      expect(result).toEqual([fallback]);
      expect(variantProcessor.createOriginal).toHaveBeenCalledWith(
        buffer,
        meta[0],
        defaults.resize,
      );
    });
  });
});

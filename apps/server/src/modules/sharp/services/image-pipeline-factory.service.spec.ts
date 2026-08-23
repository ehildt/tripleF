import { Test, TestingModule } from '@nestjs/testing';

import { SharpOptions } from '../dtos/sharp-options.dto.js';

import { ImagePipelineFactory } from './image-pipeline-factory.service.js';

describe('ImagePipelineFactory', () => {
  let factory: ImagePipelineFactory;

  const options: Required<SharpOptions> = {
    enabled: true,
    resize: {
      maxWidth: 768,
      maxHeight: null,
      withoutEnlargement: true,
    },
    variants: {
      original: true,
      grayscale: true,
      denoised: false,
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

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ImagePipelineFactory],
    }).compile();

    factory = module.get<ImagePipelineFactory>(ImagePipelineFactory);
  });

  it('should be defined', () => {
    expect(factory).toBeDefined();
  });

  describe('createBasePipeline', () => {
    it('creates a sharp resize pipeline', () => {
      const buffer = Buffer.from('image');
      const pipeline = factory.createBasePipeline(buffer, options.resize);

      expect(pipeline).toBeDefined();
    });
  });

  describe('buildVariantPipelines', () => {
    it('returns only enabled variants', () => {
      const pipelines = factory.buildVariantPipelines(options);

      expect(pipelines).toHaveLength(3);
      expect(pipelines.map((p) => p.variant)).toEqual([
        'original',
        'grayscale',
        'clahe',
      ]);
      expect(pipelines.every((p) => typeof p.pipeline === 'function')).toBe(
        true,
      );
    });

    it('returns an empty array when no variants are enabled', () => {
      const disabled: Required<SharpOptions> = {
        ...options,
        variants: {
          original: false,
          grayscale: false,
          denoised: false,
          sharpened: false,
          clahe: false,
        },
      };

      expect(factory.buildVariantPipelines(disabled)).toEqual([]);
    });
  });
});

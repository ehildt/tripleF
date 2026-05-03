import { Test, TestingModule } from '@nestjs/testing';

import { HarnessStreamQueryDto } from '../../harness/dtos/harness-stream-query.dto.js';
import { SharpConfigService } from '../configs/sharp-config.service.js';

import { SharpOptionsBuilder } from './sharp-options-builder.service.js';

describe('SharpOptionsBuilder', () => {
  let builder: SharpOptionsBuilder;
  const defaults = {
    enabled: false,
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

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SharpOptionsBuilder,
        {
          provide: SharpConfigService,
          useValue: { defaults },
        },
      ],
    }).compile();

    builder = module.get<SharpOptionsBuilder>(SharpOptionsBuilder);
  });

  it('should be defined', () => {
    expect(builder).toBeDefined();
  });

  it('returns undefined when preprocessing is disabled', () => {
    const query: HarnessStreamQueryDto = {
      requestId: 'req-1',
      stream: false,
      event: 'harness',
      think: 'medium',
      pproc_enabled: false,
    };

    expect(builder.build(query)).toBeUndefined();
  });

  it('returns options merged with defaults when enabled', () => {
    const query: HarnessStreamQueryDto = {
      requestId: 'req-1',
      stream: false,
      event: 'harness',
      think: 'medium',
      pproc_enabled: true,
      pproc_resize_maxWidth: 512,
      pproc_grayscale: false,
    };

    expect(builder.build(query)).toEqual({
      enabled: true,
      resize: {
        maxWidth: 512,
        maxHeight: null,
        withoutEnlargement: true,
      },
      variants: {
        original: true,
        grayscale: false,
        denoised: true,
        sharpened: false,
        clahe: true,
      },
      parameters: {
        blurSigma: 0.5,
        sharpenSigma: 1,
        sharpenM1: 1,
        sharpenM2: 2,
        brightnessLevel: 1.2,
        claheWidth: 8,
        claheHeight: 8,
        claheMaxSlope: 3,
        normalizeLower: 1,
        normalizeUpper: 99,
      },
    });
  });
});

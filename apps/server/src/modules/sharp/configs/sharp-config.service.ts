import { Injectable } from '@nestjs/common';
import { CacheReturnValue } from '@triplef/config-factory/cache-return-value';
import { z } from 'zod';

import { SharpConfigAdapter, SharpDefaults } from './sharp-config.adapter.js';

const schema = z.strictObject({
  enabled: z.boolean(),
  resize: z.strictObject({
    maxWidth: z.number().int(),
    maxHeight: z.number().int().nullable(),
    withoutEnlargement: z.boolean(),
  }),
  variants: z.strictObject({
    original: z.boolean(),
    grayscale: z.boolean(),
    denoised: z.boolean(),
    sharpened: z.boolean(),
    clahe: z.boolean(),
  }),
  parameters: z.strictObject({
    blurSigma: z.number(),
    sharpenSigma: z.number(),
    sharpenM1: z.number(),
    sharpenM2: z.number(),
    contrastLevel: z.number(),
    brightnessLevel: z.number(),
    claheWidth: z.number().int(),
    claheHeight: z.number().int(),
    claheMaxSlope: z.number(),
    normalizeLower: z.number(),
    normalizeUpper: z.number(),
  }),
});

@Injectable()
export class SharpConfigService {
  @CacheReturnValue(schema)
  get defaults(): SharpDefaults {
    return SharpConfigAdapter();
  }
}

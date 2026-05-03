import { CacheReturnValue } from '@ehildt/nestjs-config-factory/cache-return-value';
import { Injectable } from '@nestjs/common';
import Joi from 'joi';

import { SharpConfigAdapter, SharpDefaults } from './sharp-config.adapter.js';

const schema = Joi.object({
  enabled: Joi.boolean().required(),
  resize: Joi.object({
    maxWidth: Joi.number().integer().required(),
    maxHeight: Joi.number().integer().allow(null).required(),
    withoutEnlargement: Joi.boolean().required(),
  }).required(),
  variants: Joi.object({
    original: Joi.boolean().required(),
    grayscale: Joi.boolean().required(),
    denoised: Joi.boolean().required(),
    sharpened: Joi.boolean().required(),
    clahe: Joi.boolean().required(),
  }).required(),
  parameters: Joi.object({
    blurSigma: Joi.number().required(),
    sharpenSigma: Joi.number().required(),
    sharpenM1: Joi.number().required(),
    sharpenM2: Joi.number().required(),
    contrastLevel: Joi.number().required(),
    brightnessLevel: Joi.number().required(),
    claheWidth: Joi.number().integer().required(),
    claheHeight: Joi.number().integer().required(),
    claheMaxSlope: Joi.number().required(),
    normalizeLower: Joi.number().required(),
    normalizeUpper: Joi.number().required(),
  }).required(),
});

@Injectable()
export class SharpConfigService {
  @CacheReturnValue(schema)
  get defaults(): SharpDefaults {
    return SharpConfigAdapter();
  }
}

import Joi from 'joi';

import { BullMQConfig } from './bullmq.model.ts';

export const BullMQConfigSchema = Joi.object<BullMQConfig>({
  defaultJobOptions: Joi.object({
    delay: Joi.number().min(0).optional(),
    lifo: Joi.boolean().optional(),
    priority: Joi.number().min(0).optional(),
    attempts: Joi.number().min(1).max(50).optional(),
    stackTraceLimit: Joi.number().min(1).optional(),
    removeOnComplete: Joi.object({
      age: Joi.number().optional(),
      count: Joi.number().optional(),
    }).optional(),
    removeOnFail: Joi.object({
      age: Joi.number().min(0).optional(),
      count: Joi.number().min(0).optional(),
    }).optional(),
    backoff: Joi.object({
      type: Joi.string().valid('exponential', 'fixed').optional(),
      delay: Joi.number().min(0).optional(),
    }).optional(),
  }).optional(),
  connection: Joi.object({
    enableReadyCheck: Joi.boolean().optional(),
    host: Joi.string().hostname().optional(),
    password: Joi.string().allow('').optional(),
    username: Joi.string().allow('').optional(),
    port: Joi.number().min(1).max(65535).optional(),
    connectTimeout: Joi.number().min(1000).optional(),
    commandTimeout: Joi.number().min(1000).optional(),
    retryStrategy: Joi.any().optional(),
    tls: Joi.object({
      rejectUnauthorized: Joi.boolean().optional(),
      ca: Joi.binary().optional(),
      cert: Joi.binary().optional(),
      key: Joi.binary().optional(),
      passphrase: Joi.string().optional(),
    })
      .optional()
      .allow(null),
  }).optional(),
});

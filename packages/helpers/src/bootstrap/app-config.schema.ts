import Joi from 'joi';

import { AppConfig } from './app-config.model.ts';

export const AppConfigSchema = Joi.object<AppConfig>({
  printConfig: Joi.boolean().required(),
  enableSwagger: Joi.boolean().required(),
  bodyLimit: Joi.number().min(1).required(),
  address: Joi.string()
    .ip({ version: ['ipv4', 'ipv6'] })
    .required(),
  port: Joi.number().integer().min(1).max(65535).required(),
  nodeEnv: Joi.string().valid('development', 'production', 'test', 'local').required(),
  logLevel: Joi.array()
    .items(Joi.string().valid('warn', 'error', 'debug', 'log', 'verbose', 'fatal'))
    .default(['warn', 'error', 'debug', 'log', 'verbose', 'fatal']),
  cors: Joi.object({
    origin: Joi.string().optional(),
    methods: Joi.string().optional(),
    preflightContinue: Joi.boolean().optional(),
    optionsSuccessStatus: Joi.number().optional(),
    credentials: Joi.boolean().optional(),
    allowedHeaders: Joi.string().allow(null).optional(),
  }).optional(),
  health: Joi.object({
    memoryHeap: Joi.number().min(0).optional(),
    memoryRSS: Joi.number().min(0).optional(),
    diskPath: Joi.string().optional(),
    diskThresholdPercent: Joi.number().min(0).optional(),
  }).optional(),
});

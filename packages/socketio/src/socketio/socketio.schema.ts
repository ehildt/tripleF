import Joi from 'joi';

import { SocketIOServerConfig } from './socketio.model.ts';

export const SocketIOConfigSchema = Joi.object<SocketIOServerConfig>({
  port: Joi.number().optional(),
  opts: Joi.object({
    cleanupEmptyChildNamespaces: Joi.boolean().required(),
    maxHttpBufferSize: Joi.number().required(),
    pingInterval: Joi.number().required(),
    pingTimeout: Joi.number().optional(),
    connectTimeout: Joi.number().required(),
    allowEIO3: Joi.boolean().required(),
    transports: Joi.array()
      .items(Joi.string().valid('websocket', 'polling', 'webtransport'))
      .required(),
    cors: Joi.object({
      origin: Joi.string().allow('*').required(),
      credentials: Joi.boolean().required(),
      methods: Joi.array().items(Joi.string().valid('GET', 'POST')).required(),
    }).required(),
  }).optional(),
});

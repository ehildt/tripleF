import { CacheReturnValue } from '@ehildt/nestjs-config-factory/cache-return-value';
import { SocketIOConfigSchema } from '@ehildt/nestjs-socket.io';
import { SocketIOServerConfig } from '@ehildt/nestjs-socket.io';
import { Injectable } from '@nestjs/common';
import Joi from 'joi';

import { SocketIOConfigAdapter } from './socket-io-config.adapter.js';

const extendedSchema = SocketIOConfigSchema.concat(
  Joi.object({ event: Joi.string().required() }),
);

export type SocketIOConfig = SocketIOServerConfig & { event: string };

@Injectable()
export class SocketIOConfigService {
  @CacheReturnValue(extendedSchema)
  get config(): SocketIOConfig {
    return SocketIOConfigAdapter() as SocketIOConfig;
  }
}

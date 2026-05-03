import { CacheReturnValue } from '@ehildt/nestjs-config-factory/cache-return-value';
import { SocketIOConfigSchema } from '@ehildt/nestjs-socket.io';
import { SocketIOServerConfig } from '@ehildt/nestjs-socket.io';
import { Injectable } from '@nestjs/common';

import { SocketIOConfigAdapter } from './socket-io-config.adapter.js';

@Injectable()
export class SocketIOConfigService {
  @CacheReturnValue(SocketIOConfigSchema)
  get config(): SocketIOServerConfig {
    return SocketIOConfigAdapter() as SocketIOServerConfig;
  }
}

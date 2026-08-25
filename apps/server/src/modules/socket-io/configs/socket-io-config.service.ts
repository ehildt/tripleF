import { Injectable } from '@nestjs/common';
import { CacheReturnValue } from '@triplef/config-factory/cache-return-value';
import { SocketIOConfigSchema } from '@triplef/socketio';
import { SocketIOServerConfig } from '@triplef/socketio';

import { SocketIOConfigAdapter } from './socket-io-config.adapter.js';

@Injectable()
export class SocketIOConfigService {
  @CacheReturnValue(SocketIOConfigSchema)
  get config(): SocketIOServerConfig {
    return SocketIOConfigAdapter() as SocketIOServerConfig;
  }
}

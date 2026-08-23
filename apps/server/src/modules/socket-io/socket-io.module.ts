import { Global, Module } from '@nestjs/common';

import { SocketIOConfigService } from './configs/socket-io-config.service.js';
import { SocketIOEventsService } from './services/socket-io-events.service.js';

@Global()
@Module({
  providers: [SocketIOConfigService, SocketIOEventsService],
  exports: [SocketIOConfigService, SocketIOEventsService],
})
export class SocketIOModule {}

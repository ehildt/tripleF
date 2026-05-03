import { Global, Module } from '@nestjs/common';

import { SocketIOEventsService } from './services/socket-io-events.service.js';

@Global()
@Module({
  providers: [SocketIOEventsService],
  exports: [SocketIOEventsService],
})
export class SocketIOModule {}

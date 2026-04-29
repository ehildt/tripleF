import { Global, Module } from '@nestjs/common';

import { JobTrackingService } from '../services/job-tracking.service.js';
import { SocketService } from '../services/socket.service.js';

@Global()
@Module({
  providers: [JobTrackingService, SocketService],
  exports: [JobTrackingService, SocketService],
})
export class SocketEventModule {}

import { Global, Module } from '@nestjs/common';

import { BullMQConfigService } from './configs/bullmq-config.service.js';
import { BullMQLoggerConfigService } from './configs/bullmq-logger-config.service.js';
import { BullMQController } from './controllers/bullmq.controller.js';

@Global()
@Module({
  controllers: [BullMQController],
  providers: [BullMQConfigService, BullMQLoggerConfigService],
  exports: [BullMQConfigService, BullMQLoggerConfigService],
})
export class BullMQModule {}

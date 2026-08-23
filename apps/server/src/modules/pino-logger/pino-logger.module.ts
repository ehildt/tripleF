import { Global, Module } from '@nestjs/common';

import { PinoLoggerConfigService } from './configs/pino-logger-config.service.js';
import {
  PINO_LOGGER_OPTIONS,
  PinoLoggerService,
} from './services/pino-logger.service.js';

@Global()
@Module({
  providers: [
    PinoLoggerService,
    PinoLoggerConfigService,
    {
      provide: PINO_LOGGER_OPTIONS,
      inject: [PinoLoggerConfigService],
      useFactory: (configService: PinoLoggerConfigService) =>
        configService.config,
    },
  ],
  exports: [PinoLoggerService, PinoLoggerConfigService],
})
export class PinoLoggerModule {}

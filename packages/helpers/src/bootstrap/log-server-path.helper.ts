import { Logger } from '@nestjs/common';

import { AppConfig } from './app-config.model.ts';

export function logServerPath(logger: Logger, appConfig: AppConfig) {
  logger.log(`http://localhost:${appConfig.port}`, 'REST API');
}

import { Logger } from '@nestjs/common';

import type { AppConfig } from './app-config.schema.ts';

export function logServerPath(logger: Logger, appConfig: AppConfig) {
  logger.log(`http://localhost:${appConfig.port}`, 'REST API');
}

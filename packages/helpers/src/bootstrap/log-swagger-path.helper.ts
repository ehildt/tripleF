import { Logger } from '@nestjs/common';

import { AppConfig } from './app-config.model.ts';
import { API_DOCS, API_DOCS_JSON } from './bootstrap.constants.ts';

export function logSwaggerPath(logger: Logger, appConfig: AppConfig) {
  if (!appConfig.enableSwagger) return;
  const baseUrl = `http://localhost:${appConfig.port}`;
  logger.warn(`${baseUrl}/${API_DOCS_JSON}`, 'Swagger JSON');
  logger.warn(`${baseUrl}/${API_DOCS}`, 'Swagger UI');
}

import { Logger } from '@nestjs/common';

import type { AppConfig } from './app-config.model.ts';
import { logSwaggerPath } from './log-swagger-path.helper.ts';

describe('logSwaggerPath', () => {
  let mockLogger: { warn: ReturnType<typeof vi.fn> };
  let appConfig: AppConfig;

  beforeEach(() => {
    mockLogger = {
      warn: vi.fn(),
    };
    appConfig = {
      port: 3000,
      address: '127.0.0.1',
      bodyLimit: 16777216,
      enableSwagger: true,
      nodeEnv: 'development',
      printConfig: false,
    };
  });

  test('should log swagger JSON and UI paths when swagger is enabled', () => {
    logSwaggerPath(mockLogger as unknown as Logger, appConfig);

    expect(mockLogger.warn).toHaveBeenCalledTimes(2);
    expect(mockLogger.warn).toHaveBeenNthCalledWith(1, 'http://localhost:3000/api-docs-json', 'Swagger JSON');
    expect(mockLogger.warn).toHaveBeenNthCalledWith(2, 'http://localhost:3000/api-docs', 'Swagger UI');
  });

  test('should not log anything when swagger is disabled', () => {
    appConfig.enableSwagger = false;

    logSwaggerPath(mockLogger as unknown as Logger, appConfig);

    expect(mockLogger.warn).not.toHaveBeenCalled();
  });

  test('should log with correct port', () => {
    appConfig.port = 8080;

    logSwaggerPath(mockLogger as unknown as Logger, appConfig);

    expect(mockLogger.warn).toHaveBeenCalledWith('http://localhost:8080/api-docs-json', 'Swagger JSON');
    expect(mockLogger.warn).toHaveBeenCalledWith('http://localhost:8080/api-docs', 'Swagger UI');
  });
});

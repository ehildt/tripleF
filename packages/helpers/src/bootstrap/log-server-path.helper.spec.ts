import { Logger } from '@nestjs/common';

import type { AppConfig } from './app-config.model.ts';
import { logServerPath } from './log-server-path.helper.ts';

describe('logServerPath', () => {
  let mockLogger: { log: ReturnType<typeof vi.fn> };
  let appConfig: AppConfig;

  beforeEach(() => {
    mockLogger = {
      log: vi.fn(),
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

  test('should log server path with port', () => {
    logServerPath(mockLogger as unknown as Logger, appConfig);

    expect(mockLogger.log).toHaveBeenCalledWith('http://localhost:3000', 'REST API');
  });

  test('should log server path with different port', () => {
    appConfig.port = 8080;

    logServerPath(mockLogger as unknown as Logger, appConfig);

    expect(mockLogger.log).toHaveBeenCalledWith('http://localhost:8080', 'REST API');
  });
});

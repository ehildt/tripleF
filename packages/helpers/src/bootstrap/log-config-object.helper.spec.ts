import { Logger } from '@nestjs/common';

import { logConfigObject } from './log-config-object.helper.ts';

describe('logConfigObject', () => {
  let mockLogger: { log: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    mockLogger = {
      log: vi.fn(),
    };
  });

  test('should log config object with underscore prefix stripped', () => {
    const factory = {
      _port: 3000,
      _host: 'localhost',
      _debug: true,
    };

    logConfigObject(mockLogger as unknown as Logger, factory, true);

    expect(mockLogger.log).toHaveBeenCalledWith({
      port: 3000,
      host: 'localhost',
      debug: true,
    });
  });

  test('should not log when printConfig is false', () => {
    const factory = {
      _port: 3000,
    };

    logConfigObject(mockLogger as unknown as Logger, factory, false);

    expect(mockLogger.log).not.toHaveBeenCalled();
  });

  test('should not log when printConfig is undefined (default)', () => {
    const factory = {
      _port: 3000,
    };

    logConfigObject(mockLogger as unknown as Logger, factory);

    expect(mockLogger.log).not.toHaveBeenCalled();
  });

  test('should handle empty factory object', () => {
    logConfigObject(mockLogger as unknown as Logger, {}, true);

    expect(mockLogger.log).toHaveBeenCalledWith({});
  });

  test('should always slice first character from keys', () => {
    const factory = {
      port: 3000,
      host: 'localhost',
    };

    logConfigObject(mockLogger as unknown as Logger, factory, true);

    expect(mockLogger.log).toHaveBeenCalledWith({
      ort: 3000,
      ost: 'localhost',
    });
  });

  test('should handle mixed keys (some with underscore, some without)', () => {
    const factory = {
      _port: 3000,
      host: 'localhost',
      _debug: true,
    };

    logConfigObject(mockLogger as unknown as Logger, factory, true);

    expect(mockLogger.log).toHaveBeenCalledWith({
      port: 3000,
      ost: 'localhost',
      debug: true,
    });
  });
});

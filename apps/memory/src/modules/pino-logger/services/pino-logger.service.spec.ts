import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockLogger } = vi.hoisted(() => ({
  mockLogger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
    trace: vi.fn(),
    fatal: vi.fn(),
  },
}));

vi.mock('pino', () => ({
  default: vi.fn(() => mockLogger),
}));

import { PinoLoggerService } from './pino-logger.service.js';

describe('PinoLoggerService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  function createService(): PinoLoggerService {
    return new PinoLoggerService({} as never);
  }

  it('logs a plain message at info level', () => {
    createService().log('hello');
    expect(mockLogger.info).toHaveBeenCalledWith('hello');
  });

  it('logs a message with a context string', () => {
    createService().log('hello', 'MyContext');
    expect(mockLogger.info).toHaveBeenCalledWith(
      { context: 'MyContext' },
      'hello',
    );
  });

  it('logs a message with a meta object', () => {
    createService().log('hello', { requestId: '1' });
    expect(mockLogger.info).toHaveBeenCalledWith({ requestId: '1' }, 'hello');
  });

  it('routes error to the error level', () => {
    createService().error('boom');
    expect(mockLogger.error).toHaveBeenCalledWith('boom');
  });

  it('routes warn to the warn level', () => {
    createService().warn('careful');
    expect(mockLogger.warn).toHaveBeenCalledWith('careful');
  });

  it('routes verbose to the trace level', () => {
    createService().verbose('detail');
    expect(mockLogger.trace).toHaveBeenCalledWith('detail');
  });

  it('routes fatal to the fatal level', () => {
    createService().fatal('crash');
    expect(mockLogger.fatal).toHaveBeenCalledWith('crash');
  });
});

import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockLogger } = vi.hoisted(() => ({
  mockLogger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
    trace: vi.fn(),
    fatal: vi.fn(),
    level: 'info',
  },
}));

vi.mock('pino', () => ({
  default: vi.fn(() => mockLogger),
}));

import { CoreLoggerService } from './core-logger.service.ts';

describe('CoreLoggerService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLogger.level = 'info';
  });

  function createService(): CoreLoggerService {
    return new CoreLoggerService({} as never);
  }

  it('logs a plain message at info level', () => {
    createService().log('hello');
    expect(mockLogger.info).toHaveBeenCalledWith('hello');
  });

  it('renders the trailing string as the NestJS context binding', () => {
    createService().log('hello', 'MyContext');
    expect(mockLogger.info).toHaveBeenCalledWith({ context: 'MyContext' }, 'hello');
  });

  it('supports pino object-first form with message and context', () => {
    createService().log({ requestId: 'r-1' }, 'request received', 'Harness');
    expect(mockLogger.info).toHaveBeenCalledWith({ requestId: 'r-1', context: 'Harness' }, 'request received');
  });

  it('supports pino object-first form without a context', () => {
    createService().log({ requestId: 'r-1' }, 'request received');
    expect(mockLogger.info).toHaveBeenCalledWith({ requestId: 'r-1' }, 'request received');
  });

  it('merges a trailing meta object into the bindings', () => {
    createService().log('hello', { requestId: 'r-1' }, 'MyContext');
    expect(mockLogger.info).toHaveBeenCalledWith({ context: 'MyContext', requestId: 'r-1' }, 'hello');
  });

  it('binds an Error passed as the message under err', () => {
    const error = new Error('boom');
    createService().error(error, 'MyContext');
    expect(mockLogger.error).toHaveBeenCalledWith({ context: 'MyContext', err: error }, 'boom');
  });

  it('binds an Error parameter under err at any level', () => {
    const error = new Error('boom');
    createService().warn('join failed:', error, 'SocketIo');
    expect(mockLogger.warn).toHaveBeenCalledWith({ context: 'SocketIo', err: error }, 'join failed:');
  });

  it('keeps a stack string verbatim under stack on error(message, stack, context)', () => {
    const stack = 'Error: boom\n    at fn (file.ts:1:1)';
    createService().error('boom', stack, 'ExceptionsHandler');
    expect(mockLogger.error).toHaveBeenCalledWith({ context: 'ExceptionsHandler', stack }, 'boom');
  });

  it('does not treat an optional-param string at info level as a stack', () => {
    createService().log('hello', 'world', 'MyContext');
    expect(mockLogger.info).toHaveBeenCalledWith({ context: 'MyContext' }, 'hello', 'world');
  });

  it('routes verbose to trace and fatal to fatal', () => {
    const service = createService();
    service.verbose('deep');
    service.fatal('crash');
    expect(mockLogger.trace).toHaveBeenCalledWith('deep');
    expect(mockLogger.fatal).toHaveBeenCalledWith('crash');
  });

  it('defaults a nullish message to an empty string', () => {
    createService().log(undefined, 'MyContext');
    expect(mockLogger.info).toHaveBeenCalledWith({ context: 'MyContext' }, '');
  });

  it.each([
    [['error', 'fatal'], 'error'],
    [['warn', 'error', 'fatal'], 'warn'],
    [['log', 'warn', 'error', 'fatal'], 'info'],
    [['verbose'], 'trace'],
    [[], 'silent'],
  ] as const)('setLogLevels(%j) sets pino level %s', (levels, expected) => {
    const service = createService();
    service.setLogLevels([...levels]);
    expect(mockLogger.level).toBe(expected);
  });
});

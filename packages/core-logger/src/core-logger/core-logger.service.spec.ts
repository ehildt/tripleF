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

  it('logs a message with a context string', () => {
    createService().log('hello', 'MyContext');
    expect(mockLogger.info).toHaveBeenCalledWith({ context: 'MyContext' }, 'hello');
  });

  it('logs a message with a meta object as the second argument', () => {
    createService().log('hello', { requestId: '1' });
    expect(mockLogger.info).toHaveBeenCalledWith({ requestId: '1' }, 'hello');
  });

  it('logs a meta object as the first argument', () => {
    createService().log({ requestId: '1' }, 'hello');
    expect(mockLogger.info).toHaveBeenCalledWith({ requestId: '1' }, 'hello');
  });

  it('routes error to the error level', () => {
    createService().error('boom');
    expect(mockLogger.error).toHaveBeenCalledWith('boom');
  });

  it('attaches the stack trace and context on error(message, stack, context)', () => {
    const stack = 'Error: boom\n    at fn (file.ts:1:1)';
    createService().error('boom', stack, 'MyContext');
    expect(mockLogger.error).toHaveBeenCalledWith({ err: stack, context: 'MyContext' }, 'boom');
  });

  it('attaches a bare stack trace on error(message, stack)', () => {
    const stack = 'Error: boom\n    at fn (file.ts:1:1)';
    createService().error('boom', stack);
    expect(mockLogger.error).toHaveBeenCalledWith({ err: stack }, 'boom');
  });

  it('attaches an Error instance on error(message, error)', () => {
    const error = new Error('boom');
    createService().error('failed', error);
    expect(mockLogger.error).toHaveBeenCalledWith({ err: error }, 'failed');
  });

  it('attaches an Error instance and context on error(message, error, context)', () => {
    const error = new Error('boom');
    createService().error('failed', error, 'MyContext');
    expect(mockLogger.error).toHaveBeenCalledWith({ err: error, context: 'MyContext' }, 'failed');
  });

  it('treats a bare Error argument as the message and err binding', () => {
    const error = new Error('boom');
    createService().error(error);
    expect(mockLogger.error).toHaveBeenCalledWith({ err: error }, 'boom');
  });

  it('extracts context from a bare Error argument', () => {
    const error = new Error('boom');
    createService().error(error, 'MyContext');
    expect(mockLogger.error).toHaveBeenCalledWith({ err: error, context: 'MyContext' }, 'boom');
  });

  it('preserves an Error instance at non-error levels', () => {
    const error = new Error('boom');
    createService().warn('careful', error);
    expect(mockLogger.warn).toHaveBeenCalledWith({ err: error }, 'careful');
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

  it('invokes onLog after writing, with the structured entry', () => {
    const onLog = vi.fn();
    createService().log('hello', { requestId: '1', onLog });
    expect(mockLogger.info).toHaveBeenCalledWith({ requestId: '1' }, 'hello');
    expect(onLog).toHaveBeenCalledWith({
      level: 'info',
      message: 'hello',
      context: undefined,
      meta: { requestId: '1' },
    });
  });

  it('invokes onLog from a meta-first call and strips it from the output', () => {
    const onLog = vi.fn();
    createService().log({ requestId: '1', onLog }, 'hello');
    expect(mockLogger.info).toHaveBeenCalledWith({ requestId: '1' }, 'hello');
    expect(onLog).toHaveBeenCalledWith({
      level: 'info',
      message: 'hello',
      context: undefined,
      meta: { requestId: '1' },
    });
  });

  it('does not invoke onLog when it is not a function', () => {
    createService().log('hello', { onLog: 'not-a-function' });
    expect(mockLogger.info).toHaveBeenCalledWith('hello');
  });

  it('maps NestJS log levels to the pino threshold', () => {
    const service = createService();
    service.setLogLevels(['warn', 'error']);
    expect(mockLogger.level).toBe('warn');
  });

  it('falls back to silent when no known level is enabled', () => {
    const service = createService();
    service.setLogLevels([]);
    expect(mockLogger.level).toBe('silent');
  });
});

import { CoreLoggerSchema } from './core-logger.schema.ts';

describe('CoreLoggerSchema', () => {
  it('accepts an empty config and applies the level default', () => {
    const result = CoreLoggerSchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.level).toBe('info');
  });

  it('passes through unknown top-level pino options (loose object)', () => {
    const result = CoreLoggerSchema.safeParse({ level: 'debug', customPinoOption: 42 });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.level).toBe('debug');
      expect(result.data.customPinoOption).toBe(42);
    }
  });

  it.each(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'])('accepts level %s', (level) => {
    expect(CoreLoggerSchema.safeParse({ level }).success).toBe(true);
  });

  it('rejects an unknown level', () => {
    const result = CoreLoggerSchema.safeParse({ level: 'verbose' });
    expect(result.success).toBe(false);
    expect(result.error?.issues.some((i) => i.path.includes('level'))).toBe(true);
  });

  it('accepts a null base', () => {
    expect(CoreLoggerSchema.safeParse({ base: null }).success).toBe(true);
  });

  it('accepts a populated base object', () => {
    expect(CoreLoggerSchema.safeParse({ base: { pid: 123 } }).success).toBe(true);
  });

  it('rejects a non-object base', () => {
    expect(CoreLoggerSchema.safeParse({ base: 'not-an-object' }).success).toBe(false);
  });

  it('applies transport defaults when only options are given', () => {
    const result = CoreLoggerSchema.safeParse({ transport: { options: {} } });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.transport?.target).toBe('pino-pretty');
      expect(result.data.transport?.options.translateTime).toBe('yyyy-mm-dd HH:MM:ss.l');
      expect(result.data.transport?.options.colorize).toBe(true);
      expect(result.data.transport?.options.ignore).toBe('pid,hostname,context');
      expect(result.data.transport?.options.singleLine).toBe(false);
      expect(result.data.transport?.options.colorizeObjects).toBe(true);
    }
  });

  it('requires transport.options', () => {
    const result = CoreLoggerSchema.safeParse({ transport: {} });
    expect(result.success).toBe(false);
    expect(result.error?.issues.some((i) => i.path.includes('transport'))).toBe(true);
  });

  it('rejects a transport target other than pino-pretty', () => {
    expect(CoreLoggerSchema.safeParse({ transport: { target: 'pino/file', options: {} } }).success).toBe(false);
  });

  it('accepts a string messageFormat', () => {
    expect(
      CoreLoggerSchema.safeParse({ transport: { options: { messageFormat: '{levelLabel} {msg}' } } }).success,
    ).toBe(true);
  });

  it('accepts a function messageFormat', () => {
    expect(CoreLoggerSchema.safeParse({ transport: { options: { messageFormat: () => 'x' } } }).success).toBe(true);
  });

  it('rejects a non-string non-function messageFormat', () => {
    expect(CoreLoggerSchema.safeParse({ transport: { options: { messageFormat: 42 } } }).success).toBe(false);
  });

  it('rejects unknown keys inside transport.options (strict nested object)', () => {
    expect(CoreLoggerSchema.safeParse({ transport: { options: { unknownPrettyOption: true } } }).success).toBe(false);
  });
});

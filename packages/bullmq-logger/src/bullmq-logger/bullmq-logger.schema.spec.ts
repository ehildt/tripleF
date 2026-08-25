import { BullMQLoggerSchema } from './bullmq-logger.schema.ts';

describe('BullMQLoggerSchema', () => {
  it('should validate a valid config', () => {
    const config = {
      level: 'info',
      base: null,
      timestamp: Date.now,
      transport: {
        target: 'pino-pretty',
        options: {
          translateTime: 'yyyy-mm-dd HH:MM:ss.l',
          colorize: true,
          ignore: 'pid,hostname',
        },
      },
    };

    const { error } = BullMQLoggerSchema.validate(config);
    expect(error).toBeUndefined();
  });

  it('should use default values when config is partial', () => {
    const config = {
      timestamp: Date.now,
      transport: {
        target: 'pino-pretty',
        options: {},
      },
    };

    const { error, value } = BullMQLoggerSchema.validate(config);
    expect(error).toBeUndefined();
    expect(value.level).toBe('info');
    expect(value.transport.target).toBe('pino-pretty');
    expect(value.transport.options.colorize).toBe(true);
    expect(value.transport.options.ignore).toBe('pid,hostname');
  });

  it('should reject invalid level', () => {
    const config = {
      level: 'invalid',
      timestamp: Date.now,
      transport: {
        target: 'pino-pretty',
        options: {},
      },
    };

    const { error } = BullMQLoggerSchema.validate(config);
    expect(error).toBeDefined();
    expect(error!.message).toContain('level');
  });

  it('should reject invalid transport target', () => {
    const config = {
      timestamp: Date.now,
      transport: {
        target: 'invalid',
        options: {},
      },
    };

    const { error } = BullMQLoggerSchema.validate(config);
    expect(error).toBeDefined();
    expect(error!.message).toContain('target');
  });

  it('should accept redact with paths and censor', () => {
    const config = {
      level: 'info',
      redact: {
        paths: ['apiKey', '*.apiKey', 'req.headers.authorization'],
        censor: '[REDACTED]',
      },
    };

    const { error } = BullMQLoggerSchema.validate(config);
    expect(error).toBeUndefined();
  });

  it('should accept timestamp as false', () => {
    const config = {
      level: 'info',
      timestamp: false,
    };

    const { error } = BullMQLoggerSchema.validate(config);
    expect(error).toBeUndefined();
  });

  it('should accept base as an object', () => {
    const config = {
      level: 'info',
      base: { pid: 1234, hostname: 'localhost' },
    };

    const { error } = BullMQLoggerSchema.validate(config);
    expect(error).toBeUndefined();
  });

  it('should accept config without transport', () => {
    const config = {
      level: 'info',
    };

    const { error } = BullMQLoggerSchema.validate(config);
    expect(error).toBeUndefined();
  });

  it('should reject invalid redact paths', () => {
    const config = {
      redact: { paths: 'not-an-array' },
    };

    const { error } = BullMQLoggerSchema.validate(config);
    expect(error).toBeDefined();
    expect(error!.message).toContain('paths');
  });
});

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

    expect(BullMQLoggerSchema.safeParse(config).success).toBe(true);
  });

  it('should use default values when config is partial', () => {
    const config = {
      timestamp: Date.now,
      transport: {
        target: 'pino-pretty',
        options: {},
      },
    };

    const result = BullMQLoggerSchema.safeParse(config);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.level).toBe('info');
      expect(result.data.transport?.target).toBe('pino-pretty');
      expect(result.data.transport?.options.colorize).toBe(true);
      expect(result.data.transport?.options.ignore).toBe('pid,hostname');
    }
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

    const result = BullMQLoggerSchema.safeParse(config);
    expect(result.success).toBe(false);
    expect(result.error?.issues.some((i) => i.path.includes('level'))).toBe(true);
  });

  it('should reject invalid transport target', () => {
    const config = {
      timestamp: Date.now,
      transport: {
        target: 'invalid',
        options: {},
      },
    };

    const result = BullMQLoggerSchema.safeParse(config);
    expect(result.success).toBe(false);
    expect(result.error?.issues.some((i) => i.path.includes('target'))).toBe(true);
  });

  it('should accept redact with paths and censor', () => {
    const config = {
      level: 'info',
      redact: {
        paths: ['apiKey', '*.apiKey', 'req.headers.authorization'],
        censor: '[REDACTED]',
      },
    };

    expect(BullMQLoggerSchema.safeParse(config).success).toBe(true);
  });

  it('should accept timestamp as false', () => {
    const config = {
      level: 'info',
      timestamp: false,
    };

    expect(BullMQLoggerSchema.safeParse(config).success).toBe(true);
  });

  it('should accept timestamp as a function', () => {
    expect(BullMQLoggerSchema.safeParse({ timestamp: Date.now }).success).toBe(true);
  });

  it('should accept base as an object', () => {
    const config = {
      level: 'info',
      base: { pid: 1234, hostname: 'localhost' },
    };

    expect(BullMQLoggerSchema.safeParse(config).success).toBe(true);
  });

  it('should accept config without transport', () => {
    const config = {
      level: 'info',
    };

    expect(BullMQLoggerSchema.safeParse(config).success).toBe(true);
  });

  it('should reject invalid redact paths', () => {
    const config = {
      redact: { paths: 'not-an-array' },
    };

    const result = BullMQLoggerSchema.safeParse(config);
    expect(result.success).toBe(false);
    expect(result.error?.issues.some((i) => i.path.includes('paths'))).toBe(true);
  });
});

import { describe, expect, it } from 'vitest';

import { BullMQConfigSchema } from './bullmq-config.schema.ts';

describe('BullMQConfigSchema', () => {
  describe('valid configs', () => {
    it('should accept empty config', () => {
      expect(BullMQConfigSchema.safeParse({}).success).toBe(true);
    });

    it('should accept valid config with all fields', () => {
      const config = {
        defaultJobOptions: {
          delay: 1000,
          lifo: true,
          priority: 5,
          attempts: 3,
          stackTraceLimit: 10,
          removeOnComplete: { age: 3600, count: 100 },
          removeOnFail: { age: 7200, count: 200 },
          backoff: { type: 'exponential' as const, delay: 1000 },
        },
        connection: {
          enableReadyCheck: true,
          host: 'localhost',
          password: 'password',
          username: 'user',
          port: 6379,
          connectTimeout: 5000,
          commandTimeout: 5000,
          tls: {
            rejectUnauthorized: false,
            ca: Buffer.from('ca'),
            cert: Buffer.from('cert'),
            key: Buffer.from('key'),
            passphrase: 'pass',
          },
        },
      };
      expect(BullMQConfigSchema.safeParse(config).success).toBe(true);
    });

    it('should accept minimal connection config', () => {
      const config = {
        connection: {
          host: '127.0.0.1',
        },
      };
      expect(BullMQConfigSchema.safeParse(config).success).toBe(true);
    });

    it('should accept null tls', () => {
      const config = {
        connection: {
          host: 'localhost',
          tls: null,
        },
      };
      expect(BullMQConfigSchema.safeParse(config).success).toBe(true);
    });

    it('should coerce tls string values to Buffers (joi binary parity)', () => {
      const result = BullMQConfigSchema.safeParse({
        connection: {
          host: 'localhost',
          tls: { ca: 'ca-data', cert: 'cert-data', key: 'key-data' },
        },
      });
      expect(result.success).toBe(true);
      if (result.success) {
        const tls = result.data.connection?.tls as Record<string, unknown> | null | undefined;
        expect(Buffer.isBuffer(tls?.ca)).toBe(true);
        expect((tls?.cert as Buffer).toString()).toBe('cert-data');
        expect((tls?.key as Buffer).toString()).toBe('key-data');
      }
    });

    it('should accept empty password', () => {
      const config = {
        connection: {
          host: 'localhost',
          password: '',
        },
      };
      expect(BullMQConfigSchema.safeParse(config).success).toBe(true);
    });
  });

  describe('invalid configs', () => {
    it('should reject negative delay', () => {
      const config = {
        defaultJobOptions: {
          delay: -1,
        },
      };
      expect(BullMQConfigSchema.safeParse(config).success).toBe(false);
    });

    it('should reject negative priority', () => {
      const config = {
        defaultJobOptions: {
          priority: -1,
        },
      };
      expect(BullMQConfigSchema.safeParse(config).success).toBe(false);
    });

    it('should reject attempts > 50', () => {
      const config = {
        defaultJobOptions: {
          attempts: 51,
        },
      };
      expect(BullMQConfigSchema.safeParse(config).success).toBe(false);
    });

    it('should reject attempts < 1', () => {
      const config = {
        defaultJobOptions: {
          attempts: 0,
        },
      };
      expect(BullMQConfigSchema.safeParse(config).success).toBe(false);
    });

    it('should reject invalid backoff type', () => {
      const config = {
        defaultJobOptions: {
          backoff: { type: 'invalid' },
        },
      };
      expect(BullMQConfigSchema.safeParse(config).success).toBe(false);
    });

    it('should reject port < 1', () => {
      const config = {
        connection: {
          port: 0,
        },
      };
      expect(BullMQConfigSchema.safeParse(config).success).toBe(false);
    });

    it('should reject port > 65535', () => {
      const config = {
        connection: {
          port: 65536,
        },
      };
      expect(BullMQConfigSchema.safeParse(config).success).toBe(false);
    });

    it('should reject negative removeOnFail age', () => {
      const config = {
        defaultJobOptions: {
          removeOnFail: { age: -1 },
        },
      };
      expect(BullMQConfigSchema.safeParse(config).success).toBe(false);
    });

    it('should reject negative removeOnFail count', () => {
      const config = {
        defaultJobOptions: {
          removeOnFail: { count: -1 },
        },
      };
      expect(BullMQConfigSchema.safeParse(config).success).toBe(false);
    });

    it('should reject invalid host', () => {
      const config = {
        connection: {
          host: '',
        },
      };
      expect(BullMQConfigSchema.safeParse(config).success).toBe(false);
    });

    it('should reject connectTimeout < 1000', () => {
      const config = {
        connection: {
          connectTimeout: 500,
        },
      };
      expect(BullMQConfigSchema.safeParse(config).success).toBe(false);
    });

    it('should reject commandTimeout < 1000', () => {
      const config = {
        connection: {
          commandTimeout: 500,
        },
      };
      expect(BullMQConfigSchema.safeParse(config).success).toBe(false);
    });
  });
});

import { describe, expect, it } from 'vitest';

import { BullMQConfigSchema } from './bullmq-config.schema.ts';

describe('BullMQConfigSchema', () => {
  describe('valid configs', () => {
    it('should accept empty config', () => {
      const result = BullMQConfigSchema.validate({});
      expect(result.error).toBeUndefined();
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
      const result = BullMQConfigSchema.validate(config);
      expect(result.error).toBeUndefined();
    });

    it('should accept minimal connection config', () => {
      const config = {
        connection: {
          host: '127.0.0.1',
        },
      };
      const result = BullMQConfigSchema.validate(config);
      expect(result.error).toBeUndefined();
    });

    it('should accept null tls', () => {
      const config = {
        connection: {
          host: 'localhost',
          tls: null,
        },
      };
      const result = BullMQConfigSchema.validate(config);
      expect(result.error).toBeUndefined();
    });

    it('should accept empty password', () => {
      const config = {
        connection: {
          host: 'localhost',
          password: '',
        },
      };
      const result = BullMQConfigSchema.validate(config);
      expect(result.error).toBeUndefined();
    });
  });

  describe('invalid configs', () => {
    it('should reject negative delay', () => {
      const config = {
        defaultJobOptions: {
          delay: -1,
        },
      };
      const result = BullMQConfigSchema.validate(config);
      expect(result.error).toBeDefined();
    });

    it('should reject negative priority', () => {
      const config = {
        defaultJobOptions: {
          priority: -1,
        },
      };
      const result = BullMQConfigSchema.validate(config);
      expect(result.error).toBeDefined();
    });

    it('should reject attempts > 50', () => {
      const config = {
        defaultJobOptions: {
          attempts: 51,
        },
      };
      const result = BullMQConfigSchema.validate(config);
      expect(result.error).toBeDefined();
    });

    it('should reject attempts < 1', () => {
      const config = {
        defaultJobOptions: {
          attempts: 0,
        },
      };
      const result = BullMQConfigSchema.validate(config);
      expect(result.error).toBeDefined();
    });

    it('should reject invalid backoff type', () => {
      const config = {
        defaultJobOptions: {
          backoff: { type: 'invalid' },
        },
      };
      const result = BullMQConfigSchema.validate(config);
      expect(result.error).toBeDefined();
    });

    it('should reject port < 1', () => {
      const config = {
        connection: {
          port: 0,
        },
      };
      const result = BullMQConfigSchema.validate(config);
      expect(result.error).toBeDefined();
    });

    it('should reject port > 65535', () => {
      const config = {
        connection: {
          port: 65536,
        },
      };
      const result = BullMQConfigSchema.validate(config);
      expect(result.error).toBeDefined();
    });

    it('should reject negative removeOnFail age', () => {
      const config = {
        defaultJobOptions: {
          removeOnFail: { age: -1 },
        },
      };
      const result = BullMQConfigSchema.validate(config);
      expect(result.error).toBeDefined();
    });

    it('should reject negative removeOnFail count', () => {
      const config = {
        defaultJobOptions: {
          removeOnFail: { count: -1 },
        },
      };
      const result = BullMQConfigSchema.validate(config);
      expect(result.error).toBeDefined();
    });

    it('should reject invalid host', () => {
      const config = {
        connection: {
          host: '',
        },
      };
      const result = BullMQConfigSchema.validate(config);
      expect(result.error).toBeDefined();
    });

    it('should reject connectTimeout < 1000', () => {
      const config = {
        connection: {
          connectTimeout: 500,
        },
      };
      const result = BullMQConfigSchema.validate(config);
      expect(result.error).toBeDefined();
    });

    it('should reject commandTimeout < 1000', () => {
      const config = {
        connection: {
          commandTimeout: 500,
        },
      };
      const result = BullMQConfigSchema.validate(config);
      expect(result.error).toBeDefined();
    });
  });
});

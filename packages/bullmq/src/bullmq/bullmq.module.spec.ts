import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { describe, expect, it, vi } from 'vitest';

import 'reflect-metadata';

import { BullMQModule } from './bullmq.module.ts';

@Module({})
class MockBullModule {}

vi.mock('@nestjs/bullmq', () => ({
  BullModule: {
    registerQueueAsync: vi.fn((...args: unknown[]) => ({
      module: class {},
      imports: args,
      providers: [MockBullModule],
      exports: [MockBullModule],
    })),
  },
}));

describe('BullMQModule', () => {
  describe('registerAsync', () => {
    it('should create a dynamic module', async () => {
      const mockConfig = { connection: { host: 'localhost' } };
      const module = BullMQModule.registerAsync({
        imports: [],
        inject: [],
        queues: ['test-queue'],
        processors: [],
        useFactory: async () => mockConfig,
      });

      expect(module.module).toBe(BullMQModule);
      expect(module.imports).toBeDefined();
      expect(Array.isArray(module.imports)).toBe(true);
    });

    it('should set global option when provided', () => {
      const module = BullMQModule.registerAsync({
        inject: [],
        imports: [],
        queues: ['test-queue'],
        processors: [],
        useFactory: async () => ({}),
        global: true,
      });

      expect(module.global).toBe(true);
    });

    it('should not set global when not provided', () => {
      const module = BullMQModule.registerAsync({
        inject: [],
        imports: [],
        queues: ['test-queue'],
        processors: [],
        useFactory: async () => ({}),
      });

      expect(module.global).toBeUndefined();
    });

    it('should export BullModule', () => {
      const module = BullMQModule.registerAsync({
        inject: [],
        imports: [],
        queues: ['test-queue'],
        processors: [],
        useFactory: async () => ({}),
      });

      expect(module.exports).toEqual([BullModule]);
    });

    it('should include processors in providers', () => {
      const mockProcessor = { provide: 'TEST_PROCESSOR', useValue: {} };
      const module = BullMQModule.registerAsync({
        inject: [],
        imports: [],
        queues: ['test-queue'],
        processors: [mockProcessor],
        useFactory: async () => ({}),
      });

      expect(module.providers).toContain(mockProcessor);
    });

    it('should handle queue as string', () => {
      const module = BullMQModule.registerAsync({
        inject: ['CONFIG_TOKEN'],
        imports: [],
        queues: ['my-queue'],
        processors: [],
        useFactory: async () => ({}),
      });

      expect(module.imports).toBeDefined();
    });

    it('should handle queue as object with connection', () => {
      const queueConfig = {
        name: 'my-queue',
        connection: { host: 'queue-host' },
      };
      const module = BullMQModule.registerAsync({
        inject: ['CONFIG_TOKEN'],
        imports: [],
        queues: [queueConfig],
        processors: [],
        useFactory: async () => ({}),
      });

      expect(module.imports).toBeDefined();
    });

    it('should handle multiple queues', () => {
      const module = BullMQModule.registerAsync({
        inject: [],
        imports: [],
        queues: ['queue-1', 'queue-2', 'queue-3'],
        processors: [],
        useFactory: async () => ({}),
      });

      expect(module.imports).toBeDefined();
    });

    it('should pass inject to queue config', () => {
      const inject = ['ConfigService'];
      const module = BullMQModule.registerAsync({
        inject,
        imports: [],
        queues: ['test-queue'],
        processors: [],
        useFactory: async () => ({}),
      });

      expect(module.imports).toBeDefined();
    });

    it('should include queue connection in factory output', async () => {
      const queueConnection = { host: 'queue-host', port: 6380 };
      const module = BullMQModule.registerAsync({
        inject: [],
        imports: [],
        queues: [{ name: 'test-queue', connection: queueConnection }],
        processors: [],
        useFactory: async () => ({}),
      });

      const bullModuleResult = module.imports![0] as { imports: unknown[] };
      const queueConfig = (
        bullModuleResult.imports[0] as { useFactory: (deps: unknown[]) => Promise<unknown> }
      ).useFactory([]);
      const result = await queueConfig;

      expect(result).toHaveProperty('connection');
      expect(result).toMatchObject({ connection: queueConnection });
    });

    it('should merge factory output with queue connection', async () => {
      const factoryConfig = { connection: { host: 'default-host' }, defaultJobOptions: { delay: 1000 } };
      const queueConnection = { host: 'queue-host' };
      const module = BullMQModule.registerAsync({
        inject: [],
        imports: [],
        queues: [{ name: 'test-queue', connection: queueConnection }],
        processors: [],
        useFactory: async () => factoryConfig,
      });

      const bullModuleResult = module.imports![0] as { imports: unknown[] };
      const queueConfig = (
        bullModuleResult.imports[0] as { useFactory: (deps: unknown[]) => Promise<unknown> }
      ).useFactory([]);
      const result = await queueConfig;

      expect(result).toMatchObject({
        connection: queueConnection,
        defaultJobOptions: { delay: 1000 },
      });
    });

    it('should handle empty factory output', async () => {
      const module = BullMQModule.registerAsync({
        inject: [],
        imports: [],
        queues: ['test-queue'],
        processors: [],
        useFactory: async () => ({}),
      });

      const bullModuleResult = module.imports![0] as { imports: unknown[] };
      const queueConfig = (
        bullModuleResult.imports[0] as { useFactory: (deps: unknown[]) => Promise<unknown> }
      ).useFactory([]);
      const result = await queueConfig;

      expect(result).toEqual({});
    });

    it('should include queue name in factory config', async () => {
      const module = BullMQModule.registerAsync({
        inject: [],
        imports: [],
        queues: ['my-queue-name'],
        processors: [],
        useFactory: async () => ({}),
      });

      const bullModuleResult = module.imports![0] as { imports: unknown[] };
      const queueConfig = bullModuleResult.imports[0] as { name: string };

      expect(queueConfig.name).toBe('my-queue-name');
    });

    it('should use default global setting per queue', async () => {
      const module = BullMQModule.registerAsync({
        inject: [],
        imports: [],
        queues: ['test-queue'],
        processors: [],
        useFactory: async () => ({}),
      });

      const bullModuleResult = module.imports![0] as { imports: unknown[] };
      const queueConfig = bullModuleResult.imports[0] as { global?: boolean };

      expect(queueConfig.global).toBeUndefined();
    });

    it('should pass inject to factory', async () => {
      const injectDeps = ['CONFIG_TOKEN'];
      const module = BullMQModule.registerAsync({
        inject: injectDeps,
        imports: [],
        queues: ['test-queue'],
        processors: [],
        useFactory: async () => ({}),
      });

      const bullModuleResult = module.imports![0] as { imports: unknown[] };
      const queueConfig = bullModuleResult.imports[0] as { inject: string[] };

      expect(queueConfig.inject).toEqual(injectDeps);
    });

    it('should place custom imports before BullModule', () => {
      @Module({})
      class CustomModule {}
      const module = BullMQModule.registerAsync({
        inject: [],
        imports: [CustomModule],
        queues: ['test-queue'],
        processors: [],
        useFactory: async () => ({}),
      });

      expect(module.imports![0]).toBe(CustomModule);
      expect(module.imports![1]).toHaveProperty('imports');
    });

    it('should handle multiple queues with different configs', async () => {
      const module = BullMQModule.registerAsync({
        inject: [],
        imports: [],
        queues: [{ name: 'queue-1', connection: { host: 'host1' } }, { name: 'queue-2' }, 'queue-3'],
        processors: [],
        useFactory: async () => ({}),
      });

      const bullModuleResult = module.imports![0] as { imports: unknown[] };
      const queueConfigs = bullModuleResult.imports as Array<{
        name: string;
        useFactory: (deps: unknown[]) => Promise<unknown>;
      }>;

      expect(queueConfigs[0].name).toBe('queue-1');
      const result1 = await queueConfigs[0].useFactory([]);
      expect(result1).toHaveProperty('connection', { host: 'host1' });
      expect(queueConfigs[1].name).toBe('queue-2');
      const result2 = await queueConfigs[1].useFactory([]);
      expect(result2).not.toHaveProperty('connection');
      expect(queueConfigs[2].name).toBe('queue-3');
    });

    describe('with NestJS Testing Module', () => {
      it('should return TestingModule from createTestingModule', async () => {
        const module: TestingModule = await Test.createTestingModule({
          imports: [],
        }).compile();

        expect(module).toBeDefined();
      });

      it('should return TestingModule with BullMQModule as part of module tree', async () => {
        const bullMQModule = BullMQModule.registerAsync({
          inject: [],
          imports: [],
          queues: ['test-queue'],
          processors: [],
          useFactory: async () => ({ connection: { host: 'localhost' } }),
        });

        expect(bullMQModule.module).toBe(BullMQModule);
      });
    });
  });

  describe('edge cases', () => {
    it('should default imports to an empty array when not provided', () => {
      const module = BullMQModule.registerAsync({
        inject: [],
        queues: ['test-queue'],
        processors: [],
        useFactory: async () => ({}),
      });

      expect(Array.isArray(module.imports)).toBe(true);
      expect(module.imports![0]).toHaveProperty('imports');
    });

    it('should default factory output to an empty object when the factory returns nullish', async () => {
      const module = BullMQModule.registerAsync({
        inject: [],
        imports: [],
        queues: ['test-queue'],
        processors: [],
        useFactory: async () => null as any,
      });

      const bullModuleResult = module.imports![0] as { imports: unknown[] };
      const queueConfig = (
        bullModuleResult.imports[0] as { useFactory: (deps: unknown[]) => Promise<unknown> }
      ).useFactory([]);
      const result = await queueConfig;

      expect(result).toEqual({});
    });
  });
});

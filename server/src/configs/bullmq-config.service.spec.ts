import { beforeEach, describe, expect, it, vi } from 'vitest';

import { BullMQConfigAdapter } from './bullmq-config.adapter.js';
import { BullMQConfigService } from './bullmq-config.service.js';

describe('BullMQConfigAdapter', () => {
  it('returns expected config from env object', () => {
    const config = BullMQConfigAdapter({
      BULLMQ_HOST: 'redis.example.com',
      BULLMQ_PORT: '6380',
      BULLMQ_USER: 'admin',
      BULLMQ_PASS: 'secret',
      BULLMQ_USE_TLS: 'true',
      BULLMQ_TLS_REJECT_UNAUTHORIZED: 'false',
      BULLMQ_TLS_CERT: 'cert-data',
      BULLMQ_TLS_KEY: 'key-data',
      BULLMQ_TLS_CA: 'ca-data',
      BULLMQ_PASSPHRASE: 'passphrase',
    });

    expect(config.connection!.host).toBe('redis.example.com');
    expect(config.connection!.port).toBe(6380);
    expect(config.connection!.username).toBe('admin');
    expect(config.connection!.password).toBe('secret');
    expect(config.connection!.tls).toBeDefined();
    expect(config.connection!.tls?.rejectUnauthorized).toBe(false);
    expect(config.connection!.tls?.cert).toBe('cert-data');
    expect(config.connection!.tls?.key).toBe('key-data');
    expect(config.connection!.tls?.ca).toBe('ca-data');
    expect(config.connection!.tls?.passphrase).toBe('passphrase');
  });

  it('uses default values when env vars are not provided', () => {
    const config = BullMQConfigAdapter({});

    expect(config.connection!.host).toBeUndefined();
    expect(config.connection!.port).toBe(6379);
    expect(config.connection!.connectTimeout).toBe(30000);
    expect(config.connection!.commandTimeout).toBe(30000);
    expect(config.defaultJobOptions!.lifo).toBe(false);
    expect(config.defaultJobOptions!.attempts).toBe(15);
    const backoff = config.defaultJobOptions!.backoff as unknown as {
      type?: string;
      delay: number;
    };
    expect(backoff.type).toBeUndefined();
    expect(backoff.delay).toBe(5270);
  });

  it('does not set TLS when BULLMQ_USE_TLS is not set', () => {
    const config = BullMQConfigAdapter({});

    expect(config.connection!.tls).toBeUndefined();
  });

  it('applies default TLS rejectUnauthorized when BULLMQ_USE_TLS is set', () => {
    const config = BullMQConfigAdapter({
      BULLMQ_USE_TLS: 'true',
    });

    expect(config.connection!.tls).toBeDefined();
    expect(config.connection!.tls?.rejectUnauthorized).toBe(true);
  });
});

describe('BullMQConfigService', () => {
  let service: BullMQConfigService;

  beforeEach(() => {
    vi.stubEnv('BULLMQ_HOST', 'test-redis');
    vi.stubEnv('BULLMQ_PORT', '6380');
    service = new BullMQConfigService();
  });

  it('returns config from adapter', () => {
    const config = service.config;

    expect(config.connection!.host).toBe('test-redis');
    expect(config.connection!.port).toBe(6380);
  });
});

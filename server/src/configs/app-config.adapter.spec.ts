import { AppConfigSchema } from '@ehildt/ckir-helpers/bootstrap';

import { AppConfigAdapter } from './app-config.adapter.js';

describe('AppConfigAdapter', () => {
  it('returns expected config from env object', () => {
    const config = AppConfigAdapter({
      ADDRESS: '127.0.0.1',
      NODE_ENV: 'development',
      PORT: '3000',
      BODY_LIMIT: '1024',
      LOG_LEVEL: 'warn',
      PRINT_CONFIG: 'true',
      ENABLE_SWAGGER: 'false',
      CORS_ORIGIN: 'https://example.com',
      CORS_METHODS: 'GET,POST',
      CORS_PREFLIGHT_CONTINUE: 'true',
      CORS_OPTIONS_SUCCESS_STATUS: '204',
      CORS_CREDENTIALS: 'true',
      CORS_ALLOWED_HEADERS: 'Authorization',
    });

    expect(config).toEqual({
      address: '127.0.0.1',
      nodeEnv: 'development',
      port: 3000,
      bodyLimit: 1024,
      logLevel: ['warn'],
      printConfig: true,
      enableSwagger: false,
      health: {
        memoryHeap: 268435456,
        memoryRSS: 268435456,
        diskPath: '/',
        diskThresholdPercent: 0.8,
      },
      cors: {
        origin: 'https://example.com',
        methods: 'GET,POST',
        preflightContinue: true,
        optionsSuccessStatus: 204,
        credentials: true,
        allowedHeaders: 'Content-Type,Accept,X-Vision-LLM',
      },
    });
  });
});

describe('AppConfigSchema', () => {
  it('validates correct config', () => {
    const result = AppConfigSchema.validate({
      printConfig: true,
      enableSwagger: false,
      bodyLimit: 1024,
      address: '127.0.0.1',
      port: 3000,
      nodeEnv: 'development',
      cors: {
        origin: 'https://example.com',
        methods: 'GET,POST',
        preflightContinue: false,
        optionsSuccessStatus: 204,
        credentials: true,
        allowedHeaders: 'Authorization',
      },
    });

    expect(result.error).toBeUndefined();
  });

  it('fails if required fields are missing', () => {
    const result = AppConfigSchema.validate({});
    expect(result.error).toBeDefined();
    expect(
      result.error?.details.some((d) => d.message.includes('printConfig')),
    ).toBe(true);
  });
});

describe('AppConfigAdapter', () => {
  it('uses default values when env vars are not provided', () => {
    const config = AppConfigAdapter({});

    expect(config.address).toBe('0.0.0.0');
    expect(config.nodeEnv).toBe('development');
    expect(config.port).toBe(0);
    expect(config.bodyLimit).toBe(0);
    expect(config.printConfig).toBe(false);
    expect(config.enableSwagger).toBe(false);
    expect(config.logLevel).toEqual([]);
    expect(config.cors).toBeUndefined();
  });

  it('handles missing health env vars with defaults', () => {
    const config = AppConfigAdapter({});

    expect(config.health!.memoryHeap).toBe(268435456);
    expect(config.health!.memoryRSS).toBe(268435456);
    expect(config.health!.diskPath).toBe('/');
    expect(config.health!.diskThresholdPercent).toBe(0.8);
  });

  it('applies cors config when CORS_ORIGIN is provided', () => {
    const config = AppConfigAdapter({
      CORS_ORIGIN: 'https://example.com',
    });

    expect(config.cors).toBeDefined();
    expect(config.cors?.origin).toBe('https://example.com');
  });

  it('applies cors defaults when only CORS_ORIGIN is set', () => {
    const config = AppConfigAdapter({
      CORS_ORIGIN: 'https://example.com',
    });

    expect(config.cors?.preflightContinue).toBe(false);
    expect(config.cors?.optionsSuccessStatus).toBe(0);
    expect(config.cors?.credentials).toBe(false);
  });
});

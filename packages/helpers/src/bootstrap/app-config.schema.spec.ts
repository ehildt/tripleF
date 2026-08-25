import { AppConfigSchema } from './app-config.schema.ts';

describe('AppConfigSchema', () => {
  it('validates a correct config', () => {
    const validConfig = {
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
    };

    const { error, value } = AppConfigSchema.validate(validConfig);
    expect(error).toBeUndefined();
    expect(value.address).toBe('127.0.0.1');
  });

  it('fails if required fields are missing', () => {
    const { error } = AppConfigSchema.validate({}, { abortEarly: false });
    expect(error).toBeDefined();

    const missingFields = error?.details.map((d) => d.path[0]);
    expect(missingFields).toContain('printConfig');
    expect(missingFields).toContain('enableSwagger');
  });

  it('fails if IP address is invalid', () => {
    const { error } = AppConfigSchema.validate({
      printConfig: true,
      enableSwagger: false,
      bodyLimit: 1024,
      address: 'invalid-ip',
      port: 3000,
      nodeEnv: 'development',
    });
    expect(error).toBeDefined();
    expect(error?.details.some((d) => d.message.includes('address'))).toBe(true);
  });

  it('fails if port is out of range', () => {
    const { error } = AppConfigSchema.validate({
      printConfig: true,
      enableSwagger: false,
      bodyLimit: 1024,
      address: '127.0.0.1',
      port: 70000, // invalid port
      nodeEnv: 'development',
    });
    expect(error).toBeDefined();
    expect(error?.details.some((d) => d.message.includes('port'))).toBe(true);
  });

  it('validates config with optional health', () => {
    const configWithHealth = {
      printConfig: true,
      enableSwagger: false,
      bodyLimit: 1024,
      address: '127.0.0.1',
      port: 3000,
      nodeEnv: 'development',
      health: {
        memoryHeap: 256 * 1024 * 1024,
        memoryRSS: 256 * 1024 * 1024,
        diskPath: '/',
        diskThresholdPercent: 0.8,
      },
    };

    const { error, value } = AppConfigSchema.validate(configWithHealth);
    expect(error).toBeUndefined();
    expect(value.health).toEqual(configWithHealth.health);
  });

  it('validates config with partial health', () => {
    const configWithPartialHealth = {
      printConfig: true,
      enableSwagger: false,
      bodyLimit: 1024,
      address: '127.0.0.1',
      port: 3000,
      nodeEnv: 'development',
      health: {
        memoryHeap: 512 * 1024 * 1024,
      },
    };

    const { error, value } = AppConfigSchema.validate(configWithPartialHealth);
    expect(error).toBeUndefined();
    expect(value.health?.memoryHeap).toBe(512 * 1024 * 1024);
    expect(value.health?.memoryRSS).toBeUndefined();
  });

  it('fails if health memoryHeap is negative', () => {
    const { error } = AppConfigSchema.validate({
      printConfig: true,
      enableSwagger: false,
      bodyLimit: 1024,
      address: '127.0.0.1',
      port: 3000,
      nodeEnv: 'development',
      health: {
        memoryHeap: -1,
      },
    });
    expect(error).toBeDefined();
    expect(error?.details.some((d) => d.path.includes('memoryHeap'))).toBe(true);
  });

  it('fails if health memoryRSS is negative', () => {
    const { error } = AppConfigSchema.validate({
      printConfig: true,
      enableSwagger: false,
      bodyLimit: 1024,
      address: '127.0.0.1',
      port: 3000,
      nodeEnv: 'development',
      health: {
        memoryRSS: -100,
      },
    });
    expect(error).toBeDefined();
    expect(error?.details.some((d) => d.path.includes('memoryRSS'))).toBe(true);
  });
});

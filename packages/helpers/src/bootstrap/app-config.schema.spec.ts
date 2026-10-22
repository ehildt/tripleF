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

    const result = AppConfigSchema.safeParse(validConfig);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.address).toBe('127.0.0.1');
  });

  it('fails if required fields are missing', () => {
    const result = AppConfigSchema.safeParse({});
    expect(result.success).toBe(false);

    const missingFields = (result.error?.issues ?? []).map((i) => i.path[0]);
    expect(missingFields).toContain('printConfig');
    expect(missingFields).toContain('enableSwagger');
  });

  it('fails if IP address is invalid', () => {
    const result = AppConfigSchema.safeParse({
      printConfig: true,
      enableSwagger: false,
      bodyLimit: 1024,
      address: 'invalid-ip',
      port: 3000,
      nodeEnv: 'development',
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues.some((i) => i.path.includes('address'))).toBe(true);
  });

  it('fails if port is out of range', () => {
    const result = AppConfigSchema.safeParse({
      printConfig: true,
      enableSwagger: false,
      bodyLimit: 1024,
      address: '127.0.0.1',
      port: 70000, // invalid port
      nodeEnv: 'development',
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues.some((i) => i.path.includes('port'))).toBe(true);
  });

  it('fails if nodeEnv is not an allowed value', () => {
    const result = AppConfigSchema.safeParse({
      printConfig: true,
      enableSwagger: false,
      bodyLimit: 1024,
      address: '127.0.0.1',
      port: 3000,
      nodeEnv: 'staging',
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues.some((i) => i.path.includes('nodeEnv'))).toBe(true);
  });

  it('rejects unknown keys (joi default, mirrored by the schema)', () => {
    const result = AppConfigSchema.safeParse({
      printConfig: true,
      enableSwagger: false,
      bodyLimit: 1024,
      address: '127.0.0.1',
      port: 3000,
      nodeEnv: 'development',
      typoKey: true,
    });
    expect(result.success).toBe(false);
  });

  it('validates an ipv6 address', () => {
    const result = AppConfigSchema.safeParse({
      printConfig: true,
      enableSwagger: false,
      bodyLimit: 1024,
      address: '::1',
      port: 3000,
      nodeEnv: 'development',
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.address).toBe('::1');
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

    const result = AppConfigSchema.safeParse(configWithHealth);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.health).toEqual(configWithHealth.health);
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

    const result = AppConfigSchema.safeParse(configWithPartialHealth);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.health?.memoryHeap).toBe(512 * 1024 * 1024);
      expect(result.data.health?.memoryRSS).toBeUndefined();
    }
  });

  it('rejects a null cors.allowedHeaders', () => {
    const result = AppConfigSchema.safeParse({
      printConfig: true,
      enableSwagger: false,
      bodyLimit: 1024,
      address: '127.0.0.1',
      port: 3000,
      nodeEnv: 'development',
      cors: { allowedHeaders: null },
    });
    expect(result.success).toBe(false);
  });

  it('fails if health memoryHeap is negative', () => {
    const result = AppConfigSchema.safeParse({
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
    expect(result.success).toBe(false);
    expect(result.error?.issues.some((i) => i.path.includes('memoryHeap'))).toBe(true);
  });

  it('fails if health memoryRSS is negative', () => {
    const result = AppConfigSchema.safeParse({
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
    expect(result.success).toBe(false);
    expect(result.error?.issues.some((i) => i.path.includes('memoryRSS'))).toBe(true);
  });
});

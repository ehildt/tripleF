import { OllamaApiConfigSchema } from './ollama-api.schema.ts';

describe('OllamaApiConfigSchema', () => {
  it('should validate a valid full config', () => {
    const config = {
      host: 'http://127.0.0.1:11434/api',
      apiKey: 'test-key',
      keepAlive: '5m',
      streamChunkTimeoutMs: 60_000,
      streamTotalTimeoutMs: 600_000,
      generateTotalTimeoutMs: 300_000,
      enableSmoothStream: true,
    };

    expect(OllamaApiConfigSchema.safeParse(config).success).toBe(true);
  });

  it('should validate an empty config', () => {
    expect(OllamaApiConfigSchema.safeParse({}).success).toBe(true);
  });

  it('should reject a non-string host', () => {
    const result = OllamaApiConfigSchema.safeParse({ host: 11434 });
    expect(result.success).toBe(false);
    expect(result.error?.issues.some((i) => i.path.includes('host'))).toBe(true);
  });

  it('should reject a non-string keepAlive', () => {
    const result = OllamaApiConfigSchema.safeParse({ keepAlive: 5 });
    expect(result.success).toBe(false);
    expect(result.error?.issues.some((i) => i.path.includes('keepAlive'))).toBe(true);
  });

  it('should reject a non-numeric timeout', () => {
    const result = OllamaApiConfigSchema.safeParse({ streamChunkTimeoutMs: 'not-a-number' });
    expect(result.success).toBe(false);
    expect(result.error?.issues.some((i) => i.path.includes('streamChunkTimeoutMs'))).toBe(true);
  });

  it('should reject a timeout below the minimum', () => {
    const result = OllamaApiConfigSchema.safeParse({ streamTotalTimeoutMs: 500 });
    expect(result.success).toBe(false);
    expect(result.error?.issues.some((i) => i.path.includes('streamTotalTimeoutMs'))).toBe(true);
  });

  it('should reject a non-boolean enableSmoothStream', () => {
    const result = OllamaApiConfigSchema.safeParse({ enableSmoothStream: 'yes' });
    expect(result.success).toBe(false);
    expect(result.error?.issues.some((i) => i.path.includes('enableSmoothStream'))).toBe(true);
  });
});

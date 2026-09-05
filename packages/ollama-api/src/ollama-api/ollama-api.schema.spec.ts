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

    const { error } = OllamaApiConfigSchema.validate(config);
    expect(error).toBeUndefined();
  });

  it('should validate an empty config', () => {
    const { error } = OllamaApiConfigSchema.validate({});
    expect(error).toBeUndefined();
  });

  it('should reject a non-string host', () => {
    const { error } = OllamaApiConfigSchema.validate({ host: 11434 });
    expect(error).toBeDefined();
    expect(error!.message).toContain('host');
  });

  it('should reject a non-string keepAlive', () => {
    const { error } = OllamaApiConfigSchema.validate({ keepAlive: 5 });
    expect(error).toBeDefined();
    expect(error!.message).toContain('keepAlive');
  });

  it('should reject a non-numeric timeout', () => {
    const { error } = OllamaApiConfigSchema.validate({ streamChunkTimeoutMs: 'not-a-number' });
    expect(error).toBeDefined();
    expect(error!.message).toContain('streamChunkTimeoutMs');
  });

  it('should reject a timeout below the minimum', () => {
    const { error } = OllamaApiConfigSchema.validate({ streamTotalTimeoutMs: 500 });
    expect(error).toBeDefined();
    expect(error!.message).toContain('streamTotalTimeoutMs');
  });

  it('should reject a non-boolean enableSmoothStream', () => {
    const { error } = OllamaApiConfigSchema.validate({ enableSmoothStream: 'yes' });
    expect(error).toBeDefined();
    expect(error!.message).toContain('enableSmoothStream');
  });
});

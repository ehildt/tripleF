import { AiSdkConfigSchema } from './ai-sdk.schema.ts';

describe('AiSdkConfigSchema', () => {
  it('should validate a valid full config', () => {
    const config = {
      streamChunkTimeoutMs: 60_000,
      streamTotalTimeoutMs: 600_000,
      generateTotalTimeoutMs: 300_000,
      enableSmoothStream: true,
    };

    const { error } = AiSdkConfigSchema.validate(config);
    expect(error).toBeUndefined();
  });

  it('should validate an empty config', () => {
    const { error } = AiSdkConfigSchema.validate({});
    expect(error).toBeUndefined();
  });

  it('should reject a non-numeric timeout', () => {
    const config = { streamChunkTimeoutMs: 'not-a-number' };

    const { error } = AiSdkConfigSchema.validate(config);
    expect(error).toBeDefined();
    expect(error!.message).toContain('streamChunkTimeoutMs');
  });

  it('should reject a timeout below the minimum', () => {
    const config = { streamChunkTimeoutMs: 500 };

    const { error } = AiSdkConfigSchema.validate(config);
    expect(error).toBeDefined();
    expect(error!.message).toContain('streamChunkTimeoutMs');
  });

  it('should reject a non-boolean enableSmoothStream', () => {
    const config = { enableSmoothStream: 'yes' };

    const { error } = AiSdkConfigSchema.validate(config);
    expect(error).toBeDefined();
    expect(error!.message).toContain('enableSmoothStream');
  });
});

import { AiSdkConfigSchema } from './ai-sdk.schema.ts';

describe('AiSdkConfigSchema', () => {
  it('should validate a valid full config', () => {
    const config = {
      streamChunkTimeoutMs: 60_000,
      streamTotalTimeoutMs: 600_000,
      generateTotalTimeoutMs: 300_000,
      enableSmoothStream: true,
    };

    expect(AiSdkConfigSchema.safeParse(config).success).toBe(true);
  });

  it('should validate an empty config', () => {
    expect(AiSdkConfigSchema.safeParse({}).success).toBe(true);
  });

  it('should reject a non-numeric timeout', () => {
    const config = { streamChunkTimeoutMs: 'not-a-number' };

    const result = AiSdkConfigSchema.safeParse(config);
    expect(result.success).toBe(false);
    expect(result.error?.issues.some((i) => i.path.includes('streamChunkTimeoutMs'))).toBe(true);
  });

  it('should reject a timeout below the minimum', () => {
    const config = { streamChunkTimeoutMs: 500 };

    const result = AiSdkConfigSchema.safeParse(config);
    expect(result.success).toBe(false);
    expect(result.error?.issues.some((i) => i.path.includes('streamChunkTimeoutMs'))).toBe(true);
  });

  it('should reject a non-boolean enableSmoothStream', () => {
    const config = { enableSmoothStream: 'yes' };

    const result = AiSdkConfigSchema.safeParse(config);
    expect(result.success).toBe(false);
    expect(result.error?.issues.some((i) => i.path.includes('enableSmoothStream'))).toBe(true);
  });
});

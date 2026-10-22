import { describe, expect, it } from 'vitest';

import {
  MinioConfigAdapter,
  MinioConfigSchema,
} from './minio-config.adapter.js';

describe('MinioConfigSchema', () => {
  const validConfig = MinioConfigAdapter({
    MINIO_ENDPOINT: 'minio.local',
    MINIO_ACCESS_KEY: 'ak',
    MINIO_SECRET_KEY: 'sk',
  });

  it('accepts the adapter output', () => {
    expect(MinioConfigSchema.safeParse(validConfig).success).toBe(true);
  });

  it.each([
    [{ endpoint: undefined }],
    [{ accessKey: undefined }],
    [{ secretKey: undefined }],
    [{ bucket: undefined }],
  ])('rejects a missing required string field', (patch) => {
    const result = MinioConfigSchema.safeParse({ ...validConfig, ...patch });
    expect(result.success).toBe(false);
  });

  it.each([65536, -1])('rejects out-of-range port %s', (port) => {
    const result = MinioConfigSchema.safeParse({ ...validConfig, port });
    expect(result.success).toBe(false);
    expect(result.error?.issues.some((i) => i.path.includes('port'))).toBe(
      true,
    );
  });

  it.each([0, 9000, 65535])('accepts in-range port %s', (port) => {
    expect(MinioConfigSchema.safeParse({ ...validConfig, port }).success).toBe(
      true,
    );
  });

  it('applies the ttlDays default when absent', () => {
    const withoutTtl = { ...validConfig } as Partial<typeof validConfig>;
    delete withoutTtl.ttlDays;
    const result = MinioConfigSchema.safeParse(withoutTtl);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.ttlDays).toBe(7);
  });

  it.each([0, -1, 1.5])(
    'rejects non-positive/non-integer ttlDays %s',
    (ttlDays) => {
      const result = MinioConfigSchema.safeParse({ ...validConfig, ttlDays });
      expect(result.success).toBe(false);
      expect(result.error?.issues.some((i) => i.path.includes('ttlDays'))).toBe(
        true,
      );
    },
  );
});

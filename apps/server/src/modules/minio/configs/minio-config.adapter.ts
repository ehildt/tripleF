import { getBooleanEnv } from '@triplef/helpers/get-boolean-env';
import { getNumberEnv } from '@triplef/helpers/get-number-env';
import { z } from 'zod';

export const MinioConfigSchema = z.strictObject({
  endpoint: z.string(),
  port: z.number().int().min(0).max(65535),
  useSsl: z.boolean(),
  accessKey: z.string(),
  secretKey: z.string(),
  bucket: z.string(),
  /** Default object lifetime for uploaded job buffers, in days. */
  ttlDays: z.number().int().positive().default(7),
});

/**
 * Shape of the validated MinIO config. Derived from the schema, so the type
 * can never drift from the runtime contract.
 */
export type MinioConfig = z.infer<typeof MinioConfigSchema>;

export function MinioConfigAdapter(env = process.env): MinioConfig {
  return {
    endpoint: env.MINIO_ENDPOINT!,
    port: getNumberEnv(env.MINIO_PORT, 9000) as number,
    useSsl: getBooleanEnv(env.MINIO_USE_SSL, false)!,
    accessKey: env.MINIO_ACCESS_KEY!,
    secretKey: env.MINIO_SECRET_KEY!,
    bucket: env.MINIO_BUCKET ?? 'failed-jobs',
    ttlDays: getNumberEnv(env.MINIO_TTL_DAYS, 7) as number,
  };
}

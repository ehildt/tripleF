import { getNumberEnv } from '@triplef/helpers/get-number-env';
import { z } from 'zod';

export const ObjectStorageConfigSchema = z.strictObject({
  endpoint: z
    .url()
    .refine(
      (value) => ['http:', 'https:'].includes(new URL(value).protocol),
      'Endpoint must use http or https',
    ),
  accessKeyId: z.string(),
  secretAccessKey: z.string(),
  bucket: z.string(),
  region: z.string().default('us-east-1'),
  /** Object lifetime for uploaded image buffers, in days. */
  imageTtlDays: z.number().int().positive().default(7),
});

/** Validated configuration for the S3-compatible object-storage capability. */
export type ObjectStorageConfig = z.infer<typeof ObjectStorageConfigSchema>;

export function ObjectStorageConfigAdapter(
  env = process.env,
): ObjectStorageConfig {
  return {
    endpoint: env.OBJECT_STORAGE_ENDPOINT!,
    accessKeyId: env.OBJECT_STORAGE_ACCESS_KEY_ID!,
    secretAccessKey: env.OBJECT_STORAGE_SECRET_ACCESS_KEY!,
    bucket: env.OBJECT_STORAGE_BUCKET ?? 'failed-jobs',
    region: env.OBJECT_STORAGE_REGION ?? 'us-east-1',
    imageTtlDays: getNumberEnv(env.OBJECT_STORAGE_IMAGE_TTL_DAYS, 7) as number,
  };
}

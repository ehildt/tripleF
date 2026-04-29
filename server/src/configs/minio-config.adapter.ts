import { getBooleanEnv } from '@ehildt/ckir-helpers/get-boolean-env';
import { getNumberEnv } from '@ehildt/ckir-helpers/get-number-env';
import Joi from 'joi';

export interface MinioConfig {
  endpoint: string;
  port: number;
  useSsl: boolean;
  accessKey: string;
  secretKey: string;
  bucket: string;
}

export const MinioConfigSchema = Joi.object<MinioConfig>({
  endpoint: Joi.string().required(),
  port: Joi.number().port().required(),
  useSsl: Joi.boolean().required(),
  accessKey: Joi.string().required(),
  secretKey: Joi.string().required(),
  bucket: Joi.string().required(),
}).required();

export function MinioConfigAdapter(env = process.env): MinioConfig {
  return {
    endpoint: env.MINIO_ENDPOINT!,
    port: getNumberEnv(env.MINIO_PORT, 9000) as number,
    useSsl: getBooleanEnv(env.MINIO_USE_SSL, false)!,
    accessKey: env.MINIO_ACCESS_KEY!,
    secretKey: env.MINIO_SECRET_KEY!,
    bucket: env.MINIO_BUCKET ?? 'failed-jobs',
  };
}

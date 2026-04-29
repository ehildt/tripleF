import { getNumberEnv } from '@ehildt/ckir-helpers/get-number-env';

export enum BULLMQ_QUEUE {
  IMAGE_DESCRIBE = 'image-describe',
  IMAGE_COMPARE = 'image-compare',
  IMAGE_OCR = 'image-ocr',
}

export const BULLMQ_WORKER_CONCURRENCY = getNumberEnv(
  process.env.BULLMQ_WORKER_CONCURRENCY,
  3,
) as number;

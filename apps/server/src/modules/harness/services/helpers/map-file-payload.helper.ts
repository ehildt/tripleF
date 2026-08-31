import type { MultipartFile } from '@fastify/multipart';
import { hashPayload } from '@triplef/helpers/hash-payload';

import type { FastifyMultipartMeta } from '../../dtos/harness-job.dto.js';
import { buildImageFingerprint } from '../../helpers/media/build-image-fingerprint.helper.js';

/** Convert one multipart file into a buffer + meta payload. */
export async function mapFilePayload(
  file: MultipartFile,
  index: number,
  providedHashes: string[] | undefined,
  fingerprint: boolean,
): Promise<{ buffer: Buffer; meta: FastifyMultipartMeta }> {
  const buffer = await file.toBuffer();
  const hash = providedHashes?.[index] ?? `${hashPayload(buffer, 'sha256')}`;
  const meta: FastifyMultipartMeta = {
    name: file.filename,
    type: file.mimetype,
    hash,
    fingerprint: fingerprint ? await buildImageFingerprint(buffer) : undefined,
    size: buffer.length,
  };
  return { buffer, meta };
}

import { hashPayload } from '@ehildt/ckir-helpers/hash-payload';
import sharp from 'sharp';

/**
 * Build a content fingerprint for an image buffer.
 * Resizes to a fixed maximum dimension, converts to PNG, and returns a SHA256
 * hash. The same settings are used for cloud image ingestion so user images
 * and downloaded reference images can be compared by hash.
 */
export async function buildImageFingerprint(
  buffer: Buffer,
  maxDimension = 512,
): Promise<string> {
  const metadata = await sharp(buffer).metadata();
  const width = metadata.width ?? maxDimension;
  const height = metadata.height ?? maxDimension;

  const shouldResize = width > maxDimension || height > maxDimension;
  const pipeline = shouldResize
    ? sharp(buffer).resize({
        width: maxDimension,
        height: maxDimension,
        fit: 'inside',
        withoutEnlargement: true,
      })
    : sharp(buffer);

  const normalized = await pipeline.png().toBuffer();
  return hashPayload(normalized, 'sha256');
}

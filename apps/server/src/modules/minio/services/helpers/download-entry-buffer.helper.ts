import type { Client } from 'minio';

import type { HarnessJobPayload } from '../../../harness/dtos/harness-job.dto.js';

type MetaEntry = HarnessJobPayload['meta'][number];

/**
 * Download one referenced object and pair it with its meta entry; null when
 * the object is missing (the caller skips it).
 */
export async function downloadEntryBuffer(
  entry: MetaEntry,
  deps: {
    objectName: string;
    client: Client;
    bucket: string;
    logger: { warn: (message: string) => void };
  },
): Promise<{ buffer: Buffer; entry: MetaEntry } | null> {
  try {
    const dataStream = await deps.client.getObject(
      deps.bucket,
      deps.objectName,
    );
    const chunks: Buffer[] = [];
    for await (const chunk of dataStream) chunks.push(chunk);
    return { buffer: Buffer.concat(chunks), entry };
  } catch (error) {
    const code = (error as { code?: string })?.code;
    if (code === 'NoSuchKey' || code === 'NotFound') {
      deps.logger.warn(
        `Missing referenced image ${deps.objectName}; skipping.`,
      );
      return null;
    }
    throw error;
  }
}

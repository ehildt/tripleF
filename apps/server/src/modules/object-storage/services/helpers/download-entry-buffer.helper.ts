import {
  GetObjectCommand,
  type GetObjectCommandOutput,
} from '@aws-sdk/client-s3';

import type { HarnessJobPayload } from '../../../harness/dtos/harness-job.dto.js';

import { isObjectNotFoundError } from './is-object-not-found-error.helper.js';

type MetaEntry = HarnessJobPayload['meta'][number];

type DownloadEntryBufferDependencies = {
  objectName: string;
  client: {
    send: (command: GetObjectCommand) => Promise<GetObjectCommandOutput>;
  };
  bucket: string;
  logger: { warn: (message: string) => void };
};

/**
 * Download one referenced object and pair it with its meta entry; null when
 * the object is missing (the caller skips it).
 */
export async function downloadEntryBuffer(
  entry: MetaEntry,
  deps: DownloadEntryBufferDependencies,
): Promise<{ buffer: Buffer; entry: MetaEntry } | null> {
  try {
    const output = await deps.client.send(
      new GetObjectCommand({ Bucket: deps.bucket, Key: deps.objectName }),
    );
    if (!output.Body) {
      throw new Error(`Object ${deps.objectName} returned no response body`);
    }

    const bytes = await output.Body.transformToByteArray();
    return { buffer: Buffer.from(bytes), entry };
  } catch (error) {
    if (isObjectNotFoundError(error)) {
      deps.logger.warn(
        `Missing referenced image ${deps.objectName}; skipping.`,
      );
      return null;
    }
    throw error;
  }
}

import type { Readable } from 'node:stream';

import {
  CreateBucketCommand,
  DeleteObjectCommand,
  DeleteObjectsCommand,
  GetObjectCommand,
  HeadBucketCommand,
  HeadObjectCommand,
  type HeadObjectOutput,
  ListObjectsV2Command,
  PutBucketLifecycleConfigurationCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import {
  Inject,
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { hashPayload } from '@triplef/helpers/hash-payload';

import type {
  FastifyMultipartMeta,
  HarnessJobPayload,
} from '../../harness/dtos/harness-job.dto.js';
import type { ObjectStorageConfig } from '../configs/object-storage-config.adapter.js';
import { OBJECT_STORAGE_CONFIG } from '../constants/object-storage.constants.js';

import { downloadEntryBuffer } from './helpers/download-entry-buffer.helper.js';
import { isObjectNotFoundError } from './helpers/is-object-not-found-error.helper.js';

@Injectable()
export class ObjectStorageService implements OnModuleInit, OnModuleDestroy {
  private _client: S3Client | null = null;

  private readonly logger = new Logger(ObjectStorageService.name);

  constructor(
    @Inject(OBJECT_STORAGE_CONFIG)
    private readonly _config: ObjectStorageConfig,
  ) {}

  private get client(): S3Client {
    if (!this._client)
      throw new Error('Object storage client is not initialized');

    return this._client;
  }

  get config() {
    return this._config;
  }

  async onModuleInit() {
    if (!this._client) {
      this._client = new S3Client({
        endpoint: this._config.endpoint,
        region: this._config.region,
        credentials: {
          accessKeyId: this._config.accessKeyId,
          secretAccessKey: this._config.secretAccessKey,
        },
        forcePathStyle: true,
      });
    }

    try {
      await this.client.send(
        new HeadBucketCommand({ Bucket: this._config.bucket }),
      );
    } catch (error) {
      const name = (error as { name?: unknown })?.name;
      if (!isObjectNotFoundError(error) && name !== 'NoSuchBucket') throw error;
      await this.client.send(
        new CreateBucketCommand({ Bucket: this._config.bucket }),
      );
    }

    await this.setBucketLifecycle();
  }

  private async setBucketLifecycle(): Promise<void> {
    try {
      await this.client.send(
        new PutBucketLifecycleConfigurationCommand({
          Bucket: this._config.bucket,
          LifecycleConfiguration: {
            Rules: [
              {
                ID: `expire-job-buffers-${this._config.imageTtlDays}d`,
                Status: 'Enabled',
                Filter: { Prefix: 'images/' },
                Expiration: { Days: this._config.imageTtlDays },
              },
            ],
          },
        }),
      );
    } catch (error) {
      // Lifecycle configuration is best-effort for S3-compatible local stores.
      this.logger.warn('Failed to set bucket lifecycle policy:', error);
    }
  }

  onModuleDestroy() {
    this._client?.destroy();
    this._client = null;
  }

  private getObjectKey(
    sessionId: string | undefined,
    conversationId: string | undefined,
    hash: string,
  ): string {
    return `images/${sessionId ?? 'unknown-session'}/${conversationId ?? 'unknown-conversation'}/${hash}.bin`;
  }

  private getObjectContentType(meta: FastifyMultipartMeta | undefined): string {
    return meta?.type ?? 'application/octet-stream';
  }

  private buildObjectStorageUrl(
    sessionId: string,
    conversationId: string,
    hash: string,
  ): string {
    return `/api/v1/object-storage/${sessionId}/${conversationId}/${hash}`;
  }

  async uploadBuffers(
    sessionId: string | undefined,
    conversationId: string | undefined,
    requestId: string,
    buffers: Buffer[],
    meta?: FastifyMultipartMeta[],
  ) {
    const results = await Promise.all(
      buffers.map(async (buffer, index) => {
        const entryMeta = meta?.[index];
        const hash = entryMeta?.hash ?? `${hashPayload(buffer, 'sha256')}`;
        const objectName = this.getObjectKey(sessionId, conversationId, hash);

        try {
          await this.client.send(
            new HeadObjectCommand({
              Bucket: this._config.bucket,
              Key: objectName,
            }),
          );
          return objectName;
        } catch {
          await this.client.send(
            new PutObjectCommand({
              Bucket: this._config.bucket,
              Key: objectName,
              Body: buffer,
              ContentLength: buffer.length,
              ContentType: this.getObjectContentType(entryMeta),
              Metadata: {
                requestid: requestId,
                hash,
                // Header values must stay printable ASCII: unicode filenames
                // (and spaces) can otherwise break request signing.
                filename:
                  entryMeta?.name?.replace(/\s|[^\x20-\x7e]/g, '-') ??
                  `image-${index + 1}`,
              },
            }),
          );
          return objectName;
        }
      }),
    );

    return results;
  }

  async downloadBuffers(
    sessionId: string | undefined,
    conversationId: string | undefined,
    meta: HarnessJobPayload['meta'],
  ): Promise<{
    buffers: Buffer[];
    keptMeta: HarnessJobPayload['meta'];
  }> {
    const results = await Promise.all(
      meta.map(async (entry) => {
        const objectName = this.getObjectKey(
          sessionId,
          conversationId,
          entry.hash,
        );
        return downloadEntryBuffer(entry, {
          objectName,
          client: this.client,
          bucket: this._config.bucket,
          logger: this.logger,
        });
      }),
    );

    const kept = results.filter((r): r is NonNullable<typeof r> => r !== null);

    return {
      buffers: kept.map((r) => r.buffer),
      keptMeta: kept.map((r) => r.entry),
    };
  }

  /** Download one object by hash; return null only when it is missing. */
  async downloadBuffer(
    sessionId: string | undefined,
    conversationId: string | undefined,
    hash: string,
  ): Promise<Buffer | null> {
    const objectName = this.getObjectKey(sessionId, conversationId, hash);
    try {
      const output = await this.client.send(
        new GetObjectCommand({ Bucket: this._config.bucket, Key: objectName }),
      );

      if (!output.Body)
        throw new Error(`Object ${objectName} returned no response body`);

      return Buffer.from(await output.Body.transformToByteArray());
    } catch (error) {
      if (isObjectNotFoundError(error)) return null;
      throw error;
    }
  }

  /** Object-storage API path for a known-present object. */
  buildFileUrl(
    sessionId: string | undefined,
    conversationId: string | undefined,
    hash: string,
  ): string {
    return this.buildObjectStorageUrl(
      sessionId ?? 'unknown-session',
      conversationId ?? 'unknown-conversation',
      hash,
    );
  }

  async getObjectUrl(
    sessionId: string,
    conversationId: string,
    hash: string,
  ): Promise<string | null> {
    const objectName = this.getObjectKey(sessionId, conversationId, hash);
    try {
      await this.client.send(
        new HeadObjectCommand({
          Bucket: this._config.bucket,
          Key: objectName,
        }),
      );
      return this.buildObjectStorageUrl(sessionId, conversationId, hash);
    } catch {
      return null;
    }
  }

  async getObjectStreamAndMeta(
    sessionId: string,
    conversationId: string,
    hash: string,
  ): Promise<{
    stream: Readable;
    meta: HeadObjectOutput;
  }> {
    const objectName = this.getObjectKey(sessionId, conversationId, hash);
    const meta = await this.client.send(
      new HeadObjectCommand({
        Bucket: this._config.bucket,
        Key: objectName,
      }),
    );

    const output = await this.client.send(
      new GetObjectCommand({ Bucket: this._config.bucket, Key: objectName }),
    );

    if (!output.Body)
      throw new Error(`Object ${objectName} returned no response body`);

    return { stream: output.Body as Readable, meta };
  }

  async deleteBuffers(requestId: string) {
    const objectKeys = await this.listObjectKeys('images/');
    const matchingKeys: string[] = [];

    for (const key of objectKeys) {
      const output = await this.client.send(
        new HeadObjectCommand({ Bucket: this._config.bucket, Key: key }),
      );

      if (output.Metadata?.requestid === requestId) matchingKeys.push(key);
    }

    await this.deleteObjectKeys(matchingKeys);
  }

  async objectExists(
    sessionId: string,
    conversationId: string,
    hash: string,
  ): Promise<boolean> {
    const objectName = this.getObjectKey(sessionId, conversationId, hash);
    try {
      await this.client.send(
        new HeadObjectCommand({
          Bucket: this._config.bucket,
          Key: objectName,
        }),
      );
      return true;
    } catch {
      return false;
    }
  }

  async deleteObject(
    sessionId: string,
    conversationId: string,
    hash: string,
  ): Promise<void> {
    const objectName = this.getObjectKey(sessionId, conversationId, hash);
    await this.client.send(
      new DeleteObjectCommand({
        Bucket: this._config.bucket,
        Key: objectName,
      }),
    );
  }

  async listObjectKeys(prefix: string): Promise<string[]> {
    const keys: string[] = [];
    let continuationToken: string | undefined;

    do {
      const output = await this.client.send(
        new ListObjectsV2Command({
          Bucket: this._config.bucket,
          Prefix: prefix,
          ContinuationToken: continuationToken,
        }),
      );

      for (const object of output.Contents ?? [])
        if (object.Key) keys.push(object.Key);

      continuationToken = output.IsTruncated
        ? output.NextContinuationToken
        : undefined;
    } while (continuationToken);

    return keys;
  }

  async deleteObjectKeys(objectKeys: string[]): Promise<void> {
    for (let index = 0; index < objectKeys.length; index += 1000) {
      const batch = objectKeys.slice(index, index + 1000);
      await this.client.send(
        new DeleteObjectsCommand({
          Bucket: this._config.bucket,
          Delete: {
            Objects: batch.map((Key) => ({ Key })),
            Quiet: true,
          },
        }),
      );
    }
  }

  async ping() {
    await this.client.send(
      new HeadBucketCommand({ Bucket: this._config.bucket }),
    );
  }
}

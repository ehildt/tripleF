import { hashPayload } from '@ehildt/ckir-helpers/hash-payload';
import {
  Inject,
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { Client, ItemBucketMetadata } from 'minio';

import type { MinioConfig } from '../../../configs/minio-config.adapter.js';
import { MINIO_CONFIG } from '../../../constants/minio.constants.js';
import type {
  FastifyMultipartMeta,
  HarnessJobPayload,
} from '../../harness/dtos/harness-job.dto.js';

@Injectable()
export class MinioService implements OnModuleInit, OnModuleDestroy {
  private _client: Client | null = null;

  private readonly logger = new Logger(MinioService.name);

  constructor(
    @Inject(MINIO_CONFIG)
    private readonly _config: MinioConfig,
  ) {}

  get client() {
    return this._client as Client;
  }

  get config() {
    return this._config;
  }

  async onModuleInit() {
    if (!this._client) {
      this._client = new Client({
        endPoint: this._config.endpoint,
        port: this._config.port,
        useSSL: this._config.useSsl,
        accessKey: this._config.accessKey,
        secretKey: this._config.secretKey,
      });
    }

    const exists = await this._client.bucketExists(this._config.bucket);
    if (!exists) {
      await this._client.makeBucket(this._config.bucket);
    }

    await this.setBucketLifecycle();
  }

  private async setBucketLifecycle(): Promise<void> {
    const rule = {
      ID: `expire-job-buffers-${this._config.ttlDays}d`,
      Status: 'Enabled',
      Filter: { Prefix: 'images/' },
      Expiration: { Days: this._config.ttlDays },
    };

    try {
      await this.client.setBucketLifecycle(this._config.bucket, {
        Rule: [rule],
      });
    } catch (error) {
      // Lifecycle configuration is best-effort; some test/embedded MinIO
      // instances may not support the API.
      this.logger.warn('Failed to set bucket lifecycle policy:', error);
    }
  }

  onModuleDestroy() {
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

  private buildStorageUrl(
    sessionId: string,
    conversationId: string,
    hash: string,
  ): string {
    return `/api/v1/storage/${sessionId}/${conversationId}/${hash}`;
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
        const metadata: ItemBucketMetadata = {
          'Content-Type': this.getObjectContentType(entryMeta),
          'X-Amz-Meta-Requestid': requestId,
          'X-Amz-Meta-Hash': hash,
          'X-Amz-Meta-Filename': entryMeta?.name ?? `image-${index + 1}`,
        };
        try {
          await this.client.statObject(this._config.bucket, objectName);
          return objectName;
        } catch {
          await this.client.putObject(
            this._config.bucket,
            objectName,
            buffer,
            buffer.length,
            metadata,
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
  ): Promise<Buffer[]> {
    return Promise.all(
      meta.map(async (entry) => {
        const objectName = this.getObjectKey(
          sessionId,
          conversationId,
          entry.hash,
        );
        const dataStream = await this.client.getObject(
          this._config.bucket,
          objectName,
        );
        const chunks: Buffer[] = [];
        for await (const chunk of dataStream) chunks.push(chunk);
        return Buffer.concat(chunks);
      }),
    );
  }

  async getObjectUrl(
    sessionId: string,
    conversationId: string,
    hash: string,
  ): Promise<string | null> {
    const objectName = this.getObjectKey(sessionId, conversationId, hash);
    try {
      await this.client.statObject(this._config.bucket, objectName);
      return this.buildStorageUrl(sessionId, conversationId, hash);
    } catch {
      return null;
    }
  }

  async getObjectStreamAndMeta(
    sessionId: string,
    conversationId: string,
    hash: string,
  ): Promise<{
    stream: import('minio').BucketStream<Buffer>;
    meta: ItemBucketMetadata;
  }> {
    const objectName = this.getObjectKey(sessionId, conversationId, hash);
    const stat = await this.client.statObject(this._config.bucket, objectName);
    const stream = await this.client.getObject(this._config.bucket, objectName);
    return { stream, meta: stat.metaData };
  }

  async deleteBuffers(requestId: string) {
    const prefix = 'images/';
    const stream = this.client.listObjectsV2(this._config.bucket, prefix, true);

    const objects: string[] = [];
    for await (const obj of stream) {
      if (!obj.name) continue;
      const meta = await this.client.statObject(this._config.bucket, obj.name);
      const objectRequestId = meta.metaData?.['X-Amz-Meta-Requestid'];
      if (objectRequestId === requestId) objects.push(obj.name);
    }

    if (objects.length === 0) return;
    await this.client.removeObjects(this._config.bucket, objects);
  }

  async objectExists(
    sessionId: string,
    conversationId: string,
    hash: string,
  ): Promise<boolean> {
    const objectName = this.getObjectKey(sessionId, conversationId, hash);
    try {
      await this.client.statObject(this._config.bucket, objectName);
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
    await this.client.removeObject(this._config.bucket, objectName);
  }

  async ping() {
    await this.client.bucketExists(this._config.bucket);
  }
}

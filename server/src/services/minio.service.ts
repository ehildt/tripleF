import {
  Inject,
  Injectable,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { Client } from 'minio';

import type { MinioConfig } from '../configs/minio-config.adapter.js';
import { MINIO_CONFIG } from '../constants/minio.constants.js';

@Injectable()
export class MinioService implements OnModuleInit, OnModuleDestroy {
  private _client: Client | null = null;

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
    this._client = new Client({
      endPoint: this._config.endpoint,
      port: this._config.port,
      useSSL: this._config.useSsl,
      accessKey: this._config.accessKey,
      secretKey: this._config.secretKey,
    });

    const exists = await this._client.bucketExists(this._config.bucket);
    if (!exists) await this._client.makeBucket(this._config.bucket);
  }

  onModuleDestroy() {
    this._client = null;
  }

  private getObjectKey(requestId: string, index: number) {
    return `jobs/${requestId}/${index}.bin`;
  }

  async uploadBuffers(requestId: string, buffers: Buffer[]) {
    const results = await Promise.all(
      buffers.map(async (buffer, index) => {
        const objectName = this.getObjectKey(requestId, index);
        await this.client.putObject(
          this._config.bucket,
          objectName,
          buffer,
          buffer.length,
        );
        return objectName;
      }),
    );

    return results;
  }

  async downloadBuffers(requestId: string): Promise<Buffer[]> {
    const prefix = `jobs/${requestId}/`;
    const stream = this.client.listObjectsV2(
      this._config.bucket,
      prefix,
      false,
    );

    const objects: string[] = [];
    for await (const obj of stream) if (obj.name) objects.push(obj.name);
    objects.sort();

    const buffers = await Promise.all(
      objects.map(async (objectName) => {
        const dataStream = await this.client.getObject(
          this._config.bucket,
          objectName,
        );
        const chunks: Buffer[] = [];
        for await (const chunk of dataStream) chunks.push(chunk);
        return Buffer.concat(chunks);
      }),
    );

    return buffers;
  }

  async deleteBuffers(requestId: string) {
    const prefix = `jobs/${requestId}/`;
    const stream = this.client.listObjectsV2(
      this._config.bucket,
      prefix,
      false,
    );

    const objects: string[] = [];
    for await (const obj of stream) if (obj.name) objects.push(obj.name);
    if (objects.length === 0) return;
    await this.client.removeObjects(this._config.bucket, objects);
  }

  async ping() {
    await this.client.bucketExists(this._config.bucket);
  }
}

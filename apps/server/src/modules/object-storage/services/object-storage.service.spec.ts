import { Readable } from 'node:stream';

import {
  CreateBucketCommand,
  DeleteObjectCommand,
  DeleteObjectsCommand,
  GetObjectCommand,
  HeadBucketCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  PutBucketLifecycleConfigurationCommand,
  PutObjectCommand,
} from '@aws-sdk/client-s3';
import { Test } from '@nestjs/testing';

import { OBJECT_STORAGE_CONFIG } from '../constants/object-storage.constants.js';

import { ObjectStorageService } from './object-storage.service.js';

const config = {
  endpoint: 'http://localhost:9000',
  accessKeyId: 'test-access',
  secretAccessKey: 'test-secret',
  bucket: 'test-bucket',
  region: 'us-east-1',
  imageTtlDays: 7,
};

const imageMeta = (hash: string) => ({
  name: `${hash}.png`,
  type: 'image/png',
  hash,
  size: 4,
});

describe('ObjectStorageService', () => {
  let service: ObjectStorageService;
  let client: {
    send: ReturnType<typeof vi.fn>;
    destroy: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    client = { send: vi.fn().mockResolvedValue({}), destroy: vi.fn() };
    const module = await Test.createTestingModule({
      providers: [
        ObjectStorageService,
        { provide: OBJECT_STORAGE_CONFIG, useValue: config },
      ],
    }).compile();
    service = module.get(ObjectStorageService);
    (service as unknown as { _client: unknown })._client = client;
  });

  describe('onModuleInit', () => {
    it('checks the bucket and applies best-effort image lifecycle', async () => {
      await service.onModuleInit();

      expect(client.send).toHaveBeenCalledTimes(2);
      expect(client.send.mock.calls[0][0]).toBeInstanceOf(HeadBucketCommand);
      const lifecycle = client.send.mock.calls[1][0];
      expect(lifecycle).toBeInstanceOf(PutBucketLifecycleConfigurationCommand);
      expect(lifecycle.input).toEqual({
        Bucket: 'test-bucket',
        LifecycleConfiguration: {
          Rules: [
            {
              ID: 'expire-job-buffers-7d',
              Status: 'Enabled',
              Filter: { Prefix: 'images/' },
              Expiration: { Days: 7 },
            },
          ],
        },
      });
    });

    it('creates a missing bucket', async () => {
      client.send.mockImplementation(async (command) => {
        if (command instanceof HeadBucketCommand) {
          throw Object.assign(new Error('missing'), { name: 'NotFound' });
        }
        return {};
      });

      await service.onModuleInit();

      expect(client.send.mock.calls[1][0]).toBeInstanceOf(CreateBucketCommand);
      expect(client.send.mock.calls[1][0].input.Bucket).toBe('test-bucket');
    });

    it('propagates unexpected bucket-bootstrap failures', async () => {
      const error = new Error('access denied');
      client.send.mockRejectedValue(error);
      await expect(service.onModuleInit()).rejects.toBe(error);
    });

    it('does not fail startup when lifecycle configuration is unsupported', async () => {
      client.send.mockImplementation(async (command) => {
        if (command instanceof PutBucketLifecycleConfigurationCommand) {
          throw new Error('not implemented');
        }
        return {};
      });
      const logger = (
        service as unknown as {
          logger: { warn: (...args: unknown[]) => void };
        }
      ).logger;
      const warn = vi.spyOn(logger, 'warn').mockImplementation(() => {});

      await expect(service.onModuleInit()).resolves.toBeUndefined();
      expect(warn).toHaveBeenCalled();
    });

    it('destroys the AWS SDK client on shutdown', async () => {
      await service.onModuleInit();
      service.onModuleDestroy();
      expect(client.destroy).toHaveBeenCalledOnce();
    });
  });

  describe('object operations', () => {
    beforeEach(async () => {
      await service.onModuleInit();
      client.send.mockClear();
    });

    it('uploads a missing object with AWS metadata and content length', async () => {
      client.send.mockImplementation(async (command) => {
        if (command instanceof HeadObjectCommand) {
          throw Object.assign(new Error('missing'), { name: 'NotFound' });
        }
        return {};
      });

      await expect(
        service.uploadBuffers(
          's',
          'c',
          'req',
          [Buffer.from('data')],
          [{ ...imageMeta('abc'), name: 'sp ace.png' }],
        ),
      ).resolves.toEqual(['images/s/c/abc.bin']);

      const put = client.send.mock.calls[1][0];
      expect(put).toBeInstanceOf(PutObjectCommand);
      expect(put.input).toMatchObject({
        Bucket: 'test-bucket',
        Key: 'images/s/c/abc.bin',
        ContentLength: 4,
        ContentType: 'image/png',
        Metadata: {
          requestid: 'req',
          hash: 'abc',
          filename: 'sp-ace.png',
        },
      });
    });

    it('skips uploading an existing object', async () => {
      await service.uploadBuffers(
        's',
        'c',
        'req',
        [Buffer.from('data')],
        [imageMeta('abc')],
      );
      expect(client.send).toHaveBeenCalledOnce();
      expect(client.send.mock.calls[0][0]).toBeInstanceOf(HeadObjectCommand);
    });

    it('downloads referenced buffers and keeps matching metadata', async () => {
      client.send.mockImplementation(async (command) => {
        if (command instanceof GetObjectCommand) {
          const value = command.input.Key?.includes('abc') ? 'first' : 'second';
          return {
            Body: {
              transformToByteArray: async () => new TextEncoder().encode(value),
            },
          };
        }
        return {};
      });

      const result = await service.downloadBuffers('s', 'c', [
        imageMeta('abc'),
        imageMeta('def'),
      ]);

      expect(result.buffers.map((buffer) => buffer.toString())).toEqual([
        'first',
        'second',
      ]);
      expect(result.keptMeta.map((entry) => entry.hash)).toEqual([
        'abc',
        'def',
      ]);
    });

    it('downloads one object and returns null for a missing key', async () => {
      client.send.mockResolvedValue({
        Body: {
          transformToByteArray: async () => new TextEncoder().encode('data'),
        },
      });
      await expect(service.downloadBuffer('s', 'c', 'abc')).resolves.toEqual(
        Buffer.from('data'),
      );

      client.send.mockRejectedValue(
        Object.assign(new Error('missing'), { name: 'NoSuchKey' }),
      );
      await expect(service.downloadBuffer('s', 'c', 'abc')).resolves.toBeNull();
    });

    it('builds only the object-storage API URL', () => {
      expect(service.buildFileUrl('s', 'c', 'abc')).toBe(
        '/api/v1/object-storage/s/c/abc',
      );
    });

    it('returns an object URL only when the object exists', async () => {
      await expect(service.getObjectUrl('s', 'c', 'abc')).resolves.toBe(
        '/api/v1/object-storage/s/c/abc',
      );
      client.send.mockRejectedValue(new Error('missing'));
      await expect(service.getObjectUrl('s', 'c', 'abc')).resolves.toBeNull();
    });

    it('returns the SDK body stream and head metadata', async () => {
      const stream = Readable.from(['data']);
      client.send.mockImplementation(async (command) => {
        if (command instanceof HeadObjectCommand) {
          return { ContentType: 'image/png' };
        }
        if (command instanceof GetObjectCommand) return { Body: stream };
        return {};
      });

      const result = await service.getObjectStreamAndMeta('s', 'c', 'abc');
      expect(result.stream).toBe(stream);
      expect(result.meta.ContentType).toBe('image/png');
    });

    it('checks object existence', async () => {
      await expect(service.objectExists('s', 'c', 'abc')).resolves.toBe(true);
      client.send.mockRejectedValue(new Error('missing'));
      await expect(service.objectExists('s', 'c', 'abc')).resolves.toBe(false);
    });

    it('deletes one object', async () => {
      await service.deleteObject('s', 'c', 'abc');
      const command = client.send.mock.calls[0][0];
      expect(command).toBeInstanceOf(DeleteObjectCommand);
      expect(command.input.Key).toBe('images/s/c/abc.bin');
    });

    it('paginates object listing', async () => {
      client.send.mockImplementation(async (command) => {
        if (command instanceof ListObjectsV2Command) {
          if (!command.input.ContinuationToken) {
            return {
              Contents: [{ Key: 'images/s/c/a.bin' }],
              IsTruncated: true,
              NextContinuationToken: 'next',
            };
          }
          return {
            Contents: [{ Key: 'images/s/c/b.bin' }],
            IsTruncated: false,
          };
        }
        return {};
      });

      await expect(service.listObjectKeys('images/s/c/')).resolves.toEqual([
        'images/s/c/a.bin',
        'images/s/c/b.bin',
      ]);
      expect(client.send).toHaveBeenCalledTimes(2);
      expect(client.send.mock.calls[1][0].input.ContinuationToken).toBe('next');
    });

    it('deletes object keys in batches of at most 1000', async () => {
      const keys = Array.from({ length: 1001 }, (_, i) => `images/${i}.bin`);
      await service.deleteObjectKeys(keys);

      const commands = client.send.mock.calls
        .map(([command]) => command)
        .filter((command) => command instanceof DeleteObjectsCommand);
      expect(commands).toHaveLength(2);
      expect(commands[0].input.Delete?.Objects).toHaveLength(1000);
      expect(commands[1].input.Delete?.Objects).toHaveLength(1);

      client.send.mockClear();
      await service.deleteObjectKeys([]);
      expect(client.send).not.toHaveBeenCalled();
    });

    it('deletes buffers whose lowercase AWS requestid metadata matches', async () => {
      client.send.mockImplementation(async (command) => {
        if (command instanceof ListObjectsV2Command) {
          return {
            Contents: [
              { Key: 'images/s/c/a.bin' },
              { Key: 'images/s/c/b.bin' },
            ],
          };
        }
        if (command instanceof HeadObjectCommand) {
          return {
            Metadata: {
              requestid: command.input.Key?.includes('/a.') ? 'req' : 'other',
            },
          };
        }
        return {};
      });

      await service.deleteBuffers('req');

      const command = client.send.mock.calls.at(-1)?.[0];
      expect(command).toBeInstanceOf(DeleteObjectsCommand);
      expect(command.input.Delete?.Objects).toEqual([
        { Key: 'images/s/c/a.bin' },
      ]);
    });

    it('checks bucket readiness with HeadBucket', async () => {
      await service.ping();
      expect(client.send.mock.calls[0][0]).toBeInstanceOf(HeadBucketCommand);
    });
  });
});

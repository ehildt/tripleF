import { Test, TestingModule } from '@nestjs/testing';
import { describe, expect, it, vi } from 'vitest';

import { MINIO_CONFIG } from '../../../constants/minio.constants.js';

import { MinioService } from './minio.service.js';

const mockConfig = {
  endpoint: 'localhost',
  port: 9000,
  useSsl: false,
  accessKey: 'access',
  secretKey: 'secret',
  bucket: 'test-bucket',
  ttlDays: 7,
};

describe('MinioService', () => {
  let service: MinioService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MinioService,
        {
          provide: MINIO_CONFIG,
          useValue: mockConfig,
        },
      ],
    }).compile();

    service = module.get<MinioService>(MinioService);
    // Avoid real network calls by mocking after construction but before init.
    (service as any)._client = {
      bucketExists: vi.fn().mockResolvedValue(true),
      setBucketLifecycle: vi.fn().mockResolvedValue(undefined),
      putObject: vi.fn().mockResolvedValue(undefined),
      statObject: vi.fn().mockRejectedValue(new Error('not found')),
      getObject: vi.fn().mockRejectedValue(new Error('not found')),
      listObjectsV2: vi.fn().mockReturnValue([]),
      removeObjects: vi.fn().mockResolvedValue(undefined),
      removeObject: vi.fn().mockResolvedValue(undefined),
    };
    await service.onModuleInit();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('applies bucket lifecycle on init', () => {
    expect(service.client.setBucketLifecycle).toHaveBeenCalledWith(
      'test-bucket',
      expect.objectContaining({
        Rule: expect.arrayContaining([
          expect.objectContaining({
            ID: 'expire-job-buffers-7d',
            Status: 'Enabled',
            Filter: { Prefix: 'images/' },
            Expiration: { Days: 7 },
          }),
        ]),
      }),
    );
  });

  it('uploads buffers with content-type metadata', async () => {
    await service.uploadBuffers(
      'sess-1',
      'conv-1',
      'req-1',
      [Buffer.from('img')],
      [{ name: 'a.png', type: 'image/png', hash: 'h' }],
    );

    expect(service.client.putObject).toHaveBeenCalledWith(
      'test-bucket',
      'images/sess-1/conv-1/h.bin',
      Buffer.from('img'),
      3,
      expect.objectContaining({ 'Content-Type': 'image/png' }),
    );
  });

  it('skips upload when object already exists for session, conversation and hash', async () => {
    service.client.statObject = vi.fn().mockResolvedValue({});

    await service.uploadBuffers(
      'sess-1',
      'conv-1',
      'req-1',
      [Buffer.from('img')],
      [{ name: 'a.png', type: 'image/png', hash: 'h' }],
    );

    expect(service.client.putObject).not.toHaveBeenCalled();
  });

  it('builds storage URLs', async () => {
    service.client.statObject = vi.fn().mockResolvedValue({});

    const url = await service.getObjectUrl('sess-1', 'conv-1', 'h');

    expect(url).toBe('/api/v1/storage/sess-1/conv-1/h');
  });

  it('returns null when object does not exist', async () => {
    service.client.statObject = vi
      .fn()
      .mockRejectedValue(new Error('not found'));

    const url = await service.getObjectUrl('sess-1', 'conv-1', 'h');

    expect(url).toBeNull();
  });

  it('checks object existence', async () => {
    service.client.statObject = vi.fn().mockResolvedValue({});

    const exists = await service.objectExists('sess-1', 'conv-1', 'h');

    expect(exists).toBe(true);
  });

  it('reports object does not exist', async () => {
    service.client.statObject = vi
      .fn()
      .mockRejectedValue(new Error('not found'));

    const exists = await service.objectExists('sess-1', 'conv-1', 'h');

    expect(exists).toBe(false);
  });

  it('deletes a single object', async () => {
    await service.deleteObject('sess-1', 'conv-1', 'h');

    expect(service.client.removeObject).toHaveBeenCalledWith(
      'test-bucket',
      'images/sess-1/conv-1/h.bin',
    );
  });
});

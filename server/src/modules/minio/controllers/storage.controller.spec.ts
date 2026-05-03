import { Test, TestingModule } from '@nestjs/testing';
import { describe, expect, it, vi } from 'vitest';

import { MINIO_CONFIG } from '../../../constants/minio.constants.js';
import { MinioService } from '../services/minio.service.js';

import { StorageController } from './storage.controller.js';

const mockConfig = {
  endpoint: 'localhost',
  port: 9000,
  useSsl: false,
  accessKey: 'access',
  secretKey: 'secret',
  bucket: 'test-bucket',
  ttlDays: 7,
};

describe('StorageController', () => {
  let controller: StorageController;
  let service: MinioService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [StorageController],
      providers: [
        MinioService,
        {
          provide: MINIO_CONFIG,
          useValue: mockConfig,
        },
      ],
    }).compile();

    controller = module.get<StorageController>(StorageController);
    service = module.get<MinioService>(MinioService);
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

  it('returns true when object exists', async () => {
    service.client.statObject = vi.fn().mockResolvedValue({});

    const result = await controller.exists('sess-1', 'conv-1', 'h');

    expect(result).toEqual({ exists: true });
  });

  it('returns false when object does not exist', async () => {
    service.client.statObject = vi
      .fn()
      .mockRejectedValue(new Error('not found'));

    const result = await controller.exists('sess-1', 'conv-1', 'h');

    expect(result).toEqual({ exists: false });
  });

  it('delegates single object deletion to service', async () => {
    service.client.removeObject = vi.fn().mockResolvedValue(undefined);

    await controller.removeObject('sess-1', 'conv-1', 'h');

    expect(service.client.removeObject).toHaveBeenCalledWith(
      'test-bucket',
      'images/sess-1/conv-1/h.bin',
    );
  });
});

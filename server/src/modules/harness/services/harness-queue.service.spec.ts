import { MultipartFile } from '@fastify/multipart';
import { getQueueToken } from '@nestjs/bullmq';
import { Test, TestingModule } from '@nestjs/testing';
import { vi } from 'vitest';

import { HARNESS_QUEUE } from '../../bullmq/constants/bullmq.constants.js';
import { MinioService } from '../../minio/services/minio.service.js';

import { HarnessCancellationService } from './harness-cancellation.service.js';
import { HarnessQueueService } from './harness-queue.service.js';
import { HarnessStepLogger } from './harness-step-logger.service.js';

vi.mock('../helpers/build-image-fingerprint.helper.js', () => ({
  buildImageFingerprint: vi.fn().mockResolvedValue('fingerprint'),
}));

describe('HarnessQueueService', () => {
  let service: HarnessQueueService;
  let queue: any;
  let minioService: MinioService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HarnessQueueService,
        {
          provide: getQueueToken(HARNESS_QUEUE),
          useValue: {
            add: vi.fn(),
            getJobs: vi.fn().mockResolvedValue([]),
          },
        },
        {
          provide: MinioService,
          useValue: {
            uploadBuffers: vi.fn(),
            deleteBuffers: vi.fn(),
          },
        },
        {
          provide: HarnessCancellationService,
          useValue: {
            cancel: vi.fn().mockReturnValue(false),
          },
        },
        {
          provide: HarnessStepLogger,
          useValue: {
            log: vi.fn(),
            warn: vi.fn(),
            error: vi.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<HarnessQueueService>(HarnessQueueService);
    queue = module.get(getQueueToken(HARNESS_QUEUE));
    minioService = module.get<MinioService>(MinioService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('converts multipart files to file payloads', async () => {
    const file = {
      filename: 'test.png',
      mimetype: 'image/png',
      toBuffer: vi.fn().mockResolvedValue(Buffer.from('img')),
    } as unknown as MultipartFile;

    const result = await service.toFilePayloads([file]);

    expect(result).toHaveLength(1);
    expect(result[0].meta.name).toBe('test.png');
    expect(result[0].meta.type).toBe('image/png');
    expect(result[0].meta.hash).toBeDefined();
  });

  it('uploads buffers with metadata and adds a job on emit', async () => {
    queue.add.mockResolvedValue({ id: 1 });

    const req = {
      buffers: [Buffer.from('img')],
      meta: [{ name: 'test.png', type: 'image/png', hash: 'abc' }],
      filters: { requestId: 'req-1', sessionId: 'sess-1' },
    } as any;

    const job = await service.emit(req);

    expect(minioService.uploadBuffers).toHaveBeenCalledWith(
      'sess-1',
      undefined,
      'req-1',
      [Buffer.from('img')],
      [{ name: 'test.png', type: 'image/png', hash: 'abc' }],
    );
    expect(queue.add).toHaveBeenCalledWith('req-1', {
      meta: req.meta,
      filters: req.filters,
    });
    expect(job).toEqual({ id: 1 });
  });

  it('rolls back MinIO upload when queue add fails', async () => {
    queue.add.mockRejectedValue(new Error('queue down'));

    const req = {
      buffers: [Buffer.from('img')],
      meta: [],
      filters: { requestId: 'req-1' },
    } as any;

    const job = await service.emit(req);

    expect(minioService.deleteBuffers).toHaveBeenCalledWith('req-1');
    expect(job).toBeUndefined();
  });

  it('removes a waiting job and cleans up MinIO on cancel', async () => {
    const mockJob = { name: 'req-1', remove: vi.fn() };
    queue.getJobs.mockResolvedValue([mockJob]);

    const result = await service.cancel('req-1');

    expect(mockJob.remove).toHaveBeenCalled();
    expect(minioService.deleteBuffers).toHaveBeenCalledWith('req-1');
    expect(result).toBe(true);
  });
});

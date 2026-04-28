import { Readable } from 'node:stream';

import { hashPayload } from '@ehildt/ckir-helpers/hash-payload';
import { BullMQLoggerService } from '@ehildt/nestjs-bullmq-logger';
import { MultipartFile } from '@fastify/multipart';
import { getQueueToken } from '@nestjs/bullmq';
import { Test, TestingModule } from '@nestjs/testing';
import { Job, Queue } from 'bullmq';
import { Mock, vi } from 'vitest';

import { BULLMQ_QUEUE } from '../constants/bullmq.constants.js';

import { AnalyzeImageService } from './analyze-image.service.js';
import { JobTrackingService } from './job-tracking.service.js';

vi.mock('@ehildt/ckir-helpers/hash-payload', () => ({
  hashPayload: vi.fn(),
}));

describe('AnalyzeImageService', () => {
  let service: AnalyzeImageService;
  let describeQueue: Queue & { add: Mock };
  let compareQueue: Queue & { add: Mock };
  let ocrQueue: Queue & { add: Mock };
  let jobTrackingServiceMock: {
    add: ReturnType<typeof vi.fn>;
    isCanceled: ReturnType<typeof vi.fn>;
    cancel: ReturnType<typeof vi.fn>;
    get: ReturnType<typeof vi.fn>;
  };

  const mockFileStream = () =>
    Object.assign(new Readable({ read() {} }), {
      truncated: false,
      bytesRead: 0,
    });

  beforeEach(async () => {
    vi.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnalyzeImageService,
        {
          provide: getQueueToken(BULLMQ_QUEUE.IMAGE_DESCRIBE),
          useValue: { add: vi.fn(), remove: vi.fn() },
        },
        {
          provide: getQueueToken(BULLMQ_QUEUE.IMAGE_COMPARE),
          useValue: { add: vi.fn(), remove: vi.fn() },
        },
        {
          provide: getQueueToken(BULLMQ_QUEUE.IMAGE_OCR),
          useValue: { add: vi.fn(), remove: vi.fn() },
        },
        {
          provide: JobTrackingService,
          useValue: {
            add: vi.fn(),
            isCanceled: vi.fn().mockReturnValue(false),
            cancel: vi.fn(),
            get: vi.fn(),
          },
        },
        {
          provide: BullMQLoggerService,
          useValue: {
            log: vi.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(AnalyzeImageService);
    describeQueue = module.get(getQueueToken(BULLMQ_QUEUE.IMAGE_DESCRIBE));
    compareQueue = module.get(getQueueToken(BULLMQ_QUEUE.IMAGE_COMPARE));
    ocrQueue = module.get(getQueueToken(BULLMQ_QUEUE.IMAGE_OCR));
    jobTrackingServiceMock = module.get(JobTrackingService);
  });

  describe('toFilePayloads', () => {
    it('maps MultipartFile to buffer + meta payload', async () => {
      const buffer = Buffer.from('image-bytes');
      (
        hashPayload as unknown as { mockReturnValue: (value: string) => void }
      ).mockReturnValue('hash123');

      const file: MultipartFile = {
        type: 'file',
        fieldname: 'image',
        filename: 'photo.jpg',
        encoding: '7bit',
        mimetype: 'image/jpeg',
        fields: {},
        file: mockFileStream(),
        toBuffer: vi.fn().mockResolvedValue(buffer),
      };

      const result = await service.toFilePayloads('batch-1', [file]);

      expect(file.toBuffer).toHaveBeenCalledTimes(1);
      expect(hashPayload).toHaveBeenCalledWith(buffer, 'sha256');
      expect(result).toEqual([
        {
          buffer,
          meta: {
            name: 'photo.jpg',
            type: 'image/jpeg',
            hash: 'hash123_batch-1',
          },
        },
      ]);
    });

    it('handles multiple image files', async () => {
      const buffer1 = Buffer.from('image-bytes-1');
      const buffer2 = Buffer.from('image-bytes-2');
      const hashMock = hashPayload as ReturnType<typeof vi.fn>;
      hashMock.mockReturnValueOnce('hash1').mockReturnValueOnce('hash2');

      const file1: MultipartFile = {
        type: 'file',
        fieldname: 'image',
        filename: 'photo1.jpg',
        encoding: '7bit',
        mimetype: 'image/jpeg',
        fields: {},
        file: mockFileStream(),
        toBuffer: vi.fn().mockResolvedValue(buffer1),
      };

      const file2: MultipartFile = {
        type: 'file',
        fieldname: 'image',
        filename: 'photo2.png',
        encoding: '7bit',
        mimetype: 'image/png',
        fields: {},
        file: mockFileStream(),
        toBuffer: vi.fn().mockResolvedValue(buffer2),
      };

      const result = await service.toFilePayloads('req-456', [file1, file2]);

      expect(result).toHaveLength(2);
      expect(result[0].meta).toEqual({
        name: 'photo1.jpg',
        type: 'image/jpeg',
        hash: 'hash1_req-456',
      });
      expect(result[1].meta).toEqual({
        name: 'photo2.png',
        type: 'image/png',
        hash: 'hash2_req-456',
      });
    });

    it('handles empty image array', async () => {
      const result = await service.toFilePayloads('batch-1', []);

      expect(result).toEqual([]);
    });
  });

  describe('emit', () => {
    it('enqueues describe job', async () => {
      const req = {
        filters: { task: 'describe', requestId: 'req-123' },
      } as any;

      await service.emit(req);

      expect(describeQueue.add).toHaveBeenCalledWith('req-123', req);
    });

    it('enqueues compare job', async () => {
      const req = { filters: { task: 'compare', requestId: 'req-456' } } as any;

      await service.emit(req);

      expect(compareQueue.add).toHaveBeenCalledWith('req-456', req);
    });

    it('enqueues ocr job', async () => {
      const req = { filters: { task: 'ocr', requestId: 'req-789' } } as any;

      await service.emit(req);

      expect(ocrQueue.add).toHaveBeenCalledWith('req-789', req);
    });

    it('does nothing for unknown task', async () => {
      const req = { filters: { task: 'unknown' } } as any;

      await service.emit(req);

      expect(describeQueue.add).not.toHaveBeenCalled();
      expect(compareQueue.add).not.toHaveBeenCalled();
      expect(ocrQueue.add).not.toHaveBeenCalled();
    });

    it('removes job if already canceled before tracking', async () => {
      const mockJob = { id: 'job-1', remove: vi.fn() } as unknown as Job;
      (jobTrackingServiceMock.isCanceled as any).mockReturnValue(true);
      (describeQueue.add as any).mockResolvedValue(mockJob);

      const req = {
        filters: { task: 'describe', requestId: 'req-123' },
      } as any;

      const result = await service.emit(req);

      expect(mockJob.remove).toHaveBeenCalled();
      expect(result).toBeUndefined();
      expect(jobTrackingServiceMock.add).not.toHaveBeenCalled();
    });
  });

  describe('cancel', () => {
    it('should track cancel before job is queued', async () => {
      const requestId = 'test-request-123';

      const result = await service.cancel(requestId);

      expect(result).toBe(true);
      expect(jobTrackingServiceMock.cancel).toHaveBeenCalledWith(requestId);
    });

    it('should use job tracking service correctly', () => {
      expect(jobTrackingServiceMock).toBeDefined();
    });

    it('should return false when cancel fails', async () => {
      const requestId = 'test-request-456';
      (jobTrackingServiceMock.get as any).mockReturnValue({
        queueName: 'image-describe',
        jobId: 'job-1',
        status: 'pending',
      });
      (jobTrackingServiceMock.cancel as any).mockReturnValue(false);

      const result = await service.cancel(requestId);

      expect(result).toBe(false);
    });

    it('should remove job from queue when cancel succeeds for pending job', async () => {
      const requestId = 'test-request-789';
      const mockJob = { id: 'job-1', remove: vi.fn() } as unknown as Job;
      (jobTrackingServiceMock.get as any).mockReturnValue({
        queueName: 'image-describe',
        jobId: 'job-1',
        status: 'pending',
      });
      (jobTrackingServiceMock.cancel as any).mockReturnValue(true);
      vi.spyOn(Job, 'fromId').mockResolvedValue(mockJob as any);

      const result = await service.cancel(requestId);

      expect(result).toBe(true);
      expect(jobTrackingServiceMock.cancel).toHaveBeenCalledWith(requestId);
      expect(mockJob.remove).toHaveBeenCalled();
    });

    it('should handle job removal failure gracefully', async () => {
      const requestId = 'test-request-abc';
      (jobTrackingServiceMock.get as any).mockReturnValue({
        queueName: 'image-describe',
        jobId: 'job-1',
        status: 'pending',
      });
      (jobTrackingServiceMock.cancel as any).mockReturnValue(true);
      vi.spyOn(Job, 'fromId').mockRejectedValue(new Error('Job not found'));

      const result = await service.cancel(requestId);

      expect(result).toBe(true);
    });

    it('should not remove job if status is not pending', async () => {
      const requestId = 'test-request-def';
      const fromIdSpy = vi.spyOn(Job, 'fromId');
      (jobTrackingServiceMock.get as any).mockReturnValue({
        queueName: 'image-describe',
        jobId: 'job-1',
        status: 'active',
      });
      (jobTrackingServiceMock.cancel as any).mockReturnValue(true);

      const result = await service.cancel(requestId);

      expect(result).toBe(true);
      expect(fromIdSpy).not.toHaveBeenCalled();
    });
  });
});

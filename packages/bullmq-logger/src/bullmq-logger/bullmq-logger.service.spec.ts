import { Test, TestingModule } from '@nestjs/testing';
import { Job } from 'bullmq';
import { Logger } from 'pino';
import { Mocked } from 'vitest';

import { NESTJS_PINO_OPTIONS } from './bullmq-logger.constants.ts';
import { BullMQLoggerService } from './bullmq-logger.service.ts';

vi.mock('pino', () => ({
  default: vi.fn(() => mockLogger),
}));

const JOB_ATTEMPTS = 15;
const JOB_DELAY = 0;

let mockLogger: Mocked<Logger>;

describe('BullMQLoggerService', () => {
  let service: BullMQLoggerService;

  const createMockJob = (state: string): Partial<Job> => ({
    name: 'test-job',
    id: '1234',
    attemptsMade: 1,
    queueName: 'test-queue',
    timestamp: 123456789,
    processedOn: 123456790,
    finishedOn: 123456791,
    opts: {
      attempts: JOB_ATTEMPTS,
      delay: JOB_DELAY,
    },
    data: { foo: 'bar' },
    failedReason: 'Something went wrong',
    stacktrace: ['stack line 1', 'stack line 2'],
    getState: vi.fn().mockResolvedValue(state),
  });

  beforeEach(async () => {
    mockLogger = {
      info: vi.fn(),
      error: vi.fn(),
      warn: vi.fn(),
      debug: vi.fn(),
      trace: vi.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BullMQLoggerService,
        {
          provide: NESTJS_PINO_OPTIONS,
          useValue: mockLogger,
        },
      ],
    }).compile();

    service = module.get<BullMQLoggerService>(BullMQLoggerService);
    await service.onModuleInit();
  });

  it('should log info in log()', async () => {
    const job = createMockJob('completed') as Job;
    await service.log(job);
    expect(mockLogger.info).toHaveBeenCalledWith(
      expect.stringContaining('📦 test-queue(test-job) 🆔 ID-1234 🔄 Attempts-1 🟢 completed'),
    );
  });

  it('should log error in error()', async () => {
    const job = createMockJob('failed') as Job;
    await service.error(job);
    expect(mockLogger.error).toHaveBeenCalledWith(
      expect.objectContaining({
        msg: expect.stringContaining('⚫ failed'),
        failedReason: 'Something went wrong',
        stacktrace: ['stack line 1', 'stack line 2'],
      }),
    );
  });

  it('should log warn in warn()', async () => {
    const job = createMockJob('delayed') as Job;
    await service.warn(job);
    expect(mockLogger.warn).toHaveBeenCalledWith(
      expect.objectContaining({
        msg: expect.stringContaining('🟠 delayed'),
        queue: 'test-queue',
        maxAttempts: JOB_ATTEMPTS,
        delay: JOB_DELAY,
        timestamp: 123456789,
        processedOn: 123456790,
        finishedOn: 123456791,
      }),
    );
  });

  it('should log debug in debug()', async () => {
    const job = createMockJob('active') as Job;
    await service.debug(job);
    expect(mockLogger.debug).toHaveBeenCalledWith(
      expect.objectContaining({
        msg: expect.stringContaining('🟣 active'),
        queue: 'test-queue',
        timestamp: 123456789,
        opts: expect.any(Object),
        data: expect.any(Object),
      }),
    );
  });

  it('should log trace in verbose()', async () => {
    const job = createMockJob('waiting') as Job;
    await service.verbose(job);
    expect(mockLogger.trace).toHaveBeenCalledWith(job, expect.stringContaining('🟡 waiting'));
  });

  it('should return pino logger via getter', () => {
    expect(service.pino).toBe(mockLogger);
  });

  it('should log with prioritized state icon', async () => {
    const job = createMockJob('prioritized') as Job;
    await service.log(job);
    expect(mockLogger.info).toHaveBeenCalledWith(expect.stringContaining('🔵 prioritized'));
  });

  it('should log with waiting-children state icon', async () => {
    const job = createMockJob('waiting-children') as Job;
    await service.log(job);
    expect(mockLogger.info).toHaveBeenCalledWith(expect.stringContaining('🟤 waiting-children'));
  });

  it('should log with paused state icon', async () => {
    const job = createMockJob('paused') as Job;
    await service.log(job);
    expect(mockLogger.info).toHaveBeenCalledWith(expect.stringContaining('⚪ paused'));
  });

  it('should log with stalled state icon', async () => {
    const job = createMockJob('stalled') as Job;
    await service.log(job);
    expect(mockLogger.info).toHaveBeenCalledWith(expect.stringContaining('🔘 stalled'));
  });

  it('should log with unknown state icon', async () => {
    const job = createMockJob('unknown-state' as any) as Job;
    await service.log(job);
    expect(mockLogger.info).toHaveBeenCalledWith(expect.stringContaining('🚫 unknown-state'));
  });

  it('should log with canceled state icon', async () => {
    const job = createMockJob('canceled') as Job;
    await service.log(job);
    expect(mockLogger.info).toHaveBeenCalledWith(expect.stringContaining('⭕ canceled'));
  });

  it('should log with error state icon', async () => {
    const job = createMockJob('error' as any) as Job;
    await service.log(job);
    expect(mockLogger.info).toHaveBeenCalledWith(expect.stringContaining('🔴 error'));
  });

  it('should log with error state when getState is not available', async () => {
    const job = {
      name: 'test-job',
      id: '1234',
      attemptsMade: 1,
      queueName: 'test-queue',
      timestamp: 123456789,
      processedOn: undefined,
      finishedOn: undefined,
      opts: { attempts: JOB_ATTEMPTS, delay: JOB_DELAY },
      data: { foo: 'bar' },
      failedReason: undefined,
      stacktrace: undefined,
      // getState is not defined
    } as unknown as Job;
    await service.log(job);
    expect(mockLogger.info).toHaveBeenCalledWith(expect.stringContaining('🔴 error'));
  });

  it('should log with failed state when getState is not available but failedReason exists', async () => {
    const job = {
      name: 'test-job',
      id: '1234',
      attemptsMade: 1,
      queueName: 'test-queue',
      timestamp: 123456789,
      processedOn: undefined,
      finishedOn: undefined,
      opts: { attempts: JOB_ATTEMPTS, delay: JOB_DELAY },
      data: { foo: 'bar' },
      failedReason: 'Something went wrong',
      stacktrace: ['stack line 1'],
      // getState is not defined
    } as unknown as Job;
    await service.log(job);
    expect(mockLogger.info).toHaveBeenCalledWith(expect.stringContaining('⚫ failed'));
  });

  it('should log with completed state when getState is not available but finishedOn exists', async () => {
    const job = {
      name: 'test-job',
      id: '1234',
      attemptsMade: 1,
      queueName: 'test-queue',
      timestamp: 123456789,
      processedOn: 123456790,
      finishedOn: 123456791,
      opts: { attempts: JOB_ATTEMPTS, delay: JOB_DELAY },
      data: { foo: 'bar' },
      failedReason: undefined,
      stacktrace: undefined,
      // getState is not defined
    } as unknown as Job;
    await service.log(job);
    expect(mockLogger.info).toHaveBeenCalledWith(expect.stringContaining('🟢 completed'));
  });

  it('should use provided type parameter when getState is not available', async () => {
    const job = {
      name: 'test-job',
      id: '1234',
      attemptsMade: 1,
      queueName: 'test-queue',
      timestamp: 123456789,
      processedOn: undefined,
      finishedOn: undefined,
      opts: { attempts: JOB_ATTEMPTS, delay: JOB_DELAY },
      data: { foo: 'bar' },
      failedReason: undefined,
      stacktrace: undefined,
      // getState is not defined
    } as unknown as Job;
    await service.log(job, 'canceled');
    expect(mockLogger.info).toHaveBeenCalledWith(expect.stringContaining('⭕ canceled'));
  });

  it('should log error without failedReason when fallback state is not failed', async () => {
    const job = {
      name: 'test-job',
      id: '1234',
      attemptsMade: 1,
      queueName: 'test-queue',
      timestamp: 123456789,
      processedOn: 123456790,
      finishedOn: undefined,
      opts: { attempts: JOB_ATTEMPTS, delay: JOB_DELAY },
      data: { foo: 'bar' },
      failedReason: undefined,
      stacktrace: undefined,
      // getState is not defined - will fallback to "active" state
    } as unknown as Job;
    await service.error(job);
    expect(mockLogger.error).toHaveBeenCalledWith(
      expect.objectContaining({
        msg: expect.stringContaining('🟣 active'),
        failedReason: undefined,
        stacktrace: undefined,
      }),
    );
  });
});

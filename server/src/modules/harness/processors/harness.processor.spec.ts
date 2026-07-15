import { BullMQLoggerService } from '@ehildt/nestjs-bullmq-logger';
import { SocketIOService } from '@ehildt/nestjs-socket.io';
import { Test, TestingModule } from '@nestjs/testing';
import { Job } from 'bullmq';
import { vi } from 'vitest';

import { LifecycleService } from '../../dead-letter/services/lifecycle.service.js';
import { HarnessJobPayload } from '../dtos/harness-job.dto.js';
import { HarnessCancellationService } from '../services/harness-cancellation.service.js';
import { HarnessChatStreamingService } from '../services/harness-chat-streaming.service.js';
import { HarnessCompactService } from '../services/harness-compact.service.js';
import { HarnessContextService } from '../services/harness-context.service.js';
import { HarnessStepEngineService } from '../services/harness-step-engine.service.js';
import { StepRegistryService } from '../services/step-registry.service.js';
import { ExecuteStepService } from '../services/steps/execute-step.service.js';
import { InterpretStepService } from '../services/steps/interpret-step.service.js';
import { RespondStepService } from '../services/steps/respond-step.service.js';
import { SanitizeStepService } from '../services/steps/sanitize-step.service.js';

import { HarnessProcessor } from './harness.processor.js';

class TestHarnessProcessor extends HarnessProcessor {
  testOnCompleted(job: Job<HarnessJobPayload>) {
    return this.onCompleted(job);
  }

  testOnActive(job: Job<HarnessJobPayload>) {
    return this.onActive(job);
  }

  testOnFailed(job: Job<HarnessJobPayload>) {
    return this.onFailed(job);
  }
}

describe('HarnessProcessor', () => {
  let processor: TestHarnessProcessor;
  let contextService: HarnessContextService;
  let stepEngine: HarnessStepEngineService;
  let chatStreaming: HarnessChatStreamingService;
  let compactService: HarnessCompactService;
  let dlqLifecycleService: LifecycleService;
  let bullMQLogger: BullMQLoggerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TestHarnessProcessor,
        {
          provide: SocketIOService,
          useValue: {
            emit: vi.fn(),
            emitTo: vi.fn(),
          },
        },
        {
          provide: BullMQLoggerService,
          useValue: {
            log: vi.fn(),
            error: vi.fn(),
          },
        },
        {
          provide: StepRegistryService,
          useValue: {
            addStep: vi.fn().mockReturnThis(),
            getRegistry: vi.fn().mockReturnValue(new Map()),
          },
        },
        {
          provide: HarnessContextService,
          useValue: {
            buildContext: vi.fn().mockResolvedValue({ requestId: 'req-1' }),
          },
        },
        {
          provide: HarnessStepEngineService,
          useValue: {
            run: vi.fn().mockResolvedValue(undefined),
          },
        },
        {
          provide: HarnessCancellationService,
          useValue: {
            register: vi.fn().mockReturnValue(new AbortController()),
            deregister: vi.fn(),
          },
        },
        {
          provide: HarnessChatStreamingService,
          useValue: {
            streamResult: vi.fn().mockResolvedValue(undefined),
          },
        },
        {
          provide: HarnessCompactService,
          useValue: {
            runCompact: vi.fn().mockResolvedValue(undefined),
          },
        },
        {
          provide: InterpretStepService,
          useValue: {
            execute: vi.fn(),
          },
        },
        {
          provide: ExecuteStepService,
          useValue: {
            execute: vi.fn(),
          },
        },
        {
          provide: RespondStepService,
          useValue: {
            execute: vi.fn(),
          },
        },
        {
          provide: SanitizeStepService,
          useValue: {
            execute: vi.fn(),
          },
        },
        {
          provide: LifecycleService,
          useValue: {
            onJobCompleted: vi.fn(),
            onJobFailed: vi.fn(),
            handleFailed: vi.fn(),
          },
        },
      ],
    }).compile();

    processor = module.get<TestHarnessProcessor>(TestHarnessProcessor);
    contextService = module.get<HarnessContextService>(HarnessContextService);
    stepEngine = module.get<HarnessStepEngineService>(HarnessStepEngineService);
    chatStreaming = module.get<HarnessChatStreamingService>(
      HarnessChatStreamingService,
    );
    compactService = module.get<HarnessCompactService>(HarnessCompactService);
    dlqLifecycleService = module.get<LifecycleService>(LifecycleService);
    bullMQLogger = module.get<BullMQLoggerService>(BullMQLoggerService);
  });

  function createJob(
    overrides: Partial<Job<HarnessJobPayload>> = {},
  ): Job<HarnessJobPayload> {
    return {
      name: 'req-1',
      queueName: 'harness',
      id: 'job-1',
      attemptsMade: 1,
      data: { meta: [], filters: {} },
      remove: vi.fn().mockResolvedValue(undefined),
      ...overrides,
    } as Job<HarnessJobPayload>;
  }

  it('should be defined', () => {
    expect(processor).toBeDefined();
  });

  it('runs context, step engine, and streaming for non-compact tasks', async () => {
    const job = createJob();

    await processor.process(job);

    expect(contextService.buildContext).toHaveBeenCalledWith(job);
    expect(stepEngine.run).toHaveBeenCalled();
    expect(chatStreaming.streamResult).toHaveBeenCalled();
    expect(compactService.runCompact).not.toHaveBeenCalled();
  });

  it('delegates compact tasks to the compact service', async () => {
    const job = createJob({
      data: {
        meta: [],
        filters: { compact: true, event: 'harness', roomId: 'room-1' },
      },
    } as any);

    await processor.process(job);

    expect(compactService.runCompact).toHaveBeenCalledWith(
      job,
      expect.any(AbortSignal),
    );
    expect(contextService.buildContext).not.toHaveBeenCalled();
    expect(stepEngine.run).not.toHaveBeenCalled();
  });

  describe('onCompleted', () => {
    it('logs to BullMQ and delegates to LifecycleService', async () => {
      const job = createJob();

      await processor.testOnCompleted(job);

      expect(bullMQLogger.log).toHaveBeenCalledWith(job, 'completed');
      expect(dlqLifecycleService.onJobCompleted).toHaveBeenCalledWith(job);
    });
  });

  describe('onActive', () => {
    it('logs to BullMQ for active jobs', async () => {
      const job = createJob();

      await processor.testOnActive(job);

      expect(bullMQLogger.log).toHaveBeenCalledWith(job, 'active');
    });
  });

  describe('onFailed', () => {
    it('logs failure and delegates cleanup to LifecycleService', async () => {
      const job = createJob({ attemptsMade: 1 });

      await processor.testOnFailed(job);

      expect(bullMQLogger.error).toHaveBeenCalledWith(job, 'failed');
      expect(dlqLifecycleService.onJobFailed).toHaveBeenCalled();
      expect(dlqLifecycleService.handleFailed).toHaveBeenCalledWith(
        job,
        undefined,
      );
    });

    it('logs canceled status and delegates to LifecycleService with reason', async () => {
      const job = createJob({
        attemptsMade: 1,
        failedReason: 'canceled by user',
      } as any);

      await processor.testOnFailed(job);

      expect(bullMQLogger.log).toHaveBeenCalledWith(job, 'canceled');
      expect(dlqLifecycleService.handleFailed).toHaveBeenCalledWith(
        job,
        'canceled by user',
      );
    });
  });
});

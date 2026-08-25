import { Test, TestingModule } from '@nestjs/testing';
import { vi } from 'vitest';

import { ModelWarmupService } from '../../ai-sdk/services/model-warmup.service.js';
import { OllamaModelsService } from '../../ai-sdk/services/ollama-models.service.js';
import { SharpService } from '../../sharp/services/sharp.service.js';
import { NumCtxConfigService } from '../configs/numctx-config.service.js';
import { DocumentConversionService } from '../services/document-conversion.service.js';
import { HarnessQueueService } from '../services/harness-queue.service.js';

import { HarnessController } from './harness.controller.js';

describe('HarnessController', () => {
  let controller: HarnessController;
  let queueService: HarnessQueueService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HarnessController],
      providers: [
        {
          provide: HarnessQueueService,
          useValue: {
            toFilePayloads: vi.fn().mockResolvedValue([]),
            emit: vi.fn(),
            cancel: vi.fn().mockResolvedValue(true),
          },
        },
        {
          provide: DocumentConversionService,
          useValue: { convertAndPersist: vi.fn().mockResolvedValue(null) },
        },
        {
          provide: OllamaModelsService,
          useValue: {
            getModels: vi.fn().mockResolvedValue({ models: [] }),
          },
        },
        {
          provide: ModelWarmupService,
          useValue: {
            warm: vi.fn(),
          },
        },
        {
          provide: NumCtxConfigService,
          useValue: { config: { options: [1024, 2048] } },
        },
        {
          provide: SharpService,
          useValue: {
            buildOptions: vi.fn().mockReturnValue(undefined),
          },
        },
      ],
    }).compile();

    controller = module.get<HarnessController>(HarnessController);
    queueService = module.get<HarnessQueueService>(HarnessQueueService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('queues a harness job', async () => {
    await controller.harnessStream(
      'model',
      {
        requestId: 'req-1',
        stream: false,
        event: 'harness',
        think: 'medium',
        pproc_enabled: false,
      } as any,
      { value: 'describe' } as any,
    );

    expect(queueService.toFilePayloads).toHaveBeenCalledWith([], undefined);
    expect(queueService.emit).toHaveBeenCalled();
  });

  it('cancels a job', async () => {
    const result = await controller.cancelJob({ requestId: 'req-1' } as any);
    expect(result.success).toBe(true);
    expect(queueService.cancel).toHaveBeenCalledWith('req-1');
  });
});

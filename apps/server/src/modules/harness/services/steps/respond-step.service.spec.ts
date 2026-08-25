import { SocketIOService } from '@ehildt/nestjs-socket.io';
import { Test, TestingModule } from '@nestjs/testing';
import { describe, expect, it, vi } from 'vitest';

import { MinioService } from '../../../minio/services/minio.service.js';
import { RespondActionService } from '../../actions/respond.action.js';
import { HarnessContext } from '../harness-context.type.js';
import { ShownMediaService } from '../shown-media.service.js';

import { RespondStepService } from './respond-step.service.js';

function createContext(): HarnessContext {
  return {
    requestId: 'req-1',
    job: { name: 'req-1', data: { meta: [], filters: {} } } as any,
    filters: {},
    model: 'model',
    request: { messages: [], options: {}, model: 'model', keep_alive: '5m' },
    processedMeta: [],
    buffers: [],
    stream: false,
    steps: new Map(),
    outputs: { toolResults: [] },
    done: false,
  } as any;
}

describe('RespondStepService', () => {
  let service: RespondStepService;
  let action: RespondActionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RespondStepService,
        {
          provide: RespondActionService,
          useValue: { execute: vi.fn() },
        },
        {
          provide: SocketIOService,
          useValue: { emit: vi.fn(), emitTo: vi.fn() },
        },
        {
          provide: MinioService,
          useValue: { objectExists: vi.fn().mockResolvedValue(true) },
        },
        {
          provide: ShownMediaService,
          useValue: {
            lookupKeys: vi.fn().mockResolvedValue(undefined),
            recordShownMedia: vi.fn().mockResolvedValue(0),
          },
        },
      ],
    }).compile();

    service = module.get<RespondStepService>(RespondStepService);
    action = module.get<RespondActionService>(RespondActionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('stores the final content into the context', async () => {
    (action.execute as any).mockResolvedValue({
      content: JSON.stringify({ text: 'Final' }),
      inputTokens: 20,
      outputTokens: 10,
    });

    const ctx = createContext();
    ctx.outputs.intent = {
      template: 'text',
      prompt: 'default',
      tools: [],
      getDate: true,
      imageCount: 0,
      videoCount: 0,
      reasoning: '',
      contextSummary: '',
      needsClarification: false,
      language: 'en',
      plan: {},
    };

    await service.execute(ctx);

    expect(action.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        intent: ctx.outputs.intent,
        messages: ctx.request.messages,
        model: ctx.model,
      }),
    );
    expect(ctx.outputs.finalContent).toBe(JSON.stringify({ text: 'Final' }));
    expect(ctx.outputs.inputTokens).toBe(20);
    expect(ctx.outputs.outputTokens).toBe(10);
  });

  it('throws when interpret output is missing', async () => {
    const ctx = createContext();
    await expect(service.execute(ctx)).rejects.toThrow(
      'Missing interpret output',
    );
  });
});

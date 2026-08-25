import { SocketIOService } from '@ehildt/nestjs-socket.io';
import { Test, TestingModule } from '@nestjs/testing';
import { describe, expect, it, vi } from 'vitest';

import { SanitizeActionService } from '../../actions/sanitize.action.js';
import { HarnessContext } from '../harness-context.type.js';

import { SanitizeStepService } from './sanitize-step.service.js';

function createContext(overrides?: Partial<HarnessContext>): HarnessContext {
  return {
    requestId: 'req-1',
    job: { name: 'req-1', data: { meta: [], filters: {} } } as any,
    filters: {},
    model: 'model',
    request: {
      messages: [
        { role: 'system', content: 'base' },
        { role: 'user', content: 'find media' },
      ],
      options: {},
      model: 'model',
      keep_alive: '5m',
    },
    processedMeta: [],
    buffers: [],
    stream: false,
    steps: new Map(),
    outputs: {
      intent: { template: 'news', tools: [] } as any,
      toolResults: [{ toolName: 'webSearch', result: { results: [] } }],
    },
    done: false,
    ...overrides,
  } as any;
}

describe('SanitizeStepService', () => {
  let service: SanitizeStepService;
  let action: SanitizeActionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SanitizeStepService,
        {
          provide: SanitizeActionService,
          useValue: { execute: vi.fn() },
        },
        {
          provide: SocketIOService,
          useValue: {
            emit: vi.fn(),
            emitTo: vi.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<SanitizeStepService>(SanitizeStepService);
    action = module.get<SanitizeActionService>(SanitizeActionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('requires the interpret step output', async () => {
    const ctx = createContext({ outputs: {} as any });
    await expect(service.execute(ctx)).rejects.toThrow(
      'Missing interpret output',
    );
  });

  it('runs the sanitize action and updates the context', async () => {
    const ctx = createContext();
    const messages = [
      { role: 'system', content: 'base' },
      { role: 'user', content: 'Retrieved articles and media (JSON): {}' },
    ];
    const toolResults = [{ toolName: 'webSearch', result: { results: [] } }];

    (action.execute as any).mockResolvedValue({
      messages,
      toolResults,
      verifiedImages: [],
      verifiedVideos: [],
      inputTokens: 0,
      outputTokens: 0,
    });

    await service.execute(ctx);

    expect(action.execute).toHaveBeenCalledWith(
      ctx,
      ctx.outputs.toolResults,
      [],
    );
    expect(ctx.request.messages).toBe(messages);
    expect(ctx.outputs.toolResults).toBe(toolResults);
  });
});

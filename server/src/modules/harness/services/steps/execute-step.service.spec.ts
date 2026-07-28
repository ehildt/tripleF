import { SocketIOService } from '@ehildt/nestjs-socket.io';
import { Test, TestingModule } from '@nestjs/testing';
import { describe, expect, it, vi } from 'vitest';

import { ExecuteActionService } from '../../actions/execute.action.js';
import { HarnessContext } from '../harness-context.type.js';
import { HarnessStepLogger } from '../harness-step-logger.service.js';

import { ExecuteStepService } from './execute-step.service.js';

function createContext(overrides?: Partial<HarnessContext>): HarnessContext {
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
    ...overrides,
  } as any;
}

describe('ExecuteStepService', () => {
  let service: ExecuteStepService;
  let action: ExecuteActionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExecuteStepService,
        {
          provide: ExecuteActionService,
          useValue: { execute: vi.fn() },
        },
        {
          provide: SocketIOService,
          useValue: {
            emit: vi.fn(),
            emitTo: vi.fn(),
          },
        },
        {
          provide: HarnessStepLogger,
          useValue: { log: vi.fn(), warn: vi.fn(), error: vi.fn() },
        },
      ],
    }).compile();

    service = module.get<ExecuteStepService>(ExecuteStepService);
    action = module.get<ExecuteActionService>(ExecuteActionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('updates context with processed images and tool results', async () => {
    (action.execute as any).mockResolvedValue({
      buffers: [Buffer.from('processed')],
      processedMeta: [{ name: 'test.png', type: 'image/png', hash: 'abc' }],
      toolResults: [{ toolName: 'webSearch', result: { x: 1 } }],
      inputTokens: 20,
      outputTokens: 10,
    });

    const ctx = createContext({
      outputs: {
        intent: {
          template: 'describe',
          prompt: 'default',
          tools: [],
          imageCount: 0,
          videoCount: 0,
          reasoning: '',
          contextSummary: '',
          needsClarification: false,
          language: 'en',
          plan: {},
        },
        toolResults: [],
      },
    });

    await service.execute(ctx);

    expect(ctx.buffers[0]).toEqual(Buffer.from('processed'));
    expect(ctx.processedMeta[0]).toEqual({
      name: 'test.png',
      type: 'image/png',
      hash: 'abc',
    });
    expect(ctx.outputs.toolResults).toEqual([
      { toolName: 'webSearch', result: { x: 1 } },
    ]);
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

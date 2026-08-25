import { Test, TestingModule } from '@nestjs/testing';
import { SocketIOService } from '@triplef/socketio';
import { describe, expect, it, vi } from 'vitest';

import { MemoryClientService } from '../../../memory-client/services/memory-client.service.js';
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
  let memoryClient: MemoryClientService;

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
        {
          provide: MemoryClientService,
          useValue: { indexLexiconDocuments: vi.fn() },
        },
      ],
    }).compile();

    service = module.get<SanitizeStepService>(SanitizeStepService);
    action = module.get<SanitizeActionService>(SanitizeActionService);
    memoryClient = module.get<MemoryClientService>(MemoryClientService);
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

  it('indexes uploaded documents into the lexicon', async () => {
    const ctx = createContext({
      documentSections: [
        { name: 'cv.docx', text: 'Eugen Hildt', url: 'http://minio/cv.docx' },
      ],
    });
    (action.execute as any).mockResolvedValue({
      messages: [],
      toolResults: [],
      verifiedImages: [],
      verifiedVideos: [],
      inputTokens: 0,
      outputTokens: 0,
    });

    await service.execute(ctx);

    expect(memoryClient.indexLexiconDocuments).toHaveBeenCalledWith({
      documents: [
        {
          url: 'http://minio/cv.docx',
          title: 'cv.docx',
          content: 'Eugen Hildt',
        },
      ],
      partitionScope: 'global',
    });
  });
});

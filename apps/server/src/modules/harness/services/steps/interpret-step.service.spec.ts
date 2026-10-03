import { Test, TestingModule } from '@nestjs/testing';
import { AiSdkService } from '@triplef/ai-sdk';
import { SocketIOService } from '@triplef/socketio';
import { describe, expect, it, vi } from 'vitest';

import { MemoryClientService } from '../../../memory-client/services/memory-client.service.js';
import { InterpretActionService } from '../../actions/interpret.action.js';
import { HarnessContext } from '../harness-context.type.js';

import { InterpretStepService } from './interpret-step.service.js';

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

describe('InterpretStepService', () => {
  let service: InterpretStepService;
  let action: InterpretActionService;
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      providers: [
        InterpretStepService,
        {
          provide: InterpretActionService,
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
          provide: AiSdkService,
          useValue: { generateChat: vi.fn() },
        },
        {
          provide: MemoryClientService,
          useValue: {
            searchByText: vi.fn().mockResolvedValue([]),
            searchSynopses: vi.fn().mockResolvedValue([]),
            getCognition: vi.fn().mockResolvedValue({
              profile: null,
              insights: [],
            }),
            getOverrides: vi.fn().mockResolvedValue({}),
          },
        },
      ],
    }).compile();

    service = module.get<InterpretStepService>(InterpretStepService);
    action = module.get<InterpretActionService>(InterpretActionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('stores intent and continues when no clarification is needed', async () => {
    (action.execute as any).mockResolvedValue({
      intent: {
        template: 'text',
        tools: [],
        reasoning: 'chat',
        needsClarification: false,
        plan: {},
      },
      inputTokens: 10,
      outputTokens: 5,
    });

    const ctx = createContext();
    await service.execute(ctx);

    expect(ctx.outputs.intent?.template).toBe('text');
    expect(ctx.outputs.inputTokens).toBe(10);
    expect(ctx.outputs.outputTokens).toBe(5);
    expect(ctx.done).toBe(false);
  });

  it('downgrades compare to evaluation when no images are attached', async () => {
    (action.execute as any).mockResolvedValue({
      intent: {
        template: 'compare',
        prompt: 'default',
        tools: ['webSearch', 'serperImageSearch', 'serperVideoSearch'],
        reasoning: 'user wants comparison without images',
        needsClarification: false,
        plan: {},
      },
    });

    const ctx = createContext({
      lastUserPrompt: 'compare and evaluate the two games',
    });
    await service.execute(ctx);

    expect(ctx.outputs.intent?.template).toBe('evaluation');
    expect(ctx.outputs.intent?.prompt).toBe('default');
    expect(ctx.outputs.intent?.needsClarification).toBe(false);
    expect(ctx.outputs.intent?.tools).toEqual([
      'webSearch',
      'serperImageSearch',
      'serperVideoSearch',
    ]);
    expect(ctx.outputs.intent?.plan).toEqual({});
    expect(ctx.done).toBe(false);
  });

  it('downgrades compare to evaluation even without judgment language', async () => {
    (action.execute as any).mockResolvedValue({
      intent: {
        template: 'compare',
        prompt: 'default',
        tools: ['webSearch', 'serperImageSearch'],
        reasoning: 'user wants comparison without images',
        needsClarification: false,
        plan: {},
      },
    });

    const ctx = createContext({
      lastUserPrompt: 'compare the two games',
    });
    await service.execute(ctx);

    expect(ctx.outputs.intent?.template).toBe('evaluation');
    expect(ctx.outputs.intent?.needsClarification).toBe(false);
    expect(ctx.outputs.intent?.plan).toEqual({});
    expect(ctx.done).toBe(false);
  });

  it('downgrades describe to summary when no images are attached', async () => {
    (action.execute as any).mockResolvedValue({
      intent: {
        template: 'describe',
        prompt: 'default',
        tools: [],
        reasoning: 'user wants description without images',
        needsClarification: false,
        plan: { images: { resize: true, variants: [] } },
      },
    });

    const ctx = createContext();
    await service.execute(ctx);

    expect(ctx.outputs.intent?.template).toBe('summary');
    expect(ctx.outputs.intent?.needsClarification).toBe(false);
    expect(ctx.outputs.intent?.plan).toEqual({});
    expect(ctx.done).toBe(false);
  });

  it('downgrades ocr to summary when no images are attached', async () => {
    (action.execute as any).mockResolvedValue({
      intent: {
        template: 'ocr',
        tools: [],
        reasoning: 'prior turn had an image',
        needsClarification: false,
        plan: { images: { resize: true, variants: [] } },
      },
    });

    const ctx = createContext();
    await service.execute(ctx);

    expect(ctx.outputs.intent?.template).toBe('summary');
    expect(ctx.outputs.intent?.needsClarification).toBe(false);
    expect(ctx.outputs.intent?.plan).toEqual({});
    expect(ctx.done).toBe(false);
  });

  it('keeps a classifier-set clarification for an image-required template without images', async () => {
    (action.execute as any).mockResolvedValue({
      intent: {
        template: 'compare',
        prompt: 'default',
        tools: [],
        reasoning: 'user refers to a previously shown image',
        needsClarification: true,
        clarificationQuestion:
          'Do you want to compare the images from earlier? Please attach them again.',
        plan: {},
      },
    });

    const ctx = createContext({
      lastUserPrompt: 'attach them again please',
    });
    await service.execute(ctx);

    expect(ctx.outputs.intent?.template).toBe('compare');
    expect(ctx.outputs.intent?.needsClarification).toBe(true);
    expect(ctx.outputs.intent?.clarificationQuestion).toBeTruthy();
    expect(ctx.done).toBe(true);
    expect(ctx.doneReason).toBe('clarification');
  });

  it('forces a text response when vision is excluded', async () => {
    (action.execute as any).mockResolvedValue({
      intent: {
        template: 'describe',
        prompt: 'detailed',
        tools: ['webSearch'],
        reasoning: 'model lacks vision',
        needsClarification: false,
        plan: { images: { resize: true, variants: [] } },
      },
    });

    const ctx = createContext({ visionExcluded: true });
    await service.execute(ctx);

    expect(ctx.outputs.intent?.template).toBe('text');
    expect(ctx.outputs.intent?.tools).toEqual([]);
    expect(ctx.outputs.intent?.plan).toEqual({});
    expect(ctx.outputs.intent?.needsClarification).toBe(false);
    expect(ctx.done).toBe(false);
  });

  it('keeps article template when only referenced images are present', async () => {
    (action.execute as any).mockResolvedValue({
      intent: {
        template: 'article',
        prompt: 'default',
        tools: ['serperImageSearch'],
        reasoning: 'user wants external images',
        needsClarification: false,
        plan: {},
      },
    });

    const ctx = createContext({
      processedMeta: [
        {
          name: 'ref.png',
          type: 'file',
          hash: 'abc',
          size: 1,
          variant: 'original',
        },
      ],
      buffers: [Buffer.from('image')],
    });

    await service.execute(ctx);

    expect(ctx.outputs.intent?.template).toBe('article');
    expect(ctx.outputs.intent?.tools).toEqual(['serperImageSearch']);
    expect(ctx.done).toBe(false);
  });

  it('keeps summary template when no images are present', async () => {
    (action.execute as any).mockResolvedValue({
      intent: {
        template: 'summary',
        prompt: 'default',
        tools: [],
        reasoning: 'user wants a recap',
        needsClarification: false,
        plan: {},
      },
    });

    const ctx = createContext();
    await service.execute(ctx);

    expect(ctx.outputs.intent?.template).toBe('summary');
    expect(ctx.outputs.intent?.needsClarification).toBe(false);
    expect(ctx.done).toBe(false);
  });

  it('keeps evaluation template when no images are present', async () => {
    (action.execute as any).mockResolvedValue({
      intent: {
        template: 'evaluation',
        prompt: 'default',
        tools: [],
        reasoning: 'user wants a critique',
        needsClarification: false,
        plan: {},
      },
    });

    const ctx = createContext();
    await service.execute(ctx);

    expect(ctx.outputs.intent?.template).toBe('evaluation');
    expect(ctx.outputs.intent?.needsClarification).toBe(false);
    expect(ctx.done).toBe(false);
  });

  it('keeps image-required templates when images are present', async () => {
    (action.execute as any).mockResolvedValue({
      intent: {
        template: 'describe',
        prompt: 'default',
        tools: [],
        reasoning: 'image is available',
        needsClarification: false,
        plan: { images: { resize: true, variants: [] } },
      },
    });

    const ctx = createContext({
      processedMeta: [
        {
          name: 'ref.png',
          type: 'file',
          hash: 'abc',
          size: 1,
          variant: 'original',
        },
      ],
      buffers: [Buffer.from('image')],
    });

    await service.execute(ctx);

    expect(ctx.outputs.intent?.template).toBe('describe');
    expect(ctx.outputs.intent?.needsClarification).toBe(false);
    expect(ctx.outputs.intent?.tools).toEqual([]);
    expect(ctx.outputs.intent?.plan).toEqual({
      images: { resize: true, variants: [] },
    });
    expect(ctx.done).toBe(false);
  });

  it('preserves an existing clarification question when the intent already has one', async () => {
    (action.execute as any).mockResolvedValue({
      intent: {
        template: 'text',
        tools: [],
        reasoning: 'ambiguous request',
        needsClarification: true,
        clarificationQuestion: 'Please upload the image.',
        plan: {},
      },
    });

    const ctx = createContext();
    await service.execute(ctx);

    expect(ctx.outputs.intent?.clarificationQuestion).toBe(
      'Please upload the image.',
    );
  });

  it('resolves a clarification from the memory probe and re-runs the classifier', async () => {
    const memoryClient = module.get<MemoryClientService>(MemoryClientService);
    (memoryClient.searchByText as any).mockResolvedValue([
      { text: 'User prefers concise answers.' },
    ]);
    (memoryClient.searchSynopses as any).mockResolvedValue([]);
    (memoryClient.getCognition as any).mockResolvedValue({
      profile: null,
      insights: [],
    });
    (memoryClient.getOverrides as any).mockResolvedValue({
      episodeProbeLimit: 3,
    });

    (action.execute as any)
      .mockResolvedValueOnce({
        intent: {
          template: 'text',
          tools: [],
          reasoning: 'ambiguous',
          needsClarification: true,
          clarificationQuestion: 'What do you mean?',
          plan: {},
        },
        inputTokens: 10,
        outputTokens: 5,
      })
      .mockResolvedValueOnce({
        intent: {
          template: 'text',
          tools: [],
          reasoning: 'resolved from memory',
          needsClarification: false,
          plan: {},
        },
        inputTokens: 20,
        outputTokens: 7,
      });

    const ctx = createContext({
      memoryPartition: 'sess-1',
      sessionId: 'sess-1',
      lastUserPrompt: 'what did I say about tone?',
      request: {
        messages: [{ role: 'user', content: 'what did I say about tone?' }],
        options: { num_ctx: 4096 },
        model: 'model',
        keep_alive: '5m',
        stream: false,
        think: false,
      },
    });
    await service.execute(ctx);

    expect(ctx.outputs.intent?.needsClarification).toBe(false);
    expect(ctx.outputs.inputTokens).toBe(30);
    expect(ctx.outputs.outputTokens).toBe(12);
    expect(ctx.done).toBe(false);
    expect(action.execute).toHaveBeenCalledTimes(2);
  });

  it('keeps the clarification when the memory probe does not resolve it', async () => {
    const memoryClient = module.get<MemoryClientService>(MemoryClientService);
    (memoryClient.searchByText as any).mockResolvedValue([]);
    (memoryClient.searchSynopses as any).mockResolvedValue([]);
    (memoryClient.getCognition as any).mockResolvedValue({
      profile: null,
      insights: [],
    });
    (memoryClient.getOverrides as any).mockResolvedValue({});

    (action.execute as any).mockResolvedValue({
      intent: {
        template: 'text',
        tools: [],
        reasoning: 'ambiguous',
        needsClarification: true,
        clarificationQuestion: 'Which one?',
        plan: {},
      },
    });

    const ctx = createContext({
      memoryPartition: 'sess-1',
      sessionId: 'sess-1',
      lastUserPrompt: 'which one?',
    });
    await service.execute(ctx);

    expect(ctx.outputs.intent?.needsClarification).toBe(true);
    expect(ctx.done).toBe(true);
    expect(ctx.doneReason).toBe('clarification');
  });

  it('falls back to the first-pass question when the second pass throws', async () => {
    const memoryClient = module.get<MemoryClientService>(MemoryClientService);
    (memoryClient.searchByText as any).mockResolvedValue([
      { text: 'Some memory hit.' },
    ]);
    (memoryClient.searchSynopses as any).mockResolvedValue([]);
    (memoryClient.getCognition as any).mockResolvedValue({
      profile: null,
      insights: [],
    });
    (memoryClient.getOverrides as any).mockResolvedValue({});

    (action.execute as any)
      .mockResolvedValueOnce({
        intent: {
          template: 'text',
          tools: [],
          reasoning: 'ambiguous',
          needsClarification: true,
          clarificationQuestion: 'Original question',
          plan: {},
        },
      })
      .mockRejectedValueOnce(new Error('classifier down'));

    const ctx = createContext({
      memoryPartition: 'sess-1',
      sessionId: 'sess-1',
      lastUserPrompt: 'huh?',
    });
    await service.execute(ctx);

    expect(ctx.outputs.intent?.clarificationQuestion).toBe('Original question');
    expect(ctx.done).toBe(true);
  });

  it('skips the memory probe when there is no memory partition', async () => {
    (action.execute as any).mockResolvedValue({
      intent: {
        template: 'text',
        tools: [],
        reasoning: 'ambiguous',
        needsClarification: true,
        clarificationQuestion: 'Which one?',
        plan: {},
      },
    });

    const ctx = createContext({ sessionId: undefined });
    await service.execute(ctx);

    expect(action.execute).toHaveBeenCalledTimes(1);
    expect(ctx.done).toBe(true);
  });

  it('injects the persona name into the classifier when the user set one', async () => {
    const memoryClient = module.get<MemoryClientService>(MemoryClientService);
    (memoryClient.getCognition as any).mockResolvedValue({
      profile: JSON.stringify({ persona: { name: 'Shinku' } }),
      insights: [],
    });
    (action.execute as any).mockResolvedValue({
      intent: {
        template: 'text',
        tools: [],
        reasoning: 'chat',
        needsClarification: false,
        plan: {},
      },
    });

    const ctx = createContext({ sessionId: 'sess-1' });
    await service.execute(ctx);

    expect(action.execute).toHaveBeenCalledWith(
      expect.objectContaining({ personaName: 'Shinku' }),
    );
  });

  it('degrades gracefully when the cognition read fails', async () => {
    const memoryClient = module.get<MemoryClientService>(MemoryClientService);
    (memoryClient.getCognition as any).mockRejectedValue(new Error('down'));
    (action.execute as any).mockResolvedValue({
      intent: {
        template: 'text',
        tools: [],
        reasoning: 'chat',
        needsClarification: false,
        plan: {},
      },
    });

    const ctx = createContext({ sessionId: 'sess-1' });
    await service.execute(ctx);

    expect(ctx.outputs.intent?.template).toBe('text');
    expect(ctx.done).toBe(false);
  });

  it('localizes the clarification question for non-English languages', async () => {
    const aiSdk = module.get<AiSdkService>(AiSdkService);
    (aiSdk.generateChat as any).mockResolvedValue({
      text: '¿Qué quisiste decir?',
    });
    (action.execute as any).mockResolvedValue({
      intent: {
        template: 'text',
        tools: [],
        reasoning: 'ambiguous',
        needsClarification: true,
        clarificationQuestion: 'What did you mean?',
        language: 'es',
        plan: {},
      },
    });

    const ctx = createContext({
      request: {
        messages: [{ role: 'user', content: '¿qué?' }],
        options: { num_ctx: 4096 },
        model: 'model',
        keep_alive: '5m',
        stream: false,
        think: false,
      },
    });
    await service.execute(ctx);

    expect(ctx.outputs.intent?.clarificationQuestion).toBe(
      '¿Qué quisiste decir?',
    );
    expect(ctx.done).toBe(true);
  });

  it('keeps the English question when localization fails', async () => {
    const aiSdk = module.get<AiSdkService>(AiSdkService);
    (aiSdk.generateChat as any).mockRejectedValue(new Error('down'));
    (action.execute as any).mockResolvedValue({
      intent: {
        template: 'text',
        tools: [],
        reasoning: 'ambiguous',
        needsClarification: true,
        clarificationQuestion: 'What did you mean?',
        language: 'de',
        plan: {},
      },
    });

    const ctx = createContext();
    await service.execute(ctx);

    expect(ctx.outputs.intent?.clarificationQuestion).toBe(
      'What did you mean?',
    );
  });

  it('does not localize English clarification questions', async () => {
    const aiSdk = module.get<AiSdkService>(AiSdkService);
    (action.execute as any).mockResolvedValue({
      intent: {
        template: 'text',
        tools: [],
        reasoning: 'ambiguous',
        needsClarification: true,
        clarificationQuestion: 'What did you mean?',
        language: 'en',
        plan: {},
      },
    });

    const ctx = createContext();
    await service.execute(ctx);

    expect(aiSdk.generateChat).not.toHaveBeenCalled();
    expect(ctx.outputs.intent?.clarificationQuestion).toBe(
      'What did you mean?',
    );
  });

  it('clamps negative media counts to zero', async () => {
    (action.execute as any).mockResolvedValue({
      intent: {
        template: 'article',
        tools: [],
        reasoning: 'chat',
        needsClarification: false,
        imageCount: -3,
        videoCount: -1,
        plan: {},
      },
    });

    const ctx = createContext();
    await service.execute(ctx);

    expect(ctx.outputs.intent?.imageCount).toBe(0);
    expect(ctx.outputs.intent?.videoCount).toBe(0);
  });

  it('emits reasoning deltas to the socket', async () => {
    const io = module.get<SocketIOService>(SocketIOService);
    (action.execute as any).mockImplementation(
      async ({ onReasoningDelta }: any) => {
        onReasoningDelta('thinking...');
        return {
          intent: {
            template: 'text',
            tools: [],
            reasoning: 'chat',
            needsClarification: false,
            plan: {},
          },
        };
      },
    );

    const ctx = createContext({ roomId: 'room-1', event: 'event-1' });
    await service.execute(ctx);

    expect(io.emitTo).toHaveBeenCalledWith(
      'event-1',
      'room-1',
      expect.objectContaining({
        type: 'harness:delta',
        data: expect.objectContaining({
          channel: 'reasoning',
          text: 'thinking...',
        }),
      }),
    );
  });
});

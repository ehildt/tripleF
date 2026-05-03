import { Test, TestingModule } from '@nestjs/testing';
import { describe, expect, it, vi } from 'vitest';

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

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InterpretStepService,
        {
          provide: InterpretActionService,
          useValue: { execute: vi.fn() },
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

  it('falls back to evaluation for compare without images when the prompt asks for judgment', async () => {
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
    expect(ctx.outputs.intent?.tools).toEqual([
      'webSearch',
      'serperImageSearch',
      'serperVideoSearch',
    ]);
    expect(ctx.outputs.intent?.imageCount).toBe(0);
    expect(ctx.outputs.intent?.videoCount).toBe(0);
    expect(ctx.outputs.intent?.needsClarification).toBe(false);
    expect(ctx.done).toBe(false);
  });

  it('falls back to summary for compare without images when no judgment is requested', async () => {
    (action.execute as any).mockResolvedValue({
      intent: {
        template: 'compare',
        prompt: 'default',
        tools: ['webSearch', 'braveImageSearch'],
        reasoning: 'user wants comparison without images',
        needsClarification: false,
        plan: {},
      },
    });

    const ctx = createContext({
      lastUserPrompt: 'compare the two games',
    });
    await service.execute(ctx);

    expect(ctx.outputs.intent?.template).toBe('summary');
    expect(ctx.outputs.intent?.tools).toEqual([
      'webSearch',
      'braveImageSearch',
    ]);
    expect(ctx.outputs.intent?.imageCount).toBe(0);
    expect(ctx.outputs.intent?.needsClarification).toBe(false);
    expect(ctx.done).toBe(false);
  });

  it('falls back to text for describe without images', async () => {
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

    expect(ctx.outputs.intent?.template).toBe('text');
    expect(ctx.outputs.intent?.needsClarification).toBe(false);
    expect(ctx.done).toBe(false);
  });

  it('falls back to text for ocr without images', async () => {
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

    expect(ctx.outputs.intent?.template).toBe('text');
    expect(ctx.outputs.intent?.needsClarification).toBe(false);
    expect(ctx.outputs.intent?.tools).toEqual([]);
    expect(ctx.outputs.intent?.plan).toEqual({});
    expect(ctx.done).toBe(false);
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

  it('downgrades image-required templates to text when no new images are present', async () => {
    (action.execute as any).mockResolvedValue({
      intent: {
        template: 'describe',
        prompt: 'default',
        tools: [],
        reasoning: 'no fresh upload',
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

    expect(ctx.outputs.intent?.template).toBe('text');
    expect(ctx.outputs.intent?.tools).toEqual([]);
    expect(ctx.outputs.intent?.plan).toEqual({});
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
});

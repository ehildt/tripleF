import { Test, TestingModule } from '@nestjs/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { OllamaConfigService } from '../../../configs/ollama-config.service.js';
import { AiSdkService } from '../../ai-sdk/services/ai-sdk.service.js';
import { ToolSelectionService } from '../../ai-sdk/services/tool-selection.service.js';
import { SharpService } from '../../sharp/services/sharp.service.js';

import { ExecuteActionService } from './execute.action.js';

describe('ExecuteActionService', () => {
  let service: ExecuteActionService;
  let sharpService: SharpService;
  let aiSdkService: AiSdkService;
  let toolSelectionService: ToolSelectionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExecuteActionService,
        {
          provide: SharpService,
          useValue: {
            resizeImages: vi.fn().mockResolvedValue([]),
            generateVariants: vi.fn().mockResolvedValue([]),
          },
        },
        {
          provide: AiSdkService,
          useValue: {
            generateWithTools: vi.fn(),
          },
        },
        {
          provide: ToolSelectionService,
          useValue: {
            selectToolsByName: vi.fn().mockReturnValue({}),
          },
        },
        {
          provide: OllamaConfigService,
          useValue: { config: { keepAlive: '5m' } },
        },
      ],
    }).compile();

    service = module.get<ExecuteActionService>(ExecuteActionService);
    sharpService = module.get<SharpService>(SharpService);
    aiSdkService = module.get<AiSdkService>(AiSdkService);
    toolSelectionService =
      module.get<ToolSelectionService>(ToolSelectionService);
  });

  function createContext(
    overrides: {
      buffers?: Buffer[];
      meta?: Array<{
        name: string;
        type: string;
        hash: string;
        variant?: string;
      }>;
      messages?: Array<{
        role: 'system' | 'user' | 'assistant';
        content: string;
      }>;
      lastUserPrompt?: string;
      intent?: {
        template: string;
        prompt: string;
        tools: string[];
        reasoning: string;
        needsClarification: false;
        imageCount?: number;
        videoCount?: number;
        plan?: { images?: { resize?: boolean; variants?: string[] } };
      };
      preprocessing?: { enabled: boolean; variants?: Record<string, boolean> };
    } = {},
  ) {
    const buffers = overrides.buffers ?? [Buffer.from('img')];
    const meta = overrides.meta ?? [
      { name: 'test.png', type: 'image/png', hash: 'abc' },
    ];
    const messages = (overrides.messages ?? [
      { role: 'system' as const, content: 'base system prompt' },
      { role: 'user' as const, content: 'describe this' },
    ]) as any;
    const lastUserPrompt =
      overrides.lastUserPrompt ??
      [...messages].reverse().find((m) => m.role === 'user')?.content;

    return {
      model: 'model',
      requestId: 'req-1',
      request: {
        messages,
        options: {},
        keep_alive: '5m',
      },
      lastUserPrompt,
      buffers,
      processedMeta: meta,
      filters: {
        model: 'model',
        preprocessing: overrides.preprocessing,
      },
      outputs: {
        intent: overrides.intent ?? {
          template: 'describe',
          prompt: 'default',
          tools: [],
          reasoning: '',
          needsClarification: false,
          plan: {},
        },
        toolResults: [],
      },
    } as any;
  }

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('resizes images by default', async () => {
    (sharpService.resizeImages as any).mockResolvedValue([
      {
        buffer: Buffer.from('resized'),
        meta: { name: 'test.png', type: 'image/png', hash: 'abc' },
      },
    ]);

    const ctx = createContext();
    const result = await service.execute(ctx);

    expect(sharpService.resizeImages).toHaveBeenCalledWith(
      ctx.buffers,
      ctx.processedMeta,
      ctx.filters.preprocessing,
    );
    expect(result.buffers[0]).toEqual(Buffer.from('resized'));
  });

  it('does not resize when plan.images.resize is false', async () => {
    const ctx = createContext({
      intent: {
        template: 'describe',
        prompt: 'default',
        tools: [],
        reasoning: '',
        needsClarification: false,
        plan: { images: { resize: false } },
      },
    });

    await service.execute(ctx);

    expect(sharpService.resizeImages).not.toHaveBeenCalled();
  });

  it('generates requested variants that are enabled in preprocessing', async () => {
    (sharpService.resizeImages as any).mockResolvedValue([
      {
        buffer: Buffer.from('resized'),
        meta: { name: 'test.png', type: 'image/png', hash: 'abc' },
      },
    ]);
    (sharpService.generateVariants as any).mockResolvedValue([
      {
        buffer: Buffer.from('gray'),
        meta: {
          name: 'test_grayscale.png',
          type: 'image/png',
          hash: 'abc_grayscale',
          variant: 'grayscale',
        },
      },
    ]);

    const ctx = createContext({
      intent: {
        template: 'describe',
        prompt: 'default',
        tools: [],
        reasoning: '',
        needsClarification: false,
        plan: { images: { variants: ['grayscale'] } },
      },
      preprocessing: {
        enabled: true,
        variants: { grayscale: true, denoised: false },
      },
    });

    const result = await service.execute(ctx);

    expect(sharpService.generateVariants).toHaveBeenCalledWith(
      [Buffer.from('resized')],
      [{ name: 'test.png', type: 'image/png', hash: 'abc' }],
      ['grayscale'],
      ctx.filters.preprocessing,
    );
    expect(result.buffers).toHaveLength(2);
    expect(result.processedMeta[1].variant).toBe('grayscale');
  });

  it('ignores requested variants that are not enabled in preprocessing', async () => {
    (sharpService.resizeImages as any).mockResolvedValue([
      {
        buffer: Buffer.from('resized'),
        meta: { name: 'test.png', type: 'image/png', hash: 'abc' },
      },
    ]);

    const ctx = createContext({
      intent: {
        template: 'describe',
        prompt: 'default',
        tools: [],
        reasoning: '',
        needsClarification: false,
        plan: { images: { variants: ['grayscale'] } },
      },
      preprocessing: { enabled: true, variants: { grayscale: false } },
    });

    await service.execute(ctx);

    expect(sharpService.generateVariants).not.toHaveBeenCalled();
  });

  it('invokes selected external tools and records results', async () => {
    (aiSdkService.generateWithTools as any).mockResolvedValue({
      text: '',
      toolResults: [{ toolName: 'webSearch', result: { x: 1 } }],
      totalUsage: { inputTokens: 20, outputTokens: 10 },
    });
    (toolSelectionService.selectToolsByName as any).mockReturnValue({
      webSearch: { description: 'search' },
    });

    const ctx = createContext({
      buffers: [],
      meta: [],
      messages: [
        { role: 'system', content: 'base' },
        { role: 'user', content: 'find news on conan' },
      ],
      intent: {
        template: 'article',
        prompt: 'default',
        tools: ['webSearch'],
        reasoning: '',
        needsClarification: false,
        plan: {},
      },
    });

    const result = await service.execute(ctx);

    expect(aiSdkService.generateWithTools).toHaveBeenCalled();
    expect(result.toolResults).toEqual([
      { toolName: 'webSearch', result: { x: 1 } },
    ]);
    expect(result.inputTokens).toBe(20);
    expect(result.outputTokens).toBe(10);
  });

  it('does not duplicate the latest user message for non-image tasks', async () => {
    (aiSdkService.generateWithTools as any).mockResolvedValue({
      text: '',
      toolResults: [{ toolName: 'webSearch', result: { results: [] } }],
      totalUsage: {},
    });
    (toolSelectionService.selectToolsByName as any).mockReturnValue({
      webSearch: { description: 'search' },
    });

    const ctx = createContext({
      buffers: [],
      meta: [],
      messages: [
        { role: 'system', content: 'base' },
        { role: 'user', content: 'find news on conan' },
      ],
      intent: {
        template: 'article',
        prompt: 'default',
        tools: ['webSearch'],
        reasoning: '',
        needsClarification: false,
        plan: {},
      },
    });

    await service.execute(ctx);

    const call = (aiSdkService.generateWithTools as any).mock.calls[0][0];
    const executeUserMessages = call.messages.filter(
      (m: any) => m.role === 'user',
    );
    expect(executeUserMessages).toHaveLength(1);
    expect(executeUserMessages[0].content).toBe('find news on conan');
  });

  it('uses a tool-execution system prompt for non-image tasks', async () => {
    (aiSdkService.generateWithTools as any).mockResolvedValue({
      text: '',
      toolResults: [],
      totalUsage: {},
    });
    (toolSelectionService.selectToolsByName as any).mockReturnValue({
      webSearch: { description: 'search' },
    });

    const ctx = createContext({
      buffers: [],
      meta: [],
      messages: [
        { role: 'system', content: 'base' },
        { role: 'user', content: 'find news on conan' },
      ],
      intent: {
        template: 'article',
        prompt: 'default',
        tools: ['webSearch'],
        reasoning: '',
        needsClarification: false,
        plan: {},
      },
    });

    await service.execute(ctx);

    const call = (aiSdkService.generateWithTools as any).mock.calls[0][0];
    expect(call.messages[0].content).toContain(
      'deterministic tool execution engine',
    );
    expect(call.messages[0].content).toContain(
      'MANDATORY tools you MUST call: webSearch',
    );
  });

  it('includes imageCount and videoCount in the tool execution prompt', async () => {
    (aiSdkService.generateWithTools as any).mockResolvedValue({
      text: '',
      toolResults: [],
      totalUsage: {},
    });
    (toolSelectionService.selectToolsByName as any).mockReturnValue({
      serperImageSearch: { description: 'images' },
      serperVideoSearch: { description: 'videos' },
    });

    const ctx = createContext({
      buffers: [],
      meta: [],
      messages: [
        { role: 'system', content: 'base' },
        { role: 'user', content: 'show me images and videos' },
      ],
      intent: {
        template: 'article',
        prompt: 'default',
        tools: ['serperImageSearch', 'serperVideoSearch'],
        imageCount: 5,
        videoCount: 2,
        reasoning: '',
        needsClarification: false,
        plan: {},
      },
    });

    await service.execute(ctx);

    const call = (aiSdkService.generateWithTools as any).mock.calls[0][0];
    expect(call.messages[0].content).toContain(
      'imageCount: retrieve 5 image(s).',
    );
    expect(call.messages[0].content).toContain(
      'videoCount: retrieve 2 video(s).',
    );
  });

  it('falls back to direct invocation without counts when no explicit media counts are set', async () => {
    const executeSpy = vi.fn().mockResolvedValue({ results: [] });
    (aiSdkService.generateWithTools as any).mockResolvedValue({
      text: 'I will not call any tools',
      toolResults: [],
      totalUsage: {},
    });
    (toolSelectionService.selectToolsByName as any).mockReturnValue({
      serperImageSearch: { execute: executeSpy },
      serperVideoSearch: { execute: executeSpy },
    });

    const ctx = createContext({
      buffers: [],
      meta: [],
      messages: [
        { role: 'system', content: 'base' },
        { role: 'user', content: 'find media' },
      ],
      intent: {
        template: 'article',
        prompt: 'default',
        tools: ['serperImageSearch', 'serperVideoSearch'],
        imageCount: 0,
        videoCount: 0,
        reasoning: '',
        needsClarification: false,
        plan: {},
      },
    });

    await service.execute(ctx);

    expect(executeSpy).toHaveBeenCalledWith({ query: 'find media' });
  });

  it('falls back to direct invocation with counts for image and video search tools', async () => {
    const executeSpy = vi.fn().mockResolvedValue({ results: [] });
    (aiSdkService.generateWithTools as any).mockResolvedValue({
      text: 'I will not call any tools',
      toolResults: [],
      totalUsage: {},
    });
    (toolSelectionService.selectToolsByName as any).mockReturnValue({
      serperImageSearch: { execute: executeSpy },
      serperVideoSearch: { execute: executeSpy },
    });

    const ctx = createContext({
      buffers: [],
      meta: [],
      messages: [
        { role: 'system', content: 'base' },
        { role: 'user', content: 'find media' },
      ],
      intent: {
        template: 'article',
        prompt: 'default',
        tools: ['serperImageSearch', 'serperVideoSearch'],
        imageCount: 7,
        videoCount: 4,
        reasoning: '',
        needsClarification: false,
        plan: {},
      },
    });

    await service.execute(ctx);

    expect(executeSpy).toHaveBeenCalledWith({ query: 'find media', count: 7 });
    expect(executeSpy).toHaveBeenCalledWith({ query: 'find media', count: 4 });
  });

  it('attaches images to the latest user message for image tasks', async () => {
    (sharpService.resizeImages as any).mockResolvedValue([
      {
        buffer: Buffer.from('resized'),
        meta: { name: 'test.png', type: 'image/png', hash: 'abc' },
      },
    ]);
    (aiSdkService.generateWithTools as any).mockResolvedValue({
      text: '',
      toolResults: [{ toolName: 'webSearch', result: { results: [] } }],
      totalUsage: {},
    });
    (toolSelectionService.selectToolsByName as any).mockReturnValue({
      webSearch: { description: 'search' },
    });

    const ctx = createContext({
      messages: [
        { role: 'system', content: 'base' },
        { role: 'user', content: 'describe this' },
      ],
      intent: {
        template: 'describe',
        prompt: 'default',
        tools: ['webSearch'],
        reasoning: '',
        needsClarification: false,
        plan: {},
      },
    });

    await service.execute(ctx);

    const call = (aiSdkService.generateWithTools as any).mock.calls[0][0];
    expect(call.messages[0].content).toContain('image task');
    expect(call.messages[1].images).toHaveLength(1);
    expect(call.messages[1].content).toContain('[1 image attached]');
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { describe, expect, it, vi } from 'vitest';

import { AiSdkService } from '../../ai-sdk/services/ai-sdk.service.js';
import { PlaywrightMcpConfigService } from '../../playwright-mcp/configs/playwright-mcp-config.service.js';
import { ProviderOverridesService } from '../../provider-overrides/services/provider-overrides.service.js';
import { HarnessStepLogger } from '../services/harness-step-logger.service.js';

import { InterpretActionService } from './interpret.action.js';

const playwrightMcpConfigProvider = {
  provide: PlaywrightMcpConfigService,
  useValue: { config: { enabled: false, url: 'http://localhost:8931/mcp' } },
};

describe('InterpretActionService', () => {
  let service: InterpretActionService;
  let aiSdkService: AiSdkService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InterpretActionService,
        playwrightMcpConfigProvider,
        {
          provide: AiSdkService,
          useValue: {
            generateChat: vi.fn(),
          },
        },
        {
          provide: ProviderOverridesService,
          useValue: {
            getConfig: vi.fn().mockReturnValue({
              serper: {
                enabled: false,
                web: { enabled: false },
                images: { enabled: false },
                news: { enabled: false },
                places: { enabled: false },
                shopping: { enabled: false },
                reviews: { enabled: false },
                videos: { enabled: false },
                scrape: { enabled: false },
              },
              youtube: {
                enabled: false,
                apiKey: undefined,
                videos: { enabled: false },
              },
              brightData: {
                enabled: false,
                apiKey: undefined,
                web: { enabled: false },
                images: { enabled: false },
                news: { enabled: false },
                places: { enabled: false },
                shopping: { enabled: false },
                videos: { enabled: false },
                scrape: { enabled: false },
              },
            }),
          },
        },
        {
          provide: HarnessStepLogger,
          useValue: { log: vi.fn(), warn: vi.fn() },
        },
      ],
    }).compile();

    service = module.get<InterpretActionService>(InterpretActionService);
    aiSdkService = module.get<AiSdkService>(AiSdkService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('accepts null clarificationQuestion when clarification is not needed', async () => {
    (aiSdkService.generateChat as any).mockResolvedValue({
      text: JSON.stringify({
        template: 'text',
        tools: [],
        reasoning: 'chat',
        language: 'en',
        needsClarification: false,
        clarificationQuestion: null,
        plan: {},
      }),
    });

    const result = await service.execute({
      model: 'model',
      requestId: 'req-1',
      messages: [{ role: 'user', content: 'hi' }],
    });

    expect(result.intent.template).toBe('text');
    expect(result.intent.needsClarification).toBe(false);
    expect(result.intent.clarificationQuestion).toBeNull();
    expect(result.intent.plan).toEqual({});
  });

  it('returns clarification without invoking tools', async () => {
    (aiSdkService.generateChat as any).mockResolvedValue({
      text: JSON.stringify({
        template: 'text',
        tools: [],
        reasoning: 'ambiguous',
        language: 'en',
        needsClarification: true,
        clarificationQuestion: 'Which one?',
        plan: {},
      }),
    });

    const result = await service.execute({
      model: 'model',
      requestId: 'req-1',
      messages: [{ role: 'user', content: 'Tell me about it' }],
    });

    expect(result.intent.needsClarification).toBe(true);
    expect(result.inputTokens).toBeUndefined();
    expect(result.outputTokens).toBeUndefined();
  });

  it('classifies intent and plan for image tasks', async () => {
    (aiSdkService.generateChat as any).mockResolvedValue({
      text: JSON.stringify({
        template: 'describe',
        tools: [],
        reasoning: 'image description',
        language: 'en',
        needsClarification: false,
        plan: {
          images: {
            resize: true,
            variants: ['grayscale'],
          },
        },
      }),
      totalUsage: { inputTokens: 10, outputTokens: 5 },
    });

    const result = await service.execute({
      model: 'model',
      requestId: 'req-1',
      messages: [
        {
          role: 'user',
          content: 'describe',
          images: [Buffer.from('image')],
        },
      ],
    });

    expect(result.intent.template).toBe('describe');
    expect(result.intent.plan?.images?.resize).toBe(true);
    expect(result.intent.plan?.images?.variants).toEqual(['grayscale']);
    expect(result.inputTokens).toBe(10);
    expect(result.outputTokens).toBe(5);
  });

  it('strips images from classification prompt but preserves attachment marker', async () => {
    (aiSdkService.generateChat as any).mockResolvedValue({
      text: JSON.stringify({
        template: 'describe',
        tools: [],
        reasoning: 'image description',
        language: 'en',
        needsClarification: false,
        plan: {},
      }),
    });

    await service.execute({
      model: 'model',
      requestId: 'req-1',
      messages: [
        {
          role: 'user',
          content: 'describe',
          images: [Buffer.from('image')],
        },
      ],
    });

    const classifyCall = (aiSdkService.generateChat as any).mock.calls[0][0]
      .messages as any[];
    expect(classifyCall.some((m) => m.images)).toBe(false);
    const userMessage = classifyCall.find((m) => m.role === 'user');
    expect(userMessage?.content).toContain('[1 image attached]');
  });

  it('keeps the actual user text prompt for image classification', async () => {
    (aiSdkService.generateChat as any).mockResolvedValue({
      text: JSON.stringify({
        template: 'describe',
        tools: [],
        reasoning: 'image description',
        language: 'en',
        needsClarification: false,
        plan: {},
      }),
    });

    await service.execute({
      model: 'model',
      requestId: 'req-1',
      messages: [
        {
          role: 'user',
          content: 'das hier koennten diese goettinen sein?',
          images: [Buffer.from('image')],
        },
      ],
    });

    const classifyCall = (aiSdkService.generateChat as any).mock.calls[0][0]
      .messages as any[];
    const userMessage = classifyCall.find((m) => m.role === 'user');
    expect(userMessage?.content).toContain(
      'das hier koennten diese goettinen sein?',
    );
    expect(userMessage?.content).toContain('[1 image attached]');
    expect(userMessage?.content).not.toContain('Image(s):');
  });

  it('adds enabled image and video search tools for article template', async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InterpretActionService,
        playwrightMcpConfigProvider,
        {
          provide: HarnessStepLogger,
          useValue: { log: vi.fn(), warn: vi.fn() },
        },
        {
          provide: AiSdkService,
          useValue: {
            generateChat: vi.fn().mockResolvedValue({
              text: JSON.stringify({
                template: 'article',
                tools: ['webSearch'],
                reasoning: 'research',
                language: 'en',
                needsClarification: false,
                plan: {},
              }),
            }),
          },
        },
        {
          provide: ProviderOverridesService,
          useValue: {
            getConfig: vi.fn().mockReturnValue({
              serper: {
                enabled: true,
                apiKey: 'key',
                web: { enabled: true },
                images: { enabled: true },
                news: { enabled: false },
                places: { enabled: false },
                shopping: { enabled: false },
                reviews: { enabled: false },
                videos: { enabled: true },
                scrape: { enabled: false },
              },
              youtube: {
                enabled: false,
                apiKey: undefined,
                videos: { enabled: false },
              },
              brightData: {
                enabled: false,
                apiKey: undefined,
                web: { enabled: false },
                images: { enabled: false },
                news: { enabled: false },
                places: { enabled: false },
                shopping: { enabled: false },
                videos: { enabled: false },
                scrape: { enabled: false },
              },
            }),
          },
        },
      ],
    }).compile();

    const serviceWithTools = module.get<InterpretActionService>(
      InterpretActionService,
    );

    const result = await serviceWithTools.execute({
      model: 'model',
      requestId: 'req-1',
      messages: [{ role: 'user', content: 'research topic' }],
    });

    expect(result.intent.template).toBe('article');
    expect(result.intent.tools).toContain('webSearch');
    expect(result.intent.tools).toContain('serperImageSearch');
    expect(result.intent.tools).toContain('serperVideoSearch');
    expect(result.intent.tools).toHaveLength(3);
  });

  it('adds enabled image and video search tools for news template', async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InterpretActionService,
        playwrightMcpConfigProvider,
        {
          provide: HarnessStepLogger,
          useValue: { log: vi.fn(), warn: vi.fn() },
        },
        {
          provide: AiSdkService,
          useValue: {
            generateChat: vi.fn().mockResolvedValue({
              text: JSON.stringify({
                template: 'news',
                tools: ['webSearch', 'serperNewsSearch'],
                reasoning: 'current events',
                language: 'en',
                needsClarification: false,
                plan: {},
              }),
            }),
          },
        },
        {
          provide: ProviderOverridesService,
          useValue: {
            getConfig: vi.fn().mockReturnValue({
              serper: {
                enabled: true,
                apiKey: 'key',
                web: { enabled: true },
                images: { enabled: true },
                news: { enabled: true },
                places: { enabled: false },
                shopping: { enabled: false },
                reviews: { enabled: false },
                videos: { enabled: true },
                scrape: { enabled: false },
              },
              youtube: {
                enabled: false,
                apiKey: undefined,
                videos: { enabled: false },
              },
              brightData: {
                enabled: false,
                apiKey: undefined,
                web: { enabled: false },
                images: { enabled: false },
                news: { enabled: false },
                places: { enabled: false },
                shopping: { enabled: false },
                videos: { enabled: false },
                scrape: { enabled: false },
              },
            }),
          },
        },
      ],
    }).compile();

    const serviceWithTools = module.get<InterpretActionService>(
      InterpretActionService,
    );

    const result = await serviceWithTools.execute({
      model: 'model',
      requestId: 'req-1',
      messages: [{ role: 'user', content: 'latest news' }],
    });

    expect(result.intent.template).toBe('news');
    expect(result.intent.tools).toContain('webSearch');
    expect(result.intent.tools).toContain('serperNewsSearch');
    expect(result.intent.tools).toContain('serperImageSearch');
    expect(result.intent.tools).toContain('serperVideoSearch');
  });

  it('does not add media search tools for non-media templates', async () => {
    (aiSdkService.generateChat as any).mockResolvedValue({
      text: JSON.stringify({
        template: 'text',
        tools: [],
        reasoning: 'chat',
        language: 'en',
        needsClarification: false,
        plan: {},
      }),
    });

    const result = await service.execute({
      model: 'model',
      requestId: 'req-1',
      messages: [{ role: 'user', content: 'hi' }],
    });

    expect(result.intent.template).toBe('text');
    expect(result.intent.tools).toEqual([]);
  });

  it('does not force media search tools for summary and evaluation templates', async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InterpretActionService,
        playwrightMcpConfigProvider,
        {
          provide: HarnessStepLogger,
          useValue: { log: vi.fn(), warn: vi.fn() },
        },
        {
          provide: AiSdkService,
          useValue: {
            generateChat: vi.fn().mockResolvedValue({
              text: JSON.stringify({
                template: 'evaluation',
                tools: ['webSearch'],
                reasoning: 'review',
                language: 'en',
                needsClarification: false,
                plan: {},
              }),
            }),
          },
        },
        {
          provide: ProviderOverridesService,
          useValue: {
            getConfig: vi.fn().mockReturnValue({
              serper: {
                enabled: true,
                apiKey: 'key',
                web: { enabled: true },
                images: { enabled: true },
                news: { enabled: false },
                places: { enabled: false },
                shopping: { enabled: false },
                reviews: { enabled: false },
                videos: { enabled: true },
                scrape: { enabled: false },
              },
              youtube: {
                enabled: false,
                apiKey: undefined,
                videos: { enabled: false },
              },
              brightData: {
                enabled: false,
                apiKey: undefined,
                web: { enabled: false },
                images: { enabled: false },
                news: { enabled: false },
                places: { enabled: false },
                shopping: { enabled: false },
                videos: { enabled: false },
                scrape: { enabled: false },
              },
            }),
          },
        },
      ],
    }).compile();

    const serviceWithTools = module.get<InterpretActionService>(
      InterpretActionService,
    );

    const result = await serviceWithTools.execute({
      model: 'model',
      requestId: 'req-1',
      messages: [{ role: 'user', content: 'online reviews' }],
    });

    expect(result.intent.template).toBe('evaluation');
    expect(result.intent.tools).toEqual(['webSearch']);
  });

  it('defaults imageCount and videoCount to 6 when media tools are selected', async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InterpretActionService,
        playwrightMcpConfigProvider,
        {
          provide: HarnessStepLogger,
          useValue: { log: vi.fn(), warn: vi.fn() },
        },
        {
          provide: AiSdkService,
          useValue: {
            generateChat: vi.fn().mockResolvedValue({
              text: JSON.stringify({
                template: 'article',
                tools: ['webSearch', 'serperImageSearch', 'serperVideoSearch'],
                reasoning: 'research',
                language: 'en',
                needsClarification: false,
                plan: {},
              }),
            }),
          },
        },
        {
          provide: ProviderOverridesService,
          useValue: {
            getConfig: vi.fn().mockReturnValue({
              serper: {
                enabled: true,
                apiKey: 'key',
                web: { enabled: true },
                images: { enabled: true },
                news: { enabled: false },
                places: { enabled: false },
                shopping: { enabled: false },
                reviews: { enabled: false },
                videos: { enabled: true },
                scrape: { enabled: false },
              },
              youtube: {
                enabled: false,
                apiKey: undefined,
                videos: { enabled: false },
              },
              brightData: {
                enabled: false,
                apiKey: undefined,
                web: { enabled: false },
                images: { enabled: false },
                news: { enabled: false },
                places: { enabled: false },
                shopping: { enabled: false },
                videos: { enabled: false },
                scrape: { enabled: false },
              },
            }),
          },
        },
      ],
    }).compile();

    const serviceWithTools = module.get<InterpretActionService>(
      InterpretActionService,
    );

    const result = await serviceWithTools.execute({
      model: 'model',
      requestId: 'req-1',
      messages: [{ role: 'user', content: 'research topic' }],
    });

    expect(result.intent.imageCount).toBe(0);
    expect(result.intent.videoCount).toBe(0);
  });

  it('preserves explicit imageCount and videoCount from the classifier', async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InterpretActionService,
        playwrightMcpConfigProvider,
        {
          provide: HarnessStepLogger,
          useValue: { log: vi.fn(), warn: vi.fn() },
        },
        {
          provide: AiSdkService,
          useValue: {
            generateChat: vi.fn().mockResolvedValue({
              text: JSON.stringify({
                template: 'article',
                tools: ['webSearch', 'serperImageSearch', 'serperVideoSearch'],
                imageCount: 7,
                videoCount: 2,
                reasoning: 'research',
                language: 'en',
                needsClarification: false,
                plan: {},
              }),
            }),
          },
        },
        {
          provide: ProviderOverridesService,
          useValue: {
            getConfig: vi.fn().mockReturnValue({
              serper: {
                enabled: true,
                apiKey: 'key',
                web: { enabled: true },
                images: { enabled: true },
                news: { enabled: false },
                places: { enabled: false },
                shopping: { enabled: false },
                reviews: { enabled: false },
                videos: { enabled: true },
                scrape: { enabled: false },
              },
              youtube: {
                enabled: false,
                apiKey: undefined,
                videos: { enabled: false },
              },
              brightData: {
                enabled: false,
                apiKey: undefined,
                web: { enabled: false },
                images: { enabled: false },
                news: { enabled: false },
                places: { enabled: false },
                shopping: { enabled: false },
                videos: { enabled: false },
                scrape: { enabled: false },
              },
            }),
          },
        },
      ],
    }).compile();

    const serviceWithTools = module.get<InterpretActionService>(
      InterpretActionService,
    );

    const result = await serviceWithTools.execute({
      model: 'model',
      requestId: 'req-1',
      messages: [{ role: 'user', content: 'show me 7 images and 2 videos' }],
    });

    expect(result.intent.imageCount).toBe(7);
    expect(result.intent.videoCount).toBe(2);
  });

  it('throws when classification output is empty', async () => {
    (aiSdkService.generateChat as any).mockResolvedValue({ text: '' });

    await expect(
      service.execute({
        model: 'model',
        requestId: 'req-1',
        messages: [{ role: 'user', content: 'hi' }],
      }),
    ).rejects.toThrow('Intent classification returned empty output');
  });

  it('throws when classification output is not valid JSON', async () => {
    (aiSdkService.generateChat as any).mockResolvedValue({
      text: 'not json',
    });

    await expect(
      service.execute({
        model: 'model',
        requestId: 'req-1',
        messages: [{ role: 'user', content: 'hi' }],
      }),
    ).rejects.toThrow('Intent classification produced invalid JSON');
  });

  it('retries when language is missing and succeeds on subsequent attempt', async () => {
    let attempts = 0;
    (aiSdkService.generateChat as any).mockImplementation(async () => {
      attempts++;
      if (attempts === 1) {
        // First attempt: missing language
        return {
          text: JSON.stringify({
            template: 'article',
            tools: ['webSearch'],
            reasoning: 'research',
            needsClarification: false,
            plan: {},
          }),
          totalUsage: { inputTokens: 10, outputTokens: 5 },
        };
      }
      // Second attempt: language provided
      return {
        text: JSON.stringify({
          template: 'article',
          tools: ['webSearch'],
          reasoning: 'research',
          language: 'de',
          needsClarification: false,
          plan: {},
        }),
        totalUsage: { inputTokens: 12, outputTokens: 6 },
      };
    });

    const result = await service.execute({
      model: 'model',
      requestId: 'req-1',
      messages: [{ role: 'user', content: 'forschung thema' }],
    });

    expect(attempts).toBe(2);
    expect(result.intent.template).toBe('article');
    expect(result.intent.language).toBe('de');
    // Tokens accumulated across both attempts
    expect(result.inputTokens).toBe(10 + 12);
    expect(result.outputTokens).toBe(5 + 6);
  });

  it('retries when the JSON is structurally invalid and succeeds on subsequent attempt', async () => {
    let attempts = 0;
    (aiSdkService.generateChat as any).mockImplementation(async () => {
      attempts++;
      if (attempts === 1) {
        // First attempt: plan is null → fails the intent schema
        return {
          text: JSON.stringify({
            template: 'article',
            tools: ['webSearch'],
            reasoning: 'research',
            language: 'en',
            needsClarification: false,
            plan: null,
          }),
          totalUsage: { inputTokens: 10, outputTokens: 5 },
        };
      }
      return {
        text: JSON.stringify({
          template: 'article',
          tools: ['webSearch'],
          reasoning: 'research',
          language: 'en',
          needsClarification: false,
          plan: {},
        }),
        totalUsage: { inputTokens: 12, outputTokens: 6 },
      };
    });

    const result = await service.execute({
      model: 'model',
      requestId: 'req-1',
      messages: [{ role: 'user', content: 'research a topic' }],
    });

    expect(attempts).toBe(2);
    expect(result.intent.template).toBe('article');
  });
});

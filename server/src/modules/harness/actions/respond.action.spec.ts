import { Test, TestingModule } from '@nestjs/testing';
import { describe, expect, it, vi } from 'vitest';

import { AiSdkService } from '../../ai-sdk/services/ai-sdk.service.js';
import { HarnessStepLogger } from '../services/harness-step-logger.service.js';
import { ResponseValidatorService } from '../services/response-validator.service.js';
import { type IntentResult } from '../templates/intent.schema.js';

import { RespondActionService } from './respond.action.js';

function intent(template: IntentResult['template']): IntentResult {
  return {
    template,
    prompt: 'default',
    tools: [],
    imageCount: 0,
    videoCount: 0,
    reasoning: '',
    contextSummary: '',
    needsClarification: false,
    language: 'en',
    plan: {},
  };
}

describe('RespondActionService', () => {
  let service: RespondActionService;
  let aiSdkService: AiSdkService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RespondActionService,
        ResponseValidatorService,
        {
          provide: AiSdkService,
          useValue: {
            generateChat: vi.fn().mockImplementation(({ model }: any) => {
              // Return a valid structured JSON when mocked with a template marker.
              if (model === 'article-model') {
                return Promise.resolve({
                  text: JSON.stringify({
                    category: 'Research',
                    title: 'Title',
                    subtitle: '',
                    author: '',
                    publishDate: '',
                    readTime: '',
                    heroImageUrl: '',
                    heroImageAlt: '',
                    heroCaption: '',
                    heroVideoUrl: '',
                    heroVideoCaption: '',
                    summary: '',
                    sectionTitle: '',
                    sectionContent: '',
                    quote: '',
                    galleryTitle: '',
                    galleryItems: [],
                    videoGalleryTitle: '',
                    videoGalleryItems: [],
                    cardsTitle: '',
                    cards: [],
                    keyFindings: [],
                    sources: [],
                    conclusion: '',
                  }),
                  totalUsage: { inputTokens: 10, outputTokens: 5 },
                });
              }
              if (model === 'describe-model') {
                return Promise.resolve({
                  text: JSON.stringify({
                    category: 'Description',
                    title: 'Title',
                    subtitle: '',
                    sectionContent: '',
                    keyFindings: [],
                    sources: [],
                  }),
                  totalUsage: { inputTokens: 10, outputTokens: 5 },
                });
              }
              if (model === 'compare-model') {
                return Promise.resolve({
                  text: JSON.stringify({
                    category: 'Comparison',
                    title: 'Title',
                    subtitle: '',
                    sectionContent: '',
                    keyFindings: [],
                    sources: [],
                  }),
                  totalUsage: { inputTokens: 10, outputTokens: 5 },
                });
              }
              if (model === 'ocr-model') {
                return Promise.resolve({
                  text: JSON.stringify({
                    category: 'Document',
                    title: 'Title',
                    subtitle: '',
                    sectionContent: '',
                    keyFindings: [],
                  }),
                  totalUsage: { inputTokens: 10, outputTokens: 5 },
                });
              }
              if (model === 'news-model') {
                return Promise.resolve({
                  text: JSON.stringify({
                    category: 'News',
                    headline: 'Headline',
                    deck: '',
                    lead: '',
                    sectionTitle: '',
                    sectionContent: '',
                    heroImageUrl: '',
                    heroImageAlt: '',
                    heroCaption: '',
                    heroVideoUrl: '',
                    heroVideoCaption: '',
                    videoGalleryItems: [],
                    keyPoints: [],
                    sources: [],
                    relatedStories: [],
                    dateline: '',
                    byline: '',
                    publishDate: '',
                    readTime: '',
                  }),
                  totalUsage: { inputTokens: 10, outputTokens: 5 },
                });
              }
              return Promise.resolve({
                text: JSON.stringify({ text: 'Hello world' }),
                totalUsage: { inputTokens: 10, outputTokens: 5 },
              });
            }),
            streamChat: vi.fn().mockResolvedValue({
              fullStream: (async function* () {
                yield {
                  type: 'text-delta',
                  text: JSON.stringify({ text: 'Hello world' }),
                };
                yield {
                  type: 'finish',
                  totalUsage: { inputTokens: 10, outputTokens: 5 },
                };
              })(),
            }),
          },
        },
        {
          provide: HarnessStepLogger,
          useValue: { log: vi.fn(), warn: vi.fn() },
        },
      ],
    }).compile();

    service = module.get<RespondActionService>(RespondActionService);
    aiSdkService = module.get<AiSdkService>(AiSdkService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('returns generated JSON content for the text template', async () => {
    const result = await service.execute({
      intent: intent('text'),
      messages: [{ role: 'user', content: 'hi' }],
      model: 'model',
    });

    expect(result.content).toBe(JSON.stringify({ text: 'Hello world' }));
  });

  it('returns generated JSON content for structured templates', async () => {
    const articleResult = await service.execute({
      intent: intent('article'),
      messages: [{ role: 'user', content: 'hi' }],
      model: 'article-model',
    });

    expect(articleResult.content).toContain('"category"');
  });

  it('validates describe template JSON against its schema', async () => {
    const result = await service.execute({
      intent: intent('describe'),
      messages: [{ role: 'user', content: 'describe this' }],
      model: 'describe-model',
    });

    expect(result.content).toContain('"category"');
  });

  it('validates compare template JSON against its schema', async () => {
    const result = await service.execute({
      intent: intent('compare'),
      messages: [{ role: 'user', content: 'compare these' }],
      model: 'compare-model',
    });

    expect(result.content).toContain('"category"');
  });

  it('validates ocr template JSON against its schema', async () => {
    const result = await service.execute({
      intent: intent('ocr'),
      messages: [{ role: 'user', content: 'ocr this' }],
      model: 'ocr-model',
    });

    expect(result.content).toContain('"category"');
  });

  it('validates news template JSON against its schema', async () => {
    const result = await service.execute({
      intent: intent('news'),
      messages: [{ role: 'user', content: 'latest news' }],
      model: 'news-model',
    });

    expect(result.content).toContain('"headline"');
  });

  it('normalizes malformed array entries instead of retrying', async () => {
    (aiSdkService.generateChat as any).mockResolvedValue({
      text: JSON.stringify({
        category: 'Description',
        title: 'Title',
        subtitle: '',
        sectionContent: 'Description text',
        keyFindings: ['first finding', 'second finding'],
        sources: ['https://example.com'],
      }),
      totalUsage: { inputTokens: 10, outputTokens: 5 },
    });

    const result = await service.execute({
      intent: intent('describe'),
      messages: [{ role: 'user', content: 'describe this' }],
      model: 'model',
    });

    expect(result.content).toContain(
      '"keyFindings":[{"text":"first finding"},{"text":"second finding"}]',
    );
    expect(result.content).toContain(
      '"sources":[{"url":"https://example.com"}]',
    );
    expect(aiSdkService.generateChat).toHaveBeenCalledTimes(1);
  });

  it('does not retry when the model uses single-quoted JSON', async () => {
    (aiSdkService.generateChat as any).mockResolvedValue({
      text: "{ 'category': 'Description', 'title': 'Title', 'subtitle': '', 'sectionContent': '', 'keyFindings': [], 'sources': [] }",
      totalUsage: { inputTokens: 10, outputTokens: 5 },
    });

    const result = await service.execute({
      intent: intent('describe'),
      messages: [{ role: 'user', content: 'describe this' }],
      model: 'model',
    });

    expect(aiSdkService.generateChat).toHaveBeenCalledTimes(1);
    expect(result.content).toContain('"category":"Description"');
  });

  it('retries structured generation until JSON is valid', async () => {
    let calls = 0;
    (aiSdkService.generateChat as any).mockImplementation(() => {
      calls++;
      if (calls === 1) {
        return Promise.resolve({
          text: '{ invalid json',
          totalUsage: { inputTokens: 10, outputTokens: 5 },
        });
      }
      return Promise.resolve({
        text: JSON.stringify({
          category: 'Research',
          title: 'Title',
          subtitle: '',
          author: '',
          publishDate: '',
          readTime: '',
          heroImageUrl: '',
          heroImageAlt: '',
          heroCaption: '',
          heroVideoUrl: '',
          heroVideoCaption: '',
          summary: '',
          sectionTitle: '',
          sectionContent: '',
          quote: '',
          galleryTitle: '',
          galleryItems: [],
          videoGalleryTitle: '',
          videoGalleryItems: [],
          cardsTitle: '',
          cards: [],
          keyFindings: [],
          sources: [],
          conclusion: '',
        }),
        totalUsage: { inputTokens: 10, outputTokens: 5 },
      });
    });

    const result = await service.execute({
      intent: intent('article'),
      messages: [{ role: 'user', content: 'hi' }],
      model: 'model',
    });

    expect(calls).toBe(2);
    expect(result.content).toContain('"category"');
  });

  it('throws when structured JSON cannot be validated after retries', async () => {
    (aiSdkService.generateChat as any).mockResolvedValue({
      text: '{ invalid json',
      totalUsage: { inputTokens: 10, outputTokens: 5 },
    });

    await expect(
      service.execute({
        intent: intent('article'),
        messages: [{ role: 'user', content: 'hi' }],
        model: 'model',
      }),
    ).rejects.toThrow('Failed to produce valid JSON');
  });

  it('keeps conversation history for text tasks', async () => {
    await service.execute({
      intent: intent('text'),
      messages: [
        { role: 'user', content: 'hello' },
        { role: 'assistant', content: 'hi there' },
        { role: 'user', content: 'how are you?' },
      ],
      model: 'model',
    });

    const messages = (aiSdkService.generateChat as any).mock.calls[0][0]
      .messages;
    expect(messages.filter((m: any) => m.role === 'user')).toHaveLength(2);
    expect(messages.some((m: any) => m.role === 'assistant')).toBe(true);
  });

  it('uses only the latest image-carrying user message for image tasks', async () => {
    const imageBuffer = Buffer.from('image');
    await service.execute({
      intent: intent('describe'),
      messages: [
        { role: 'user', content: 'hello' },
        { role: 'assistant', content: 'hi there' },
        {
          role: 'user',
          content: 'describe this',
          images: [imageBuffer],
        },
      ],
      model: 'describe-model',
    });

    const messages = (aiSdkService.generateChat as any).mock.calls[0][0]
      .messages;
    const userMessages = messages.filter((m: any) => m.role === 'user');
    expect(userMessages).toHaveLength(1);
    expect(userMessages[0].content).toBe('describe this');
    expect(userMessages[0].images).toEqual([imageBuffer]);
    expect(messages.some((m: any) => m.role === 'system')).toBe(true);
    expect(messages.some((m: any) => m.role === 'assistant')).toBe(false);
  });
});

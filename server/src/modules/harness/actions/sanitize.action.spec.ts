import { Test, TestingModule } from '@nestjs/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ProviderOverridesService } from '../../provider-overrides/services/provider-overrides.service.js';
import { CloudImageIngestionService } from '../services/cloud-image-ingestion.service.js';
import { HarnessStepLogger } from '../services/harness-step-logger.service.js';
import { MediaUrlValidatorService } from '../services/media-url-validator.service.js';
import { ShownMediaService } from '../services/shown-media.service.js';

import { SanitizeActionService } from './sanitize.action.js';

describe('SanitizeActionService', () => {
  let service: SanitizeActionService;
  let mediaUrlValidator: MediaUrlValidatorService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SanitizeActionService,
        {
          provide: CloudImageIngestionService,
          useValue: { ingest: vi.fn().mockResolvedValue([]) },
        },
        {
          provide: ProviderOverridesService,
          useValue: {
            getConfig: vi.fn().mockReturnValue({
              sources: { preferred: [], blocked: [] },
            }),
          },
        },
        {
          provide: HarnessStepLogger,
          useValue: { log: vi.fn(), warn: vi.fn() },
        },
        {
          provide: MediaUrlValidatorService,
          useValue: {
            validateUrls: vi
              .fn()
              .mockImplementation((urls: string[]) =>
                Promise.resolve(urls.map((url) => ({ url, kind: 'unknown' }))),
              ),
          },
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

    service = module.get<SanitizeActionService>(SanitizeActionService);
    mediaUrlValidator = module.get<MediaUrlValidatorService>(
      MediaUrlValidatorService,
    );
  });

  function createContext(
    overrides: {
      imageCount?: number;
      videoCount?: number;
      messages?: any[];
    } = {},
  ) {
    return {
      requestId: 'req-1',
      model: 'model',
      request: {
        messages: overrides.messages ?? [
          { role: 'system', content: 'base' },
          { role: 'user', content: 'find media' },
        ],
      },
      outputs: {
        intent: {
          template: 'article',
          imageCount: overrides.imageCount ?? 0,
          videoCount: overrides.videoCount ?? 0,
        },
        toolResults: [],
      },
    } as any;
  }

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('builds final messages with tool context', async () => {
    const ctx = createContext();
    const result = await service.execute(
      ctx,
      [
        {
          toolName: 'webSearch',
          result: {
            results: [
              {
                title: 'Article',
                url: 'https://example.com/article',
                snippet: 'Snippet',
              },
            ],
          },
        },
      ],
      [],
    );

    const userMessages = result.messages.filter(
      (m: any) => m.role === 'system',
    );
    expect(userMessages.length).toBeGreaterThan(0);
    expect(userMessages[userMessages.length - 1]?.content).toContain(
      '[TOOL CONTEXT — DO NOT OUTPUT]',
    );
  });

  it('sanitizes search results and removes provider slugs from final messages', async () => {
    const ctx = createContext({
      messages: [
        { role: 'system', content: 'base' },
        { role: 'user', content: 'find news on conan' },
      ],
    });

    const result = await service.execute(
      ctx,
      [
        {
          toolName: 'serperWebSearch',
          result: {
            results: [
              {
                title: 'A',
                snippet: 'snippet',
                url: 'https://example.com/page',
                source: 'serper',
              },
            ],
          },
        },
        {
          toolName: 'serperNewsSearch',
          result: {
            results: [
              {
                title: 'B',
                snippet: 'snippet',
                url: 'https://bbc.com/news',
                source: 'BBC',
                date: '2026-07-11',
              },
            ],
          },
        },
      ],
      [],
    );

    const contextMessage = result.messages
      .filter((m: any) => m.role === 'system')
      .at(-1)?.content;

    expect(contextMessage).toContain('[TOOL CONTEXT — DO NOT OUTPUT]');
    expect(contextMessage).not.toContain('toolName');
    expect(contextMessage).not.toContain('"serper"');
    expect(contextMessage).toContain('"example"');
    expect(contextMessage).toContain('"BBC"');
  });

  it('rejects untrusted source URLs from webSearch results', async () => {
    const ctx = createContext();
    const result = await service.execute(
      ctx,
      [
        {
          toolName: 'serperWebSearch',
          result: {
            results: [
              {
                title: 'Good article',
                url: 'https://example.com/article',
              },
              {
                title: 'JS asset',
                url: 'https://www.youtube.com/s/_/ytembeds/_/js/k=ytembeds.base.en_US.DmLPwS-QVfI.2021.O/am=AAAAgA/d=1/br=1/rs=AGKMywEZpz2uK0zwYjoH08xuduL1PiQtSQ/m=root,base',
              },
            ],
          },
        },
      ],
      [],
    );

    const contextMessage = result.messages
      .filter((m: any) => m.role === 'system')
      .at(-1)?.content;
    const payload = JSON.parse(
      contextMessage!.replace('[TOOL CONTEXT — DO NOT OUTPUT]\n', ''),
    );

    expect(payload.articles).toHaveLength(1);
    expect(payload.articles[0].url).toBe('https://example.com/article');
  });

  it('extracts and prioritizes video URLs from webSearch over videoSearch', async () => {
    (mediaUrlValidator.validateUrls as any).mockImplementation(
      (urls: string[]) => Promise.resolve(urls.map(() => ({ kind: 'video' }))),
    );

    const ctx = createContext();
    const result = await service.execute(
      ctx,
      [
        {
          toolName: 'serperVideoSearch',
          result: {
            results: [
              {
                videoUrl: 'https://www.youtube.com/watch?v=videoSearchId',
                title: 'Video search result',
              },
            ],
          },
        },
        {
          toolName: 'serperWebSearch',
          result: {
            results: [
              {
                url: 'https://www.youtube.com/watch?v=webSearchId',
                title: 'Web article with video',
              },
            ],
          },
        },
      ],
      [],
    );

    const contextMessage = result.messages.find(
      (m: any) =>
        m.role === 'system' &&
        typeof m.content === 'string' &&
        m.content.startsWith('[TOOL CONTEXT'),
    );
    expect(contextMessage).toBeDefined();
    const payload = JSON.parse(
      contextMessage!.content.replace('[TOOL CONTEXT — DO NOT OUTPUT]\n', ''),
    );
    expect(payload.availableVideos[0].videoUrl).toBe(
      'https://www.youtube.com/watch?v=webSearchId',
    );
    expect(payload.availableVideos[1].videoUrl).toBe(
      'https://www.youtube.com/watch?v=videoSearchId',
    );
  });

  it('includes imageTargetCount and videoTargetCount in the tool context', async () => {
    const ctx = createContext({ imageCount: 3, videoCount: 4 });
    const result = await service.execute(
      ctx,
      [
        {
          toolName: 'webSearch',
          result: {
            results: [
              {
                url: 'https://example.com/article',
                title: 'Article',
                snippet: 'Snippet',
              },
            ],
          },
        },
      ],
      [],
    );

    const contextMessage = result.messages.find(
      (m: any) =>
        m.role === 'system' &&
        typeof m.content === 'string' &&
        m.content.startsWith('[TOOL CONTEXT'),
    );
    expect(contextMessage).toBeDefined();
    const payload = JSON.parse(
      contextMessage!.content.replace('[TOOL CONTEXT — DO NOT OUTPUT]\n', ''),
    );
    expect(payload.imageTargetCount).toBe(3);
    expect(payload.videoTargetCount).toBe(4);
    expect(payload.mediaInstructions.join('\n')).toContain(
      'Target counts: use at most 3 image(s) and 4 video(s)',
    );
  });

  it('caps availableVideos to the default target count of 6', async () => {
    const videos = Array.from({ length: 10 }, (_, i) => ({
      videoUrl: `https://www.youtube.com/watch?v=video${i}`,
      title: `Video ${i}`,
    }));

    (mediaUrlValidator.validateUrls as any).mockImplementation(
      (urls: string[]) => Promise.resolve(urls.map(() => ({ kind: 'video' }))),
    );

    const ctx = createContext();
    const result = await service.execute(
      ctx,
      [
        {
          toolName: 'serperVideoSearch',
          result: { results: videos },
        },
      ],
      [],
    );

    expect(result.availableVideoCount).toBe(6);

    const contextMessage = result.messages.find(
      (m: any) =>
        m.role === 'system' &&
        typeof m.content === 'string' &&
        m.content.startsWith('[TOOL CONTEXT'),
    );
    expect(contextMessage).toBeDefined();
    const payload = JSON.parse(
      contextMessage!.content.replace('[TOOL CONTEXT — DO NOT OUTPUT]\n', ''),
    );
    expect(payload.availableVideos).toHaveLength(6);
    expect(payload.videoTargetCount).toBe(6);
  });

  it('caps availableVideos to the explicit videoCount target', async () => {
    const videos = Array.from({ length: 10 }, (_, i) => ({
      videoUrl: `https://www.youtube.com/watch?v=video${i}`,
      title: `Video ${i}`,
    }));

    (mediaUrlValidator.validateUrls as any).mockImplementation(
      (urls: string[]) => Promise.resolve(urls.map(() => ({ kind: 'video' }))),
    );

    const ctx = createContext({ videoCount: 4 });
    const result = await service.execute(
      ctx,
      [
        {
          toolName: 'serperVideoSearch',
          result: { results: videos },
        },
      ],
      [],
    );

    expect(result.availableVideoCount).toBe(4);

    const contextMessage = result.messages.find(
      (m: any) =>
        m.role === 'system' &&
        typeof m.content === 'string' &&
        m.content.startsWith('[TOOL CONTEXT'),
    );
    expect(contextMessage).toBeDefined();
    const payload = JSON.parse(
      contextMessage!.content.replace('[TOOL CONTEXT — DO NOT OUTPUT]\n', ''),
    );
    expect(payload.availableVideos).toHaveLength(4);
    expect(payload.videoTargetCount).toBe(4);
  });

  it('strips asset tags from webpage fetch content', async () => {
    const ctx = createContext();
    const result = await service.execute(
      ctx,
      [
        {
          toolName: 'webFetch',
          result: {
            content:
              '<script src="https://evil.com/tracker.js"></script><p>Article text</p>',
          },
        },
      ],
      [],
    );

    const reference = result.toolResults[0].result as { content: string };
    expect(reference.content).not.toContain('script');
    expect(reference.content).not.toContain('tracker.js');
    expect(reference.content).toContain('Article text');
  });
});

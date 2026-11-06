import { Test, TestingModule } from '@nestjs/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { MemoryCognitionService } from '../../memory-client/services/memory-cognition.service.js';
import { MemoryEncyclopediaService } from '../../memory-client/services/memory-encyclopedia.service.js';
import { MemoryPartitionRecordsService } from '../../memory-client/services/memory-partition-records.service.js';
import { ProviderOverridesService } from '../../provider-overrides/services/provider-overrides.service.js';
import { SharpService } from '../../sharp/services/sharp.service.js';
import { SourceBudgetConfigService } from '../configs/source-budget-config.service.js';
import { CloudImageIngestionService } from '../services/cloud-image-ingestion.service.js';
import { MediaUrlValidatorService } from '../services/media-url-validator.service.js';
import { SanitizeCognitionContextService } from '../services/sanitize/cognition-context.service.js';
import { SanitizeImageIngestionService } from '../services/sanitize/image-ingestion.service.js';
import { SanitizeMediaValidationService } from '../services/sanitize/media-validation.service.js';
import { SanitizeReferenceSelectionService } from '../services/sanitize/reference-selection.service.js';
import { SanitizeShownMediaFilterService } from '../services/sanitize/shown-media-filter.service.js';
import { ShownMediaService } from '../services/shown-media.service.js';

import { SanitizeActionService } from './sanitize.action.js';

// A valid 1x1 PNG so image-fingerprint downloads succeed in tests.
const TINY_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64',
);

describe('SanitizeActionService', () => {
  let service: SanitizeActionService;
  let mediaUrlValidator: MediaUrlValidatorService;
  let module: TestingModule;

  beforeEach(async () => {
    // Image-fingerprint downloads hit real fetch; stub it with a valid PNG.
    // A fresh Response per call — the body stream can only be read once.
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation(() => Promise.resolve(new Response(TINY_PNG))),
    );

    module = await Test.createTestingModule({
      providers: [
        SanitizeActionService,
        SanitizeCognitionContextService,
        SanitizeImageIngestionService,
        SanitizeMediaValidationService,
        SanitizeReferenceSelectionService,
        SanitizeShownMediaFilterService,
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
        {
          provide: SharpService,
          useValue: {
            effectiveResize: vi
              .fn()
              .mockReturnValue({ maxWidth: 768, maxHeight: null }),
          },
        },
        {
          provide: MemoryPartitionRecordsService,
          useValue: {
            searchByText: vi.fn().mockResolvedValue([]),
            searchByTextWithClusters: vi.fn().mockResolvedValue({
              clusters: [],
            }),
          },
        },
        {
          provide: MemoryCognitionService,
          useValue: {
            getCognition: vi
              .fn()
              .mockResolvedValue({ profile: null, insights: [] }),
            searchConvictions: vi.fn().mockResolvedValue([]),
          },
        },
        {
          provide: MemoryEncyclopediaService,
          useValue: {
            selectContext: vi.fn().mockResolvedValue(null),
          },
        },
        {
          provide: SourceBudgetConfigService,
          useValue: {
            config: {
              sourceBudgetRatio: 0.125,
              sourceBudgetChars: 48000,
              referenceDocRatio: 0.5,
              referenceDocChars: 100000,
              gatheredTotalRatio: 0.03,
              gatheredTotalChars: 16000,
            },
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
      filters: {},
      processedMeta: [],
      buffers: [],
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

  it('drops broken image urls from the tool results', async () => {
    const cloudIngestion = module.get<CloudImageIngestionService>(
      CloudImageIngestionService,
    );
    (cloudIngestion.ingest as any).mockResolvedValue([
      {
        sourceUrl: 'https://img.com/good.jpg',
        imageUrl: '/api/v1/storage/sess-1/conv-1/hash',
        fingerprint: 'fp-good',
      },
    ]);
    (mediaUrlValidator.validateUrls as any).mockImplementation(
      (urls: string[]) =>
        Promise.resolve(
          urls.map((url) =>
            url.includes('broken')
              ? { url, kind: 'broken' }
              : { url, kind: 'image' },
          ),
        ),
    );

    const ctx = createContext();
    ctx.sessionId = 'sess-1';
    ctx.filters = { conversationId: 'conv-1' };
    const result = await service.execute(
      ctx,
      [
        {
          toolName: 'serperImageSearch',
          result: {
            results: [
              {
                imageUrl: 'https://img.com/good.jpg',
                title: 'Good',
              },
              {
                imageUrl: 'https://img.com/broken.jpg',
                title: 'Broken',
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
    const payload = JSON.parse(
      contextMessage!.content.replace('[TOOL CONTEXT — DO NOT OUTPUT]\n', ''),
    );
    // The broken URL is dropped; the good one survives as a local rewrite.
    expect(payload.availableImages).toHaveLength(1);
    expect(payload.availableImages[0].imageUrl).toBe(
      '/api/v1/storage/sess-1/conv-1/hash',
    );
    expect(JSON.stringify(payload)).not.toContain('https://img.com/broken.jpg');
  });

  it('drops dead article page urls from the tool results', async () => {
    (mediaUrlValidator.validateUrls as any).mockImplementation(
      (urls: string[]) =>
        Promise.resolve(
          urls.map((url) =>
            url.includes('dead')
              ? { url, kind: 'broken', status: 404 }
              : { url, kind: 'unknown' },
          ),
        ),
    );

    const ctx = createContext();
    const result = await service.execute(
      ctx,
      [
        {
          toolName: 'serperWebSearch',
          result: {
            results: [
              {
                title: 'Live',
                url: 'https://example.com/live',
                snippet: 's',
              },
              {
                title: 'Dead',
                url: 'https://example.com/dead',
                snippet: 's',
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
    const payload = JSON.parse(
      contextMessage!.content.replace('[TOOL CONTEXT — DO NOT OUTPUT]\n', ''),
    );
    // The dead article is filtered out of the webSearch results entirely.
    expect(payload.articles).toHaveLength(1);
    expect(payload.articles[0].url).toBe('https://example.com/live');
  });

  it('skips previously shown images for imagelist follow-ups', async () => {
    const shownMedia = module.get<ShownMediaService>(ShownMediaService);
    const { buildImageFingerprint } =
      await import('../helpers/media/build-image-fingerprint.helper.js');
    const shownFingerprint = await buildImageFingerprint(TINY_PNG);
    (shownMedia.lookupKeys as any).mockResolvedValue({
      images: new Set([shownFingerprint]),
      videos: new Set(),
    });
    (mediaUrlValidator.validateUrls as any).mockImplementation(
      (urls: string[]) =>
        Promise.resolve(urls.map((url) => ({ url, kind: 'image' }))),
    );

    const ctx = createContext({
      messages: [
        { role: 'system', content: 'base' },
        { role: 'user', content: 'more images' },
      ],
    });
    ctx.outputs.intent.template = 'imagelist';
    ctx.sessionId = 'sess-1';
    ctx.filters = { conversationId: 'conv-1' };

    const result = await service.execute(
      ctx,
      [
        {
          toolName: 'serperImageSearch',
          result: {
            results: [
              { imageUrl: 'https://img.com/shown.jpg', title: 'Shown' },
              { imageUrl: 'https://img.com/fresh.jpg', title: 'Fresh' },
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
    const payload = JSON.parse(
      contextMessage!.content.replace('[TOOL CONTEXT — DO NOT OUTPUT]\n', ''),
    );
    // Both candidates share the same fingerprint, so both are dropped.
    expect(payload.availableImages).toHaveLength(0);
  });

  it('skips previously shown videos for videolist follow-ups', async () => {
    const shownMedia = module.get<ShownMediaService>(ShownMediaService);
    (shownMedia.lookupKeys as any).mockResolvedValue({
      images: new Set(),
      videos: new Set(['youtube:dQw4w9WgXcQ']),
    });
    (mediaUrlValidator.validateUrls as any).mockImplementation(
      (urls: string[]) =>
        Promise.resolve(urls.map((url) => ({ url, kind: 'video' }))),
    );

    const ctx = createContext({
      messages: [
        { role: 'system', content: 'base' },
        { role: 'user', content: 'more videos' },
      ],
    });
    ctx.outputs.intent.template = 'videolist';
    ctx.sessionId = 'sess-1';
    ctx.filters = { conversationId: 'conv-1' };

    const result = await service.execute(
      ctx,
      [
        {
          toolName: 'serperVideoSearch',
          result: {
            results: [
              {
                videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
                title: 'Shown',
              },
              {
                videoUrl: 'https://www.youtube.com/watch?v=abcdefghijk',
                title: 'Fresh',
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
    const payload = JSON.parse(
      contextMessage!.content.replace('[TOOL CONTEXT — DO NOT OUTPUT]\n', ''),
    );
    expect(payload.availableVideos).toHaveLength(1);
    expect(payload.availableVideos[0].videoUrl).toBe(
      'https://www.youtube.com/watch?v=abcdefghijk',
    );
  });

  it('injects the cognition profile and probed insights into the context', async () => {
    const memoryRecords = module.get<MemoryPartitionRecordsService>(
      MemoryPartitionRecordsService,
    );
    const memoryCognition = module.get<MemoryCognitionService>(
      MemoryCognitionService,
    );
    (memoryCognition.getCognition as any).mockResolvedValue({
      profile: JSON.stringify({
        persona: { name: 'F' },
        likes: { cars: 'yes' },
      }),
      insights: [{ text: 'likes vintage cars', isFriction: false }],
      convictions: [{ text: 'collects cars', isFriction: false }],
      episodeProbeLimit: 2,
    });
    (memoryRecords.searchByText as any).mockResolvedValue([
      { text: 'discussed engine swaps' },
    ]);
    (memoryCognition.searchConvictions as any).mockResolvedValue([
      { text: 'collects cars', isFriction: false },
    ]);

    const ctx = createContext({
      messages: [
        { role: 'system', content: 'base' },
        { role: 'user', content: 'tell me about cars' },
      ],
    });
    ctx.sessionId = 'sess-1';
    ctx.lastUserPrompt = 'tell me about cars';

    const result = await service.execute(ctx, [], []);

    const contextMessage = result.messages.find(
      (m: any) =>
        m.role === 'system' &&
        typeof m.content === 'string' &&
        m.content.startsWith('[YOUR PROFILE OF THIS USER'),
    );
    expect(contextMessage).toBeDefined();
    expect(String(contextMessage.content)).toContain('likes');

    const insightsMessage = result.messages.find(
      (m: any) =>
        m.role === 'system' &&
        typeof m.content === 'string' &&
        m.content.startsWith('[RELEVANT PRIVATE COGNITION'),
    );
    expect(insightsMessage).toBeDefined();
    expect(String(insightsMessage.content)).toContain('discussed engine swaps');
  });

  it('marks contested insights and convictions as contested', async () => {
    const memoryRecords = module.get<MemoryPartitionRecordsService>(
      MemoryPartitionRecordsService,
    );
    const memoryCognition = module.get<MemoryCognitionService>(
      MemoryCognitionService,
    );
    (memoryCognition.getCognition as any).mockResolvedValue({
      profile: JSON.stringify({ likes: { cars: 'yes' } }),
      insights: [{ text: 'likes cars', isFriction: true }],
      convictions: [{ text: 'collects cars', isFriction: true }],
      episodeProbeLimit: 0,
    });
    (memoryRecords.searchByText as any).mockResolvedValue([
      { text: 'likes cars', isFriction: true },
    ]);
    (memoryCognition.searchConvictions as any).mockResolvedValue([
      { text: 'collects cars', isFriction: true },
    ]);

    const ctx = createContext({
      messages: [
        { role: 'system', content: 'base' },
        { role: 'user', content: 'cars' },
      ],
    });
    ctx.sessionId = 'sess-1';
    ctx.lastUserPrompt = 'cars';

    const result = await service.execute(ctx, [], []);

    const insightsMessage = result.messages.find(
      (m: any) =>
        m.role === 'system' &&
        typeof m.content === 'string' &&
        m.content.startsWith('[RELEVANT PRIVATE COGNITION'),
    );
    expect(String(insightsMessage?.content)).toContain('⚠ CONTESTED');

    const convictionsMessage = result.messages.find(
      (m: any) =>
        m.role === 'system' &&
        typeof m.content === 'string' &&
        m.content.startsWith('[YOUR CONVICTIONS'),
    );
    expect(String(convictionsMessage?.content)).toContain('⚠ CONTESTED');
  });

  it('injects cluster summaries when graphRag is enabled', async () => {
    const memoryRecords = module.get<MemoryPartitionRecordsService>(
      MemoryPartitionRecordsService,
    );
    const memoryCognition = module.get<MemoryCognitionService>(
      MemoryCognitionService,
    );
    (memoryCognition.getCognition as any).mockResolvedValue({
      profile: JSON.stringify({ likes: ['cars'] }),
      insights: [],
      episodeProbeLimit: 0,
    });
    (memoryRecords.searchByTextWithClusters as any).mockResolvedValue({
      clusters: [{ title: 'Cars', summary: 'All about cars' }],
    });

    const ctx = createContext({
      messages: [
        { role: 'system', content: 'base' },
        { role: 'user', content: 'cars' },
      ],
    });
    ctx.sessionId = 'sess-1';
    ctx.lastUserPrompt = 'cars';
    ctx.filters = { graphRag: true };

    const result = await service.execute(ctx, [], []);

    const clustersMessage = result.messages.find(
      (m: any) =>
        m.role === 'system' &&
        typeof m.content === 'string' &&
        m.content.startsWith('[TOPIC CONTEXT'),
    );
    expect(clustersMessage).toBeDefined();
    expect(String(clustersMessage.content)).toContain('Cars: All about cars');
  });

  it('selects references through the memory client when a query exists', async () => {
    const memoryEncyclopedia = module.get<MemoryEncyclopediaService>(
      MemoryEncyclopediaService,
    );
    (memoryEncyclopedia.selectContext as any).mockResolvedValue({
      chunks: [
        { url: 'https://example.com/ref', title: 'Ref', content: 'Passage' },
      ],
      consideredChunks: 5,
      selectedChunks: 1,
      pastChunks: [
        { url: 'https://example.com/past', title: 'Past', content: 'Old' },
      ],
    });

    const ctx = createContext({
      messages: [
        { role: 'system', content: 'base' },
        { role: 'user', content: 'summarize the sources' },
      ],
    });
    ctx.lastUserPrompt = 'summarize the sources';

    const result = await service.execute(
      ctx,
      [
        {
          toolName: 'webFetch',
          result: { url: 'https://example.com/ref', content: 'Full text here' },
        },
      ],
      [],
    );

    expect(memoryEncyclopedia.selectContext).toHaveBeenCalled();
    const contextMessage = result.messages.find(
      (m: any) =>
        m.role === 'system' &&
        typeof m.content === 'string' &&
        m.content.startsWith('[RELEVANT KNOWLEDGE'),
    );
    expect(contextMessage).toBeDefined();
  });

  it('falls back to full references when selection is unavailable', async () => {
    const memoryEncyclopedia = module.get<MemoryEncyclopediaService>(
      MemoryEncyclopediaService,
    );
    (memoryEncyclopedia.selectContext as any).mockResolvedValue(null);

    const ctx = createContext({
      messages: [
        { role: 'system', content: 'base' },
        { role: 'user', content: 'summarize' },
      ],
    });
    ctx.lastUserPrompt = 'summarize';

    const result = await service.execute(
      ctx,
      [
        {
          toolName: 'webFetch',
          result: { url: 'https://example.com/ref', content: 'Full text here' },
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
    const payload = JSON.parse(
      contextMessage!.content.replace('[TOOL CONTEXT — DO NOT OUTPUT]\n', ''),
    );
    expect(payload.references).toHaveLength(1);
  });

  it('ingests external images for image reference tasks', async () => {
    const cloudIngestion = module.get<CloudImageIngestionService>(
      CloudImageIngestionService,
    );
    (cloudIngestion.ingest as any).mockResolvedValue([
      {
        sourceUrl: 'https://img.com/a.jpg',
        imageUrl: '/api/v1/storage/sess-1/conv-1/hash',
        fingerprint: 'fp-a',
      },
    ]);
    (mediaUrlValidator.validateUrls as any).mockImplementation(
      (urls: string[]) =>
        Promise.resolve(urls.map((url) => ({ url, kind: 'image' }))),
    );

    const ctx = createContext({
      messages: [
        { role: 'system', content: 'base' },
        { role: 'user', content: 'compare these' },
      ],
    });
    ctx.outputs.intent.template = 'compare';
    ctx.buffers = [Buffer.from('img')];
    ctx.sessionId = 'sess-1';
    ctx.filters = { conversationId: 'conv-1' };

    const result = await service.execute(
      ctx,
      [
        {
          toolName: 'serperImageSearch',
          result: {
            results: [{ imageUrl: 'https://img.com/a.jpg', title: 'A' }],
          },
        },
      ],
      [],
    );

    expect(cloudIngestion.ingest).toHaveBeenCalled();
    expect(result.ingestedImages).toHaveLength(1);
    const contextMessage = result.messages.find(
      (m: any) =>
        m.role === 'system' &&
        typeof m.content === 'string' &&
        m.content.startsWith('[TOOL CONTEXT'),
    );
    const payload = JSON.parse(
      contextMessage!.content.replace('[TOOL CONTEXT — DO NOT OUTPUT]\n', ''),
    );
    expect(payload.availableImages[0].imageUrl).toBe(
      '/api/v1/storage/sess-1/conv-1/hash',
    );
  });

  it('keeps local images without ingestion when no externals exist', async () => {
    const cloudIngestion = module.get<CloudImageIngestionService>(
      CloudImageIngestionService,
    );
    (mediaUrlValidator.validateUrls as any).mockImplementation(
      (urls: string[]) =>
        Promise.resolve(urls.map((url) => ({ url, kind: 'image' }))),
    );

    const ctx = createContext({
      messages: [
        { role: 'system', content: 'base' },
        { role: 'user', content: 'show images' },
      ],
    });
    ctx.outputs.intent.template = 'article';

    const result = await service.execute(
      ctx,
      [
        {
          toolName: 'serperImageSearch',
          result: {
            results: [{ imageUrl: '/local/path.jpg', title: 'Local' }],
          },
        },
      ],
      [],
    );

    expect(cloudIngestion.ingest).not.toHaveBeenCalled();
    expect(result.availableImageCount).toBe(1);
  });
});

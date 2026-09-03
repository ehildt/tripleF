import { Test, TestingModule } from '@nestjs/testing';
import { OllamaApiService } from '@triplef/ollama-api';
import { Job } from 'bullmq';
import { describe, expect, it, vi } from 'vitest';

import { MinioService } from '../../minio/services/minio.service.js';
import { OllamaConfigService } from '../../ollama/configs/ollama-config.service.js';
import { SharpService } from '../../sharp/services/sharp.service.js';
import { HarnessJobPayload } from '../dtos/harness-job.dto.js';

import { DocumentConversionService } from './document-conversion.service.js';
import { HarnessContextService } from './harness-context.service.js';
import { StepRegistryService } from './step-registry.service.js';

function createJob(payload: HarnessJobPayload): Job<HarnessJobPayload> {
  return {
    name: 'req-1',
    data: payload,
  } as Job<HarnessJobPayload>;
}

describe('HarnessContextService', () => {
  let service: HarnessContextService;
  let minioService: MinioService;
  let ollamaApiService: OllamaApiService;
  let documentConversionService: DocumentConversionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HarnessContextService,
        {
          provide: DocumentConversionService,
          useValue: {
            resolveOriginals: vi
              .fn()
              .mockResolvedValue({ pageImageMeta: [], textSections: [] }),
          },
        },
        {
          provide: MinioService,
          useValue: {
            downloadBuffers: vi.fn(),
            buildFileUrl: vi.fn(() => '/api/v1/storage/s/c/h'),
          },
        },
        {
          provide: OllamaConfigService,
          useValue: { config: { keepAlive: '5m' } },
        },
        {
          provide: OllamaApiService,
          useValue: {
            supportsCapability: vi.fn().mockResolvedValue(true),
          },
        },
        {
          provide: SharpService,
          useValue: {
            buildOptions: vi.fn().mockReturnValue(undefined),
          },
        },
        {
          provide: StepRegistryService,
          useValue: {
            registry: new Map([
              ['interpret', { handler: {}, deps: [] }],
              ['execute', { handler: {}, deps: ['interpret'] }],
              ['sanitize', { handler: {}, deps: ['execute'] }],
              ['respond', { handler: {}, deps: ['sanitize'] }],
              ['vectorize', { handler: {}, deps: ['respond'] }],
            ]),
          },
        },
      ],
    }).compile();

    service = module.get<HarnessContextService>(HarnessContextService);
    minioService = module.get<MinioService>(MinioService);
    ollamaApiService = module.get<OllamaApiService>(OllamaApiService);
    documentConversionService = module.get<DocumentConversionService>(
      DocumentConversionService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('throws when meta is not an array', async () => {
    const job = createJob({ meta: {} as any, filters: {} });
    await expect(service.buildContext(job)).rejects.toThrow('Invalid meta');
  });

  it('skips MinIO when no images are provided', async () => {
    const job = createJob({
      meta: [],
      filters: {
        model: 'model',
        prompt: [{ role: 'user', content: 'hello' }],
      },
    });

    const ctx = await service.buildContext(job);

    expect(minioService.downloadBuffers).not.toHaveBeenCalled();
    expect(ctx.request.messages.some((m) => m.role === 'user')).toBe(true);
    expect(ctx.buffers).toEqual([]);
  });

  it('downloads buffers when images are provided', async () => {
    const buffers = [Buffer.from('img')];
    (minioService.downloadBuffers as any).mockResolvedValue({
      buffers,
      keptMeta: [{ name: 'test.png', type: 'image/png', hash: 'abc' }],
    });

    const job = createJob({
      meta: [{ name: 'test.png', type: 'image/png', hash: 'abc' }],
      filters: { model: 'model', sessionId: 'sess-1' },
    });

    const ctx = await service.buildContext(job);

    expect(minioService.downloadBuffers).toHaveBeenCalledWith(
      'sess-1',
      undefined,
      [{ name: 'test.png', type: 'image/png', hash: 'abc' }],
    );
    expect(ctx.buffers).toBe(buffers);
    expect(ctx.request.messages.some((m: any) => m.images === buffers)).toBe(
      true,
    );
    expect(ctx.steps.has('execute')).toBe(true);
    // Every registered step (including vectorize) is seeded — a hardcoded map
    // would silently starve newly-registered steps of the engine.
    expect(ctx.steps.has('vectorize')).toBe(true);
  });

  it('downloads referenced images from sessionMetadata and merges them with new images', async () => {
    const referencedBuffers = [Buffer.from('ref')];
    const newBuffers = [Buffer.from('new')];
    const mergedBuffers = [...referencedBuffers, ...newBuffers];
    (minioService.downloadBuffers as any).mockResolvedValue({
      buffers: mergedBuffers,
      keptMeta: [
        { name: 'ref.png', type: 'image/*', hash: 'ref-hash', source: 'local' },
        { name: 'new.png', type: 'image/png', hash: 'new-hash' },
      ],
    });

    const job = createJob({
      meta: [{ name: 'new.png', type: 'image/png', hash: 'new-hash' }],
      filters: {
        model: 'model',
        sessionId: 'sess-1',
        hasNewImages: false,
        sessionMetadata: JSON.stringify({
          images: [{ name: 'ref.png', hash: 'ref-hash' }],
        }),
      },
    });

    const ctx = await service.buildContext(job);

    expect(minioService.downloadBuffers).toHaveBeenCalledWith(
      'sess-1',
      undefined,
      [
        { name: 'ref.png', type: 'image/*', hash: 'ref-hash', source: 'local' },
        { name: 'new.png', type: 'image/png', hash: 'new-hash' },
      ],
    );
    expect(ctx.buffers).toBe(mergedBuffers);
    expect(ctx.processedMeta).toHaveLength(2);
  });

  it('passes the referenced image hashes to resolveOriginals so page selection is authoritative', async () => {
    (minioService.downloadBuffers as any).mockResolvedValue({
      buffers: [Buffer.from('ref')],
      keptMeta: [
        { name: 'ref.png', type: 'image/*', hash: 'ref-hash', source: 'local' },
      ],
    });
    const job = createJob({
      meta: [{ name: 'new.png', type: 'image/png', hash: 'new-hash' }],
      filters: {
        model: 'model',
        sessionId: 'sess-1',
        sessionMetadata: JSON.stringify({
          images: [{ name: 'ref.png', hash: 'ref-hash' }],
          originals: [
            { name: 'doc.pdf', hash: 'doc-hash', type: 'application/pdf' },
          ],
        }),
      },
    });

    await service.buildContext(job);

    expect(documentConversionService.resolveOriginals).toHaveBeenCalledWith(
      'sess-1',
      undefined,
      'req-1',
      expect.any(Array),
      new Set(['ref-hash', 'new-hash']),
    );
  });

  it('captures the last user prompt', async () => {
    const job = createJob({
      meta: [],
      filters: {
        model: 'model',
        prompt: [
          { role: 'user', content: 'first' },
          { role: 'assistant', content: 'ok' },
          { role: 'user', content: 'last' },
        ],
      },
    });

    const ctx = await service.buildContext(job);
    expect(ctx.lastUserPrompt).toBe('last');
  });

  it('excludes images and adds a system notice when the model does not support vision', async () => {
    (ollamaApiService.supportsCapability as any).mockResolvedValue(false);

    const job = createJob({
      meta: [{ name: 'test.png', type: 'image/png', hash: 'abc' }],
      filters: {
        model: 'text-model',
        sessionId: 'sess-1',
        prompt: [{ role: 'user', content: 'what is this' }],
      },
    });

    const ctx = await service.buildContext(job);

    expect(minioService.downloadBuffers).not.toHaveBeenCalled();
    expect(ctx.buffers).toEqual([]);
    expect(ctx.processedMeta).toEqual([]);
    expect(ctx.visionExcluded).toBe(true);
    expect(ctx.hasNewImages).toBe(false);
    expect(ctx.request.messages.some((m) => m.role === 'system')).toBe(true);
    expect(ctx.request.messages.some((m: any) => m.images?.length > 0)).toBe(
      false,
    );
  });

  it('excludes referenced images from sessionMetadata when the model does not support vision', async () => {
    (ollamaApiService.supportsCapability as any).mockResolvedValue(false);

    const job = createJob({
      meta: [],
      filters: {
        model: 'text-model',
        sessionId: 'sess-1',
        sessionMetadata: JSON.stringify({
          images: [{ name: 'ref.png', hash: 'ref-hash' }],
        }),
        prompt: [{ role: 'user', content: 'compare these' }],
      },
    });

    const ctx = await service.buildContext(job);

    expect(minioService.downloadBuffers).not.toHaveBeenCalled();
    expect(ctx.buffers).toEqual([]);
    expect(ctx.processedMeta).toEqual([]);
    expect(ctx.visionExcluded).toBe(true);
  });
});

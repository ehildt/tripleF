import { Test, TestingModule } from '@nestjs/testing';
import { Job } from 'bullmq';
import { describe, expect, it, vi } from 'vitest';

import { OllamaConfigService } from '../../../configs/ollama-config.service.js';
import { OllamaModelsService } from '../../ai-sdk/services/ollama-models.service.js';
import { MinioService } from '../../minio/services/minio.service.js';
import { HarnessJobPayload } from '../dtos/harness-job.dto.js';

import { HarnessContextService } from './harness-context.service.js';

function createJob(payload: HarnessJobPayload): Job<HarnessJobPayload> {
  return {
    name: 'req-1',
    data: payload,
  } as Job<HarnessJobPayload>;
}

describe('HarnessContextService', () => {
  let service: HarnessContextService;
  let minioService: MinioService;
  let ollamaModelsService: OllamaModelsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HarnessContextService,
        {
          provide: MinioService,
          useValue: {
            downloadBuffers: vi.fn(),
          },
        },
        {
          provide: OllamaConfigService,
          useValue: { config: { keepAlive: '5m' } },
        },
        {
          provide: OllamaModelsService,
          useValue: {
            supportsCapability: vi.fn().mockResolvedValue(true),
          },
        },
      ],
    }).compile();

    service = module.get<HarnessContextService>(HarnessContextService);
    minioService = module.get<MinioService>(MinioService);
    ollamaModelsService = module.get<OllamaModelsService>(OllamaModelsService);
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
    (minioService.downloadBuffers as any).mockResolvedValue(buffers);

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
  });

  it('downloads referenced images from sessionMetadata and merges them with new images', async () => {
    const referencedBuffers = [Buffer.from('ref')];
    const newBuffers = [Buffer.from('new')];
    const mergedBuffers = [...referencedBuffers, ...newBuffers];
    (minioService.downloadBuffers as any).mockResolvedValue(mergedBuffers);

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
        { name: 'ref.png', type: 'image/*', hash: 'ref-hash' },
        { name: 'new.png', type: 'image/png', hash: 'new-hash' },
      ],
    );
    expect(ctx.buffers).toBe(mergedBuffers);
    expect(ctx.processedMeta).toHaveLength(2);
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
    (ollamaModelsService.supportsCapability as any).mockResolvedValue(false);

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
    expect(
      ctx.request.messages.find((m) => m.role === 'system')?.content,
    ).toContain('text-model');
    expect(
      ctx.request.messages.find((m) => m.role === 'system')?.content,
    ).toContain('Respond in the same language');
    expect(ctx.request.messages.some((m: any) => m.images?.length > 0)).toBe(
      false,
    );
  });

  it('excludes referenced images from sessionMetadata when the model does not support vision', async () => {
    (ollamaModelsService.supportsCapability as any).mockResolvedValue(false);

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

import type { MultipartFile } from '@fastify/multipart';
import { Test, TestingModule } from '@nestjs/testing';
import { OllamaApiService } from '@triplef/ollama-api';
import type { FastifyReply } from 'fastify';
import { vi } from 'vitest';

import { ModelWarmupService } from '../../ollama/services/model-warmup.service.js';
import { NumCtxConfigService } from '../configs/numctx-config.service.js';
import { buildCatalogEtag } from '../helpers/catalog-etag.helper.js';
import type { DocumentManifest } from '../helpers/documents/document-manifest.helper.js';
import { DocumentConversionService } from '../services/document-conversion.service.js';
import { HarnessQueueService } from '../services/harness-queue.service.js';

import { HarnessController } from './harness.controller.js';
import { HarnessDocumentsController } from './harness-documents.controller.js';
import { HarnessModelsController } from './harness-models.controller.js';

describe('Harness controllers', () => {
  let controller: HarnessController;
  let documentsController: HarnessDocumentsController;
  let modelsController: HarnessModelsController;
  let queueService: HarnessQueueService;
  let documentConversionService: DocumentConversionService;
  let ollamaApiService: OllamaApiService;
  let modelWarmupService: ModelWarmupService;
  let reply: FastifyReply;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [
        HarnessController,
        HarnessDocumentsController,
        HarnessModelsController,
      ],
      providers: [
        {
          provide: HarnessQueueService,
          useValue: {
            toFilePayloads: vi.fn().mockResolvedValue([]),
            emit: vi.fn(),
            cancel: vi.fn().mockResolvedValue(true),
          },
        },
        {
          provide: DocumentConversionService,
          useValue: {
            convertAndPersist: vi.fn().mockResolvedValue(null),
            indexManifest: vi.fn(),
          },
        },
        {
          provide: OllamaApiService,
          useValue: {
            getModels: vi.fn().mockResolvedValue({ models: [] }),
          },
        },
        {
          provide: ModelWarmupService,
          useValue: {
            warm: vi.fn(),
          },
        },
        {
          provide: NumCtxConfigService,
          useValue: { config: { options: [1024, 2048] } },
        },
      ],
    }).compile();

    controller = module.get<HarnessController>(HarnessController);
    documentsController = module.get<HarnessDocumentsController>(
      HarnessDocumentsController,
    );
    modelsController = module.get<HarnessModelsController>(
      HarnessModelsController,
    );
    queueService = module.get<HarnessQueueService>(HarnessQueueService);
    documentConversionService = module.get<DocumentConversionService>(
      DocumentConversionService,
    );
    ollamaApiService = module.get<OllamaApiService>(OllamaApiService);
    modelWarmupService = module.get<ModelWarmupService>(ModelWarmupService);
    reply = {
      header: vi.fn().mockReturnThis(),
      status: vi.fn().mockReturnThis(),
      send: vi.fn().mockReturnThis(),
    } as unknown as FastifyReply;
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('queues a harness job', async () => {
    await controller.harnessStream(
      'model',
      {
        requestId: 'req-1',
        stream: false,
        event: 'harness',
        think: 'medium',
        pproc_enabled: false,
      } as any,
      { value: 'describe' } as any,
    );

    expect(queueService.toFilePayloads).toHaveBeenCalledWith([], undefined);
    expect(queueService.emit).toHaveBeenCalled();
  });

  it('cancels a job', async () => {
    const result = await controller.cancelJob({ requestId: 'req-1' } as any);
    expect(result.success).toBe(true);
    expect(queueService.cancel).toHaveBeenCalledWith('req-1');
  });

  it('returns an empty document result without uploads', async () => {
    await expect(
      documentsController.convertDocuments({}, [], undefined),
    ).resolves.toEqual({ documents: [] });
    expect(queueService.toFilePayloads).not.toHaveBeenCalled();
    expect(documentConversionService.convertAndPersist).not.toHaveBeenCalled();
  });

  it('converts, indexes, and maps uploaded pdf pages', async () => {
    const originals = [{} as MultipartFile];
    const hashes = ['provided-hash'];
    const meta = {
      name: 'report.pdf',
      hash: 'document-hash',
      type: 'application/pdf',
    };
    const buffer = Buffer.from('pdf');
    const manifest: DocumentManifest = {
      kind: 'pdf',
      name: meta.name,
      pageHashes: ['page-hash-1', 'page-hash-2'],
      text: 'Document text',
    };
    vi.mocked(queueService.toFilePayloads).mockResolvedValue([
      { buffer, meta },
    ]);
    vi.mocked(documentConversionService.convertAndPersist).mockResolvedValue(
      manifest,
    );

    const result = await documentsController.convertDocuments(
      { sessionId: 'session-1', conversationId: 'conversation-1' },
      originals,
      hashes,
    );

    expect(queueService.toFilePayloads).toHaveBeenCalledWith(
      originals,
      hashes,
      false,
    );
    expect(documentConversionService.convertAndPersist).toHaveBeenCalledWith(
      'session-1',
      'conversation-1',
      expect.any(String),
      meta,
      buffer,
    );
    expect(documentConversionService.indexManifest).toHaveBeenCalledWith(
      'session-1',
      'conversation-1',
      meta,
      manifest,
    );
    expect(result).toEqual({
      documents: [
        {
          ...meta,
          kind: 'pdf',
          pageImages: [
            {
              name: 'report.pdf · page 1',
              hash: 'page-hash-1',
              page: 1,
            },
            {
              name: 'report.pdf · page 2',
              hash: 'page-hash-2',
              page: 2,
            },
          ],
        },
      ],
    });
  });

  it('starts model warmup without waiting for completion', async () => {
    await expect(
      modelsController.warmModel({ model: 'qwen3' }),
    ).resolves.toEqual({ success: true, model: 'qwen3' });
    expect(modelWarmupService.warm).toHaveBeenCalledWith('qwen3');
  });

  it('returns the model catalog with context options and an etag', async () => {
    vi.mocked(ollamaApiService.getModels).mockResolvedValue({ models: [] });
    const payload = {
      models: [],
      numCtxOptions: { options: [1024, 2048] },
    };
    const etag = buildCatalogEtag(payload);

    await modelsController.getModels(undefined, reply);

    expect(reply.header).toHaveBeenCalledWith('ETag', etag);
    expect(reply.status).not.toHaveBeenCalled();
    expect(reply.send).toHaveBeenCalledWith(payload);
  });

  it('returns 304 when the model catalog etag matches', async () => {
    vi.mocked(ollamaApiService.getModels).mockResolvedValue({ models: [] });
    const etag = buildCatalogEtag({
      models: [],
      numCtxOptions: { options: [1024, 2048] },
    });

    await modelsController.getModels(etag, reply);

    expect(reply.header).toHaveBeenCalledWith('ETag', etag);
    expect(reply.status).toHaveBeenCalledWith(304);
    expect(reply.send).toHaveBeenCalledWith();
  });
});

import { Inject, Injectable, Logger } from '@nestjs/common';
import { Job } from 'bullmq';

import { OllamaConfigService } from '../../../configs/ollama-config.service.js';
import { OllamaModelsService } from '../../ai-sdk/services/ollama-models.service.js';
import { MinioService } from '../../minio/services/minio.service.js';
import { HarnessJobPayload } from '../dtos/harness-job.dto.js';
import {
  buildChatRequest,
  buildVisionExclusionNotice,
  stripImagesFromMessages,
} from '../helpers/harness.helpers.js';

import { HarnessContext, StepId, StepState } from './harness-context.type.js';

@Injectable()
export class HarnessContextService {
  private readonly logger = new Logger(HarnessContextService.name);

  constructor(
    @Inject(MinioService)
    private readonly minioService: MinioService,
    @Inject(OllamaConfigService)
    private readonly ollamaConfigService: OllamaConfigService,
    @Inject(OllamaModelsService)
    private readonly ollamaModelsService: OllamaModelsService,
  ) {}

  async buildContext(job: Job<HarnessJobPayload>): Promise<HarnessContext> {
    const { filters } = job.data;
    const requestId = job.name;
    const sessionId = filters.sessionId;
    const { meta } = job.data;

    const sessionMetadata = this.parseSessionMetadata(filters.sessionMetadata);
    const referencedMeta = sessionMetadata?.images ?? [];
    const hasNewImages = (filters.hasNewImages ?? false) && meta.length > 0;

    this.validateInput(meta);

    this.logger.log('[HARNESS] resolve images', {
      requestId,
      sessionId,
      hasNewImages,
      newImageCount: meta.length,
      referencedImageCount: referencedMeta.length,
      referencedHashes: referencedMeta.map((entry) => entry.hash),
    });

    const allMeta = this.mergeMeta(referencedMeta, meta);
    const hasImages = allMeta.length > 0;

    let buffers: Buffer[] = [];
    let visionExcluded = false;
    let effectiveMeta = allMeta;

    if (hasImages) {
      const supportsVision = await this.ollamaModelsService.supportsCapability(
        filters.model!,
        'vision',
      );

      if (supportsVision) {
        buffers = await this.minioService.downloadBuffers(
          sessionId,
          filters.conversationId,
          allMeta,
        );
      } else {
        visionExcluded = true;
        effectiveMeta = [];
        this.logger.log(
          '[HARNESS] model does not support vision; excluding images',
          {
            requestId,
            sessionId,
            model: filters.model,
            excludedImageCount: allMeta.length,
            excludedHashes: allMeta.map((entry) => entry.hash),
          },
        );
      }
    }

    const notice = visionExcluded
      ? buildVisionExclusionNotice(filters.model!, allMeta)
      : undefined;

    this.logger.log('[HARNESS] provide to llm', {
      requestId,
      sessionId,
      totalImageCount: allMeta.length,
      providedImageCount: effectiveMeta.length,
      providedHashes: effectiveMeta.map((entry) => entry.hash),
      bufferCount: buffers.length,
      visionExcluded,
    });

    const request = buildChatRequest(
      buffers,
      '',
      filters,
      this.ollamaConfigService.config.keepAlive,
      undefined,
      notice,
    );

    if (visionExcluded) {
      request.messages = stripImagesFromMessages(request.messages);
    }

    const lastUserPrompt = filters.prompt
      ?.filter((p) => p.role === 'user')
      ?.at(-1)?.content;

    const steps = new Map<StepId, StepState>([
      ['interpret', { status: 'idle' }],
      ['execute', { status: 'idle' }],
      ['respond', { status: 'idle' }],
    ]);

    return {
      requestId,
      sessionId,
      job,
      filters,
      model: request.model,
      request,
      processedMeta: effectiveMeta,
      buffers,
      roomId: filters.roomId,
      event: filters.event,
      stream: filters.stream ?? false,
      hasNewImages: hasNewImages && !visionExcluded,
      visionExcluded,
      lastUserPrompt,
      abortSignal: new AbortController().signal,
      steps,
      outputs: {
        toolResults: [],
      },
      done: false,
    };
  }

  private validateInput(meta: unknown): void {
    if (!Array.isArray(meta)) throw new Error('Invalid meta');
  }

  private parseSessionMetadata(
    raw?: string,
  ): { images?: Array<{ name: string; hash: string }> } | undefined {
    if (!raw) return undefined;
    try {
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed.images)) return { images: [] };
      return {
        images: parsed.images.filter(
          (img: any): img is { name: string; hash: string } =>
            typeof img.name === 'string' && typeof img.hash === 'string',
        ),
      };
    } catch {
      return undefined;
    }
  }

  private mergeMeta(
    referenced: Array<{ name: string; hash: string }>,
    incoming: HarnessJobPayload['meta'],
  ): HarnessJobPayload['meta'] {
    const seen = new Set<string>();
    const result: HarnessJobPayload['meta'] = [];

    for (const entry of referenced) {
      if (seen.has(entry.hash)) continue;
      seen.add(entry.hash);
      result.push({ name: entry.name, type: 'image/*', hash: entry.hash });
    }

    for (const entry of incoming) {
      if (seen.has(entry.hash)) continue;
      seen.add(entry.hash);
      result.push(entry);
    }

    return result;
  }
}

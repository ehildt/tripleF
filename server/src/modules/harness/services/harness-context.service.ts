import { Inject, Injectable } from '@nestjs/common';
import { Job } from 'bullmq';

import { OllamaConfigService } from '../../ai-sdk/configs/ollama-config.service.js';
import { OllamaModelsService } from '../../ai-sdk/services/ollama-models.service.js';
import { MinioService } from '../../minio/services/minio.service.js';
import { SharpService } from '../../sharp/services/sharp.service.js';
import { HarnessJobPayload } from '../dtos/harness-job.dto.js';
import { buildChatRequest } from '../helpers/build-chat-request.helper.js';
import { buildImageFingerprint } from '../helpers/build-image-fingerprint.helper.js';
import { buildVisionExclusionNotice } from '../helpers/build-vision-exclusion-notice.helper.js';
import { parseSessionMetadata } from '../helpers/parse-session-metadata.helper.js';
import { stripImagesFromMessages } from '../helpers/strip-images-from-messages.helper.js';

import { HarnessContext, StepId, StepState } from './harness-context.type.js';
import { HarnessStepLogger } from './harness-step-logger.service.js';

@Injectable()
export class HarnessContextService {
  constructor(
    @Inject(MinioService)
    private readonly minioService: MinioService,
    @Inject(OllamaConfigService)
    private readonly ollamaConfigService: OllamaConfigService,
    @Inject(OllamaModelsService)
    private readonly ollamaModelsService: OllamaModelsService,
    @Inject(SharpService)
    private readonly sharpService: SharpService,
    private readonly stepLogger: HarnessStepLogger,
  ) {}

  async buildContext(job: Job<HarnessJobPayload>): Promise<HarnessContext> {
    const { filters } = job.data;
    const requestId = job.name;
    const sessionId = filters.sessionId;
    const { meta } = job.data;

    const sessionMetadata = parseSessionMetadata(filters.sessionMetadata);
    const referencedMeta = sessionMetadata?.images ?? [];
    const hasNewImages = (filters.hasNewImages ?? false) && meta.length > 0;

    this.validateInput(meta);

    this.stepLogger.log({ requestId }, 'context', 'resolve images', {
      sessionId,
      hasNewImages,
      newImageCount: meta.length,
      referencedImageCount: referencedMeta.length,
      referencedHashes: referencedMeta.map((entry) => entry.hash),
    });

    let allMeta = this.mergeMeta(referencedMeta, meta);
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
        const download = await this.minioService.downloadBuffers(
          sessionId,
          filters.conversationId,
          allMeta,
        );
        buffers = download.buffers;
        allMeta = download.keptMeta;

        effectiveMeta = await this.fingerprintMeta(buffers, allMeta);
      } else {
        visionExcluded = true;
        effectiveMeta = [];
        this.stepLogger.log(
          { requestId },
          'context',
          'model does not support vision; excluding images',
          {
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

    this.stepLogger.log({ requestId }, 'context', 'provide to llm', {
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
      ['sanitize', { status: 'idle' }],
      ['respond', { status: 'idle' }],
    ]);

    return {
      requestId,
      sessionId,
      job,
      // Preprocessing resolves from the live server-side config at execution
      // time: the next query — fresh or requeued — always uses the latest
      // SysCtl settings, never whatever the client sent.
      filters: {
        ...filters,
        preprocessing: this.sharpService.buildOptions(),
      },
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

  private async fingerprintMeta(
    buffers: Buffer[],
    meta: HarnessJobPayload['meta'],
  ): Promise<HarnessJobPayload['meta']> {
    const results: HarnessJobPayload['meta'] = [];

    for (let i = 0; i < buffers.length; i++) {
      const entry = meta[i];
      if (!entry) continue;

      try {
        const fingerprint = await buildImageFingerprint(buffers[i]);
        results.push({
          ...entry,
          fingerprint,
          source: entry.source ?? 'local',
        });
      } catch {
        results.push({ ...entry, source: entry.source ?? 'local' });
      }
    }

    return results;
  }

  private mergeMeta(
    referenced: Array<{ name: string; hash: string; source?: string }>,
    incoming: HarnessJobPayload['meta'],
  ): HarnessJobPayload['meta'] {
    const seen = new Set<string>();
    const result: HarnessJobPayload['meta'] = [];

    for (const entry of referenced) {
      if (seen.has(entry.hash)) continue;
      seen.add(entry.hash);
      result.push({
        name: entry.name,
        type: 'image/*',
        hash: entry.hash,
        source:
          entry.source === 'cloud' ? ('cloud' as const) : ('local' as const),
      });
    }

    for (const entry of incoming) {
      if (seen.has(entry.hash)) continue;
      seen.add(entry.hash);
      result.push(entry);
    }

    return result;
  }
}

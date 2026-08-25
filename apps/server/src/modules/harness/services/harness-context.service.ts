import { Injectable, Logger } from '@nestjs/common';
import { Job } from 'bullmq';

import { OllamaConfigService } from '../../ai-sdk/configs/ollama-config.service.js';
import { OllamaModelsService } from '../../ai-sdk/services/ollama-models.service.js';
import { MinioService } from '../../minio/services/minio.service.js';
import { SharpService } from '../../sharp/services/sharp.service.js';
import { HarnessJobPayload } from '../dtos/harness-job.dto.js';
import { buildChatRequest } from '../helpers/build-chat-request.helper.js';
import { buildVisionExclusionNotice } from '../helpers/build-vision-exclusion-notice.helper.js';
import type { DocumentSection } from '../helpers/documents/document-section.types.js';
import { parseSessionMetadata } from '../helpers/json/parse-session-metadata.helper.js';
import { buildImageFingerprint } from '../helpers/media/build-image-fingerprint.helper.js';
import { isImageContentType } from '../helpers/media-classification/is-image-content-type.helper.js';
import { stripImagesFromMessages } from '../helpers/sanitize/strip-images-from-messages.helper.js';

import { DocumentConversionService } from './document-conversion.service.js';
import { HarnessContext } from './harness-context.type.js';
import { StepRegistryService } from './step-registry.service.js';

@Injectable()
export class HarnessContextService {
  private readonly logger = new Logger(HarnessContextService.name);

  constructor(
    private readonly documentConversionService: DocumentConversionService,
    private readonly minioService: MinioService,
    private readonly ollamaConfigService: OllamaConfigService,
    private readonly ollamaModelsService: OllamaModelsService,
    private readonly sharpService: SharpService,
    private readonly stepRegistryService: StepRegistryService,
  ) {}

  async buildContext(job: Job<HarnessJobPayload>): Promise<HarnessContext> {
    const { filters } = job.data;
    const requestId = job.name;
    const sessionId = filters.sessionId;
    const memoryPartition = filters.memoryPartition;
    const memoryCognition = filters.memoryCognition;
    const { meta } = job.data;

    const sessionMetadata = parseSessionMetadata(filters.sessionMetadata);
    const referencedMeta = sessionMetadata?.images ?? [];
    const referencedOriginals = sessionMetadata?.originals ?? [];
    const hasNewImages = (filters.hasNewImages ?? false) && meta.length > 0;

    this.validateInput(meta);

    this.logger.log(
      {
        requestId,
        step: 'context',
        sessionId,
        hasNewImages,
        newImageCount: meta.length,
        referencedImageCount: referencedMeta.length,
        referencedHashes: referencedMeta.map((entry) => entry.hash),
      },
      'resolve images',
    );

    const allMeta = this.mergeMeta(referencedMeta, meta);
    // Uploaded images and document originals both travel as meta entries;
    // originals are converted here (pdf → page images, docx/pptx/text →
    // extracted text in MinIO manifests) so their derived content can reach
    // the model: page images ride the image pipeline, text sections are
    // injected into the prompt (text needs no vision capability; pdf pages
    // are vision-gated together with the images below).
    const imageUploadMeta = allMeta.filter((entry) =>
      isImageContentType(entry.type),
    );
    const documentUploadMeta = allMeta.filter(
      (entry) => !isImageContentType(entry.type),
    );
    const documentMeta = this.mergeDocuments(
      referencedOriginals,
      documentUploadMeta,
    );

    const resolvedDocuments =
      await this.documentConversionService.resolveOriginals(
        sessionId,
        filters.conversationId,
        requestId,
        documentMeta,
      );
    // Page images already ride in as referenced images (client registers
    // them at select time) — never attach the same page twice.
    const attachedPageHashes = new Set(
      imageUploadMeta.map((entry) => entry.hash),
    );
    const newPageImageMeta = resolvedDocuments.pageImageMeta.filter(
      (entry) => !attachedPageHashes.has(entry.hash),
    );
    const imageMeta = [...imageUploadMeta, ...newPageImageMeta];
    const hasImages = imageMeta.length > 0;

    // Every file of this turn (attachments, referenced images, page images,
    // document originals) rides the embedding payload by storage url so
    // recalled memory points can reference their files.
    const files = [
      ...imageMeta.map((entry) => ({
        name: entry.name,
        url: this.minioService.buildFileUrl(
          sessionId,
          filters.conversationId,
          entry.hash,
        ),
      })),
      ...documentMeta.map((entry) => ({
        name: entry.name,
        url: this.minioService.buildFileUrl(
          sessionId,
          filters.conversationId,
          entry.hash,
        ),
      })),
    ];

    let buffers: Buffer[] = [];
    let visionExcluded = false;
    let effectiveMeta = imageMeta;

    if (hasImages) {
      const supportsVision = await this.ollamaModelsService.supportsCapability(
        filters.model!,
        'vision',
      );

      if (supportsVision) {
        const download = await this.minioService.downloadBuffers(
          sessionId,
          filters.conversationId,
          imageMeta,
        );
        buffers = download.buffers;

        effectiveMeta = await this.fingerprintMeta(buffers, download.keptMeta);
      } else {
        visionExcluded = true;
        effectiveMeta = [];
        this.logger.log(
          {
            requestId,
            step: 'context',
            sessionId,
            model: filters.model,
            excludedImageCount: imageMeta.length,
            excludedHashes: imageMeta.map((entry) => entry.hash),
          },
          'model does not support vision; excluding images',
        );
      }
    }

    const notice = visionExcluded
      ? buildVisionExclusionNotice(filters.model!, imageMeta)
      : undefined;

    this.logger.log(
      {
        requestId,
        step: 'context',
        sessionId,
        totalImageCount: allMeta.length,
        providedImageCount: effectiveMeta.length,
        providedHashes: effectiveMeta.map((entry) => entry.hash),
        bufferCount: buffers.length,
        visionExcluded,
      },
      'provide to llm',
    );

    const request = buildChatRequest(
      buffers,
      '',
      filters,
      this.ollamaConfigService.config.keepAlive,
      undefined,
      notice,
      this.truncateDocumentSections(
        resolvedDocuments.textSections,
        filters.documentTextLimit,
      ),
    );

    if (visionExcluded) {
      request.messages = stripImagesFromMessages(request.messages);
    }

    const lastUserPrompt = filters.prompt
      ?.filter((p) => p.role === 'user')
      ?.at(-1)?.content;

    // Seed every registered step as idle — derived from the registry so a new
    // step (e.g. vectorize) is picked up automatically instead of being
    // silently invisible to the engine.
    const stepsMap: HarnessContext['steps'] = new Map();
    for (const id of this.stepRegistryService.registry.keys()) {
      stepsMap.set(id, { status: 'idle' });
    }

    return {
      requestId,
      sessionId,
      memoryPartition,
      memoryCognition,
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
      files,
      documentSections: resolvedDocuments.textSections,
      roomId: filters.roomId,
      event: filters.event,
      stream: filters.stream ?? false,
      hasNewImages: hasNewImages && !visionExcluded,
      visionExcluded,
      lastUserPrompt,
      abortSignal: new AbortController().signal,
      steps: stepsMap,
      outputs: {
        toolResults: [],
      },
      done: false,
    };
  }

  private validateInput(meta: unknown): void {
    if (!Array.isArray(meta)) throw new Error('Invalid meta');
  }

  /**
   * Merge originals referenced from earlier turns with the freshly uploaded
   * ones (incoming entries win — they carry the true content type).
   */
  private mergeDocuments(
    referencedDocuments: Array<{ name: string; hash: string; type?: string }>,
    incoming: HarnessJobPayload['meta'],
  ): HarnessJobPayload['meta'] {
    const seen = new Set(incoming.map((entry) => entry.hash));
    const merged = referencedDocuments
      .filter((entry) => !seen.has(entry.hash))
      .map((entry) => ({
        name: entry.name,
        type: entry.type ?? '',
        hash: entry.hash,
        size: 0,
      }));
    return [...merged, ...incoming];
  }

  /** Cap each document section's text at the client-configured limit. */
  private truncateDocumentSections(
    sections: DocumentSection[],
    limit: number | undefined,
  ): DocumentSection[] {
    if (limit === undefined || limit <= 0) return sections;
    return sections.map((section) => ({
      ...section,
      text:
        section.text.length > limit
          ? section.text.slice(0, limit)
          : section.text,
    }));
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

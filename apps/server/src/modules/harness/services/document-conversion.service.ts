import { Injectable, Logger } from '@nestjs/common';

import { MinioService } from '../../minio/services/minio.service.js';
import type { FastifyMultipartMeta } from '../dtos/harness-job.dto.js';
import {
  classifyDocumentKind,
  type DocumentKind,
} from '../helpers/documents/classify-document-kind.helper.js';
import { convertDocx } from '../helpers/documents/convert-docx.helper.js';
import { convertPdfToPageImages } from '../helpers/documents/convert-pdf-pages.helper.js';
import type { DocumentManifest } from '../helpers/documents/document-manifest.helper.js';
import {
  buildManifestHash,
  buildManifestJson,
  parseManifestJson,
} from '../helpers/documents/document-manifest.helper.js';
import type { DocumentSection } from '../helpers/documents/document-section.types.js';
import { extractTextFromPdfBuffer } from '../helpers/documents/extract-text-from-pdf-buffer.helper.js';
import { extractTextFromPptxBuffer } from '../helpers/documents/extract-text-from-pptx-buffer.helper.js';

import { mapPageMeta } from './helpers/map-page-meta.helper.js';
import { shouldSynthesizePages } from './helpers/should-synthesize-pages.helper.js';

const MANIFEST_CONTENT_TYPE = 'application/json';

/**
 * Owns document-original conversion: for every original referenced by a
 * harness job it ensures a conversion manifest (pdf → page JPEGs + text
 * layer, docx → html + text, pptx → slide text, everything else → text)
 * exists in MinIO, uploads the derived page images, and returns what the
 * LLM request needs — page-image metadata that rides the regular image
 * pipeline plus the model-facing text sections for prompt injection and
 * encyclopedia indexing.
 */
@Injectable()
export class DocumentConversionService {
  private readonly logger = new Logger(DocumentConversionService.name);

  constructor(private readonly minioService: MinioService) {}

  /**
   * Resolve every original of the conversation — new uploads and referenced
   * ones from earlier turns alike — into model content. Existing manifests
   * are reused; missing ones are converted from the stored original bytes.
   * Returns one page-image meta entry per rendered PDF page (they ride the
   * regular image pipeline) and one text section per text-bearing document.
   *
   * Page synthesis follows the client's selection: when the client already
   * references at least one page of a pdf original, its page selection is
   * authoritative and no additional pages are synthesized (dropped pages
   * stay dropped). Only originals with no referenced pages at all fall back
   * to emitting every page.
   */
  async resolveOriginals(
    sessionId: string | undefined,
    conversationId: string | undefined,
    requestId: string,
    originals: FastifyMultipartMeta[],
    referencedImageHashes: ReadonlySet<string>,
  ): Promise<{
    pageImageMeta: FastifyMultipartMeta[];
    textSections: DocumentSection[];
  }> {
    if (originals.length === 0) {
      return { pageImageMeta: [], textSections: [] };
    }

    const pageImageMeta: FastifyMultipartMeta[] = [];
    const textSections: DocumentSection[] = [];

    for (const entry of originals) {
      try {
        const manifest = await this.resolveOriginal(
          sessionId,
          conversationId,
          requestId,
          entry,
        );
        if (!manifest) continue;

        pageImageMeta.push(
          ...this.toPageImageMeta(manifest, entry, referencedImageHashes),
        );
        // Any kind with a text layer — pdf included — yields a text section:
        // the prompt injection AND the encyclopedia index both build on it.
        if (manifest.text.trim()) {
          textSections.push(
            this.toTextSection(sessionId, conversationId, entry, manifest.text),
          );
        }
      } catch (error) {
        this.logger.warn(
          {
            requestId,
            step: 'documents',
            hash: entry.hash,
            name: entry.name,
            error: error instanceof Error ? error.message : String(error),
          },
          'document conversion failed; skipping original',
        );
      }
    }

    return { pageImageMeta, textSections };
  }

  /** Rendered pdf page images as image meta — empty when the client's page
   *  selection is authoritative or the original isn't a pdf. */
  private toPageImageMeta(
    manifest: DocumentManifest,
    entry: FastifyMultipartMeta,
    referencedImageHashes: ReadonlySet<string>,
  ): FastifyMultipartMeta[] {
    if (manifest.kind !== 'pdf') return [];
    if (!shouldSynthesizePages(manifest.pageHashes, referencedImageHashes))
      return [];
    return manifest.pageHashes.map((pageHash, index) => ({
      name: `${entry.name} · page ${index + 1}`,
      type: 'image/jpeg',
      hash: pageHash,
      size: 0,
    }));
  }

  /** One original's model-facing text section (prompt + encyclopedia index). */
  private toTextSection(
    sessionId: string | undefined,
    conversationId: string | undefined,
    entry: FastifyMultipartMeta,
    text: string,
  ): DocumentSection {
    return {
      name: entry.name,
      text,
      url: this.minioService.buildFileUrl(
        sessionId,
        conversationId,
        entry.hash,
      ),
      mimeType: entry.type,
      sizeBytes: entry.size,
      originalHash: entry.hash,
    };
  }

  /**
   * Load an original's manifest, converting and persisting it (plus the
   * derived page images) when none exists yet. Returns null when the
   * original cannot be downloaded.
   */
  private async resolveOriginal(
    sessionId: string | undefined,
    conversationId: string | undefined,
    requestId: string,
    entry: FastifyMultipartMeta,
  ): Promise<DocumentManifest | null> {
    const download = await this.minioService.downloadBuffers(
      sessionId,
      conversationId,
      [entry],
    );
    if (download.buffers.length === 0) return null;

    return this.convertAndPersist(
      sessionId,
      conversationId,
      requestId,
      entry,
      download.buffers[0],
    );
  }

  /**
   * Convert and persist one original: store its derived page images and the
   * conversion manifest in MinIO and return the manifest (reusing an
   * existing one when already present). Exposed for the select-time
   * document endpoint, which holds the bytes already — no download needed.
   */
  async convertAndPersist(
    sessionId: string | undefined,
    conversationId: string | undefined,
    requestId: string,
    entry: FastifyMultipartMeta,
    buffer: Buffer,
  ): Promise<DocumentManifest | null> {
    const existing = await this.minioService.downloadBuffer(
      sessionId,
      conversationId,
      buildManifestHash(entry.hash),
    );
    if (existing) {
      const manifest = parseManifestJson(existing);
      // Heal legacy pdf manifests: they predate text-layer extraction, so
      // backfill the text, re-persist, and return the completed manifest.
      if (manifest?.kind === 'pdf' && !manifest.text.trim()) {
        const healed = await this.extractPdfText(requestId, entry.name, buffer);
        if (healed) {
          const healedManifest = { ...manifest, text: healed };
          await this.persistManifest(
            sessionId,
            conversationId,
            requestId,
            entry,
            healedManifest,
          );
          return healedManifest;
        }
      }
      if (manifest) return manifest;
    }

    const kind = classifyDocumentKind(entry.type, entry.name);
    const manifest = await this.buildManifest(
      kind,
      entry.name,
      buffer,
      requestId,
    );

    if (manifest.pageBuffers.length > 0) {
      await this.minioService.uploadBuffers(
        sessionId,
        conversationId,
        requestId,
        manifest.pageBuffers.map((page) => page.buffer),
        manifest.pageBuffers.map((page) => mapPageMeta(page, entry.name)),
      );
    }

    await this.persistManifest(
      sessionId,
      conversationId,
      requestId,
      entry,
      manifest.json,
    );

    return manifest.json;
  }

  /** Persist one conversion manifest under the original's hash. */
  private async persistManifest(
    sessionId: string | undefined,
    conversationId: string | undefined,
    requestId: string,
    entry: FastifyMultipartMeta,
    manifest: DocumentManifest,
  ): Promise<void> {
    const manifestJson = buildManifestJson(manifest);
    await this.minioService.uploadBuffers(
      sessionId,
      conversationId,
      requestId,
      [manifestJson],
      [
        {
          name: `${entry.name} conversion manifest`,
          type: MANIFEST_CONTENT_TYPE,
          hash: buildManifestHash(entry.hash),
          size: manifestJson.length,
        },
      ],
    );
  }

  /**
   * Extract a pdf original's text layer, degrading to '' on failure — a
   * text-extraction hiccup must never kill the page-image conversion that
   * already works for it.
   */
  private async extractPdfText(
    requestId: string,
    name: string,
    buffer: Buffer,
  ): Promise<string> {
    try {
      return await extractTextFromPdfBuffer(buffer);
    } catch (error) {
      this.logger.warn(
        {
          requestId,
          step: 'documents',
          name,
          error: error instanceof Error ? error.message : String(error),
        },
        'pdf text-layer extraction failed; pages only',
      );
      return '';
    }
  }

  /** Convert one original buffer into its manifest and derived artifacts. */
  private async buildManifest(
    kind: DocumentKind,
    name: string,
    buffer: Buffer,
    requestId: string,
  ): Promise<{
    json: DocumentManifest;
    pageBuffers: Array<{ buffer: Buffer; hash: string; page: number }>;
  }> {
    if (kind === 'pdf') {
      const pages = await convertPdfToPageImages(buffer);
      return {
        json: {
          kind,
          name,
          pageHashes: pages.map((page) => page.hash),
          text: await this.extractPdfText(requestId, name, buffer),
        },
        pageBuffers: pages,
      };
    }

    if (kind === 'docx') {
      const { html, text } = await convertDocx(buffer);
      return {
        json: { kind, name, pageHashes: [], text, html },
        pageBuffers: [],
      };
    }

    if (kind === 'pptx') {
      const text = await extractTextFromPptxBuffer(buffer);
      return {
        json: { kind, name, pageHashes: [], text, slides: text.split('\n\n') },
        pageBuffers: [],
      };
    }

    return {
      json: { kind, name, pageHashes: [], text: buffer.toString('utf-8') },
      pageBuffers: [],
    };
  }
}

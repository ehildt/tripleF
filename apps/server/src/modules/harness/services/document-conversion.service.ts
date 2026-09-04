import { Injectable, Logger } from '@nestjs/common';
import { PdfService } from '@triplef/pdf';

import { MemoryClientService } from '../../memory-client/services/memory-client.service.js';
import { MinioService } from '../../minio/services/minio.service.js';
import type { FastifyMultipartMeta } from '../dtos/harness-job.dto.js';
import {
  classifyDocumentKind,
  type DocumentKind,
} from '../helpers/documents/classify-document-kind.helper.js';
import { composeEncyclopediaContent } from '../helpers/documents/compose-encyclopedia-content.helper.js';
import { convertDocx } from '../helpers/documents/convert-docx.helper.js';
import type { DocumentManifest } from '../helpers/documents/document-manifest.helper.js';
import {
  buildManifestHash,
  buildManifestJson,
  parseManifestJson,
} from '../helpers/documents/document-manifest.helper.js';
import type { DocumentSection } from '../helpers/documents/document-section.types.js';
import { extractTextFromPptxBuffer } from '../helpers/documents/extract-text-from-pptx-buffer.helper.js';
import type { EncodedPdfPage } from '../helpers/documents/re-encode-pdf-pages.helper.js';
import { reencodePdfPageImages } from '../helpers/documents/re-encode-pdf-pages.helper.js';

import { mapPageMeta } from './helpers/map-page-meta.helper.js';
import { resolveSelectedPageIndexes } from './helpers/resolve-selected-page-indexes.helper.js';
import { shouldSynthesizePages } from './helpers/should-synthesize-pages.helper.js';
import { mapDocumentSection } from './steps/helpers/map-document-section.helper.js';
import { PdfPageDescribeService } from './pdf-page-describe.service.js';

const MANIFEST_CONTENT_TYPE = 'application/json';

/** Vision context for one turn (attachments only exist under a vision model). */
interface ResolveOriginalsVision {
  /** Turn chat model — describes selected pdf pages that lack one. */
  model?: string;
  /** False when the turn's model lacks vision (pdf pages excluded this turn). */
  ready: boolean;
}

/**
 * Owns document-original conversion: for every original referenced by a
 * harness job it ensures a conversion manifest (pdf → page JPEGs + per-page
 * text layer, docx → html + text, pptx → slide text, everything else → text)
 * exists in MinIO, uploads the derived page images, and returns what the LLM
 * request needs — page-image metadata that rides the regular image pipeline
 * plus the model-facing text sections of non-pdf documents (prompt
 * injection); a pdf's text lives in the encyclopedia, not the prompt.
 *
 * Encyclopedia lifecycle: the select-time endpoint indexes the extracted
 * text at upload (indexManifest); at ask time the pages the client selected
 * get a one-time vision description (persisted into the manifest) and the
 * node is re-indexed with text + descriptions of what we know so far.
 */
@Injectable()
export class DocumentConversionService {
  private readonly logger = new Logger(DocumentConversionService.name);

  constructor(
    private readonly minioService: MinioService,
    private readonly pdfService: PdfService,
    private readonly describeService: PdfPageDescribeService,
    private readonly memoryClient: MemoryClientService,
  ) {}

  /**
   * Resolve every original of the conversation — new uploads and referenced
   * ones from earlier turns alike — into model content. Existing manifests
   * are reused; missing ones are converted from the stored original bytes.
   * Returns one page-image meta entry per rendered PDF page (they ride the
   * regular image pipeline; bootstrap fallback only) and one text section per
   * text-bearing non-pdf document.
   *
   * Side effects for pdfs: selected pages missing a description get described
   * once (vision turns only, persisted into the manifest) and the document's
   * encyclopedia node is re-indexed with everything we know about it.
   */
  async resolveOriginals(
    sessionId: string | undefined,
    conversationId: string | undefined,
    requestId: string,
    originals: FastifyMultipartMeta[],
    referencedImageHashes: ReadonlySet<string>,
    vision?: ResolveOriginalsVision,
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
        let manifest = await this.resolveOriginal(
          sessionId,
          conversationId,
          requestId,
          entry,
        );
        if (!manifest) continue;

        if (manifest.kind === 'pdf') {
          manifest = await this.processPdfPages(
            sessionId,
            conversationId,
            requestId,
            entry,
            manifest,
            referencedImageHashes,
            vision,
          );
          pageImageMeta.push(
            ...this.toPageImageMeta(manifest, entry, referencedImageHashes),
          );
          continue;
        }

        // Non-pdf kinds: the blob text is model-facing (prompt injection AND
        // encyclopedia index build on it).
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

  /**
   * Index one converted document's manifest into the memory encyclopedia —
   * the whole upload delegation: extracted text (plus known page
   * descriptions), the MinIO url (persist key + open link), and the
   * original's metadata. Fire-and-forget: idempotent on memory's side (same
   * content → same contentHash → reuse), an outage must never break a turn.
   */
  indexManifest(
    sessionId: string | undefined,
    conversationId: string | undefined,
    entry: FastifyMultipartMeta,
    manifest: DocumentManifest,
  ): void {
    const content = composeEncyclopediaContent(manifest);
    if (!content) return;

    void this.memoryClient
      .indexEncyclopediaDocuments({
        documents: [
          mapDocumentSection(
            this.toTextSection(sessionId, conversationId, entry, content),
          ),
        ],
        partitionScope: sessionId,
      })
      .catch((error: unknown) =>
        this.logger.warn(
          {
            step: 'documents',
            hash: entry.hash,
            name: entry.name,
            error: error instanceof Error ? error.message : String(error),
          },
          'encyclopedia delegation failed',
        ),
      );
  }

  /**
   * Process one pdf manifest for the current turn: describe the selected
   * pages that lack a description (vision turns only; persisted once per
   * page per document), then re-index the encyclopedia node with text +
   * descriptions. Returns the (possibly enriched) manifest.
   */
  private async processPdfPages(
    sessionId: string | undefined,
    conversationId: string | undefined,
    requestId: string,
    entry: FastifyMultipartMeta,
    manifest: DocumentManifest,
    referencedImageHashes: ReadonlySet<string>,
    vision?: ResolveOriginalsVision,
  ): Promise<DocumentManifest> {
    const selectedIndexes = resolveSelectedPageIndexes(
      manifest.pageHashes,
      referencedImageHashes,
    );
    if (!selectedIndexes.length) return manifest;

    const missing = selectedIndexes.filter(
      (index) => manifest.pageDescriptions?.[index] == null,
    );
    if (vision?.ready && vision.model && missing.length) {
      manifest = await this.describeMissingPages(
        sessionId,
        conversationId,
        requestId,
        entry,
        manifest,
        vision.model,
        missing,
      );
    }

    this.indexManifest(sessionId, conversationId, entry, manifest);
    return manifest;
  }

  /**
   * One describe round over the selected pdf pages that never got one.
   * Nothing is persisted when the describe fails — those pages are retried on
   * the next vision turn. A page whose bytes are gone from MinIO is skipped
   * for now (it stays undescribed).
   */
  private async describeMissingPages(
    sessionId: string | undefined,
    conversationId: string | undefined,
    requestId: string,
    entry: FastifyMultipartMeta,
    manifest: DocumentManifest,
    model: string,
    missingIndexes: number[],
  ): Promise<DocumentManifest> {
    const pages: Array<{ buffer: Buffer; pageNumber: number }> = [];
    for (const index of missingIndexes) {
      const buffer = await this.minioService.downloadBuffer(
        sessionId,
        conversationId,
        manifest.pageHashes[index],
      );
      if (buffer) pages.push({ buffer, pageNumber: index + 1 });
      else
        this.logger.warn(
          {
            requestId,
            step: 'documents',
            name: manifest.name,
            page: index + 1,
          },
          'page image missing; skipping description',
        );
    }
    if (!pages.length) return manifest;

    let descriptions: Map<number, string>;
    try {
      descriptions = await this.describeService.describePages({
        model,
        documentName: manifest.name,
        pageCount: manifest.pageHashes.length,
        pages,
      });
    } catch (error) {
      this.logger.warn(
        {
          requestId,
          step: 'documents',
          name: manifest.name,
          error: error instanceof Error ? error.message : String(error),
        },
        'pdf page description failed; retrying next turn',
      );
      return manifest;
    }
    if (!descriptions.size) return manifest;

    const pageDescriptions =
      manifest.pageDescriptions ??
      new Array<string | null>(manifest.pageHashes.length).fill(null);
    for (const [pageNumber, description] of descriptions) {
      pageDescriptions[pageNumber - 1] = description;
    }
    const enriched = { ...manifest, pageDescriptions };
    await this.persistManifest(
      sessionId,
      conversationId,
      requestId,
      entry,
      enriched,
    );
    return enriched;
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
      // Heal legacy pdf manifests: they predate per-page text-layer
      // extraction, so backfill pageTexts, re-persist, and return the
      // completed manifest.
      if (manifest?.kind === 'pdf' && !manifest.pageTexts) {
        const pageTexts = await this.extractPdfPageTexts(
          requestId,
          entry.name,
          buffer,
        );
        if (pageTexts) {
          const healedManifest = this.toHealedPdfManifest(manifest, pageTexts);
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

  /** A legacy pdf manifest completed with its per-page text layer. */
  private toHealedPdfManifest(
    manifest: DocumentManifest,
    pageTexts: string[],
  ): DocumentManifest {
    return {
      ...manifest,
      pageTexts,
      text: pageTexts.filter(Boolean).join('\n\n'),
    };
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
   * Extract a pdf original's per-page text layer, degrading to null on
   * failure — a text-extraction hiccup must never kill the page-image
   * conversion that already works for it, and a null result is retried on
   * the next reference instead of being frozen into the manifest.
   */
  private async extractPdfPageTexts(
    requestId: string,
    name: string,
    buffer: Buffer,
  ): Promise<string[] | null> {
    try {
      return await this.pdfService.extractText(buffer);
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
      return null;
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
    pageBuffers: EncodedPdfPage[];
  }> {
    if (kind === 'pdf') {
      const [pageBuffers, pageTexts] = await Promise.all([
        this.pdfService.renderPages(buffer).then(reencodePdfPageImages),
        this.extractPdfPageTexts(requestId, name, buffer),
      ]);
      return {
        json: {
          kind,
          name,
          pageHashes: pageBuffers.map((page) => page.hash),
          text: (pageTexts ?? []).filter(Boolean).join('\n\n'),
          // null (extraction failed) stays out of the manifest so the next
          // reference retries instead of treating the gap as healed.
          ...(pageTexts ? { pageTexts } : {}),
        },
        pageBuffers,
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

import { Test, TestingModule } from '@nestjs/testing';
import type { PdfPage } from '@triplef/pdf';
import { PdfService } from '@triplef/pdf';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { MemoryClientService } from '../../memory-client/services/memory-client.service.js';
import { MinioService } from '../../minio/services/minio.service.js';
import type { DocumentManifest } from '../helpers/documents/document-manifest.helper.js';
import { buildManifestJson } from '../helpers/documents/document-manifest.helper.js';
import { reencodePdfPageImages } from '../helpers/documents/re-encode-pdf-pages.helper.js';

import { DocumentConversionService } from './document-conversion.service.js';
import { PdfPageDescribeService } from './pdf-page-describe.service.js';

vi.mock('../helpers/documents/re-encode-pdf-pages.helper.js', () => ({
  reencodePdfPageImages: vi.fn(),
}));

function createMinioMock() {
  return {
    downloadBuffers: vi.fn(),
    downloadBuffer: vi.fn(),
    buildFileUrl: vi.fn(() => '/api/v1/storage/s/c/h'),
    uploadBuffers: vi.fn(),
  };
}

const pdfEntry = () => ({
  name: 'doc.pdf',
  type: 'application/pdf',
  hash: 'doc-hash',
  size: 0,
});

describe('DocumentConversionService', () => {
  let service: DocumentConversionService;
  let minioService: ReturnType<typeof createMinioMock>;
  let pdfService: {
    renderPages: ReturnType<typeof vi.fn>;
    extractText: ReturnType<typeof vi.fn>;
  };
  let describeService: { describePages: ReturnType<typeof vi.fn> };
  let memoryClient: { indexEncyclopediaDocuments: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    minioService = createMinioMock();
    pdfService = { renderPages: vi.fn(), extractText: vi.fn() };
    describeService = { describePages: vi.fn() };
    memoryClient = { indexEncyclopediaDocuments: vi.fn(async () => null) };
    pdfService.extractText.mockResolvedValue(['']);
    describeService.describePages.mockResolvedValue(new Map());
    vi.mocked(reencodePdfPageImages).mockImplementation(
      async (pages: PdfPage[]) =>
        pages.map((page) => ({
          buffer: page.buffer,
          hash: `page-hash-${page.pageNumber}`,
          page: page.pageNumber,
        })),
    );

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DocumentConversionService,
        { provide: MinioService, useValue: minioService },
        { provide: PdfService, useValue: pdfService },
        { provide: PdfPageDescribeService, useValue: describeService },
        { provide: MemoryClientService, useValue: memoryClient },
      ],
    }).compile();

    service = module.get<DocumentConversionService>(DocumentConversionService);
  });

  /** A pdf original whose manifest already exists (no re-render needed). */
  function seedPdfManifest(manifest: DocumentManifest) {
    minioService.downloadBuffers.mockResolvedValue({
      buffers: [Buffer.from('pdf-bytes')],
      keptMeta: [pdfEntry()],
    });
    // Manifest fetch (.conv hash) vs page-buffer fetch (page hashes).
    minioService.downloadBuffer.mockImplementation(
      (_s: string, _c: string, hash: string) =>
        hash.endsWith('.conv')
          ? buildManifestJson(manifest)
          : Buffer.from(`jpeg-${hash}`),
    );
  }

  /** The manifest JSON of the last manifest upload (meta hash ends .conv). */
  function lastManifestUpload(): DocumentManifest | null {
    const call = minioService.uploadBuffers.mock.calls.findLast((args) => {
      const meta = args[4]?.[0];
      return typeof meta?.hash === 'string' && meta.hash.endsWith('.conv');
    });
    if (!call) return null;
    return JSON.parse(call[3][0].toString('utf-8')) as DocumentManifest;
  }

  it('synthesizes every page when none are referenced (bootstrap fallback)', async () => {
    seedPdfManifest({
      kind: 'pdf',
      name: 'doc.pdf',
      pageHashes: ['p1', 'p2', 'p3'],
      text: 'full text',
      pageTexts: ['t1', 't2', 't3'],
    });

    const result = await service.resolveOriginals(
      'sess-1',
      'conv-1',
      'req-1',
      [pdfEntry()],
      new Set(['unrelated-hash']),
    );

    expect(result.pageImageMeta.map((m) => m.hash)).toEqual(['p1', 'p2', 'p3']);
    expect(result.textSections).toEqual([]);
  });

  it('synthesizes nothing when the client references at least one page', async () => {
    seedPdfManifest({
      kind: 'pdf',
      name: 'doc.pdf',
      pageHashes: ['p1', 'p2', 'p3'],
      text: '',
      pageTexts: ['', '', ''],
    });

    const result = await service.resolveOriginals(
      'sess-1',
      'conv-1',
      'req-1',
      [pdfEntry()],
      new Set(['p2']),
    );

    expect(result.pageImageMeta).toEqual([]);
  });

  it('injects no prompt section for a pdf — its text lives in the encyclopedia', async () => {
    seedPdfManifest({
      kind: 'pdf',
      name: 'doc.pdf',
      pageHashes: ['p1'],
      text: 'pdf text layer',
      pageTexts: ['pdf text layer'],
    });

    const result = await service.resolveOriginals(
      'sess-1',
      'conv-1',
      'req-1',
      [pdfEntry()],
      new Set(['p1']),
    );

    expect(result.textSections).toEqual([]);
  });

  it('emits text sections for non-pdf originals regardless of page selection', async () => {
    minioService.downloadBuffers.mockResolvedValue({
      buffers: [Buffer.from('docx-bytes')],
      keptMeta: [{ name: 'notes.docx', type: 'application/docx', hash: 'd1' }],
    });
    minioService.downloadBuffer.mockResolvedValue(
      buildManifestJson({
        kind: 'docx',
        name: 'notes.docx',
        pageHashes: [],
        text: 'extracted text',
      }),
    );

    const result = await service.resolveOriginals(
      'sess-1',
      'conv-1',
      'req-1',
      [{ name: 'notes.docx', type: 'application/docx', hash: 'd1', size: 0 }],
      new Set(['p1']),
    );

    expect(result.pageImageMeta).toEqual([]);
    expect(result.textSections).toEqual([
      {
        name: 'notes.docx',
        text: 'extracted text',
        url: '/api/v1/storage/s/c/h',
        mimeType: 'application/docx',
        sizeBytes: 0,
        originalHash: 'd1',
      },
    ]);
    // Non-pdf indexing rides the sanitize step; the turn path never doubles it.
    expect(memoryClient.indexEncyclopediaDocuments).not.toHaveBeenCalled();
  });

  it('describes only the selected pages on a vision turn, persists, enriches', async () => {
    seedPdfManifest({
      kind: 'pdf',
      name: 'doc.pdf',
      pageHashes: ['p1', 'p2', 'p3'],
      text: 't1 t2 t3',
      pageTexts: ['t1', 't2', 't3'],
    });
    describeService.describePages.mockResolvedValue(
      new Map([
        [1, 'd1'],
        [3, 'd3'],
      ]),
    );

    await service.resolveOriginals(
      'sess-1',
      'conv-1',
      'req-1',
      [pdfEntry()],
      new Set(['p1', 'p3']),
      { model: 'vision-model', ready: true },
    );

    // Only the selected, never-described pages (1 and 3) are described.
    expect(describeService.describePages).toHaveBeenCalledTimes(1);
    const call = describeService.describePages.mock.calls[0][0];
    expect(call.model).toBe('vision-model');
    expect(call.documentName).toBe('doc.pdf');
    expect(call.pageCount).toBe(3);
    expect(call.pages.map((p: { pageNumber: number }) => p.pageNumber)).toEqual(
      [1, 3],
    );

    // Sparse fill persisted into the manifest.
    const manifest = lastManifestUpload();
    expect(manifest?.pageDescriptions).toEqual(['d1', null, 'd3']);

    // Encyclopedia node: full text layer + known descriptions.
    expect(memoryClient.indexEncyclopediaDocuments).toHaveBeenCalledTimes(1);
    const indexed = memoryClient.indexEncyclopediaDocuments.mock.calls[0][0];
    expect(indexed.partitionScope).toBe('sess-1');
    expect(indexed.documents[0].content).toBe(
      ['t1', 'd1', 't2', 't3', 'd3'].join('\n\n'),
    );
    expect(indexed.documents[0].title).toBe('doc.pdf');
  });

  it('never describes on a non-vision turn but still ensures the node', async () => {
    seedPdfManifest({
      kind: 'pdf',
      name: 'doc.pdf',
      pageHashes: ['p1'],
      text: 't1',
      pageTexts: ['t1'],
    });

    await service.resolveOriginals(
      'sess-1',
      'conv-1',
      'req-1',
      [pdfEntry()],
      new Set(['p1']),
      { model: 'plain-model', ready: false },
    );

    expect(describeService.describePages).not.toHaveBeenCalled();
    expect(lastManifestUpload()).toBeNull();
    expect(memoryClient.indexEncyclopediaDocuments).toHaveBeenCalledTimes(1);
    expect(
      memoryClient.indexEncyclopediaDocuments.mock.calls[0][0].documents[0]
        .content,
    ).toBe('t1');
  });

  it('never re-describes pages that already have a description', async () => {
    seedPdfManifest({
      kind: 'pdf',
      name: 'doc.pdf',
      pageHashes: ['p1'],
      text: 't1',
      pageTexts: ['t1'],
      pageDescriptions: ['already described'],
    });

    await service.resolveOriginals(
      'sess-1',
      'conv-1',
      'req-1',
      [pdfEntry()],
      new Set(['p1']),
      { model: 'vision-model', ready: true },
    );

    expect(describeService.describePages).not.toHaveBeenCalled();
    expect(lastManifestUpload()).toBeNull();
    expect(
      memoryClient.indexEncyclopediaDocuments.mock.calls[0][0].documents[0]
        .content,
    ).toBe(['t1', 'already described'].join('\n\n'));
  });

  it('leaves the manifest untouched when the describe call fails', async () => {
    seedPdfManifest({
      kind: 'pdf',
      name: 'doc.pdf',
      pageHashes: ['p1'],
      text: 't1',
      pageTexts: ['t1'],
    });
    describeService.describePages.mockRejectedValue(
      new Error('model exploded'),
    );

    await service.resolveOriginals(
      'sess-1',
      'conv-1',
      'req-1',
      [pdfEntry()],
      new Set(['p1']),
      { model: 'vision-model', ready: true },
    );

    expect(lastManifestUpload()).toBeNull();
    // Text-only node is still ensured.
    expect(memoryClient.indexEncyclopediaDocuments).toHaveBeenCalledTimes(1);
  });

  it('heals a legacy pdf manifest missing pageTexts and indexes it', async () => {
    seedPdfManifest({
      kind: 'pdf',
      name: 'doc.pdf',
      pageHashes: ['p1'],
      text: '',
    });
    pdfService.extractText.mockResolvedValue(['healed t1']);

    await service.resolveOriginals(
      'sess-1',
      'conv-1',
      'req-1',
      [pdfEntry()],
      new Set(['p1']),
    );

    const manifest = lastManifestUpload();
    expect(manifest?.pageTexts).toEqual(['healed t1']);
    expect(manifest?.text).toBe('healed t1');
    expect(
      memoryClient.indexEncyclopediaDocuments.mock.calls[0][0].documents[0]
        .content,
    ).toBe('healed t1');
  });

  it('converts and persists a fresh pdf original (pages + per-page text)', async () => {
    minioService.downloadBuffer.mockResolvedValue(null);
    pdfService.renderPages.mockResolvedValue([
      { buffer: Buffer.from('png-1'), mimeType: 'image/png', pageNumber: 1 },
      { buffer: Buffer.from('png-2'), mimeType: 'image/png', pageNumber: 2 },
    ]);
    pdfService.extractText.mockResolvedValue(['t1', '']);

    const manifest = await service.convertAndPersist(
      'sess-1',
      'conv-1',
      'req-1',
      pdfEntry(),
      Buffer.from('pdf-bytes'),
    );

    expect(pdfService.renderPages).toHaveBeenCalledWith(
      Buffer.from('pdf-bytes'),
    );
    // Page images uploaded first …
    expect(
      minioService.uploadBuffers.mock.calls[0][4].map(
        (m: { hash: string }) => m.hash,
      ),
    ).toEqual(['page-hash-1', 'page-hash-2']);
    // … then the manifest carrying hashes + per-page text.
    expect(manifest).toMatchObject({
      kind: 'pdf',
      pageHashes: ['page-hash-1', 'page-hash-2'],
      pageTexts: ['t1', ''],
      text: 't1',
    });
  });

  it('indexManifest delegates the composed content to the memory encyclopedia', () => {
    service.indexManifest('sess-1', 'conv-1', pdfEntry(), {
      kind: 'pdf',
      name: 'doc.pdf',
      pageHashes: ['p1'],
      text: 't1',
      pageTexts: ['t1'],
      pageDescriptions: ['d1'],
    });

    expect(memoryClient.indexEncyclopediaDocuments).toHaveBeenCalledWith({
      partitionScope: 'sess-1',
      documents: [
        {
          url: '/api/v1/storage/s/c/h',
          title: 'doc.pdf',
          content: ['t1', 'd1'].join('\n\n'),
          mimeType: 'application/pdf',
          sizeBytes: 0,
          originalHash: 'doc-hash',
        },
      ],
    });
  });

  it('indexManifest skips documents without any content', () => {
    service.indexManifest('sess-1', 'conv-1', pdfEntry(), {
      kind: 'pdf',
      name: 'doc.pdf',
      pageHashes: ['p1'],
      text: '',
      pageTexts: [''],
    });

    expect(memoryClient.indexEncyclopediaDocuments).not.toHaveBeenCalled();
  });
});

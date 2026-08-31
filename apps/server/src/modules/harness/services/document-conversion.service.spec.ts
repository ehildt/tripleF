import { Test, TestingModule } from '@nestjs/testing';
import { describe, expect, it, vi } from 'vitest';

import { MinioService } from '../../minio/services/minio.service.js';
import { buildManifestJson } from '../helpers/documents/document-manifest.helper.js';

import { DocumentConversionService } from './document-conversion.service.js';

function createMinioMock() {
  return {
    downloadBuffers: vi.fn(),
    downloadBuffer: vi.fn(),
    buildFileUrl: vi.fn(() => '/api/v1/storage/s/c/h'),
    uploadBuffers: vi.fn(),
  };
}

describe('DocumentConversionService', () => {
  let service: DocumentConversionService;
  let minioService: ReturnType<typeof createMinioMock>;

  beforeEach(async () => {
    minioService = createMinioMock();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DocumentConversionService,
        { provide: MinioService, useValue: minioService },
      ],
    }).compile();

    service = module.get<DocumentConversionService>(DocumentConversionService);
  });

  /** A pdf original whose manifest already exists (no re-render needed). */
  function pdfOriginal() {
    return {
      name: 'doc.pdf',
      type: 'application/pdf',
      hash: 'doc-hash',
      size: 0,
    };
  }

  function seedPdfManifest(pageHashes: string[]) {
    minioService.downloadBuffers.mockResolvedValue({
      buffers: [Buffer.from('pdf-bytes')],
      keptMeta: [
        { name: 'doc.pdf', type: 'application/pdf', hash: 'doc-hash' },
      ],
    });
    minioService.downloadBuffer.mockResolvedValue(
      buildManifestJson({
        kind: 'pdf',
        name: 'doc.pdf',
        pageHashes,
        text: '',
      }),
    );
  }

  it('synthesizes every page when none are referenced (bootstrap fallback)', async () => {
    seedPdfManifest(['p1', 'p2', 'p3']);

    const result = await service.resolveOriginals(
      'sess-1',
      'conv-1',
      'req-1',
      [pdfOriginal()],
      new Set(['unrelated-hash']),
    );

    expect(result.pageImageMeta.map((m) => m.hash)).toEqual(['p1', 'p2', 'p3']);
    expect(result.textSections).toEqual([]);
  });

  it('synthesizes nothing when the client references at least one page', async () => {
    seedPdfManifest(['p1', 'p2', 'p3']);

    const result = await service.resolveOriginals(
      'sess-1',
      'conv-1',
      'req-1',
      [pdfOriginal()],
      new Set(['p2']),
    );

    expect(result.pageImageMeta).toEqual([]);
  });

  it('treats a partial selection as authoritative (dropped pages stay dropped)', async () => {
    seedPdfManifest(['p1', 'p2', 'p3']);

    const result = await service.resolveOriginals(
      'sess-1',
      'conv-1',
      'req-1',
      [pdfOriginal()],
      new Set(['p1', 'p3']),
    );

    expect(result.pageImageMeta).toEqual([]);
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
  });
});

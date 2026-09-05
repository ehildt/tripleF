import { describe, expect, it } from 'vitest';

import { composeEncyclopediaContent } from './compose-encyclopedia-content.helper.js';
import type { DocumentManifest } from './document-manifest.helper.js';

describe('composeEncyclopediaContent', () => {
  it('returns the blob text for non-pdf kinds', () => {
    const manifest: DocumentManifest = {
      kind: 'docx',
      name: 'notes.docx',
      pageHashes: [],
      text: '  blob text  ',
    };

    expect(composeEncyclopediaContent(manifest)).toBe('blob text');
  });

  it('composes per-page text and description, in page order', () => {
    const manifest: DocumentManifest = {
      kind: 'pdf',
      name: 'doc.pdf',
      pageHashes: ['p1', 'p2', 'p3'],
      text: 't1 t2 t3',
      pageTexts: ['t1', 't2', 't3'],
      pageDescriptions: ['d1', null, 'd3'],
    };

    expect(composeEncyclopediaContent(manifest)).toBe(
      ['t1', 'd1', 't2', 't3', 'd3'].join('\n\n'),
    );
  });

  it('keeps a description-only page (scanned page, empty text layer)', () => {
    const manifest: DocumentManifest = {
      kind: 'pdf',
      name: 'scan.pdf',
      pageHashes: ['p1'],
      text: '',
      pageTexts: [''],
      pageDescriptions: ['a form with hand-written entries'],
    };

    expect(composeEncyclopediaContent(manifest)).toBe(
      'a form with hand-written entries',
    );
  });

  it('falls back to the blob text for legacy manifests without per-page texts', () => {
    const manifest: DocumentManifest = {
      kind: 'pdf',
      name: 'legacy.pdf',
      pageHashes: ['p1'],
      text: 'legacy blob',
    };

    expect(composeEncyclopediaContent(manifest)).toBe('legacy blob');
  });

  it('returns an empty string when there is nothing to index', () => {
    const manifest: DocumentManifest = {
      kind: 'pdf',
      name: 'blank.pdf',
      pageHashes: ['p1'],
      text: '',
      pageTexts: [''],
    };

    expect(composeEncyclopediaContent(manifest)).toBe('');
  });
});

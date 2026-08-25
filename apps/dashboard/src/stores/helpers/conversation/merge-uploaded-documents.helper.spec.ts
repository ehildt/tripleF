import { describe, expect, it } from 'vitest';

import { mergeUploadedDocuments } from './merge-uploaded-documents.helper';

function makeDocument(hash: string, overrides: Record<string, unknown> = {}) {
  return {
    name: `${hash}.txt`,
    hash,
    extractedText: 'text',
    uploadedAt: 1,
    conversationId: 'cid',
    ...overrides,
  };
}

describe('mergeUploadedDocuments', () => {
  it('deduplicates by hash and conversationId', () => {
    const merged = mergeUploadedDocuments(
      [makeDocument('a')],
      [makeDocument('a'), makeDocument('b')],
      'cid',
    );
    expect(merged).toHaveLength(2);
    expect(merged.map((d) => d.hash)).toEqual(['a', 'b']);
  });

  it('keeps the existing selection state', () => {
    const merged = mergeUploadedDocuments(
      [makeDocument('a', { selected: false })],
      [makeDocument('a', { selected: true })],
      'cid',
    );
    expect(merged[0].selected).toBe(false);
  });

  it('defaults selection to true for new entries', () => {
    const merged = mergeUploadedDocuments([], [makeDocument('a')], 'cid');
    expect(merged[0].selected).toBe(true);
  });
});

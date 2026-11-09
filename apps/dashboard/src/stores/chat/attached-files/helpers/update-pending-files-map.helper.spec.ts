import { describe, expect, it } from 'vitest';

import type { AttachedFileEntry } from '../attached-files.model';
import { updatePendingFilesMap } from './update-pending-files-map.helper';

function makeEntry(id: string): AttachedFileEntry {
  return {
    id,
    file: new File(['body'], `${id}.png`, { type: 'image/png' }),
    isSelected: true,
    objectUrl: `blob:${id}`,
    hash: id,
    conversationId: 'stable',
    kind: 'image',
  };
}

describe('updatePendingFilesMap', () => {
  it('clones the map and upserts a non-empty scope without mutating the source', () => {
    const existing = [makeEntry('existing')];
    const source = new Map([['other', existing]]);
    const next = [makeEntry('next')];

    const result = updatePendingFilesMap(source, 'target', next);

    expect(result).not.toBe(source);
    expect(result.get('target')).toBe(next);
    expect(result.get('other')).toBe(existing);
    expect(source.has('target')).toBe(false);
  });

  it('deletes an empty scope while retaining other scopes', () => {
    const source = new Map([
      ['target', [makeEntry('target')]],
      ['other', [makeEntry('other')]],
    ]);

    const result = updatePendingFilesMap(source, 'target', []);

    expect(result.has('target')).toBe(false);
    expect(result.has('other')).toBe(true);
    expect(source.has('target')).toBe(true);
  });

  it('can create a new empty-scope-free map', () => {
    expect(updatePendingFilesMap(new Map(), 'target', []).size).toBe(0);
  });
});

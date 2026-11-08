import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it } from 'vitest';

import type { AttachedFileEntry } from './attached-files.model';
import { useAttachedFilesStore } from './attached-files.store';
import type { PendingAttachmentScope } from './attached-files.store.types';

const scope: PendingAttachmentScope = {
  parentConversationId: 'parent:one',
  conversationId: 'stable:one',
};

function makeEntry(
  id: string,
  overrides: Partial<AttachedFileEntry> = {},
): AttachedFileEntry {
  return {
    id,
    file: new File(['body'], `${id}.png`, { type: 'image/png' }),
    isSelected: true,
    objectUrl: `blob:${id}`,
    hash: 'shared-hash',
    conversationId: scope.conversationId,
    kind: 'image',
    ...overrides,
  };
}

describe('useAttachedFilesStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('starts with no pending entries', () => {
    const store = useAttachedFilesStore();

    expect(store.pendingFilesFor(scope)).toEqual([]);
    expect(store.selectedPendingEntriesFor(scope)).toEqual([]);
  });

  it('appends entries under their explicit pair without delimiter parsing', () => {
    const store = useAttachedFilesStore();
    const entry = makeEntry('entry-1');

    store.appendPendingFile(scope, entry);

    expect(store.pendingFilesFor(scope)).toEqual([entry]);
    expect(
      store.pendingFilesFor({
        parentConversationId: 'parent:two',
        conversationId: 'stable:one',
      }),
    ).toEqual([]);
  });

  it('derives selected entries for the matching stable conversation', () => {
    const store = useAttachedFilesStore();
    store.appendPendingFile(scope, makeEntry('selected'));
    store.appendPendingFile(
      scope,
      makeEntry('deselected', { isSelected: false }),
    );
    store.appendPendingFile(
      scope,
      makeEntry('other-stable-id', { conversationId: 'other' }),
    );

    expect(
      store.selectedPendingEntriesFor(scope).map((entry) => entry.id),
    ).toEqual(['selected']);
  });

  it('toggles and removes stable ids even when hashes are duplicated', () => {
    const store = useAttachedFilesStore();
    store.appendPendingFile(scope, makeEntry('first'));
    store.appendPendingFile(scope, makeEntry('second'));

    store.togglePendingFile(scope, 'second');
    expect(
      store.pendingFilesFor(scope).map((entry) => entry.isSelected),
    ).toEqual([true, false]);

    store.removePendingFile(scope, 'first');
    expect(store.pendingFilesFor(scope).map((entry) => entry.id)).toEqual([
      'second',
    ]);
  });

  it('clears one pair without touching another', () => {
    const store = useAttachedFilesStore();
    const otherScope = {
      parentConversationId: 'other-parent',
      conversationId: 'other-stable',
    };
    store.appendPendingFile(scope, makeEntry('first'));
    store.appendPendingFile(
      otherScope,
      makeEntry('other', { conversationId: otherScope.conversationId }),
    );

    store.clearPendingFilesForConversation(scope);

    expect(store.pendingFilesFor(scope)).toEqual([]);
    expect(store.pendingFilesFor(otherScope).map((entry) => entry.id)).toEqual([
      'other',
    ]);
  });

  it('clears every pending entry', () => {
    const store = useAttachedFilesStore();
    store.appendPendingFile(scope, makeEntry('first'));

    store.clearPendingFiles();

    expect(store.pendingFilesByConversation.size).toBe(0);
  });
});

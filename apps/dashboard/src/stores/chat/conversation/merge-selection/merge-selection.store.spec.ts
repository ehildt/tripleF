import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it } from 'vitest';

import { useMergeSelectionStore } from './merge-selection.store';

describe('useMergeSelectionStore', () => {
  beforeEach(() => setActivePinia(createPinia()));

  it('sets and clears selected ids per conversation', () => {
    const store = useMergeSelectionStore();
    expect(store.getMergeSelectedIds('missing')).toEqual([]);
    store.setMergeSelectedIds('c1', ['a', 'b']);
    expect(store.getMergeSelectedIds('c1')).toEqual(['a', 'b']);
    expect(store.getMergeSelectedIds('c1', 'a')).toBe(true);
    expect(store.getMergeSelectedIds('c1', 'missing')).toBe(false);

    store.setMergeSelectedIds('c1', []);
    expect('c1' in store.mergeSelectedIdsByConversation).toBe(false);
  });

  it('keeps selections isolated between conversations', () => {
    const store = useMergeSelectionStore();
    store.setMergeSelectedIds('c1', ['a']);
    store.setMergeSelectedIds('c2', ['x']);

    store.setMergeSelectedIds('c1', []);
    expect(store.getMergeSelectedIds('c2')).toEqual(['x']);
  });

  it('resolves pending state and drops consumed sources', () => {
    const store = useMergeSelectionStore();
    store.setMergeSelectedIds('c1', ['a', 'b', 'c']);
    store.markMergePending('c1', 'req-1');

    store.resolvePendingMerge('c1', 'req-1', ['a', 'b']);

    expect('c1' in store.pendingMergeRequestByConversation).toBe(false);
    expect(store.getMergeSelectedIds('c1')).toEqual(['c']);
  });

  it('ignores resolution for a different request id', () => {
    const store = useMergeSelectionStore();
    store.setMergeSelectedIds('c1', ['a', 'b']);
    store.markMergePending('c1', 'req-1');

    store.resolvePendingMerge('c1', 'req-other', ['a']);

    expect(store.getPendingMergeRequest('c1')).toBe('req-1');
    expect(store.getPendingMergeRequest('c1', 'req-1')).toBe(true);
    expect(store.getPendingMergeRequest('c1', 'req-other')).toBe(false);
    expect(store.getMergeSelectedIds('c1')).toEqual(['a', 'b']);
  });

  it('removes both keys when every source is consumed', () => {
    const store = useMergeSelectionStore();
    store.setMergeSelectedIds('c1', ['a', 'b']);
    store.markMergePending('c1', 'req-1');

    store.resolvePendingMerge('c1', 'req-1', ['a', 'b']);

    expect('c1' in store.mergeSelectedIdsByConversation).toBe(false);
    expect('c1' in store.pendingMergeRequestByConversation).toBe(false);
  });

  it('prunes deleted exchanges without disturbing other selections or pending state', () => {
    const store = useMergeSelectionStore();
    store.setMergeSelectedIds('c1', ['a', 'b', 'c', 'd']);
    store.setMergeSelectedIds('c2', ['x']);
    store.markMergePending('c1', 'req-1');

    store.pruneMergeSelection('c1', ['a', 'b']);

    expect(store.getMergeSelectedIds('c1')).toEqual(['c', 'd']);
    expect(store.getMergeSelectedIds('c2')).toEqual(['x']);
    expect(store.getPendingMergeRequest('c1')).toBe('req-1');
  });

  it('clears selection and pending state together', () => {
    const store = useMergeSelectionStore();
    store.setMergeSelectedIds('c1', ['a']);
    store.markMergePending('c1', 'req-1');

    store.clearMergeSelection('c1');

    expect('c1' in store.mergeSelectedIdsByConversation).toBe(false);
    expect('c1' in store.pendingMergeRequestByConversation).toBe(false);
  });

  it('clears safely without a pending merge', () => {
    const store = useMergeSelectionStore();
    store.setMergeSelectedIds('c1', ['a']);

    expect(() => store.clearMergeSelection('c1')).not.toThrow();
    expect('c1' in store.mergeSelectedIdsByConversation).toBe(false);
  });
});

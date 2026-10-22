import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it } from 'vitest';

import { useMergeSelectionStore } from './merge-selection.store';

describe('useMergeSelectionStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('sets and clears the selected ids per conversation', () => {
    const store = useMergeSelectionStore();

    store.setMergeSelectedIds('c1', ['a', 'b']);
    expect(store.mergeSelectedIdsByConversation['c1']).toEqual(['a', 'b']);

    // An empty selection deletes the conversation key entirely.
    store.setMergeSelectedIds('c1', []);
    expect('c1' in store.mergeSelectedIdsByConversation).toBe(false);
  });

  it('keeps selections isolated between conversations', () => {
    const store = useMergeSelectionStore();
    store.setMergeSelectedIds('c1', ['a']);
    store.setMergeSelectedIds('c2', ['x']);

    store.setMergeSelectedIds('c1', []);
    expect(store.mergeSelectedIdsByConversation['c2']).toEqual(['x']);
  });

  it('resolves a pending merge: stops the pulse and drops consumed sources', () => {
    const store = useMergeSelectionStore();
    store.setMergeSelectedIds('c1', ['a', 'b', 'c']);
    store.markMergePending('c1', 'req-1');

    store.resolvePendingMerge('c1', 'req-1', ['a', 'b']);

    expect('c1' in store.pendingMergeRequestByConversation).toBe(false);
    expect(store.mergeSelectedIdsByConversation['c1']).toEqual(['c']);
  });

  it('ignores resolve calls for a different request id', () => {
    const store = useMergeSelectionStore();
    store.setMergeSelectedIds('c1', ['a', 'b']);
    store.markMergePending('c1', 'req-1');

    store.resolvePendingMerge('c1', 'req-other', ['a']);

    expect(store.pendingMergeRequestByConversation['c1']).toBe('req-1');
    expect(store.mergeSelectedIdsByConversation['c1']).toEqual(['a', 'b']);
  });

  it('consuming every source resolves the selection key entirely', () => {
    const store = useMergeSelectionStore();
    store.setMergeSelectedIds('c1', ['a', 'b']);
    store.markMergePending('c1', 'req-1');

    store.resolvePendingMerge('c1', 'req-1', ['a', 'b']);

    expect('c1' in store.mergeSelectedIdsByConversation).toBe(false);
    expect('c1' in store.pendingMergeRequestByConversation).toBe(false);
  });

  it('clearMergeSelection drops selection and pending state', () => {
    const store = useMergeSelectionStore();
    store.setMergeSelectedIds('c1', ['a']);
    store.markMergePending('c1', 'req-1');

    store.clearMergeSelection('c1');

    expect('c1' in store.mergeSelectedIdsByConversation).toBe(false);
    expect('c1' in store.pendingMergeRequestByConversation).toBe(false);
  });

  it('clearMergeSelection is safe on a conversation with no pending merge', () => {
    const store = useMergeSelectionStore();
    store.setMergeSelectedIds('c1', ['a']);

    expect(() => store.clearMergeSelection('c1')).not.toThrow();
    expect('c1' in store.mergeSelectedIdsByConversation).toBe(false);
  });
});

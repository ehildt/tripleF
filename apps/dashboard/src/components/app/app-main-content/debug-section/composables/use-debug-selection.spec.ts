import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it } from 'vitest';

import { useDebugStore } from '@/stores/debug/debug.store';

import { useDebugSelection } from './use-debug-selection';

function addResult(endpoint: string): string {
  const store = useDebugStore();
  store.addDebugResult({
    endpoint,
    method: 'GET',
    status: 'success',
    responseTime: 1,
    type: 'http',
  });
  return store.debugResults[0].id;
}

describe('useDebugSelection', () => {
  beforeEach(() => {
    localStorage.clear();
    setActivePinia(createPinia());
    useDebugStore().debugPaused = false;
  });

  it('derives the selected record from its id as results change', () => {
    const firstId = addResult('/first');
    const selection = useDebugSelection();

    expect(selection.selectedResult.value).toBeNull();
    selection.selectDebugResult(useDebugStore().debugResults[0]);
    expect(selection.selectedResult.value?.id).toBe(firstId);

    addResult('/second');
    expect(selection.selectedResult.value?.id).toBe(firstId);
    expect(useDebugStore().debugResults[0].endpoint).toBe('/second');

    selection.selectDebugResult(null);
    expect(selection.selectedResult.value).toBeNull();
  });

  it('clears the log and selection through one composed action', () => {
    addResult('/first');
    const selection = useDebugSelection();
    selection.selectDebugResult(useDebugStore().debugResults[0]);

    selection.clearDebugView();

    expect(useDebugStore().debugResults).toHaveLength(0);
    expect(selection.selectedResult.value).toBeNull();
  });
});

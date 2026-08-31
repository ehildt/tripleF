import { afterEach, describe, expect, it } from 'vitest';

import { useMemorySpaceSubtab } from './use-memory-space-subtab';

const STORAGE_KEY = 'vision-memory-space-subtab';

describe('useMemorySpaceSubtab', () => {
  afterEach(() => localStorage.removeItem(STORAGE_KEY));

  it('defaults to the encyclopedia canvas', () => {
    expect(useMemorySpaceSubtab().activeSubtab.value).toBe('encyclopedia');
  });

  it('restores a persisted selection', () => {
    localStorage.setItem(STORAGE_KEY, 'partition');

    expect(useMemorySpaceSubtab().activeSubtab.value).toBe('partition');
  });

  it('ignores a persisted value outside the canvas set', () => {
    localStorage.setItem(STORAGE_KEY, 'config');

    expect(useMemorySpaceSubtab().activeSubtab.value).toBe('encyclopedia');
  });

  it('persists the selection', () => {
    const { activeSubtab, selectSubtab } = useMemorySpaceSubtab();

    selectSubtab('cognition');

    expect(activeSubtab.value).toBe('cognition');
    expect(localStorage.getItem(STORAGE_KEY)).toBe('cognition');
  });
});

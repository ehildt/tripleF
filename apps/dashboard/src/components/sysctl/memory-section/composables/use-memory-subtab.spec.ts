import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useMemorySubtab } from './use-memory-subtab';

describe('useMemorySubtab', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('defaults to the config subtab', () => {
    const { activeSubtab } = useMemorySubtab();

    expect(activeSubtab.value).toBe('config');
  });

  it('selects and persists a subtab', () => {
    const { activeSubtab, selectSubtab } = useMemorySubtab();

    selectSubtab('lexicon');

    expect(activeSubtab.value).toBe('lexicon');
    expect(localStorage.getItem('vision-memory-subtab')).toBe('lexicon');
  });

  it('restores the persisted subtab on a fresh instance', () => {
    localStorage.setItem('vision-memory-subtab', 'cognition');

    const { activeSubtab } = useMemorySubtab();

    expect(activeSubtab.value).toBe('cognition');
  });

  it('falls back to config for an unknown persisted value', () => {
    localStorage.setItem('vision-memory-subtab', 'bogus');

    const { activeSubtab } = useMemorySubtab();

    expect(activeSubtab.value).toBe('config');
  });
});

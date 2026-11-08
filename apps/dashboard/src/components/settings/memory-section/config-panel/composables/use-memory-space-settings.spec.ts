import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { saveConfig } from '@/api/config.api';
import { useMemorySpacesStore } from '@/stores/memory/memory-spaces/memory-spaces.store';

import { useMemorySpaceSettings } from './use-memory-space-settings';

vi.mock('@/api/config.api', () => ({
  saveConfig: vi.fn(async () => {}),
}));

describe('useMemorySpaceSettings', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    localStorage.clear();
    vi.mocked(saveConfig).mockReset().mockResolvedValue(undefined);
  });

  it('updates cognition locally and retains best-effort server persistence', () => {
    const store = useMemorySpacesStore();
    const { setMemoryCognition } = useMemorySpaceSettings();
    setMemoryCognition('  alice  ');

    expect(store.memoryCognition).toBe('alice');
    expect(store.memoryCognitionSpaces[0]).toBe('alice');
    expect(saveConfig).toHaveBeenCalledWith(expect.any(String), {
      memoryCognition: 'alice',
    });
  });

  it('does not persist removal of a non-active history entry', () => {
    const store = useMemorySpacesStore();
    store.setMemoryCognition('alice');
    store.setMemoryCognition('work');
    const { removeMemoryCognitionSpace } = useMemorySpaceSettings();
    removeMemoryCognitionSpace('alice');

    expect(store.memoryCognition).toBe('work');
    expect(saveConfig).not.toHaveBeenCalled();
  });

  it('persists the empty cognition id when removing the active space', () => {
    const store = useMemorySpacesStore();
    store.setMemoryCognition('work');
    const { removeMemoryCognitionSpace } = useMemorySpaceSettings();
    removeMemoryCognitionSpace('work');

    expect(store.memoryCognition).toBe('');
    expect(saveConfig).toHaveBeenCalledWith(expect.any(String), {
      memoryCognition: '',
    });
  });
});

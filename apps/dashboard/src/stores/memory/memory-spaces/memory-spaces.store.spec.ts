import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it } from 'vitest';
import { nextTick } from 'vue';

import { useMemorySpacesStore } from './memory-spaces.store';

describe('useMemorySpacesStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    localStorage.clear();
  });

  it('starts with the default space and records non-empty cognition ids', () => {
    const store = useMemorySpacesStore();
    expect(store.memoryCognitionSpaces).toEqual(['default']);
    store.setMemoryCognition('alice');
    store.setMemoryCognition('work');
    expect(store.memoryCognitionSpaces).toEqual(['work', 'alice', 'default']);
  });

  it('trims, ignores empty values, dedupes, and caps history at 20', () => {
    const store = useMemorySpacesStore();
    store.setMemoryCognition('  alice  ');
    store.setMemoryCognition('');
    store.setMemoryCognition('work');
    store.setMemoryCognition('alice');
    expect(store.memoryCognitionSpaces).toEqual(['alice', 'work', 'default']);

    for (let index = 0; index < 25; index += 1) {
      store.setMemoryCognition(`space-${index}`);
    }
    expect(store.memoryCognitionSpaces).toHaveLength(20);
    expect(store.memoryCognitionSpaces[0]).toBe('space-24');
  });

  it('persists and reloads cognition history', async () => {
    const store = useMemorySpacesStore();
    store.setMemoryCognition('alice');
    await nextTick();
    expect(localStorage.getItem('harness-memory-cognition-spaces')).toBe(
      JSON.stringify(['alice', 'default']),
    );

    setActivePinia(createPinia());
    expect(useMemorySpacesStore().memoryCognitionSpaces).toEqual([
      'alice',
      'default',
    ]);
  });

  it('drops malformed persisted history entries', () => {
    localStorage.setItem(
      'harness-memory-cognition-spaces',
      JSON.stringify(['alice', 42, '  ', { id: 'x' }, 'work']),
    );
    expect(useMemorySpacesStore().memoryCognitionSpaces).toEqual([
      'alice',
      'work',
    ]);
  });

  it('removes history entries and clears only an active match', () => {
    const store = useMemorySpacesStore();
    store.setMemoryCognition('alice');
    store.setMemoryCognition('work');
    store.removeMemoryCognitionSpace('work');
    expect(store.memoryCognitionSpaces).toEqual(['alice', 'default']);
    expect(store.memoryCognition).toBe('');

    store.removeMemoryCognitionSpace('alice');
    expect(store.memoryCognitionSpaces).toEqual(['default']);
  });

  it('keeps a different active cognition space when removing history', () => {
    const store = useMemorySpacesStore();
    store.setMemoryCognition('alice');
    store.setMemoryCognition('work');
    store.removeMemoryCognitionSpace('alice');

    expect(store.memoryCognitionSpaces).toEqual(['work', 'default']);
    expect(store.memoryCognition).toBe('work');
  });

  it('adopts server ids verbatim and remembers the cognition space', () => {
    const store = useMemorySpacesStore();
    store.adoptMemorySpaces({
      memoryPartition: 'server-partition',
      memoryCognition: 'server-cognition',
    });
    expect(store.memoryPartition).toBe('server-partition');
    expect(store.memoryCognition).toBe('server-cognition');
    expect(store.memoryCognitionSpaces).toContain('server-cognition');
  });
});

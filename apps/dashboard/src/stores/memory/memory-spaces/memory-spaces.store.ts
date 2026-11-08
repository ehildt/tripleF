import { defineStore } from 'pinia';
import { ref, watch } from 'vue';

import { parseMemoryCognitionSpaces } from './helpers/parse-memory-cognition-spaces.helper';
import { prependMemoryCognitionSpace } from './helpers/prepend-memory-cognition-space.helper';
import {
  LEGACY_MEMORY_TENANT_KEY,
  MEMORY_COGNITION_KEY,
  MEMORY_COGNITION_SPACES_KEY,
  MEMORY_PARTITION_KEY,
} from './memory-spaces.constant';

interface MemorySpaceIds {
  memoryPartition?: string | null;
  memoryCognition?: string | null;
}

function loadMemoryPartition(): string {
  try {
    // One-time migration of the pre-rename key, then the old slot is dropped.
    const current = localStorage.getItem(MEMORY_PARTITION_KEY);
    if (current !== null) return current.trim();
    const legacy = localStorage.getItem(LEGACY_MEMORY_TENANT_KEY)?.trim() ?? '';
    if (legacy) {
      localStorage.setItem(MEMORY_PARTITION_KEY, legacy);
      localStorage.removeItem(LEGACY_MEMORY_TENANT_KEY);
      return legacy;
    }
    return 'default';
  } catch {
    return 'default';
  }
}

function saveMemoryPartition(value: string): void {
  try {
    if (value) localStorage.setItem(MEMORY_PARTITION_KEY, value);
    else localStorage.removeItem(MEMORY_PARTITION_KEY);
  } catch {
    /* ignore */
  }
}

function loadMemoryCognition(): string {
  try {
    return localStorage.getItem(MEMORY_COGNITION_KEY)?.trim() || 'default';
  } catch {
    return 'default';
  }
}

function saveMemoryCognition(value: string): void {
  try {
    if (value) localStorage.setItem(MEMORY_COGNITION_KEY, value);
    else localStorage.removeItem(MEMORY_COGNITION_KEY);
  } catch {
    /* ignore */
  }
}

function loadMemoryCognitionSpaces(): string[] {
  try {
    const raw = localStorage.getItem(MEMORY_COGNITION_SPACES_KEY);
    return parseMemoryCognitionSpaces(raw);
  } catch {
    return ['default'];
  }
}

function saveMemoryCognitionSpaces(spaces: string[]): void {
  try {
    if (spaces.length) {
      localStorage.setItem(MEMORY_COGNITION_SPACES_KEY, JSON.stringify(spaces));
    } else {
      localStorage.removeItem(MEMORY_COGNITION_SPACES_KEY);
    }
  } catch {
    /* ignore */
  }
}

export const useMemorySpacesStore = defineStore('memory-spaces', () => {
  /**
   * Memory partition id — the user's memory space. Defaults to 'default' so
   * memory survives browser-session rotation. Empty string = session is the
   * partition (an explicit opt-in). Persisted to localStorage as a fast cache;
   * server synchronization is owned by useMemorySpaceSync.
   */
  const memoryPartition = ref(loadMemoryPartition());
  /**
   * Memory cognition id — the AI's own understanding-of-the-user space.
   * Defaults to 'default'. Empty string = cognition lives in the memory
   * partition.
   */
  const memoryCognition = ref(loadMemoryCognition());
  /** Most-recent-first local cognition-space history, capped at 20 entries. */
  const memoryCognitionSpaces = ref<string[]>(loadMemoryCognitionSpaces());

  watch(memoryPartition, saveMemoryPartition);
  watch(memoryCognition, saveMemoryCognition);
  watch(memoryCognitionSpaces, saveMemoryCognitionSpaces);

  function rememberMemoryCognitionSpace(space: string): void {
    memoryCognitionSpaces.value = prependMemoryCognitionSpace(
      memoryCognitionSpaces.value,
      space,
    );
  }

  /** Apply server values verbatim; synchronization decides which are present. */
  function adoptMemorySpaces(ids: MemorySpaceIds): void {
    if (ids.memoryPartition) {
      memoryPartition.value = ids.memoryPartition;
    }
    if (ids.memoryCognition) {
      memoryCognition.value = ids.memoryCognition;
      rememberMemoryCognitionSpace(ids.memoryCognition);
    }
  }

  function setMemoryCognition(value: string): void {
    memoryCognition.value = value.trim();
    rememberMemoryCognitionSpace(value);
  }

  function removeMemoryCognitionSpace(space: string): void {
    memoryCognitionSpaces.value = memoryCognitionSpaces.value.filter(
      (entry) => entry !== space,
    );
    if (memoryCognition.value === space) memoryCognition.value = '';
  }

  return {
    memoryPartition,
    memoryCognition,
    memoryCognitionSpaces,
    adoptMemorySpaces,
    setMemoryCognition,
    removeMemoryCognitionSpace,
  };
});

import { defineStore } from 'pinia';
import { ref, watch } from 'vue';

import { parseMemoryCognition } from './helpers/parse-memory-cognition.helper';
import { parseMemoryCognitionSpaces } from './helpers/parse-memory-cognition-spaces.helper';
import { prependMemoryCognitionSpace } from './helpers/prepend-memory-cognition-space.helper';
import { resolveMemoryPartition } from './helpers/resolve-memory-partition.helper';
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

export const useMemorySpacesStore = defineStore('memory-spaces', () => {
  /** User memory partition; an empty value explicitly selects the session. */
  const memoryPartition = ref('default');
  try {
    const current = localStorage.getItem(MEMORY_PARTITION_KEY);
    const legacy =
      current === null ? localStorage.getItem(LEGACY_MEMORY_TENANT_KEY) : null;
    memoryPartition.value = resolveMemoryPartition(current, legacy);
    if (current === null && legacy?.trim()) {
      // Preserve the one-time migration and removal of the old slot.
      localStorage.setItem(MEMORY_PARTITION_KEY, memoryPartition.value);
      localStorage.removeItem(LEGACY_MEMORY_TENANT_KEY);
    }
  } catch {
    memoryPartition.value = 'default';
  }

  /** AI cognition space; blank/missing storage uses the default. */
  const memoryCognition = ref('default');
  try {
    memoryCognition.value = parseMemoryCognition(
      localStorage.getItem(MEMORY_COGNITION_KEY),
    );
  } catch {
    /* Storage unavailable: retain the default cognition space. */
  }

  /** Most-recent-first local cognition-space history, capped at 20 entries. */
  const memoryCognitionSpaces = ref<string[]>(['default']);
  try {
    memoryCognitionSpaces.value = parseMemoryCognitionSpaces(
      localStorage.getItem(MEMORY_COGNITION_SPACES_KEY),
    );
  } catch {
    /* Storage unavailable: retain the default history. */
  }

  watch(memoryPartition, (value) => {
    try {
      if (value) localStorage.setItem(MEMORY_PARTITION_KEY, value);
      else localStorage.removeItem(MEMORY_PARTITION_KEY);
    } catch {
      /* Storage unavailable: retain the partition in memory. */
    }
  });
  watch(memoryCognition, (value) => {
    try {
      if (value) localStorage.setItem(MEMORY_COGNITION_KEY, value);
      else localStorage.removeItem(MEMORY_COGNITION_KEY);
    } catch {
      /* Storage unavailable: retain the cognition id in memory. */
    }
  });
  watch(memoryCognitionSpaces, (spaces) => {
    try {
      if (spaces.length) {
        localStorage.setItem(
          MEMORY_COGNITION_SPACES_KEY,
          JSON.stringify(spaces),
        );
      } else {
        localStorage.removeItem(MEMORY_COGNITION_SPACES_KEY);
      }
    } catch {
      /* Storage unavailable: retain the history in memory. */
    }
  });

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

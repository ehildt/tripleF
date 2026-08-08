import { ref } from 'vue';

import type { DropdownRef, SetDropdownRef } from './use-chat-dropdowns.types';

/**
 * Holds the dropdown template refs for the chat action bar and keeps
 * the think and context dropdowns mutually exclusive.
 */
export function useChatDropdowns() {
  const thinkDropdownRef = ref<DropdownRef | null>(null);
  const contextSizeDropdownRef = ref<DropdownRef | null>(null);

  const setThinkDropdownRef: SetDropdownRef = (value) => {
    thinkDropdownRef.value = value as DropdownRef | null;
  };

  const setContextSizeDropdownRef: SetDropdownRef = (value) => {
    contextSizeDropdownRef.value = value as DropdownRef | null;
  };

  function onThinkOpen() {
    contextSizeDropdownRef.value?.close();
  }

  function onContextSizeOpen() {
    thinkDropdownRef.value?.close();
  }

  return {
    setThinkDropdownRef,
    setContextSizeDropdownRef,
    onThinkOpen,
    onContextSizeOpen,
  };
}

<script setup lang="ts">
import { ref } from 'vue';

import type { SetDropdownRef } from '../composables/use-chat-dropdowns';
import type { SearchEngineState } from '../composables/use-search-engine-availability';
import ChatExchangeList from '../exchange-list/ChatExchangeList.vue';
import ChatPromptActionBar from '../prompt-action-bar/ChatPromptActionBar.vue';

const props = defineProps<{
  value: string;
  thinkOptions: readonly string[];
  thinkValue: string;
  contextSizeOptions: readonly string[];
  contextSizeValue: string;
  defaultContextSize: string;
  formatContextSize: (value: string) => string;
  isDisabled: boolean;
  isFileSelectDisabled: boolean;
  fileSelectDisabledReason?: string;
  searchEngineState?: SearchEngineState;
  /** Every toggleable search source (web, images, news, …) + its state. */
  searchSources?: { key: string; enabled: boolean }[];
  setActionBarRef: SetDropdownRef;
  setThinkDropdownRef: SetDropdownRef;
  setContextSizeDropdownRef: SetDropdownRef;
  retryHandler: (text: string) => Promise<void>;
}>();

const emit = defineEmits<{
  input: [event: Event];
  keydown: [event: KeyboardEvent];
  selectThink: [think: string];
  selectContextSize: [ctx: string];
  openThink: [];
  openContextSize: [];
  disabledHoverStart: [];
  disabledHoverEnd: [];
  fileSelect: [];
  toggleSearchEngine: [];
  toggleSource: [source: string];
  deleteConversation: [id: string];
  toggleIncluded: [exchangeId: string];
}>();

const exchangeListRef = ref<InstanceType<typeof ChatExchangeList> | null>(null);

defineExpose({ exchangeListRef });
</script>

<template>
  <div class="chat-main-column">
    <ChatExchangeList
      ref="exchangeListRef"
      :compact="true"
      :retry-handler="props.retryHandler"
      @delete-conversation="emit('deleteConversation', $event)"
      @toggle-included="emit('toggleIncluded', $event)"
    />
    <ChatPromptActionBar
      :value="props.value"
      :think-options="props.thinkOptions"
      :think-value="props.thinkValue"
      :context-size-options="props.contextSizeOptions"
      :context-size-value="props.contextSizeValue"
      :default-context-size="props.defaultContextSize"
      :format-context-size="props.formatContextSize"
      :is-disabled="props.isDisabled"
      :is-file-select-disabled="props.isFileSelectDisabled"
      :file-select-disabled-reason="props.fileSelectDisabledReason"
      :search-engine-state="props.searchEngineState"
      :search-sources="props.searchSources"
      :set-action-bar-ref="props.setActionBarRef"
      :set-think-dropdown-ref="props.setThinkDropdownRef"
      :set-context-size-dropdown-ref="props.setContextSizeDropdownRef"
      @input="emit('input', $event)"
      @keydown="emit('keydown', $event)"
      @select-think="emit('selectThink', $event)"
      @select-context-size="emit('selectContextSize', $event)"
      @open-think="emit('openThink')"
      @open-context-size="emit('openContextSize')"
      @disabled-hover-start="emit('disabledHoverStart')"
      @disabled-hover-end="emit('disabledHoverEnd')"
      @file-select="emit('fileSelect')"
      @toggle-search-engine="emit('toggleSearchEngine')"
      @toggle-source="emit('toggleSource', $event)"
    />
  </div>
</template>

<script setup lang="ts">
import { useClipboard } from '@vueuse/core';
import { computed, onActivated } from 'vue';

import { useChatViewStore } from '@/stores/chat-view';
import { useConversationStore } from '@/stores/conversation';
import { useRightToolbarStore } from '@/stores/right-toolbar';

import { useAppViewContext } from '../../composables/use-app-view-context';
import { useChatContextSize } from '../../composables/use-chat-context-size';
import { useChatInput } from '../../composables/use-chat-input';
import { useChatThink } from '../../composables/use-chat-think';
import { useSocketSubscription } from '../../composables/use-socket-subscription';
import { useToast } from '../../composables/use-toast';
import { useLeftToolbarStore } from '../../stores/left-toolbar';
import { useModelsStore } from '../../stores/models';
import ChatLeftToolbar from './chat-left-toolbar/ChatLeftToolbar.vue';
import ChatPromptActionBar from './chat-prompt-action-bar/ChatPromptActionBar.vue';
import ChatRightToolbar from './chat-right-toolbar/ChatRightToolbar.vue';
import ChatViewPanel from './chat-view-panel/ChatViewPanel.vue';
import { useChatActions } from './composables/use-chat-actions';
import { useChatConversation } from './composables/use-chat-conversation';
import { useChatDropdowns } from './composables/use-chat-dropdowns';
import { usePromptDraft } from './composables/use-prompt-draft';
import { useSearchEngineAvailability } from './composables/use-search-engine-availability';
import { useSubmit } from './composables/use-submit';

const { socketProvider } = useAppViewContext();

// KeepAlive caches the chat tree across tab switches (App.vue include list).
defineOptions({ name: 'Chat' });

const { isEventConnected, isRoomConnected } =
  useSocketSubscription(socketProvider);

const { promptDraft, persistPromptDraft, resetPromptDraft } = usePromptDraft();

const { submit } = useSubmit({
  socketProvider,
  isEventConnected,
  isRoomConnected,
  promptDraft,
  resetPromptDraft,
});

const {
  searchEngineState,
  searchSources,
  eodhdState,
  refresh: refreshSearchEngineAvailability,
  toggleSearchEngine,
  toggleSource,
  toggleEodhd,
} = useSearchEngineAvailability();

// KeepAlive caches Chat across tab switches, so the mount-only fetch in the
// composable never re-runs after a Settings toggle. Refresh on every
// activation so newly enabled/disabled engines reflect immediately.
onActivated(refreshSearchEngineAvailability);

const modelsStore = useModelsStore();
const conversationStore = useConversationStore();
const leftToolbarStore = useLeftToolbarStore();
const rightToolbarStore = useRightToolbarStore();
const chatViewStore = useChatViewStore();
const toast = useToast();

const {
  conversationId,
  conversation,
  selectedModelObj,
  userExchanges,
  messageListItems,
  toggleUserExchangeIncluded,
  toggleUserExchangeMerge,
  canMerge,
  mergeArmed,
  deleteUserExchange,
  branchUserExchange,
} = useChatConversation();

const { filteredThinkOptions, selectThink } = useChatThink(
  selectedModelObj,
  conversationId,
  conversationStore,
  toast,
);

const { filteredContextSizeOptions, defaultContextSize, selectContextSize } =
  useChatContextSize(
    modelsStore,
    conversation,
    conversationId,
    selectedModelObj,
    conversationStore,
    toast,
  );

const { onCollapsedKeydown, onPromptInput } = useChatInput(
  promptDraft,
  submit,
  persistPromptDraft,
);

/** Ambient refresh: the server cache owns freshness, so focus just re-asks. */
function onPromptFocus() {
  modelsStore.fetchModels({ silent: true });
}

const {
  setThinkDropdownRef,
  setContextSizeDropdownRef,
  onThinkOpen,
  onContextSizeOpen,
} = useChatDropdowns();

const hasNoModelSelected = computed(() => leftToolbarStore.hasNoModelSelected);

const supportsVision = computed(() => leftToolbarStore.supportsVision);

const isFileSelectDisabled = computed(
  () => hasNoModelSelected.value || !supportsVision.value,
);

const { onPromptClick } = useChatActions({ userExchanges });

const { copy } = useClipboard({ legacy: true });

function handleCopyHistoryItem(index: number) {
  const content = messageListItems.value[index]?.content;
  if (content) copy(content);
}

const currentThinkValue = computed(() => conversation.value?.think || 'medium');

const currentContextSizeValue = computed(
  () => conversation.value?.numCtx || defaultContextSize.value,
);

function formatContextSize(value: string): string {
  return modelsStore.formatCtx(Number(value));
}

function onRetry(text: string) {
  return submit(text);
}

function onDeleteConversation(id: string) {
  void leftToolbarStore.deleteConversation(id);
}
</script>

<template>
  <ChatLeftToolbar
    class="lg:col-span-2 lg:col-start-1 min-w-0 h-fit lg:sticky lg:top-12 z-50"
    :chat-active="true"
  />

  <div class="lg:col-span-8 lg:col-start-3 min-w-0 h-fit lg:sticky lg:top-12">
    <ChatViewPanel
      :compact="true"
      :retry-handler="onRetry"
      @delete-conversation="onDeleteConversation"
      @scroll="rightToolbarStore.selectView('history')"
    />

    <ChatPromptActionBar
      :conversation-id="conversationId"
      :value="promptDraft"
      :think-options="filteredThinkOptions"
      :think-value="currentThinkValue"
      :context-size-options="filteredContextSizeOptions"
      :context-size-value="currentContextSizeValue"
      :default-context-size="defaultContextSize"
      :format-context-size="formatContextSize"
      :is-disabled="hasNoModelSelected"
      :is-file-select-disabled="isFileSelectDisabled"
      :file-select-disabled-reason="
        !supportsVision ? 'Selected model does not support images' : undefined
      "
      :search-engine-state="searchEngineState"
      :search-sources="searchSources"
      :eodhd-state="eodhdState"
      :set-think-dropdown-ref="setThinkDropdownRef"
      :set-context-size-dropdown-ref="setContextSizeDropdownRef"
      @input="onPromptInput"
      @keydown="onCollapsedKeydown"
      @focus="onPromptFocus"
      @select-think="selectThink"
      @select-context-size="selectContextSize"
      @open-think="onThinkOpen"
      @open-context-size="onContextSizeOpen"
      @disabled-hover-start="leftToolbarStore.startBrainBlink"
      @disabled-hover-end="leftToolbarStore.stopBrainBlink"
      @toggle-search-engine="toggleSearchEngine"
      @toggle-source="toggleSource"
      @toggle-eodhd="toggleEodhd"
    />
  </div>

  <ChatRightToolbar
    v-if="rightToolbarStore.shouldShow"
    class="lg:col-span-2 lg:col-start-11 min-w-0 h-fit lg:sticky lg:top-12"
    :message-list-items="messageListItems"
    :can-merge="canMerge"
    :merge-armed="mergeArmed"
    :active-user-exchange-id="chatViewStore.activeUserExchangeId"
    @prompt-click="onPromptClick"
    @copy="handleCopyHistoryItem"
    @toggle-include="toggleUserExchangeIncluded"
    @toggle-merge="toggleUserExchangeMerge"
    @delete-item="deleteUserExchange"
    @branch-out="branchUserExchange"
  />
</template>

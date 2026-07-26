<script setup lang="ts">
import type { ComponentPublicInstance } from 'vue';
import { computed, provide, ref } from 'vue';

import { useConversationStore } from '@/stores/conversation';

import { deleteUploadedObject } from '../../api/storage.api';
import { useActionBar } from '../../composables/use-action-bar';
import { useBlink } from '../../composables/use-blink';
import { useChatContextSize } from '../../composables/use-chat-context-size';
import { useChatInput } from '../../composables/use-chat-input';
import { useChatThink } from '../../composables/use-chat-think';
import { useSocketSubscription } from '../../composables/use-socket-subscription';
import { useSubmit } from '../../composables/use-submit';
import { useToast } from '../../composables/use-toast';
import { useModelsStore } from '../../stores/models';
import type { SocketProvider } from '../../types/socket-provider.model';
import { useChatActions } from './composables/use-chat-actions';
import { useChatConversation } from './composables/use-chat-conversation';
import { useChatDropdowns } from './composables/use-chat-dropdowns';
import { useChatPanel } from './composables/use-chat-panel';
import ChatExchangeList from './exchange-list/ChatExchangeList.vue';
import FloatingPlayer from './floating-player/FloatingPlayer.vue';
import ChatPromptActionBar from './prompt-action-bar/ChatPromptActionBar.vue';
import ChatRightPanel from './right-panel/ChatRightPanel.vue';
import { useAttachmentList } from './right-panel/composables/use-attachment-list';
import { useVideoPlaylist } from './right-panel/composables/use-video-playlist';
import ChatToolbar from './toolbar/ChatToolbar.vue';

const props = defineProps<{
  socketProvider: SocketProvider;
}>();

const { isEventConnected, isRoomConnected } = useSocketSubscription(
  props.socketProvider,
);

const { arguments_, submit, persistArguments } = useSubmit({
  socketProvider: props.socketProvider,
  isEventConnected,
  isRoomConnected,
});

const { actionBarRef } = useActionBar();

const modelsStore = useModelsStore();
const conversationStore = useConversationStore();
const toast = useToast();

const {
  conversationId,
  conversation,
  selectedModelObj,
  userExchanges,
  messageListItems,
  toggleUserExchangeIncluded,
  deleteUserExchange,
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
  arguments_,
  submit,
  persistArguments,
);

const {
  setThinkDropdownRef,
  setContextSizeDropdownRef,
  onThinkOpen,
  onContextSizeOpen,
} = useChatDropdowns();

const brainBlink = useBlink();
provide('brainBlink', brainBlink);

const toolbarRef = ref<InstanceType<typeof ChatToolbar> | null>(null);
const chatListRef = ref<InstanceType<typeof ChatExchangeList> | null>(null);

const hasNoModelSelected = computed(
  () => !(conversation.value?.model || toolbarRef.value?.selectedModel),
);

const supportsVision = computed(() => toolbarRef.value?.supportsVision ?? true);

const isFileSelectDisabled = computed(
  () => hasNoModelSelected.value || !supportsVision.value,
);

const activeConversationId = computed(() => {
  if (!conversation.value?.id) return '';
  return conversationStore.getConversationId(conversation.value.id);
});

const attachedFiles = computed(() => toolbarRef.value?.selectedFiles ?? []);

const uploadedImagesForConversation = computed(() => {
  if (!conversation.value?.id || !activeConversationId.value) return [];
  return conversationStore.getUploadedImagesForConversation(
    conversation.value.id,
    activeConversationId.value,
  );
});

const { attachments, hasAttachments } = useAttachmentList({
  attachedFiles,
  uploadedImages: uploadedImagesForConversation,
});

const {
  onPromptClick,
  triggerFileSelect,
  onRemoveAttachedFile,
  onToggleAttachedFileSelected,
} = useChatActions({
  chatListRef,
  userExchanges,
  toolbarRef,
  hasNoModelSelected,
  supportsVision,
});

const { playlistVideos, hasPlaylist } = useVideoPlaylist(conversation);

const { rightPanelView, selectPanelView } = useChatPanel(
  hasAttachments,
  computed(() => userExchanges.value.length > 0),
  hasPlaylist,
  computed(() => playlistVideos.value.length),
);

const shouldShowRightPanel = computed(
  () =>
    conversation.value !== null &&
    (hasAttachments.value ||
      hasPlaylist.value ||
      userExchanges.value.length > 0),
);

const currentThinkValue = computed(() => conversation.value?.think || 'medium');

const currentContextSizeValue = computed(
  () => conversation.value?.numCtx || defaultContextSize.value,
);

function formatContextSize(value: string): string {
  return modelsStore.formatCtx(Number(value));
}

async function onRemoveAttachment(id: string) {
  if (!conversation.value) return;
  const item = attachments.value.find((a) => a.id === id);
  if (!item) return;

  if (item.pendingIndex !== null) {
    onRemoveAttachedFile(item.pendingIndex);
    return;
  }

  const sid = conversation.value.id;
  const cid = activeConversationId.value;
  const stillReferenced = conversationStore.hasUploadedImageReference(
    sid,
    item.hash,
    cid,
  );
  if (!stillReferenced) {
    try {
      await deleteUploadedObject(sid, cid, item.hash);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      toast.error(`Failed to remove uploaded file: ${msg}`);
      return;
    }
  }
  conversationStore.removeUploadedImage(sid, item.hash, cid);
}

function onToggleAttachment(id: string) {
  const item = attachments.value.find((a) => a.id === id);
  if (!item) return;

  if (item.pendingIndex !== null) {
    onToggleAttachedFileSelected(item.pendingIndex);
    return;
  }

  if (!conversation.value) return;
  conversationStore.toggleUploadedImageSelected(
    conversation.value.id,
    item.hash,
    activeConversationId.value,
  );
}

function onRetry(text: string) {
  return submit(text);
}

function onSetActionBarRef(el: Element | ComponentPublicInstance | null) {
  actionBarRef.value = el as HTMLElement | null;
}

function onDeleteConversation(id: string) {
  toolbarRef.value?.deleteConversation?.(id);
}

defineExpose({ actionBarRef });
</script>

<template>
  <ChatToolbar
    ref="toolbarRef"
    class="lg:col-span-2 lg:col-start-1 h-fit lg:sticky lg:top-12 z-50"
    :chat-active="true"
    :prompt-focused="false"
  />

  <div
    class="chat-center-column lg:col-span-8 lg:col-start-3 h-fit lg:sticky lg:top-12"
  >
    <ChatExchangeList
      ref="chatListRef"
      :compact="true"
      :retry-handler="onRetry"
      @delete-conversation="onDeleteConversation"
      @toggle-included="selectPanelView('history')"
    />
    <ChatPromptActionBar
      :value="arguments_"
      :is-compacting="conversationStore.compacting"
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
      :set-action-bar-ref="onSetActionBarRef"
      :set-think-dropdown-ref="setThinkDropdownRef"
      :set-context-size-dropdown-ref="setContextSizeDropdownRef"
      @input="onPromptInput"
      @keydown="onCollapsedKeydown"
      @select-think="selectThink"
      @select-context-size="selectContextSize"
      @open-think="onThinkOpen"
      @open-context-size="onContextSizeOpen"
      @disabled-hover-start="brainBlink.start"
      @disabled-hover-end="brainBlink.stop"
      @file-select="triggerFileSelect"
    />
  </div>

  <ChatRightPanel
    v-if="shouldShowRightPanel"
    class="lg:col-span-2 lg:col-start-11 h-fit lg:sticky lg:top-12"
    :attachments="attachments"
    :conversation="conversation"
    :message-list-items="messageListItems"
    :playlist-videos="playlistVideos"
    :right-panel-view="rightPanelView"
    @select-view="selectPanelView"
    @remove-attachment="onRemoveAttachment"
    @toggle-attachment="onToggleAttachment"
    @prompt-click="onPromptClick"
    @toggle-include="toggleUserExchangeIncluded"
    @delete-item="deleteUserExchange"
  />

  <FloatingPlayer />
</template>

<script setup lang="ts">
import type { ComponentPublicInstance } from 'vue';
import { computed, provide, ref, watch } from 'vue';

import { useConversationStore } from '@/stores/conversation';

import { deleteUploadedObject } from '../../api/storage.api';
import { useActionBar } from '../../composables/use-action-bar';
import { useAppViewContext } from '../../composables/use-app-view-context';
import { useBlink } from '../../composables/use-blink';
import { useChatContextSize } from '../../composables/use-chat-context-size';
import { useChatInput } from '../../composables/use-chat-input';
import { useChatThink } from '../../composables/use-chat-think';
import { useSocketSubscription } from '../../composables/use-socket-subscription';
import { useToast } from '../../composables/use-toast';
import { useModelsStore } from '../../stores/models';
import {
  getPlaylists,
  loadPlaylists,
} from '../widgets/floating-playlist/composables/playlist.state';
import { playlistMode } from '../widgets/floating-playlist/composables/playlist-settings.state';
import { conversationHasVideos } from './composables/conversation-has-videos.helper';
import { useChatActions } from './composables/use-chat-actions';
import { useChatConversation } from './composables/use-chat-conversation';
import { useChatDropdowns } from './composables/use-chat-dropdowns';
import { useChatPanel } from './composables/use-chat-panel';
import { useSearchEngineAvailability } from './composables/use-search-engine-availability';
import { useSubmit } from './composables/use-submit';
import {
  launchedFromPlaylist,
  launchedVideo,
} from './exchange-list/chat-exchange/exchange-content/assistant-response/composables/video-playback.state';
import ChatMainColumn from './main-column/ChatMainColumn.vue';
import ChatRightPanel from './right-panel/ChatRightPanel.vue';
import { useAttachmentList } from './right-panel/composables/use-attachment-list';
import { useVideoPlaylist } from './right-panel/composables/use-video-playlist';
import ChatToolbar from './toolbar/ChatToolbar.vue';

const { socketProvider } = useAppViewContext();

const { isEventConnected, isRoomConnected } =
  useSocketSubscription(socketProvider);

const { arguments_, submit, persistArguments } = useSubmit({
  socketProvider,
  isEventConnected,
  isRoomConnected,
});

const { actionBarRef } = useActionBar();

const { searchEngineState, searchSources, toggleSearchEngine, toggleSource } =
  useSearchEngineAvailability();

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
const mainColumnRef = ref<InstanceType<typeof ChatMainColumn> | null>(null);
const chatListRef = computed(
  () => mainColumnRef.value?.exchangeListRef ?? null,
);

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

// The playlist is scoped to the active conversation: the active playlist's
// videos are the queue, and switching playlists swaps them.
const { playlistVideos } = useVideoPlaylist();

// Load the active conversation's playlists from the database so the playlist
// tab can appear even before the panel mounts.
watch(conversationId, () => void loadPlaylists(conversationId.value), {
  immediate: true,
});

// In floating mode the playlist lives in the app-level window (SysCtl →
// Widgets → Playlist): the right panel drops its playlist tab entirely.
const panelPlaylistVideos = computed(() =>
  playlistMode.value === 'floating' ? [] : playlistVideos.value,
);
// The player shows when it has anything to act on: an added video, a
// playlist to load from an empty queue, a playlist video currently playing,
// or — in docked mode — a conversation that contains videos (so the empty
// state and its hints are reachable).
const hasPanelPlaylist = computed(
  () =>
    panelPlaylistVideos.value.length > 0 ||
    getPlaylists().length > 0 ||
    (launchedFromPlaylist.value && Boolean(launchedVideo.value)) ||
    (playlistMode.value !== 'floating' &&
      conversationHasVideos(conversation.value)),
);

const { rightPanelView, selectPanelView } = useChatPanel(
  hasAttachments,
  computed(() => userExchanges.value.length > 0),
  hasPanelPlaylist,
  computed(() => panelPlaylistVideos.value.length),
  computed(() => attachments.value.length),
  computed(() => messageListItems.value.length),
);

const shouldShowRightPanel = computed(
  () =>
    conversation.value !== null &&
    (hasAttachments.value ||
      hasPanelPlaylist.value ||
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
    class="lg:col-span-2 lg:col-start-1 min-w-0 h-fit lg:sticky lg:top-12 z-50"
    :chat-active="true"
    :prompt-focused="false"
  />

  <ChatMainColumn
    ref="mainColumnRef"
    class="lg:col-span-8 lg:col-start-3 min-w-0 h-fit lg:sticky lg:top-12"
    :value="arguments_"
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
    :set-action-bar-ref="onSetActionBarRef"
    :set-think-dropdown-ref="setThinkDropdownRef"
    :set-context-size-dropdown-ref="setContextSizeDropdownRef"
    :retry-handler="onRetry"
    @input="onPromptInput"
    @keydown="onCollapsedKeydown"
    @select-think="selectThink"
    @select-context-size="selectContextSize"
    @open-think="onThinkOpen"
    @open-context-size="onContextSizeOpen"
    @disabled-hover-start="brainBlink.start"
    @disabled-hover-end="brainBlink.stop"
    @file-select="triggerFileSelect"
    @toggle-search-engine="toggleSearchEngine"
    @toggle-source="toggleSource"
    @delete-conversation="onDeleteConversation"
    @toggle-included="selectPanelView('history')"
  />

  <ChatRightPanel
    v-if="shouldShowRightPanel"
    class="lg:col-span-2 lg:col-start-11 min-w-0 h-fit lg:sticky lg:top-12"
    :attachments="attachments"
    :conversation="conversation"
    :message-list-items="messageListItems"
    :playlist-videos="panelPlaylistVideos"
    :conversation-id="conversationId"
    :right-panel-view="rightPanelView"
    @select-view="selectPanelView"
    @remove-attachment="onRemoveAttachment"
    @toggle-attachment="onToggleAttachment"
    @prompt-click="onPromptClick"
    @toggle-include="toggleUserExchangeIncluded"
    @delete-item="deleteUserExchange"
    @branch-out="branchUserExchange"
  />
</template>

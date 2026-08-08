<script setup lang="ts">
import { useAppStore } from '@/stores/app';
import type { Conversation } from '@/stores/conversation';
import type { VideoGalleryItem } from '@/types/harness-response-data.model';
import { renderMarkdown } from '@/utils/render-markdown.helper';

import ExpandableMessageList from '../../shared/ui/expandable-message-list/ExpandableMessageList.vue';
import type { MessageListItem } from '../../shared/ui/expandable-message-list/types';
import type { RightPanelView } from '../types/right-panel-view.type';
import AttachmentCard from './attachment-card/AttachmentCard.vue';
import type { AttachmentItem } from './composables/use-attachment-list.types';
import { useRightPanel } from './composables/use-right-panel';
import PlaylistPanel from './playlist-panel/PlaylistPanel.vue';
import RightPanelTabs from './right-panel-tabs/RightPanelTabs.vue';

const props = defineProps<{
  attachments: AttachmentItem[];
  messageListItems: MessageListItem[];
  playlistVideos: VideoGalleryItem[];
  /** Conversation id the playlist is scoped to. */
  conversationId: string;
  rightPanelView: RightPanelView;
  conversation: Conversation | null;
  /** Id of the user exchange whose section is currently active in the carousel. */
  activeUserExchangeId?: string | null;
}>();

const emit = defineEmits<{
  selectView: [view: RightPanelView];
  removeAttachment: [id: string];
  toggleAttachment: [id: string];
  promptClick: [index: number];
  copy: [index: number];
  toggleInclude: [index: number];
  deleteItem: [index: number];
  branchOut: [index: number];
}>();

const { hasAttachments, hasHistory, hasPlaylist, previewUrl } =
  useRightPanel(props);
const appStore = useAppStore();
</script>

<template>
  <div class="chat-right-panel">
    <RightPanelTabs
      :active-view="rightPanelView"
      :has-attachments="hasAttachments"
      :has-playlist="hasPlaylist"
      :has-history="hasHistory"
      @select-view="emit('selectView', $event)"
    />

    <div
      v-if="rightPanelView === 'files' && hasAttachments"
      class="chat-right-panel__scrollable"
    >
      <AttachmentCard
        v-for="item in attachments"
        :key="item.id"
        :item="item"
        :image-src="previewUrl(item)"
        @remove="emit('removeAttachment', item.id)"
        @toggle="emit('toggleAttachment', item.id)"
      />
    </div>

    <div
      v-if="rightPanelView === 'playlist' && hasPlaylist"
      class="chat-right-panel__playlist"
    >
      <PlaylistPanel :conversation-id="props.conversationId" />
    </div>

    <div v-if="rightPanelView === 'history'" class="chat-right-panel__history">
      <ExpandableMessageList
        :items="messageListItems"
        :render-html="renderMarkdown"
        :active-id="props.activeUserExchangeId ?? null"
        :on-click="(i: number) => emit('promptClick', i)"
        :on-copy="(i: number) => emit('copy', i)"
        :on-toggle-include="(i: number) => emit('toggleInclude', i)"
        :on-delete-item="(i: number) => emit('deleteItem', i)"
        :on-branch-out="(i: number) => emit('branchOut', i)"
        :expand-all="true"
        :show-role="false"
        :icon-visibility="appStore.chatIconVisibility"
        class="chat-right-panel__scrollable"
      />
    </div>
  </div>
</template>

<style scoped>
.chat-right-panel {
  display: flex;
  flex-direction: column;
  max-height: calc(100vh - 7rem);
}

.chat-right-panel__scrollable {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
}

.chat-right-panel__history {
  width: 100%;
}

/* The shared PlaylistPanel fills this column and scrolls its own list. */
.chat-right-panel__playlist {
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;
  min-height: 0;
}
</style>

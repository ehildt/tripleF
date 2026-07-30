<script setup lang="ts">
import { computed } from 'vue';

import type { Conversation } from '@/stores/conversation';
import type { VideoGalleryItem } from '@/types/harness-response-data.model';

import ExpandableMessageList from '../../shared/ui/expandable-message-list/ExpandableMessageList.vue';
import type { MessageListItem } from '../../shared/ui/expandable-message-list/types';
import type { RightPanelView } from '../types/right-panel-view.type';
import AttachmentCard from './attachment-card/AttachmentCard.vue';
import type { AttachmentItem } from './composables/use-attachment-list';
import { usePlaylistTransport } from './composables/use-playlist-transport';
import { useRightPanel } from './composables/use-right-panel';
import PlaylistItem from './playlist-item/PlaylistItem.vue';
import PlaylistTransportBar from './playlist-transport-bar/PlaylistTransportBar.vue';
import RightPanelTabs from './right-panel-tabs/RightPanelTabs.vue';

const props = defineProps<{
  attachments: AttachmentItem[];
  messageListItems: MessageListItem[];
  playlistVideos: VideoGalleryItem[];
  rightPanelView: RightPanelView;
  conversation: Conversation | null;
}>();

const emit = defineEmits<{
  selectView: [view: RightPanelView];
  removeAttachment: [id: string];
  toggleAttachment: [id: string];
  promptClick: [index: number];
  toggleInclude: [index: number];
  deleteItem: [index: number];
  branchOut: [index: number];
}>();

const { hasAttachments, hasHistory, hasPlaylist, previewUrl } =
  useRightPanel(props);

const transportPlaylistVideos = computed(() => props.playlistVideos);
const transportConversationId = computed(() => props.conversation?.id ?? '');

const {
  activePlaybackPlaying,
  activePlaybackVideoUrl,
  activePlaybackTitle,
  playlistAutoplayEnabled,
  popoutHidden,
  hasActivePlayback,
  canTogglePlayback,
  playbackToggleTitle,
  toggleActivePlayback,
  stopActivePlayback,
  togglePlaylistAutoplay,
  toggleHideOnPlaylist,
  onPlayItem,
  onRemoveItem,
} = usePlaylistTransport(transportPlaylistVideos, transportConversationId);
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
      <PlaylistTransportBar
        :playing="activePlaybackPlaying"
        :can-toggle-playback="canTogglePlayback"
        :playback-toggle-title="playbackToggleTitle"
        :has-active-playback="hasActivePlayback"
        :autoplay-enabled="playlistAutoplayEnabled"
        :popout-hidden="popoutHidden"
        :now-playing-title="activePlaybackTitle"
        @toggle-playback="toggleActivePlayback"
        @stop-playback="stopActivePlayback"
        @toggle-autoplay="togglePlaylistAutoplay"
        @toggle-popout-visibility="toggleHideOnPlaylist"
      />
      <div
        class="chat-right-panel__scrollable chat-right-panel__playlist-items"
      >
        <PlaylistItem
          v-for="(item, index) in playlistVideos"
          :key="`${item.videoUrl}-${index}`"
          :item="item"
          :is-active="activePlaybackVideoUrl === item.videoUrl"
          @play="onPlayItem(item)"
          @remove="onRemoveItem(item.videoUrl)"
        />
      </div>
    </div>

    <div v-if="rightPanelView === 'history'" class="chat-right-panel__history">
      <ExpandableMessageList
        :items="messageListItems"
        :on-click="(i: number) => emit('promptClick', i)"
        :on-toggle-include="(i: number) => emit('toggleInclude', i)"
        :on-delete-item="(i: number) => emit('deleteItem', i)"
        :on-branch-out="(i: number) => emit('branchOut', i)"
        :expand-all="true"
        :show-role="false"
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

.chat-right-panel__playlist {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);
  flex: 1 1 auto;
  min-height: 0;
}

.chat-right-panel__playlist-items {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-1);
}
</style>

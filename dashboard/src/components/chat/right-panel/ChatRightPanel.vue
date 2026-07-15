<script setup lang="ts">
import {
  FileImage,
  History,
  ListVideo,
  Pause,
  Play,
  Repeat,
  Square,
} from '@lucide/vue';
import { computed } from 'vue';

import type { Conversation } from '@/stores/conversation';
import type { VideoGalleryItem } from '@/types/harness-response-data.model';

import { getApiUrl } from '../../../api/api-url';
import ExpandableMessageList from '../../shared/ui/expandable-message-list/ExpandableMessageList.vue';
import type { MessageListItem } from '../../shared/ui/expandable-message-list/types';
import type { RightPanelView } from '../composables/use-chat-panel';
import {
  activePlaybackControlSupported,
  activePlaybackPlaying,
  activePlaybackVideoUrl,
  launchVideo,
  playlistAutoplayEnabled,
  removePlaylistVideo,
  stopActivePlayback,
  toggleActivePlayback,
  togglePlaylistAutoplay,
} from '../exchange-list/chat-exchange/exchange-content/assistant-response/composables/video-playback.state';
import AttachmentCard from './attachment-card/AttachmentCard.vue';
import type { AttachmentItem } from './composables/use-attachment-list';
import PlaylistItem from './playlist-item/PlaylistItem.vue';

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
}>();

const hasAttachments = computed(() => props.attachments.length > 0);
const hasHistory = computed(() => props.messageListItems.length > 0);
const hasPlaylist = computed(() => props.playlistVideos.length > 0);

const hasActivePlayback = computed(() => Boolean(activePlaybackVideoUrl.value));
const canTogglePlayback = computed(
  () => hasActivePlayback.value && activePlaybackControlSupported.value,
);
const playbackToggleTitle = computed(() => {
  if (!hasActivePlayback.value) return 'Nothing is playing';
  if (!activePlaybackControlSupported.value)
    return 'Playback controls unavailable for this provider';
  return activePlaybackPlaying.value ? 'Pause' : 'Play';
});

const filesTabClass = computed(() =>
  makeTabClass(props.rightPanelView === 'files'),
);
const playlistTabClass = computed(() =>
  makeTabClass(props.rightPanelView === 'playlist'),
);
const historyTabClass = computed(() =>
  makeTabClass(props.rightPanelView === 'history'),
);

function makeTabClass(isActive: boolean) {
  return {
    'chat-right-panel__tab': true,
    'chat-right-panel__tab--active': isActive,
  };
}

function previewUrl(item: AttachmentItem): string {
  if (!item.isUploaded) return item.previewUrl;
  if (!props.conversation?.id) return '';
  return getApiUrl(
    `/api/v1/storage/${props.conversation.id}/${props.conversation.conversationId}/${item.hash}`,
  );
}

function onPromptClick(idx: number) {
  emit('promptClick', idx);
}
</script>

<template>
  <div class="chat-right-panel">
    <div class="chat-right-panel__tabs">
      <button
        v-if="hasAttachments"
        :class="filesTabClass"
        @click="emit('selectView', 'files')"
      >
        <FileImage class="chat-right-panel__tab-icon" />
        Files
      </button>
      <button
        v-if="hasPlaylist"
        :class="playlistTabClass"
        @click="emit('selectView', 'playlist')"
      >
        <ListVideo class="chat-right-panel__tab-icon" />
        Playlist
      </button>
      <button
        v-if="hasHistory"
        :class="historyTabClass"
        @click="emit('selectView', 'history')"
      >
        <History class="chat-right-panel__tab-icon" />
        History
      </button>
    </div>

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
      <div class="chat-right-panel__playlist-bar">
        <button
          type="button"
          class="chat-right-panel__transport-button"
          :disabled="!canTogglePlayback"
          :title="playbackToggleTitle"
          :aria-label="playbackToggleTitle"
          @click="toggleActivePlayback"
        >
          <Pause
            v-if="activePlaybackPlaying"
            class="chat-right-panel__transport-icon"
          />
          <Play v-else class="chat-right-panel__transport-icon" />
        </button>
        <button
          type="button"
          class="chat-right-panel__transport-button"
          :disabled="!hasActivePlayback"
          title="Stop playback"
          aria-label="Stop playback"
          @click="stopActivePlayback"
        >
          <Square class="chat-right-panel__transport-icon" />
        </button>
        <button
          type="button"
          class="chat-right-panel__transport-button"
          :class="{
            'chat-right-panel__transport-button--active':
              playlistAutoplayEnabled,
          }"
          :aria-pressed="playlistAutoplayEnabled"
          :title="
            playlistAutoplayEnabled
              ? 'Autoplay on: the next video starts when one ends'
              : 'Autoplay off'
          "
          aria-label="Toggle autoplay"
          @click="togglePlaylistAutoplay"
        >
          <Repeat class="chat-right-panel__transport-icon" />
        </button>
      </div>
      <div
        class="chat-right-panel__scrollable chat-right-panel__playlist-items"
      >
        <PlaylistItem
          v-for="(item, index) in playlistVideos"
          :key="`${item.videoUrl}-${index}`"
          :item="item"
          :is-active="activePlaybackVideoUrl === item.videoUrl"
          @play="
            launchVideo(item, {
              videos: playlistVideos,
              conversationId: conversation?.id ?? '',
            })
          "
          @remove="removePlaylistVideo(conversation?.id ?? '', item.videoUrl)"
        />
      </div>
    </div>

    <div v-if="rightPanelView === 'history'" class="chat-right-panel__history">
      <ExpandableMessageList
        :items="messageListItems"
        :on-click="onPromptClick"
        :expand-all="true"
        class="chat-right-panel__scrollable"
      />
    </div>
  </div>
</template>

<style scoped>
.chat-right-panel {
  display: flex;
  flex-direction: column;
  max-height: calc(100vh - 10.1rem);
}

.chat-right-panel__tabs {
  display: flex;
  gap: var(--spacing-1);
  margin-bottom: var(--spacing-2);
}

.chat-right-panel__tab {
  flex: 1 1 0%;
  padding: var(--spacing-2);
  font-size: 0.75rem;
  font-family: var(--font-mono);
  cursor: pointer;
  transition:
    color 0.2s ease,
    background-color 0.2s ease;
  color: var(--color-fg-muted);
  background-color: transparent;
  border: none;
}

.chat-right-panel__tab:hover {
  color: var(--color-fg-primary);
  background-color: var(--color-bg-tertiary);
}

.chat-right-panel__tab--active {
  color: var(--color-accent-primary);
  background-color: var(--color-bg-tertiary);
}

.chat-right-panel__tab-icon {
  display: inline;
  width: 0.75rem;
  height: 0.75rem;
  margin-right: var(--spacing-1);
  vertical-align: middle;
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

.chat-right-panel__playlist-bar {
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-1);
  flex-shrink: 0;
}

.chat-right-panel__transport-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-1) var(--spacing-2);
  border: 1px solid var(--color-divider);
  background-color: transparent;
  font-size: 0.7rem;
  font-family: var(--font-mono);
  color: var(--color-fg-muted);
  cursor: pointer;
  transition:
    color 0.2s ease,
    border-color 0.2s ease,
    background-color 0.2s ease;
}

.chat-right-panel__transport-button:hover:not(:disabled) {
  color: var(--color-fg-primary);
  border-color: var(--color-accent-border);
}

.chat-right-panel__transport-button:disabled {
  opacity: 0.4;
  cursor: default;
}

.chat-right-panel__transport-button--active {
  color: var(--color-accent-primary);
  border-color: var(--color-accent-primary);
  background-color: color-mix(
    in srgb,
    var(--color-accent-primary) 10%,
    transparent
  );
}

.chat-right-panel__transport-icon {
  width: 0.75rem;
  height: 0.75rem;
}

.chat-right-panel__playlist-items {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);
}
</style>

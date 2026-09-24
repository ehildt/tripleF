<script setup lang="ts">
import { useRightToolbarStore } from '@/stores/right-toolbar';

import Files from './tabs/files/Files.vue';
import History from './tabs/history/History.vue';
import PlaylistPanel from './tabs/playlist/PlaylistPanel.vue';
import Tabs from './tabs/Tabs.vue';
import type { ChatRightToolbarProps } from './ChatRightToolbar.types';

defineProps<ChatRightToolbarProps>();

const emit = defineEmits<{
  promptClick: [index: number];
  copy: [index: number];
  toggleInclude: [index: number];
  toggleMerge: [index: number];
  deleteItem: [index: number];
  branchOut: [index: number];
}>();

const toolbarStore = useRightToolbarStore();
</script>

<template>
  <div class="chat-right-toolbar">
    <Tabs
      :active-view="toolbarStore.rightToolbarView"
      :has-attachments="toolbarStore.hasAttachments"
      :has-playlist="toolbarStore.hasPlaylist"
      :has-history="toolbarStore.hasHistory"
      @select-view="toolbarStore.selectView"
    />

    <Files
      v-if="
        toolbarStore.rightToolbarView === 'files' && toolbarStore.hasAttachments
      "
    />
    <PlaylistPanel
      v-else-if="
        toolbarStore.rightToolbarView === 'playlist' && toolbarStore.hasPlaylist
      "
    />
    <History
      v-else-if="toolbarStore.rightToolbarView === 'history'"
      :message-list-items="messageListItems"
      :active-user-exchange-id="activeUserExchangeId"
      :can-merge="canMerge"
      :merge-armed="mergeArmed"
      @prompt-click="emit('promptClick', $event)"
      @copy="emit('copy', $event)"
      @toggle-include="emit('toggleInclude', $event)"
      @toggle-merge="emit('toggleMerge', $event)"
      @delete-item="emit('deleteItem', $event)"
      @branch-out="emit('branchOut', $event)"
    />
  </div>
</template>

<style scoped>
.chat-right-toolbar {
  display: flex;
  flex-direction: column;
  max-height: calc(100vh - 6rem);
  gap: var(--spacing-0-5);
}
</style>

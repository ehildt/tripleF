<script setup lang="ts">
import { FileImage, History, ListVideo } from '@lucide/vue';

import type { RightPanelView } from '../../types/right-panel-view.type';

const props = defineProps<{
  activeView: RightPanelView;
  hasAttachments: boolean;
  hasPlaylist: boolean;
  hasHistory: boolean;
}>();

const emit = defineEmits<{
  selectView: [view: RightPanelView];
}>();

function tabClass(view: RightPanelView) {
  return {
    'right-panel-tabs__tab': true,
    'right-panel-tabs__tab--active': props.activeView === view,
  };
}
</script>

<template>
  <div class="right-panel-tabs">
    <button
      v-if="hasAttachments"
      :class="tabClass('files')"
      @click="emit('selectView', 'files')"
    >
      <FileImage class="right-panel-tabs__tab-icon" />
      Files
    </button>
    <button
      v-if="hasPlaylist"
      :class="tabClass('playlist')"
      @click="emit('selectView', 'playlist')"
    >
      <ListVideo class="right-panel-tabs__tab-icon" />
      Playlist
    </button>
    <button
      v-if="hasHistory"
      :class="tabClass('history')"
      @click="emit('selectView', 'history')"
    >
      <History class="right-panel-tabs__tab-icon" />
      History
    </button>
  </div>
</template>

<style scoped>
.right-panel-tabs {
  display: flex;
  gap: var(--spacing-1);
  margin-bottom: var(--spacing-2);
}

.right-panel-tabs__tab {
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

.right-panel-tabs__tab:hover {
  color: var(--color-fg-primary);
  background-color: var(--color-bg-tertiary);
}

.right-panel-tabs__tab--active {
  color: var(--color-accent-primary);
  background-color: var(--color-bg-tertiary);
}

.right-panel-tabs__tab-icon {
  display: inline;
  width: 0.75rem;
  height: 0.75rem;
  margin-right: var(--spacing-1);
  vertical-align: middle;
}
</style>

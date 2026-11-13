<script setup lang="ts">
/**
 * Name editor and actions shown at the top of the saved-playlists menu. Load
 * imports a JSON file and Plus (or Enter) creates a playlist from the drafted
 * name. Escape asks the parent to close.
 */
import { FolderOpen, Plus } from '@lucide/vue';

import IconButton from '@/components/shared/ui/icon-button/IconButton.vue';
import Tooltip from '@/components/shared/ui/tooltip/Tooltip.vue';

import type {
  PlaylistNameRowEmits,
  PlaylistNameRowProps,
} from './PlaylistNameRow.types';

defineProps<PlaylistNameRowProps>();

const emit = defineEmits<PlaylistNameRowEmits>();

/** Draft playlist name, synchronized with the menu's v-model. */
const playlistName = defineModel<string>('playlistName', { required: true });
</script>

<template>
  <div class="playlist-name-row">
    <Tooltip :text="$t('common.typeNameToSavePlaylist')">
      <input
        v-model="playlistName"
        type="text"
        name="playlist-name"
        class="playlist-name-row__input"
        :placeholder="$t('common.nameThisPlaylist')"
        :aria-label="$t('common.playlistName')"
        @keydown.enter.prevent="emit('create')"
        @keydown.esc="emit('close')"
      />
    </Tooltip>
    <div class="playlist-name-row__actions">
      <IconButton
        size="sm"
        :title="$t('common.savePlaylist')"
        :aria-label="$t('common.savePlaylist')"
        :disabled="isCreateDisabled"
        @mousedown.prevent
        @click="emit('create')"
      >
        <Plus />
      </IconButton>
      <IconButton
        size="sm"
        :title="$t('common.loadPlaylistFromFile')"
        :aria-label="$t('common.loadPlaylistFromFile')"
        @mousedown.prevent
        @click="emit('loadFile')"
      >
        <FolderOpen />
      </IconButton>
    </div>
  </div>
</template>

<style scoped>
.playlist-name-row {
  display: flex;
  align-items: center;
  gap: var(--spacing-1-5);
  padding: var(--spacing-1-5) var(--spacing-2);
  background-color: var(--color-bg-tertiary);
  border: 1px solid var(--color-divider);
  width: 100%;
  box-sizing: border-box;
  transition: border-color 0.2s ease;
}

.playlist-name-row:focus-within {
  border-color: var(--color-accent-primary);
}

.playlist-name-row__input {
  flex: 1;
  min-width: 0;
  padding: 0;
  border: none;
  background: transparent;
  font-size: 0.75rem;
  font-family: var(--font-mono);
  color: var(--color-fg-secondary);
  outline: none;
}

.playlist-name-row__input::placeholder {
  color: var(--color-fg-muted);
}

.playlist-name-row__input:focus {
  color: var(--color-fg-primary);
}

.playlist-name-row__actions {
  display: flex;
  align-items: center;
  gap: var(--spacing-1);
  flex-shrink: 0;
  margin-left: auto;
  padding: 0;
}
</style>

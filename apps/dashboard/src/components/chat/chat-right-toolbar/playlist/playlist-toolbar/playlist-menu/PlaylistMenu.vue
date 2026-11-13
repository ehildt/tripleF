<script setup lang="ts">
/**
 * Saved-playlists menu of the floating playlist toolbar. The trigger opens a
 * name editor followed by the saved playlists. PlaylistNameRow owns the draft
 * input and file/create actions; PlaylistMenuItem owns selection, export,
 * rename, and deletion. Open/close wiring comes from the shared useDropdown composable.
 */
import { ListVideo } from '@lucide/vue';
import { ref } from 'vue';

import { useDropdown } from '@/components/shared/ui/drop-down/composables/use-dropdown';
import Tooltip from '@/components/shared/ui/tooltip/Tooltip.vue';

import PlaylistMenuItem from './playlist-menu-item/PlaylistMenuItem.vue';
import PlaylistNameRow from './playlist-name-row/PlaylistNameRow.vue';
import type {
  PlaylistMenuEmits,
  PlaylistMenuProps,
} from './PlaylistMenu.types';

defineProps<PlaylistMenuProps>();

const emit = defineEmits<PlaylistMenuEmits>();

/** Name being typed for a new playlist (the v-model of the input field). */
const playlistName = defineModel<string>('playlistName', { required: true });

const containerRef = ref<HTMLElement | null>(null);

// The list entries handle their own select (load on focus), so the dropdown
// stays open for management — no select callback here.
const { open, toggle, close } = useDropdown(containerRef, () => {});
</script>

<template>
  <div ref="containerRef" class="playlist-menu">
    <Tooltip :text="$t('common.savedPlaylists')">
      <button
        type="button"
        class="playlist-menu__trigger"
        :class="{ 'playlist-menu__trigger--active': open }"
        :aria-label="$t('common.savedPlaylists')"
        @click.stop="toggle"
        @pointerdown.stop
      >
        <ListVideo class="playlist-menu__trigger-icon" />
      </button>
    </Tooltip>
    <Transition name="playlist-menu">
      <div v-if="open" class="playlist-menu__menu" @click.stop>
        <PlaylistNameRow
          v-model:playlist-name="playlistName"
          :is-create-disabled="!playlistName.trim()"
          @load-file="emit('loadFile')"
          @create="emit('create')"
          @close="close"
        />
        <PlaylistMenuItem
          v-for="name in playlists"
          :key="name"
          :name="name"
          :is-active="name === activePlaylistName"
          @select="emit('select', name)"
          @save="emit('saveFile', name)"
          @rename="(newName) => emit('rename', name, newName)"
          @delete="emit('delete', name)"
        />
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.playlist-menu {
  position: relative;
  flex-shrink: 0;
}

/* Icon-only trigger matching the transport row's icon buttons. */
.playlist-menu__trigger {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-1) var(--spacing-2);
  border: none;
  background-color: transparent;
  color: var(--color-fg-muted);
  cursor: pointer;
  transition:
    color 0.2s ease,
    background-color 0.2s ease;
}

.playlist-menu__trigger:hover {
  color: var(--color-accent-primary);
}

.playlist-menu__trigger--active {
  color: var(--color-accent-primary);
  background-color: color-mix(
    in srgb,
    var(--color-accent-primary) 10%,
    transparent
  );
}

.playlist-menu__trigger-icon {
  width: 0.75rem;
  height: 0.75rem;
}

/* Dropdown, styled like the conversations menu: elevated surface, divider
   border, floating shadow, and a padded column with a gap between fields. */
.playlist-menu__menu {
  position: absolute;
  z-index: 50;
  top: 100%;
  right: 0;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-1);
  width: 14rem;
  max-width: calc(100vw - 2rem);
  margin-top: var(--spacing-1);
  padding: var(--spacing-1);
  background-color: var(--color-bg-elevated);
  border: 1px solid var(--color-divider);
  box-shadow: 0 10px 15px -3px
    color-mix(in srgb, var(--color-bg-primary) 10%, transparent);
  max-height: 14rem;
  overflow-y: auto;
  overscroll-behavior: contain;
}

.playlist-menu-enter-active,
.playlist-menu-leave-active {
  transition:
    max-height 150ms ease,
    opacity 150ms ease;
  overflow: hidden;
}

.playlist-menu-enter-from,
.playlist-menu-leave-to {
  max-height: 0;
  opacity: 0;
}

.playlist-menu-enter-to,
.playlist-menu-leave-from {
  max-height: 14rem;
  opacity: 1;
}
</style>

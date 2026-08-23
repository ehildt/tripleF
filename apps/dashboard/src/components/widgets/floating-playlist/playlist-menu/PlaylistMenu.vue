<script setup lang="ts">
/**
 * Saved-playlists menu of the floating playlist: an icon-only trigger in
 * the toolbar row opens a menu with the playlist name field as the first
 * row and the saved playlists below. Picking a saved playlist loads it
 * immediately (autoload — there is deliberately no load button, and no
 * checkmarks). Open/close wiring (click outside, Escape) comes from the
 * shared useDropdown composable.
 *
 * The name field is a card matching the created entries: a borderless input
 * plus a Plus button to its right (both inside a bordered surface). The Plus
 * button (or Enter) saves the typed name as a new playlist and the field
 * clears for the next one. Each saved playlist in the list is an editable
 * name input carrying its own Edit and Trash buttons: focusing it loads the
 * playlist, the Edit button enables renaming, and emptying the field deletes
 * it. The active playlist is tinted. Styling mirrors the conversations menu
 * (bg-tertiary inputs and bordered list cards).
 */
import { Library, Plus } from '@lucide/vue';
import { ref } from 'vue';

import { useDropdown } from '@/components/shared/ui/drop-down/use-dropdown';
import Tooltip from '@/components/shared/ui/tooltip/Tooltip.vue';

import PlaylistMenuItem from './playlist-menu-item/PlaylistMenuItem.vue';

defineProps<{
  /** Name being typed for a new playlist (the v-model of the input field). */
  playlistName: string;
  /** Names of the saved playlists, listed below the name field. */
  playlists: readonly string[];
  /** Name of the active playlist, tinted in the list. */
  activePlaylistName: string;
}>();

const emit = defineEmits<{
  'update:playlistName': [name: string];
  select: [name: string];
  /** Save the typed name as a playlist (Plus button or Enter). */
  create: [];
  /** Rename the named saved playlist. */
  rename: [oldName: string, newName: string];
  /** Delete the named saved playlist (its Trash button). */
  delete: [name: string];
}>();

const containerRef = ref<HTMLElement | null>(null);

// The list entries handle their own select (load on focus), so the dropdown
// stays open for management — no select callback here.
const { open, toggle, close } = useDropdown(containerRef, () => {});

function onNameInput(event: Event) {
  emit('update:playlistName', (event.target as HTMLInputElement).value);
}
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
        <Library class="playlist-menu__trigger-icon" />
      </button>
    </Tooltip>
    <Transition name="playlist-menu">
      <div v-if="open" class="playlist-menu__menu" @click.stop>
        <div class="playlist-menu__name-row">
          <Tooltip :text="$t('common.typeNameToSavePlaylist')">
            <input
              :value="playlistName"
              type="text"
              name="playlist-name"
              class="playlist-menu__input"
              :placeholder="$t('common.nameThisPlaylist')"
              :aria-label="$t('common.playlistName')"
              @input="onNameInput"
              @keydown.enter.prevent="emit('create')"
              @keydown.esc="close"
            />
          </Tooltip>
          <Tooltip :text="$t('common.savePlaylist')">
            <button
              type="button"
              class="playlist-menu__name-action"
              :aria-label="$t('common.savePlaylist')"
              :disabled="!playlistName.trim()"
              @mousedown.prevent
              @click="emit('create')"
            >
              <Plus class="playlist-menu__name-action-icon" />
            </button>
          </Tooltip>
        </div>
        <template v-if="playlists.length > 0">
          <PlaylistMenuItem
            v-for="name in playlists"
            :key="name"
            :name="name"
            :is-active="name === activePlaylistName"
            @select="emit('select', name)"
            @rename="(newName) => emit('rename', name, newName)"
            @delete="emit('delete', name)"
          />
        </template>
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

/* Name field: a card matching the created entries — bordered surface with a
   borderless input and the Plus icon button outside the field. */
.playlist-menu__name-row {
  display: flex;
  align-items: center;
  gap: var(--spacing-1);
  padding: var(--spacing-1-5) var(--spacing-2);
  background-color: var(--color-bg-tertiary);
  border: 1px solid var(--color-divider);
  width: 100%;
  box-sizing: border-box;
  transition: border-color 0.2s ease;
}

.playlist-menu__name-row:focus-within {
  border-color: var(--color-accent-primary);
}

.playlist-menu__input {
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

.playlist-menu__input::placeholder {
  color: var(--color-fg-muted);
}

.playlist-menu__input:focus {
  color: var(--color-fg-primary);
}

/* Plus action button, an icon button like the entries' Edit/Trash. */
.playlist-menu__name-action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 1.5rem;
  min-height: 1.5rem;
  padding: 0.125rem;
  color: var(--color-fg-muted);
  transition: color 0.2s ease;
  cursor: pointer;
  flex-shrink: 0;
  border: none;
  background: transparent;
}

.playlist-menu__name-action:hover:not(:disabled) {
  color: var(--color-accent-primary);
}

.playlist-menu__name-action:disabled {
  opacity: 0.5;
  cursor: default;
}

.playlist-menu__name-action-icon {
  width: 0.75rem;
  height: 0.75rem;
}
</style>

<script setup lang="ts">
/**
 * Saved-playlists menu of the floating playlist: an icon-only trigger in
 * the toolbar row opens a menu with the playlist name input as the first
 * field, a divider, and the saved playlists below. Picking a saved playlist
 * loads it immediately (autoload — there is deliberately no load button,
 * and no checkmarks on the items). Open/close wiring (click outside,
 * Escape) comes from the shared useDropdown composable.
 */
import { Library } from '@lucide/vue';
import { ref } from 'vue';

import { useDropdown } from '@/components/shared/ui/drop-down/use-dropdown';

defineProps<{
  /** Name of the queue's playlist (the v-model of the first input field). */
  playlistName: string;
  /** Names of the saved playlists, listed below the divider. */
  playlists: readonly string[];
}>();

const emit = defineEmits<{
  'update:playlistName': [name: string];
  select: [name: string];
}>();

const containerRef = ref<HTMLElement | null>(null);

const { open, toggle, select, close } = useDropdown(
  containerRef,
  (name: string) => emit('select', name),
);

function onNameInput(event: Event) {
  emit('update:playlistName', (event.target as HTMLInputElement).value);
}
</script>

<template>
  <div ref="containerRef" class="playlist-menu">
    <button
      type="button"
      class="playlist-menu__trigger"
      :class="{ 'playlist-menu__trigger--active': open }"
      title="Saved playlists"
      aria-label="Saved playlists"
      @click.stop="toggle"
      @pointerdown.stop
    >
      <Library class="playlist-menu__trigger-icon" />
    </button>
    <Transition name="playlist-menu">
      <div v-if="open" class="playlist-menu__menu" @click.stop>
        <input
          :value="playlistName"
          type="text"
          class="playlist-menu__name-input"
          placeholder="Name this playlist"
          title="Type to save the queue under a name — renaming is automatic, emptying the field deletes the playlist and leaves the queue unnamed"
          aria-label="Playlist name"
          @input="onNameInput"
          @keydown.esc="close"
        />
        <hr class="playlist-menu__divider" />
        <template v-if="playlists.length > 0">
          <button
            v-for="name in playlists"
            :key="name"
            type="button"
            class="playlist-menu__item"
            :class="{ 'playlist-menu__item--active': name === playlistName }"
            @click="select(name)"
          >
            {{ name }}
          </button>
        </template>
        <span v-else class="playlist-menu__empty">No saved playlists</span>
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

.playlist-menu__menu {
  position: absolute;
  z-index: 50;
  top: 100%;
  right: 0;
  display: flex;
  flex-direction: column;
  width: 14rem;
  max-width: calc(100vw - 2rem);
  margin-top: var(--spacing-1);
  padding: var(--spacing-1-5);
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

.playlist-menu__name-input {
  width: 100%;
  padding: var(--spacing-1) var(--spacing-1-5);
  border: 1px solid var(--color-divider);
  background: var(--color-bg-secondary);
  color: var(--color-fg-primary);
  font-family: var(--font-mono);
  font-size: 0.8rem;
}

.playlist-menu__name-input::placeholder {
  color: var(--color-fg-muted);
}

.playlist-menu__name-input:focus {
  outline: none;
  border-color: var(--color-accent-active);
  box-shadow: 0 0 0 1px var(--color-accent-active);
}

.playlist-menu__divider {
  width: 100%;
  margin: var(--spacing-1-5) 0 var(--spacing-1);
  border: none;
  border-top: 1px solid var(--color-divider);
}

.playlist-menu__item {
  width: 100%;
  padding: var(--spacing-1-5) var(--spacing-1);
  border: none;
  background: none;
  text-align: left;
  font-size: 0.75rem;
  font-family: var(--font-mono);
  color: var(--color-fg-secondary);
  cursor: pointer;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  transition:
    color 0.2s ease,
    background-color 0.2s ease;
}

.playlist-menu__item:hover {
  color: var(--color-fg-primary);
  background-color: var(--color-bg-tertiary);
}

.playlist-menu__item--active {
  color: var(--color-accent-primary);
}

.playlist-menu__empty {
  padding: var(--spacing-1-5) var(--spacing-1);
  font-size: 0.7rem;
  font-family: var(--font-mono);
  color: var(--color-fg-muted);
}
</style>

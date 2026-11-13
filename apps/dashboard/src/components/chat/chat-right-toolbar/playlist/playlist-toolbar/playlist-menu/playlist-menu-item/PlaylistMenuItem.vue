<script setup lang="ts">
/**
 * One saved playlist in the floating playlist menu: a name input with a
 * right-aligned action group containing Edit, Save, and Trash buttons,
 * matching the create field's input-plus-actions layout. It is styled like the
 * conversations menu's list cards. The name is read-only until the user
 * clicks Edit; clicking the read-only field loads the playlist (autoload),
 * and blurring the field renames it or deletes it when emptied (same as the
 * Trash button).
 */
import { Pencil, Save, Trash2 } from '@lucide/vue';
import { ref } from 'vue';

import IconButton from '@/components/shared/ui/icon-button/IconButton.vue';

import type {
  PlaylistMenuItemEmits,
  PlaylistMenuItemProps,
} from './PlaylistMenuItem.types';

const props = defineProps<PlaylistMenuItemProps>();

const emit = defineEmits<PlaylistMenuItemEmits>();

const inputRef = ref<HTMLInputElement | null>(null);
const isEditing = ref(false);
const value = ref(props.name);

function startEditing() {
  isEditing.value = true;
  inputRef.value?.focus();
}

function finishEditing() {
  inputRef.value?.blur(); // triggers onBlur
}

/** Clicking the read-only field loads the playlist; while editing, a click
 * just positions the caret. */
function onNameFieldClick() {
  if (!isEditing.value) emit('select');
}

/** The pencil toggles the field between read-only and editing. */
function toggleNameEditing() {
  if (isEditing.value) finishEditing();
  else startEditing();
}

function onBlur() {
  const trimmed = value.value.trim();
  if (!trimmed) {
    emit('delete');
  } else if (trimmed !== props.name) {
    emit('rename', trimmed);
  }
  // Revert to the saved name: a successful rename remounts this entry with
  // the new name; a failed one (taken name) leaves the field showing the
  // saved name again.
  value.value = props.name;
  isEditing.value = false;
}
</script>

<template>
  <div
    class="playlist-menu-item"
    :class="{ 'playlist-menu-item--active': isActive }"
  >
    <input
      ref="inputRef"
      v-model="value"
      type="text"
      class="playlist-menu-item__input"
      :class="{ 'playlist-menu-item__input--editing': isEditing }"
      :readonly="!isEditing"
      :aria-label="$t('common.playlistNameLabel', { name })"
      @click="onNameFieldClick"
      @blur="onBlur"
      @keydown.enter.prevent="finishEditing"
    />
    <div class="playlist-menu-item__actions">
      <IconButton
        size="sm"
        :active="isEditing"
        :title="
          isEditing ? $t('common.finishEditing') : $t('common.renamePlaylist')
        "
        @mousedown.prevent
        @click="toggleNameEditing"
      >
        <Pencil />
      </IconButton>
      <IconButton
        size="sm"
        :title="$t('common.savePlaylistToFile', { name })"
        :aria-label="$t('common.savePlaylistToFile', { name })"
        @mousedown.prevent
        @click="emit('save')"
      >
        <Save />
      </IconButton>
      <IconButton
        size="sm"
        danger
        :title="$t('common.deletePlaylist', { name })"
        @mousedown.prevent
        @click="emit('delete')"
      >
        <Trash2 />
      </IconButton>
    </div>
  </div>
</template>

<style scoped>
.playlist-menu-item {
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

.playlist-menu-item--active {
  border-color: var(--color-accent-primary);
}

.playlist-menu-item__actions {
  display: flex;
  align-items: center;
  gap: var(--spacing-1);
  flex-shrink: 0;
  margin-left: auto;
  padding: 0;
}

.playlist-menu-item__input {
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

.playlist-menu-item--active .playlist-menu-item__input {
  color: var(--color-accent-primary);
}

/* Editing the field takes precedence over both the resting and active tones. */
.playlist-menu-item__input--editing {
  color: var(--color-fg-primary);
}

/* Not editing: the field reads the saved name like a label — dimmed, with a
   pointer cursor so it is still clickable to load the playlist. */
.playlist-menu-item__input:read-only {
  cursor: pointer;
  opacity: 0.8;
}
</style>

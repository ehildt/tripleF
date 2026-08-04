<script setup lang="ts">
/**
 * One saved playlist in the floating playlist menu: a name input with an
 * Edit button and a Trash button to its right (the icons sit outside the
 * field, like the create field's Plus button), styled like the
 * conversations menu's list cards. The name is read-only until the user
 * clicks Edit; clicking the read-only field loads the playlist (autoload),
 * and blurring the field renames it or deletes it when emptied (same as the
 * Trash button).
 */
import { Pencil, Trash2 } from '@lucide/vue';
import { ref } from 'vue';

const props = defineProps<{
  /** The saved playlist's name. */
  name: string;
  /** Whether this is the active playlist (tinted). */
  isActive: boolean;
}>();

const emit = defineEmits<{
  /** The read-only field was clicked — load this playlist. */
  select: [];
  /** The field was edited and blurred — rename to this value. */
  rename: [newName: string];
  /** Delete this playlist (Trash button or emptied field). */
  delete: [];
}>();

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
      :aria-label="`Playlist name ${name}`"
      @click="!isEditing && emit('select')"
      @blur="onBlur"
      @keydown.enter.prevent="finishEditing"
    />
    <button
      type="button"
      class="playlist-menu-item__edit"
      :class="{ 'playlist-menu-item__edit--active': isEditing }"
      :title="isEditing ? 'Finish editing' : 'Rename playlist'"
      :aria-label="isEditing ? 'Finish editing' : 'Rename playlist'"
      @mousedown.prevent
      @click="isEditing ? finishEditing() : startEditing()"
    >
      <Pencil class="playlist-menu-item__edit-icon" />
    </button>
    <button
      type="button"
      class="playlist-menu-item__delete"
      :title="`Delete playlist ${name}`"
      :aria-label="`Delete playlist ${name}`"
      @mousedown.prevent
      @click="emit('delete')"
    >
      <Trash2 class="playlist-menu-item__delete-icon" />
    </button>
  </div>
</template>

<style scoped>
.playlist-menu-item {
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

.playlist-menu-item--active {
  border-color: var(--color-accent-primary);
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

.playlist-menu-item__edit,
.playlist-menu-item__delete {
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

.playlist-menu-item__edit:hover,
.playlist-menu-item__edit--active {
  color: var(--color-accent-primary);
}

.playlist-menu-item__delete:hover {
  color: var(--color-status-error);
}

.playlist-menu-item__edit-icon,
.playlist-menu-item__delete-icon {
  width: 0.75rem;
  height: 0.75rem;
}
</style>

<script setup lang="ts">
/**
 * One compact row of the playlist panel: title and meta on the left, a
 * remove button on the right. Clicking the row launches the video in the
 * floating player.
 */
import { X } from '@lucide/vue';
import { computed } from 'vue';

import type { VideoGalleryItem } from '@/types/harness-response-data.model';

const props = defineProps<{
  item: VideoGalleryItem;
  isActive: boolean;
}>();

const emit = defineEmits<{
  play: [];
  remove: [];
}>();

const metaLine = computed(() =>
  [props.item.channel, props.item.duration, props.item.date]
    .filter(Boolean)
    .join(' · '),
);
</script>

<template>
  <div
    class="playlist-item"
    :class="{ 'playlist-item--active': isActive }"
    role="button"
    tabindex="0"
    :aria-label="`Play: ${item.title || 'video'}`"
    @click="emit('play')"
    @keydown.enter="emit('play')"
  >
    <div class="playlist-item__text">
      <span class="playlist-item__title">{{ item.title }}</span>
      <span v-if="metaLine" class="playlist-item__meta">{{ metaLine }}</span>
    </div>
    <button
      type="button"
      class="playlist-item__remove"
      title="Remove from playlist"
      :aria-label="`Remove from playlist: ${item.title || 'video'}`"
      @click.stop="emit('remove')"
    >
      <X class="playlist-item__remove-icon" />
    </button>
  </div>
</template>

<style scoped>
.playlist-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  padding: var(--spacing-1-5) var(--spacing-2);
  border: 1px solid var(--color-divider);
  background-color: var(--color-bg-secondary);
  cursor: pointer;
  margin-right: var(--spacing-2);
  transition:
    border-color 0.2s ease,
    background-color 0.2s ease;
}

.playlist-item:hover {
  border-color: var(--color-accent-border);
  background-color: color-mix(
    in srgb,
    var(--color-bg-secondary) 85%,
    var(--color-accent-primary)
  );
}

.playlist-item--active {
  border-color: var(--color-accent-primary);
  box-shadow: 0 0 0 1px
    color-mix(in srgb, var(--color-accent-primary) 45%, transparent);
}

.playlist-item__text {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
  min-width: 0;
  flex: 1;
}

.playlist-item__title {
  font-size: 0.8rem;
  font-weight: 600;
  line-height: 1.3;
  color: var(--color-fg-primary);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.playlist-item__meta {
  font-size: 0.7rem;
  font-family: var(--font-mono);
  color: var(--color-fg-muted);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.playlist-item__remove {
  flex-shrink: 0;
  display: grid;
  place-items: center;
  width: 1.25rem;
  height: 1.25rem;
  border: none;
  background: none;
  color: var(--color-fg-muted);
  cursor: pointer;
  transition: color 0.2s ease;
}

.playlist-item__remove:hover {
  color: var(--color-status-error);
}

.playlist-item__remove-icon {
  width: 0.75rem;
  height: 0.75rem;
}
</style>

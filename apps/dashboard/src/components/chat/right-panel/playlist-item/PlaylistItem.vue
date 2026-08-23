<script setup lang="ts">
/**
 * One compact row of the playlist panel: title and meta on the left, a
 * remove button on the right. Clicking the row launches the video in the
 * floating player. The active (now-playing) item scrolls its title in
 * place — the animated now-playing text lives inside the selected item,
 * not in a separate bar.
 */
import { ListMinus } from '@lucide/vue';
import { computed } from 'vue';

import IconButton from '@/components/shared/ui/icon-button/IconButton.vue';
import Marquee from '@/components/shared/ui/marquee/Marquee.vue';
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
    :aria-label="$t('common.playItem', { title: item.title || 'video' })"
    @click="emit('play')"
    @keydown.enter="emit('play')"
  >
    <div class="playlist-item__text">
      <!-- Now playing: the title scrolls as a seamless marquee inside the
           selected item. -->
      <Marquee
        v-if="isActive"
        class="playlist-item__marquee"
        :text="item.title"
      />
      <span v-else class="playlist-item__title">{{ item.title }}</span>
      <span v-if="metaLine" class="playlist-item__meta">{{ metaLine }}</span>
    </div>
    <IconButton
      size="sm"
      danger
      :title="$t('common.removeFromPlaylist')"
      :aria-label="
        $t('common.removeFromPlaylistItem', {
          title: item.title || 'video',
        })
      "
      @click.stop="emit('remove')"
    >
      <ListMinus />
    </IconButton>
  </div>
</template>

<style scoped>
.playlist-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-1);
  padding: var(--spacing-1) var(--spacing-1-5);
  border: 1px solid var(--color-divider);
  background-color: var(--color-bg-secondary);
  cursor: pointer;
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
  font-size: 0.625rem;
  font-family: var(--font-mono);
  color: color-mix(in srgb, var(--color-fg-muted) 50%, transparent);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Now-playing marquee: same typography as the static title, scrolling in
   place (endless left loop, matching the playlist bar and popout). */
.playlist-item__marquee {
  font-size: 0.625rem;
  font-family: var(--font-mono);
  color: color-mix(in srgb, var(--color-fg-muted) 50%, transparent);
}

.playlist-item__meta {
  font-size: 0.625rem;
  font-family: var(--font-mono);
  color: var(--color-fg-muted);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>

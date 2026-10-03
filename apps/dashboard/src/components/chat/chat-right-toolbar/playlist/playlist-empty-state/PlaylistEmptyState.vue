<script setup lang="ts">
import { Library, ListMinus, ListPlus } from '@lucide/vue';

import type { PlaylistEmptyStateProps } from './PlaylistEmptyState.types';

defineProps<PlaylistEmptyStateProps>();
</script>

<template>
  <div class="playlist-empty-state">
    <p v-if="hasPlaylists" class="playlist-empty-state__message">
      {{ $t('common.noVideosInPlaylist') }}
    </p>
    <div class="playlist-empty-state__hints">
      <template v-if="hasPlaylists">
        <span class="playlist-empty-state__hint">
          <ListPlus class="playlist-empty-state__hint-icon" />
          {{ $t('common.addToPlaylist') }}
        </span>
        <span class="playlist-empty-state__hint">
          <ListMinus class="playlist-empty-state__hint-icon" />
          {{ $t('common.removeFromPlaylist') }}
        </span>
      </template>
      <span v-else class="playlist-empty-state__hint">
        <Library class="playlist-empty-state__hint-icon" />
        {{ $t('common.createPlaylist') }}
      </span>
    </div>
  </div>
</template>

<style scoped>
/* Empty state: a short message with the add/remove toggle hints below it. */
.playlist-empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-2);
  padding: 3rem var(--spacing-4);
  text-align: center;
  background-color: var(--color-bg-elevated);
}

.playlist-empty-state__message {
  margin: 0;
  font-size: 0.875rem;
  font-family: var(--font-mono);
  color: var(--color-fg-muted);
}

.playlist-empty-state__hints {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-1);
}

.playlist-empty-state__hint {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-1-5);
  font-size: 0.75rem;
  font-family: var(--font-mono);
  color: color-mix(in srgb, var(--color-fg-muted) 70%, transparent);
}

.playlist-empty-state__hint-icon {
  width: 0.875rem;
  height: 0.875rem;
  flex-shrink: 0;
  color: var(--color-fg-muted);
}
</style>

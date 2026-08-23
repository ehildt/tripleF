<script setup lang="ts">
import { Eye, EyeOff, Pause, Play, Repeat, Square } from '@lucide/vue';

import Marquee from '../../../shared/ui/marquee/Marquee.vue';
import Tooltip from '../../../shared/ui/tooltip/Tooltip.vue';

withDefaults(
  defineProps<{
    playing: boolean;
    canTogglePlayback: boolean;
    playbackToggleTitle: string;
    hasActivePlayback: boolean;
    autoplayEnabled: boolean;
    popoutHidden: boolean;
    nowPlayingTitle?: string;
    /** Whether the bar carries the now-playing marquee (default true).
     *  Surfaces that place the marquee elsewhere turn it off here. */
    showNowPlaying?: boolean;
  }>(),
  { nowPlayingTitle: '', showNowPlaying: true },
);

const emit = defineEmits<{
  togglePlayback: [];
  stopPlayback: [];
  toggleAutoplay: [];
  togglePopoutVisibility: [];
}>();
</script>

<template>
  <div class="playlist-transport-bar">
    <div class="playlist-transport-bar__transport">
      <Tooltip :text="playbackToggleTitle" :disabled="!canTogglePlayback">
        <button
          type="button"
          class="playlist-transport-bar__transport-button"
          :disabled="!canTogglePlayback"
          :aria-label="playbackToggleTitle"
          @click="emit('togglePlayback')"
        >
          <Pause
            v-if="playing"
            class="playlist-transport-bar__transport-icon"
          />
          <Play v-else class="playlist-transport-bar__transport-icon" />
        </button>
      </Tooltip>
      <Tooltip :text="$t('common.stopPlayback')" :disabled="!hasActivePlayback">
        <button
          type="button"
          class="playlist-transport-bar__transport-button"
          :disabled="!hasActivePlayback"
          :aria-label="$t('common.stopPlayback')"
          @click="emit('stopPlayback')"
        >
          <Square class="playlist-transport-bar__transport-icon" />
        </button>
      </Tooltip>
      <Tooltip
        :text="
          autoplayEnabled
            ? $t('common.autoplayOnHint')
            : $t('common.autoplayOff')
        "
      >
        <button
          type="button"
          class="playlist-transport-bar__transport-button"
          :class="{
            'playlist-transport-bar__transport-button--active': autoplayEnabled,
          }"
          :aria-pressed="autoplayEnabled"
          :aria-label="$t('common.toggleAutoplay')"
          @click="emit('toggleAutoplay')"
        >
          <Repeat class="playlist-transport-bar__transport-icon" />
        </button>
      </Tooltip>
      <Tooltip
        :text="
          popoutHidden
            ? $t('common.popupHiddenHint')
            : $t('common.showPopupHint')
        "
      >
        <button
          type="button"
          class="playlist-transport-bar__transport-button"
          :class="{
            'playlist-transport-bar__transport-button--active': popoutHidden,
          }"
          :aria-pressed="popoutHidden"
          :aria-label="$t('common.togglePopupVisibilityPlaylist')"
          @click="emit('togglePopoutVisibility')"
        >
          <EyeOff
            v-if="popoutHidden"
            class="playlist-transport-bar__transport-icon"
          />
          <Eye v-else class="playlist-transport-bar__transport-icon" />
        </button>
      </Tooltip>
    </div>

    <Marquee
      v-if="showNowPlaying && hasActivePlayback && nowPlayingTitle"
      class="playlist-transport-bar__now-playing"
      :text="nowPlayingTitle"
    />
  </div>
</template>

<style scoped>
.playlist-transport-bar {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  flex-shrink: 0;
}

.playlist-transport-bar__transport {
  display: flex;
  gap: var(--spacing-1);
  flex-shrink: 0;
}

.playlist-transport-bar__transport-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-1) var(--spacing-2);
  border: none;
  background-color: transparent;
  font-size: 0.7rem;
  font-family: var(--font-mono);
  color: var(--color-fg-muted);
  cursor: pointer;
  transition:
    color 0.2s ease,
    background-color 0.2s ease;
}

.playlist-transport-bar__transport-button:hover:not(:disabled) {
  color: var(--color-accent-primary);
}

.playlist-transport-bar__transport-button:disabled {
  opacity: 0.4;
  cursor: default;
}

.playlist-transport-bar__transport-button--active {
  color: var(--color-accent-primary);
  background-color: color-mix(
    in srgb,
    var(--color-accent-primary) 10%,
    transparent
  );
}

.playlist-transport-bar__transport-icon {
  width: 0.75rem;
  height: 0.75rem;
}

.playlist-transport-bar__now-playing {
  flex: 1;
  font-family: var(--font-mono);
  font-size: 0.7rem;
  line-height: 1;
  color: var(--color-fg-muted);
}
</style>

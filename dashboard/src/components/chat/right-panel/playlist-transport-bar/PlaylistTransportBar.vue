<script setup lang="ts">
import { Eye, EyeOff, Pause, Play, Repeat, Square } from '@lucide/vue';

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
      <button
        type="button"
        class="playlist-transport-bar__transport-button"
        :disabled="!canTogglePlayback"
        :title="playbackToggleTitle"
        :aria-label="playbackToggleTitle"
        @click="emit('togglePlayback')"
      >
        <Pause v-if="playing" class="playlist-transport-bar__transport-icon" />
        <Play v-else class="playlist-transport-bar__transport-icon" />
      </button>
      <button
        type="button"
        class="playlist-transport-bar__transport-button"
        :disabled="!hasActivePlayback"
        title="Stop playback"
        aria-label="Stop playback"
        @click="emit('stopPlayback')"
      >
        <Square class="playlist-transport-bar__transport-icon" />
      </button>
      <button
        type="button"
        class="playlist-transport-bar__transport-button"
        :class="{
          'playlist-transport-bar__transport-button--active': autoplayEnabled,
        }"
        :aria-pressed="autoplayEnabled"
        :title="
          autoplayEnabled
            ? 'Autoplay on: the next video starts when one ends'
            : 'Autoplay off'
        "
        aria-label="Toggle autoplay"
        @click="emit('toggleAutoplay')"
      >
        <Repeat class="playlist-transport-bar__transport-icon" />
      </button>
      <button
        type="button"
        class="playlist-transport-bar__transport-button"
        :class="{
          'playlist-transport-bar__transport-button--active': popoutHidden,
        }"
        :aria-pressed="popoutHidden"
        :title="
          popoutHidden
            ? 'Popup hidden while playlist videos play'
            : 'Show popup while playlist videos play'
        "
        aria-label="Toggle popup visibility for playlist videos"
        @click="emit('togglePopoutVisibility')"
      >
        <EyeOff
          v-if="popoutHidden"
          class="playlist-transport-bar__transport-icon"
        />
        <Eye v-else class="playlist-transport-bar__transport-icon" />
      </button>
    </div>

    <div
      v-if="showNowPlaying && hasActivePlayback && nowPlayingTitle"
      class="playlist-transport-bar__now-playing"
    >
      <div class="playlist-transport-bar__now-playing-track">
        <span class="playlist-transport-bar__now-playing-text">
          {{ nowPlayingTitle }}
        </span>
        <span
          class="playlist-transport-bar__now-playing-text"
          aria-hidden="true"
        >
          {{ nowPlayingTitle }}
        </span>
      </div>
    </div>
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
  min-width: 0;
  overflow: hidden;
  display: flex;
  align-items: center;
}

.playlist-transport-bar__now-playing-track {
  display: inline-flex;
  white-space: nowrap;
  animation: now-playing-scroll 12s linear infinite;
}

.playlist-transport-bar__now-playing-text {
  padding-right: var(--spacing-9-5);
  font-family: var(--font-mono);
  font-size: 0.7rem;
  line-height: 1;
  color: var(--color-fg-muted);
}

/* Endless left-to-right loop: the duplicated span makes the wrap
   from -50% back to 0 seamless. */
@keyframes now-playing-scroll {
  from {
    transform: translateX(0);
  }
  to {
    transform: translateX(-50%);
  }
}

@media (prefers-reduced-motion: reduce) {
  .playlist-transport-bar__now-playing-track {
    animation: none;
  }
}
</style>

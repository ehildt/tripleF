<script setup lang="ts">
/**
 * Playlist settings: whether the playlist lives in the chat right panel or
 * floats as an app-level window that survives tab switches — plus the
 * floating window's initial position, whether a dragged position is
 * remembered, whether it closes itself after a pick or an outside click —
 * and a reset back to the defaults.
 *
 * Mirrors the video popout panel: initial position is a FieldCard row with
 * two icon-only segmented toggles: vertical (top/middle/bottom) ×
 * horizontal (left/center/right).
 */
import {
  AlignCenterHorizontal,
  AlignCenterVertical,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  LayoutPanelLeft,
  ListVideo,
  PanelRightClose,
} from '@lucide/vue';
import { computed } from 'vue';

import FieldCard from '@/components/shared/ui/field-card/FieldCard.vue';
import PanelTitleBar from '@/components/shared/ui/panel-title-bar/PanelTitleBar.vue';
import PowerToggle from '@/components/shared/ui/power-toggle/PowerToggle.vue';
import ResetButton from '@/components/shared/ui/reset-button/ResetButton.vue';
import SegmentedToggle from '@/components/shared/ui/segmented-toggle/SegmentedToggle.vue';

import {
  type PlaylistAnchor,
  playlistAnchor,
  playlistAutoClose,
  playlistMode,
  resetPlaylistSettings,
  setPlaylistAnchor,
  setPlaylistAutoClose,
  setPlaylistMode,
} from '../../../widgets/floating-playlist/composables/playlist-settings.state';

type PlaylistVertical = 'top' | 'middle' | 'bottom';
type PlaylistHorizontal = 'left' | 'center' | 'right';

const VERTICAL_OPTIONS = [
  { value: 'top', icon: ArrowUp, tooltip: 'Top' },
  { value: 'middle', icon: AlignCenterVertical, tooltip: 'Middle' },
  { value: 'bottom', icon: ArrowDown, tooltip: 'Bottom' },
] as const;

const HORIZONTAL_OPTIONS = [
  { value: 'left', icon: ArrowLeft, tooltip: 'Left' },
  { value: 'center', icon: AlignCenterHorizontal, tooltip: 'Center' },
  { value: 'right', icon: ArrowRight, tooltip: 'Right' },
] as const;

/** Floating mode on/off — off keeps the playlist in the chat right panel. */
const floatingEnabled = computed(() => playlistMode.value === 'floating');

const vertical = computed(
  () => playlistAnchor.value.split('-')[0] as PlaylistVertical,
);
const horizontal = computed(
  () => playlistAnchor.value.split('-')[1] as PlaylistHorizontal,
);

function setVertical(value: string) {
  setPlaylistAnchor(`${value}-${horizontal.value}` as PlaylistAnchor);
}

function setHorizontal(value: string) {
  setPlaylistAnchor(`${vertical.value}-${value}` as PlaylistAnchor);
}
</script>

<template>
  <div class="playlist-panel panel-glow">
    <PanelTitleBar title="Playlist">
      <template #actions>
        <ResetButton
          title="Reset playlist settings to defaults"
          @click="resetPlaylistSettings"
        />
        <PowerToggle
          :enabled="floatingEnabled"
          title="Float the playlist as an app-level window"
          @toggle="setPlaylistMode(floatingEnabled ? 'panel' : 'floating')"
        />
      </template>
    </PanelTitleBar>

    <div class="playlist-panel__content">
      <FieldCard
        :icon="LayoutPanelLeft"
        label="floating playlist"
        description="float the playlist as a draggable window that survives tab switches; off keeps it in the chat right panel"
        :checked="floatingEnabled"
        @toggle="setPlaylistMode(floatingEnabled ? 'panel' : 'floating')"
      />

      <FieldCard
        :icon="ListVideo"
        label="initial position"
        description="where the floating playlist appears — beside the tab menu when anchored to its top side"
        :disabled="!floatingEnabled"
      >
        <template #controls>
          <SegmentedToggle
            :options="VERTICAL_OPTIONS"
            :model-value="vertical"
            aria-label="Vertical position"
            @update:model-value="setVertical"
          />
          <SegmentedToggle
            :options="HORIZONTAL_OPTIONS"
            :model-value="horizontal"
            aria-label="Horizontal position"
            @update:model-value="setHorizontal"
          />
        </template>
      </FieldCard>

      <FieldCard
        :icon="PanelRightClose"
        label="autoclose"
        description="collapse the floating playlist after a video was launched or a click landed outside"
        :checked="playlistAutoClose"
        :disabled="!floatingEnabled"
        @toggle="setPlaylistAutoClose(!playlistAutoClose)"
      />
    </div>
  </div>
</template>

<style scoped>
.playlist-panel {
  background-color: var(--color-bg-elevated);
  border: 1px solid var(--color-divider);
}

.playlist-panel__content {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1fr);
  gap: var(--spacing-1);
  padding: var(--spacing-1);
}

@media (max-width: 40rem) {
  .playlist-panel__content {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>

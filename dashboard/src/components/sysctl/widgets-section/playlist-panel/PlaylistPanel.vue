<script setup lang="ts">
/**
 * Floating player settings: the app's floating player (a video playlist
 * queue) can be docked into the chat right panel or float as an app-level
 * window that survives tab switches — plus the floating window's initial
 * position, whether it closes itself after a pick or an outside click —
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

import { hidePopoutPreview } from '@/components/chat/exchange-list/chat-exchange/exchange-content/assistant-response/composables/popout-settings.state';
import CollapsiblePanel from '@/components/shared/ui/collapsible-panel/CollapsiblePanel.vue';
import FieldCard from '@/components/shared/ui/field-card/FieldCard.vue';
import PowerToggle from '@/components/shared/ui/power-toggle/PowerToggle.vue';
import PreviewButton from '@/components/shared/ui/preview-button/PreviewButton.vue';
import ResetButton from '@/components/shared/ui/reset-button/ResetButton.vue';
import SegmentedToggle from '@/components/shared/ui/segmented-toggle/SegmentedToggle.vue';

import {
  type PlaylistAnchor,
  playlistAnchor,
  playlistAutoClose,
  playlistMode,
  playlistPreviewVisible,
  resetPlaylistSettings,
  setPlaylistAnchor,
  setPlaylistAutoClose,
  setPlaylistMode,
  togglePlaylistPreview,
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

/** Toggle the floating-player preview; showing it hides the popout preview. */
function handlePreviewToggle() {
  hidePopoutPreview();
  togglePlaylistPreview();
}
</script>

<template>
  <div class="playlist-panel panel-glow">
    <CollapsiblePanel id="playlist" title="Floating Player">
      <template #actions>
        <PreviewButton
          :active="playlistPreviewVisible"
          :title="
            playlistPreviewVisible
              ? 'Hide example floating player'
              : 'Show an example floating player'
          "
          @click="handlePreviewToggle"
        />
        <ResetButton
          title="Reset floating player settings to defaults"
          @click="resetPlaylistSettings"
        />
        <PowerToggle
          :enabled="floatingEnabled"
          title="Float the player as an app-level window"
          @toggle="setPlaylistMode(floatingEnabled ? 'panel' : 'floating')"
        />
      </template>

      <div class="playlist-panel__content">
        <FieldCard
          :icon="LayoutPanelLeft"
          label="docking mode"
          description="checked floats the player as an app-level window; off docks it into the chat right panel"
          :checked="floatingEnabled"
          @toggle="setPlaylistMode(floatingEnabled ? 'panel' : 'floating')"
        />

        <FieldCard
          :icon="ListVideo"
          label="initial position"
          description="where the floating player appears — beside the tab menu when anchored to its top side"
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
          description="collapse the floating player after a video was launched or a click landed outside"
          :checked="playlistAutoClose"
          :disabled="!floatingEnabled"
          @toggle="setPlaylistAutoClose(!playlistAutoClose)"
        />
      </div>
    </CollapsiblePanel>
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

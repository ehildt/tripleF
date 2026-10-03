<script setup lang="ts">
/**
 * Floating player settings: the app's floating player (a video playlist
 * queue) can be docked into the chat right toolbar or float as an app-level
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

import FieldCard from '@/components/shared/ui/field-card/FieldCard.vue';
import PowerToggle from '@/components/shared/ui/power-toggle/PowerToggle.vue';
import PreviewButton from '@/components/shared/ui/preview-button/PreviewButton.vue';
import ResetButton from '@/components/shared/ui/reset-button/ResetButton.vue';
import SectionHeader from '@/components/shared/ui/section-header/SectionHeader.vue';
import SegmentedToggle from '@/components/shared/ui/segmented-toggle/SegmentedToggle.vue';
import { i18n } from '@/i18n/i18n';
import { usePlaylistStore } from '@/stores/playlist';
import type { PlaylistAnchor } from '@/stores/playlist.types';
import { usePopoutSettingsStore } from '@/stores/popout-settings';

import type {
  PlaylistHorizontal,
  PlaylistVertical,
} from './PlaylistPanel.types';

const popoutSettingsStore = usePopoutSettingsStore();
const playlistStore = usePlaylistStore();

const VERTICAL_OPTIONS = computed(() => [
  { value: 'top', icon: ArrowUp, tooltip: i18n.global.t('common.top') },
  {
    value: 'middle',
    icon: AlignCenterVertical,
    tooltip: i18n.global.t('common.middle'),
  },
  { value: 'bottom', icon: ArrowDown, tooltip: i18n.global.t('common.bottom') },
]);

const HORIZONTAL_OPTIONS = computed(() => [
  { value: 'left', icon: ArrowLeft, tooltip: i18n.global.t('common.left') },
  {
    value: 'center',
    icon: AlignCenterHorizontal,
    tooltip: i18n.global.t('common.center'),
  },
  { value: 'right', icon: ArrowRight, tooltip: i18n.global.t('common.right') },
]);

/** Floating mode on/off — off keeps the playlist in the chat right toolbar. */
const floatingEnabled = computed(
  () => playlistStore.playlistMode === 'floating',
);

const vertical = computed(
  () => playlistStore.playlistAnchor.split('-')[0] as PlaylistVertical,
);
const horizontal = computed(
  () => playlistStore.playlistAnchor.split('-')[1] as PlaylistHorizontal,
);

function setVertical(value: string) {
  playlistStore.setPlaylistAnchor(
    `${value}-${horizontal.value}` as PlaylistAnchor,
  );
}

function setHorizontal(value: string) {
  playlistStore.setPlaylistAnchor(
    `${vertical.value}-${value}` as PlaylistAnchor,
  );
}

/** Toggle the floating-player preview; showing it hides the popout preview. */
function handlePreviewToggle() {
  popoutSettingsStore.hidePopoutPreview();
  playlistStore.togglePlaylistPreview();
}
</script>

<template>
  <div class="playlist-panel">
    <div class="playlist-panel__actions">
      <PreviewButton
        :active="playlistStore.playlistPreviewVisible"
        :title="
          playlistStore.playlistPreviewVisible
            ? $t('common.hideExampleFloatingPlayer')
            : $t('common.showExampleFloatingPlayer')
        "
        @click="handlePreviewToggle"
      />
      <ResetButton
        :title="$t('common.resetFloatingPlayerSettingsToDefaults')"
        @click="playlistStore.resetPlaylistSettings"
      />
      <PowerToggle
        :enabled="floatingEnabled"
        :title="$t('common.floatPlayerAsAppWindow')"
        @toggle="
          playlistStore.setPlaylistMode(floatingEnabled ? 'panel' : 'floating')
        "
      />
    </div>

    <div class="playlist-panel__group">
      <SectionHeader
        :icon="LayoutPanelLeft"
        :title="$t('common.dockingSection')"
      />
      <div class="playlist-panel__grid">
        <FieldCard
          :icon="LayoutPanelLeft"
          :label="$t('common.dockingMode')"
          :description="$t('common.dockingModeDesc')"
          :checked="floatingEnabled"
          @toggle="
            playlistStore.setPlaylistMode(
              floatingEnabled ? 'panel' : 'floating',
            )
          "
        />

        <FieldCard
          :icon="ListVideo"
          :label="$t('common.initialPosition')"
          :description="$t('common.floatingPlayerPositionDesc')"
          :disabled="!floatingEnabled"
        >
          <template #controls>
            <SegmentedToggle
              :options="VERTICAL_OPTIONS"
              :model-value="vertical"
              :aria-label="$t('common.verticalPosition')"
              @update:model-value="setVertical"
            />
            <SegmentedToggle
              :options="HORIZONTAL_OPTIONS"
              :model-value="horizontal"
              :aria-label="$t('common.horizontalPosition')"
              @update:model-value="setHorizontal"
            />
          </template>
        </FieldCard>
      </div>
    </div>

    <div class="playlist-panel__group">
      <SectionHeader
        :icon="PanelRightClose"
        :title="$t('common.behaviorSection')"
      />
      <div class="playlist-panel__grid">
        <FieldCard
          :icon="PanelRightClose"
          :label="$t('common.autoclose')"
          :description="$t('common.floatingPlayerAutocloseDesc')"
          :checked="playlistStore.playlistAutoClose"
          :disabled="!floatingEnabled"
          @toggle="
            playlistStore.setPlaylistAutoClose(!playlistStore.playlistAutoClose)
          "
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.playlist-panel {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-1);
  padding: var(--spacing-2);
}

.playlist-panel__actions {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: var(--spacing-1);
  min-height: calc(2.25rem + 2 * var(--spacing-2));
  padding: 0 var(--spacing-3);
  background:
    radial-gradient(
      ellipse 120% 140% at 12% 50%,
      color-mix(in srgb, var(--color-accent-primary) 18%, transparent) 0%,
      transparent 60%
    ),
    radial-gradient(
      ellipse 120% 140% at 88% 50%,
      color-mix(in srgb, var(--color-accent-secondary) 14%, transparent) 0%,
      transparent 60%
    ),
    var(--color-bg-elevated);
}

.playlist-panel__group {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-3);
}

.playlist-panel__grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1fr);
  gap: var(--spacing-1);
}

@media (max-width: 40rem) {
  .playlist-panel__grid {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>

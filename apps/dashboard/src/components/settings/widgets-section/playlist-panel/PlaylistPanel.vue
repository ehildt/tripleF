<script setup lang="ts">
/**
 * Floating player settings: the app's floating player (a video playlist
 * queue) can be docked into the chat right toolbar or float as an app-level
 * window that survives tab switches — plus the floating window's initial
 * position, whether it closes itself after a pick or an outside click —
 * and a reset back to the defaults.
 *
 * Mirrors the video popout panel: initial position is a SegmentedFieldCard
 * with two icon-only segmented toggles: vertical (top/middle/bottom) ×
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

import NumberFieldCard from '@/components/shared/ui/number-field-card/NumberFieldCard.vue';
import PanelActions from '@/components/shared/ui/panel-actions/PanelActions.vue';
import PowerToggle from '@/components/shared/ui/power-toggle/PowerToggle.vue';
import PreviewButton from '@/components/shared/ui/preview-button/PreviewButton.vue';
import ResetButton from '@/components/shared/ui/reset-button/ResetButton.vue';
import SectionHeader from '@/components/shared/ui/section-header/SectionHeader.vue';
import type { SegmentedFieldCardToggle } from '@/components/shared/ui/segmented-field-card/SegmentedFieldCard.types';
import SegmentedFieldCard from '@/components/shared/ui/segmented-field-card/SegmentedFieldCard.vue';
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

const POSITION_TOGGLES = computed<readonly SegmentedFieldCardToggle[]>(() => [
  {
    key: 'vertical',
    ariaLabel: i18n.global.t('common.verticalPosition'),
    options: VERTICAL_OPTIONS.value,
    value: vertical.value,
    onSelect: setVertical,
  },
  {
    key: 'horizontal',
    ariaLabel: i18n.global.t('common.horizontalPosition'),
    options: HORIZONTAL_OPTIONS.value,
    value: horizontal.value,
    onSelect: setHorizontal,
  },
]);

/** Toggle the floating-player preview; showing it hides the popout preview. */
function handlePreviewToggle() {
  popoutSettingsStore.hidePopoutPreview();
  playlistStore.togglePlaylistPreview();
}
</script>

<template>
  <div class="playlist-panel">
    <PanelActions>
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
    </PanelActions>

    <div class="playlist-panel__group">
      <SectionHeader
        :icon="LayoutPanelLeft"
        :title="$t('common.dockingSection')"
      />
      <div class="playlist-panel__grid">
        <NumberFieldCard
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

        <SegmentedFieldCard
          :icon="ListVideo"
          :label="$t('common.initialPosition')"
          :description="$t('common.floatingPlayerPositionDesc')"
          :toggles="POSITION_TOGGLES"
          :disabled="!floatingEnabled"
        />
      </div>
    </div>

    <div class="playlist-panel__group">
      <SectionHeader
        :icon="PanelRightClose"
        :title="$t('common.behaviorSection')"
      />
      <div class="playlist-panel__grid">
        <NumberFieldCard
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

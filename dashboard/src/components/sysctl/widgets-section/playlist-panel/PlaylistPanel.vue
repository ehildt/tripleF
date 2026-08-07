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
import PanelLayout from '@/components/shared/ui/panel-layout/PanelLayout.vue';
import PowerToggle from '@/components/shared/ui/power-toggle/PowerToggle.vue';
import PreviewButton from '@/components/shared/ui/preview-button/PreviewButton.vue';
import ResetButton from '@/components/shared/ui/reset-button/ResetButton.vue';
import SegmentedToggle from '@/components/shared/ui/segmented-toggle/SegmentedToggle.vue';
import { i18n } from '@/i18n/i18n';

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
  { value: 'top', icon: ArrowUp, tooltip: i18n.global.t('common.top') },
  {
    value: 'middle',
    icon: AlignCenterVertical,
    tooltip: i18n.global.t('common.middle'),
  },
  { value: 'bottom', icon: ArrowDown, tooltip: i18n.global.t('common.bottom') },
] as const;

const HORIZONTAL_OPTIONS = [
  { value: 'left', icon: ArrowLeft, tooltip: i18n.global.t('common.left') },
  {
    value: 'center',
    icon: AlignCenterHorizontal,
    tooltip: i18n.global.t('common.center'),
  },
  { value: 'right', icon: ArrowRight, tooltip: i18n.global.t('common.right') },
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
  <PanelLayout class="playlist-panel">
    <CollapsiblePanel id="playlist" :title="$t('common.floatingPlayer')">
      <template #actions>
        <PreviewButton
          :active="playlistPreviewVisible"
          :title="
            playlistPreviewVisible
              ? $t('common.hideExampleFloatingPlayer')
              : $t('common.showExampleFloatingPlayer')
          "
          @click="handlePreviewToggle"
        />
        <ResetButton
          :title="$t('common.resetFloatingPlayerSettingsToDefaults')"
          @click="resetPlaylistSettings"
        />
        <PowerToggle
          :enabled="floatingEnabled"
          :title="$t('common.floatPlayerAsAppWindow')"
          @toggle="setPlaylistMode(floatingEnabled ? 'panel' : 'floating')"
        />
      </template>

      <div class="playlist-panel__content">
        <FieldCard
          :icon="LayoutPanelLeft"
          :label="$t('common.dockingMode')"
          :description="$t('common.dockingModeDesc')"
          :checked="floatingEnabled"
          @toggle="setPlaylistMode(floatingEnabled ? 'panel' : 'floating')"
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

        <FieldCard
          :icon="PanelRightClose"
          :label="$t('common.autoclose')"
          :description="$t('common.floatingPlayerAutocloseDesc')"
          :checked="playlistAutoClose"
          :disabled="!floatingEnabled"
          @toggle="setPlaylistAutoClose(!playlistAutoClose)"
        />
      </div>
    </CollapsiblePanel>
  </PanelLayout>
</template>

<style scoped>
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

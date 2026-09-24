<script setup lang="ts">
/**
 * Video popout settings: where the floating video popout initially
 * appears, whether a moved position is remembered across conversations and
 * reloads, and whether the popout docks itself when its video is back in
 * view — plus a reset back to the defaults. Closing a popout always hides
 * the window and keeps playback running; the transport bar's Stop button
 * ends playback.
 *
 * Initial position is a FieldCard row with two icon-only segmented
 * toggles: vertical (top/middle/bottom) × horizontal (left/center/right),
 * covering every position in one line.
 */
import {
  AlignCenterHorizontal,
  AlignCenterVertical,
  ArrowDown,
  ArrowDownToLine,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Menu,
  PictureInPicture2,
  Pin,
} from '@lucide/vue';
import { computed } from 'vue';

import FieldCard from '@/components/shared/ui/field-card/FieldCard.vue';
import PowerToggle from '@/components/shared/ui/power-toggle/PowerToggle.vue';
import PreviewButton from '@/components/shared/ui/preview-button/PreviewButton.vue';
import ResetButton from '@/components/shared/ui/reset-button/ResetButton.vue';
import SectionHeader from '@/components/shared/ui/section-header/SectionHeader.vue';
import SegmentedToggle from '@/components/shared/ui/segmented-toggle/SegmentedToggle.vue';
import { i18n } from '@/i18n/i18n';
import { usePlaylistSettingsStore } from '@/stores/playlist-settings';
import { usePopoutSettingsStore } from '@/stores/popout-settings';
import type { PopoutAnchor } from '@/stores/popout-settings.types';

import type {
  PopoutHorizontal,
  PopoutVertical,
} from './VideoPopoutPanel.types';

const popoutSettingsStore = usePopoutSettingsStore();
const playlistSettingsStore = usePlaylistSettingsStore();

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

const vertical = computed(
  () => popoutSettingsStore.popoutAnchor.split('-')[0] as PopoutVertical,
);
const horizontal = computed(
  () => popoutSettingsStore.popoutAnchor.split('-')[1] as PopoutHorizontal,
);

function setVertical(value: string) {
  popoutSettingsStore.setPopoutAnchor(
    `${value}-${horizontal.value}` as PopoutAnchor,
  );
}

function setHorizontal(value: string) {
  popoutSettingsStore.setPopoutAnchor(
    `${vertical.value}-${value}` as PopoutAnchor,
  );
}

/** Toggle the popout preview; showing it hides the floating-player preview. */
function handlePreviewToggle() {
  playlistSettingsStore.hidePlaylistPreview();
  popoutSettingsStore.togglePopoutPreview();
}
</script>

<template>
  <div class="video-popout-panel">
    <div class="video-popout-panel__actions">
      <PreviewButton
        :active="popoutSettingsStore.popoutPreviewVisible"
        :title="
          popoutSettingsStore.popoutPreviewVisible
            ? $t('common.hideExamplePopout')
            : $t('common.showExamplePopout')
        "
        @click="handlePreviewToggle"
      />
      <ResetButton
        :title="$t('common.resetPopoutSettingsToDefaults')"
        @click="popoutSettingsStore.resetPopoutSettings"
      />
      <PowerToggle
        :enabled="popoutSettingsStore.popoutEnabled"
        :title="$t('common.enableVideoPopout')"
        @toggle="
          popoutSettingsStore.setPopoutEnabled(
            !popoutSettingsStore.popoutEnabled,
          )
        "
      />
    </div>

    <div class="video-popout-panel__group">
      <SectionHeader
        :icon="PictureInPicture2"
        :title="$t('common.positionSection')"
      />
      <div class="video-popout-panel__grid">
        <!-- Initial position + remember position side by side -->
        <FieldCard
          :icon="PictureInPicture2"
          :label="$t('common.initialPosition')"
          :description="$t('common.popoutPositionDesc')"
          :disabled="!popoutSettingsStore.popoutEnabled"
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
          :icon="Pin"
          :label="$t('common.rememberPosition')"
          :description="$t('common.rememberPositionDesc')"
          :checked="popoutSettingsStore.popoutRememberPosition"
          :disabled="!popoutSettingsStore.popoutEnabled"
          @toggle="
            popoutSettingsStore.setPopoutRememberPosition(
              !popoutSettingsStore.popoutRememberPosition,
            )
          "
        />
      </div>
    </div>

    <div class="video-popout-panel__group">
      <SectionHeader
        :icon="ArrowDownToLine"
        :title="$t('common.behaviorSection')"
      />
      <div class="video-popout-panel__grid">
        <FieldCard
          :icon="ArrowDownToLine"
          :label="$t('common.autodock')"
          :description="$t('common.autodockDesc')"
          :checked="popoutSettingsStore.popoutAutoDock"
          :disabled="!popoutSettingsStore.popoutEnabled"
          @toggle="
            popoutSettingsStore.setPopoutAutoDock(
              !popoutSettingsStore.popoutAutoDock,
            )
          "
        />

        <FieldCard
          :icon="Menu"
          :label="$t('common.alwaysShowBar')"
          :description="$t('common.alwaysShowBarDesc')"
          :checked="popoutSettingsStore.popoutShowBarAlways"
          :disabled="!popoutSettingsStore.popoutEnabled"
          @toggle="
            popoutSettingsStore.setPopoutShowBarAlways(
              !popoutSettingsStore.popoutShowBarAlways,
            )
          "
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.video-popout-panel {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-1);
  padding: var(--spacing-2);
}

.video-popout-panel__actions {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
}

.video-popout-panel__group {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);
}

.video-popout-panel__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--spacing-2);
}
</style>

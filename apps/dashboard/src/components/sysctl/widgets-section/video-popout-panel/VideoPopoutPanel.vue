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

import type { PopoutAnchor } from '@/components/chat/exchange-list/chat-exchange/exchange-content/assistant-response/composables/popout-settings.state.types';
import FieldCard from '@/components/shared/ui/field-card/FieldCard.vue';
import PowerToggle from '@/components/shared/ui/power-toggle/PowerToggle.vue';
import PreviewButton from '@/components/shared/ui/preview-button/PreviewButton.vue';
import ResetButton from '@/components/shared/ui/reset-button/ResetButton.vue';
import SegmentedToggle from '@/components/shared/ui/segmented-toggle/SegmentedToggle.vue';
import { i18n } from '@/i18n/i18n';

import {
  popoutAnchor,
  popoutAutoDock,
  popoutEnabled,
  popoutPreviewVisible,
  popoutRememberPosition,
  popoutShowBarAlways,
  resetPopoutSettings,
  setPopoutAnchor,
  setPopoutAutoDock,
  setPopoutEnabled,
  setPopoutRememberPosition,
  setPopoutShowBarAlways,
  togglePopoutPreview,
} from '../../../chat/exchange-list/chat-exchange/exchange-content/assistant-response/composables/popout-settings.state';
import SectionHeader from '../../../shared/ui/section-header/SectionHeader.vue';
import { hidePlaylistPreview } from '../../../widgets/floating-playlist/composables/playlist-settings.state';
import type {
  PopoutHorizontal,
  PopoutVertical,
} from './VideoPopoutPanel.types';

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
  () => popoutAnchor.value.split('-')[0] as PopoutVertical,
);
const horizontal = computed(
  () => popoutAnchor.value.split('-')[1] as PopoutHorizontal,
);

function setVertical(value: string) {
  setPopoutAnchor(`${value}-${horizontal.value}` as PopoutAnchor);
}

function setHorizontal(value: string) {
  setPopoutAnchor(`${vertical.value}-${value}` as PopoutAnchor);
}

/** Toggle the popout preview; showing it hides the floating-player preview. */
function handlePreviewToggle() {
  hidePlaylistPreview();
  togglePopoutPreview();
}
</script>

<template>
  <div class="video-popout-panel">
    <div class="video-popout-panel__actions">
      <PreviewButton
        :active="popoutPreviewVisible"
        :title="
          popoutPreviewVisible
            ? $t('common.hideExamplePopout')
            : $t('common.showExamplePopout')
        "
        @click="handlePreviewToggle"
      />
      <ResetButton
        :title="$t('common.resetPopoutSettingsToDefaults')"
        @click="resetPopoutSettings"
      />
      <PowerToggle
        :enabled="popoutEnabled"
        :title="$t('common.enableVideoPopout')"
        @toggle="setPopoutEnabled(!popoutEnabled)"
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
          :disabled="!popoutEnabled"
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
          :checked="popoutRememberPosition"
          :disabled="!popoutEnabled"
          @toggle="setPopoutRememberPosition(!popoutRememberPosition)"
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
          :checked="popoutAutoDock"
          :disabled="!popoutEnabled"
          @toggle="setPopoutAutoDock(!popoutAutoDock)"
        />

        <FieldCard
          :icon="Menu"
          :label="$t('common.alwaysShowBar')"
          :description="$t('common.alwaysShowBarDesc')"
          :checked="popoutShowBarAlways"
          :disabled="!popoutEnabled"
          @toggle="setPopoutShowBarAlways(!popoutShowBarAlways)"
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

.video-popout-panel__group {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-1);
}

.video-popout-panel__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--spacing-1);
}

@media (max-width: 40rem) {
  .video-popout-panel__grid {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>

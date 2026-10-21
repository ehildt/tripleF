<script setup lang="ts">
/**
 * Toast notification settings: where the toast stack is anchored, whether
 * toasts auto-hide (and after how many seconds), whether they carry a pin
 * to keep them on screen, and which message types get toasted at all.
 *
 * Mirrors the video popout panel: same dual segmented toggles for the
 * anchor, same checkbox NumberFieldCards, same reset + power actions in the
 * bar. Auto-hide gets its own AutoHideCard — its checkbox leads the seconds
 * stepper instead of trailing it.
 */
import {
  AlignCenterHorizontal,
  AlignCenterVertical,
  Anchor,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  BellOff,
  BellRing,
  Bug,
  Check,
  CircleX,
  Info,
  type LucideIcon,
  MessageSquare,
  Pin,
  Timer,
  TriangleAlert,
} from '@lucide/vue';
import { computed } from 'vue';

import IconButton from '@/components/shared/ui/icon-button/IconButton.vue';
import NumberFieldCard from '@/components/shared/ui/number-field-card/NumberFieldCard.vue';
import PanelActions from '@/components/shared/ui/panel-actions/PanelActions.vue';
import PowerToggle from '@/components/shared/ui/power-toggle/PowerToggle.vue';
import PreviewButton from '@/components/shared/ui/preview-button/PreviewButton.vue';
import ResetButton from '@/components/shared/ui/reset-button/ResetButton.vue';
import type { SegmentedFieldCardToggle } from '@/components/shared/ui/segmented-field-card/SegmentedFieldCard.types';
import SegmentedFieldCard from '@/components/shared/ui/segmented-field-card/SegmentedFieldCard.vue';
import { useToast } from '@/composables/use-toast';
import { i18n } from '@/i18n/i18n';
import { useToastSettingsStore } from '@/stores/toast-settings';
import type { ToastAnchor } from '@/stores/toast-settings.types';
import type { ToastType } from '@/types/toast-type.model';

const toastSettingsStore = useToastSettingsStore();
const { preview: previewToast } = useToast();

import SectionHeader from '@/components/shared/ui/section-header/SectionHeader.vue';

import AutoHideCard from './auto-hide-card/AutoHideCard.vue';
import type { ToastHorizontal, ToastVertical } from './ToastPanel.types';

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

const TYPE_OPTIONS = computed<
  readonly {
    type: ToastType;
    icon: LucideIcon;
    label: string;
    description: string;
  }[]
>(() => [
  {
    type: 'info',
    icon: Info,
    label: i18n.global.t('common.toastTypeInfo'),
    description: i18n.global.t('common.toastTypeInfoDesc'),
  },
  {
    type: 'success',
    icon: Check,
    label: i18n.global.t('common.toastTypeSuccess'),
    description: i18n.global.t('common.toastTypeSuccessDesc'),
  },
  {
    type: 'warning',
    icon: TriangleAlert,
    label: i18n.global.t('common.toastTypeWarning'),
    description: i18n.global.t('common.toastTypeWarningDesc'),
  },
  {
    type: 'error',
    icon: CircleX,
    label: i18n.global.t('common.toastTypeError'),
    description: i18n.global.t('common.toastTypeErrorDesc'),
  },
  {
    type: 'debug',
    icon: Bug,
    label: i18n.global.t('common.toastTypeDebug'),
    description: i18n.global.t('common.toastTypeDebugDesc'),
  },
  {
    type: 'default',
    icon: MessageSquare,
    label: i18n.global.t('common.toastTypeDefault'),
    description: i18n.global.t('common.toastTypeDefaultDesc'),
  },
]);

const vertical = computed(
  () => toastSettingsStore.toastAnchor.split('-')[0] as ToastVertical,
);
const horizontal = computed(
  () => toastSettingsStore.toastAnchor.split('-')[1] as ToastHorizontal,
);

function setVertical(value: string) {
  toastSettingsStore.setToastAnchor(
    `${value}-${horizontal.value}` as ToastAnchor,
  );
}

function setHorizontal(value: string) {
  toastSettingsStore.setToastAnchor(
    `${vertical.value}-${value}` as ToastAnchor,
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
</script>

<template>
  <div class="toast-panel">
    <PanelActions>
      <PreviewButton
        :title="$t('common.showExampleToast')"
        @click="previewToast(i18n.global.t('common.exampleToastNotification'))"
      />
      <ResetButton
        :title="$t('common.resetToastSettingsToDefaults')"
        @click="toastSettingsStore.resetToastSettings"
      />
      <PowerToggle
        :enabled="toastSettingsStore.toastEnabled"
        :title="$t('common.enableToastNotifications')"
        @toggle="
          toastSettingsStore.setToastEnabled(!toastSettingsStore.toastEnabled)
        "
      />
    </PanelActions>

    <div class="toast-panel__group">
      <SectionHeader :icon="Anchor" :title="$t('common.positionSection')" />
      <div class="toast-panel__grid">
        <SegmentedFieldCard
          :icon="Anchor"
          :label="$t('common.initialPosition')"
          :description="$t('common.toastPositionDesc')"
          :toggles="POSITION_TOGGLES"
          :disabled="!toastSettingsStore.toastEnabled"
        />
      </div>
    </div>

    <div class="toast-panel__group">
      <SectionHeader :icon="Timer" :title="$t('common.behaviorSection')" />
      <div class="toast-panel__grid">
        <AutoHideCard
          :icon="Timer"
          :label="$t('common.autoHide')"
          :description="$t('common.autoHideDesc')"
          :checked="toastSettingsStore.toastAutoHide"
          :seconds="toastSettingsStore.toastDurationSeconds"
          :disabled="!toastSettingsStore.toastEnabled"
          :checkbox-aria-label="$t('common.autoHideToasts')"
          @toggle="
            toastSettingsStore.setToastAutoHide(
              !toastSettingsStore.toastAutoHide,
            )
          "
          @update:seconds="toastSettingsStore.setToastDurationSeconds"
        />

        <NumberFieldCard
          :icon="Pin"
          :label="$t('common.showPin')"
          :description="$t('common.showPinDesc')"
          :checked="toastSettingsStore.toastPinEnabled"
          :disabled="!toastSettingsStore.toastEnabled"
          @toggle="
            toastSettingsStore.setToastPinEnabled(
              !toastSettingsStore.toastPinEnabled,
            )
          "
        />
      </div>
    </div>

    <div class="toast-panel__group">
      <SectionHeader :icon="MessageSquare" :title="$t('common.typesSection')" />
      <div class="toast-panel__types">
        <NumberFieldCard
          v-for="{ type, icon, label, description } in TYPE_OPTIONS"
          :key="type"
          :icon="icon"
          :label="label"
          :description="description"
          :checked="toastSettingsStore.toastTypeFilters[type]"
          :disabled="!toastSettingsStore.toastEnabled"
          @toggle="
            toastSettingsStore.setToastTypeFilter(
              type,
              !toastSettingsStore.toastTypeFilters[type],
            )
          "
        />
      </div>
    </div>
    <div class="toast-panel__group">
      <SectionHeader
        :icon="BellOff"
        :title="$t('common.mutedMessagesSection')"
      />
      <div
        v-if="toastSettingsStore.toastMutedMessages.length"
        class="toast-panel__muted-list"
      >
        <div
          v-for="muted in toastSettingsStore.toastMutedMessages"
          :key="muted.key"
          class="toast-panel__muted-row"
        >
          <span class="toast-panel__muted-sample">{{ muted.sample }}</span>
          <IconButton
            size="sm"
            :title="$t('common.showToastAgain')"
            @click="toastSettingsStore.unmuteToastMessage(muted.key)"
          >
            <BellRing />
          </IconButton>
        </div>
      </div>
      <p v-else class="toast-panel__muted-empty">
        {{ $t('common.noMutedMessages') }}
      </p>
    </div>
  </div>
</template>

<style scoped>
.toast-panel {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-1);
  padding: var(--spacing-2);
}

.toast-panel__group {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-3);
}

.toast-panel__grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1fr);
  gap: var(--spacing-1);
}

.toast-panel__types {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: var(--spacing-1);
}

.toast-panel__muted-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-1);
}

.toast-panel__muted-row {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  padding: var(--spacing-2);
  border: 1px solid var(--color-divider);
  background-color: var(--color-bg-elevated);
}

.toast-panel__muted-sample {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  font-size: 0.8125rem;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--color-fg-secondary);
}

.toast-panel__muted-empty {
  margin: 0;
  padding: var(--spacing-2);
  font-size: 0.8125rem;
  color: var(--color-fg-muted);
}

@media (max-width: 40rem) {
  .toast-panel__grid {
    grid-template-columns: minmax(0, 1fr);
  }

  .toast-panel__types {
    grid-template-columns: repeat(auto-fill, minmax(9rem, 1fr));
  }
}
</style>

<script setup lang="ts">
/**
 * Toast notification settings: where the toast stack is anchored, whether
 * toasts auto-hide (and after how many seconds), whether they carry a pin
 * to keep them on screen, and which message types get toasted at all.
 *
 * Mirrors the video popout panel: same dual segmented toggles for the
 * anchor, same checkbox FieldCards, same reset + power actions in the bar.
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

import FieldCard from '@/components/shared/ui/field-card/FieldCard.vue';
import IconButton from '@/components/shared/ui/icon-button/IconButton.vue';
import InputNumber from '@/components/shared/ui/input-number/InputNumber.vue';
import PowerToggle from '@/components/shared/ui/power-toggle/PowerToggle.vue';
import PreviewButton from '@/components/shared/ui/preview-button/PreviewButton.vue';
import ResetButton from '@/components/shared/ui/reset-button/ResetButton.vue';
import SegmentedToggle from '@/components/shared/ui/segmented-toggle/SegmentedToggle.vue';
import {
  resetToastSettings,
  setToastAnchor,
  setToastAutoHide,
  setToastDurationSeconds,
  setToastEnabled,
  setToastPinEnabled,
  setToastTypeFilter,
  toastAnchor,
  toastAutoHide,
  toastDurationSeconds,
  toastEnabled,
  toastMutedMessages,
  toastPinEnabled,
  toastTypeFilters,
  unmuteToastMessage,
} from '@/components/widgets/toast/composables/toast-settings.state';
import type { ToastAnchor } from '@/components/widgets/toast/composables/toast-settings.state.types';
import type { ToastType } from '@/composables/toast-state';
import { useToast } from '@/composables/use-toast';
import { i18n } from '@/i18n/i18n';

const { preview: previewToast } = useToast();

import SectionHeader from '../../../shared/ui/section-header/SectionHeader.vue';
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
  () => toastAnchor.value.split('-')[0] as ToastVertical,
);
const horizontal = computed(
  () => toastAnchor.value.split('-')[1] as ToastHorizontal,
);

function setVertical(value: string) {
  setToastAnchor(`${value}-${horizontal.value}` as ToastAnchor);
}

function setHorizontal(value: string) {
  setToastAnchor(`${vertical.value}-${value}` as ToastAnchor);
}
</script>

<template>
  <div class="toast-panel">
    <div class="toast-panel__actions">
      <PreviewButton
        :title="$t('common.showExampleToast')"
        @click="previewToast(i18n.global.t('common.exampleToastNotification'))"
      />
      <ResetButton
        :title="$t('common.resetToastSettingsToDefaults')"
        @click="resetToastSettings"
      />
      <PowerToggle
        :enabled="toastEnabled"
        :title="$t('common.enableToastNotifications')"
        @toggle="setToastEnabled(!toastEnabled)"
      />
    </div>

    <div class="toast-panel__group">
      <SectionHeader :icon="Anchor" :title="$t('common.positionSection')" />
      <div class="toast-panel__grid">
        <FieldCard
          :icon="Anchor"
          :label="$t('common.initialPosition')"
          :description="$t('common.toastPositionDesc')"
          :disabled="!toastEnabled"
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

    <div class="toast-panel__group">
      <SectionHeader :icon="Timer" :title="$t('common.behaviorSection')" />
      <div class="toast-panel__grid">
        <FieldCard
          :icon="Timer"
          :label="$t('common.autoHide')"
          :description="$t('common.autoHideDesc')"
          :disabled="!toastEnabled"
        >
          <template #controls>
            <button
              type="button"
              class="toast-panel__checkbox"
              :class="{ 'toast-panel__checkbox--checked': toastAutoHide }"
              :disabled="!toastEnabled"
              :aria-pressed="toastAutoHide"
              :aria-label="$t('common.autoHideToasts')"
              @click="setToastAutoHide(!toastAutoHide)"
            >
              <Check
                v-if="toastAutoHide"
                class="toast-panel__check-icon"
                stroke-width="3"
              />
            </button>
            <div class="toast-panel__number">
              <InputNumber
                :model-value="toastDurationSeconds"
                :min="1"
                :max="30"
                :step="0.5"
                :disabled="!toastAutoHide || !toastEnabled"
                @update:model-value="setToastDurationSeconds"
              />
            </div>
          </template>
        </FieldCard>

        <FieldCard
          :icon="Pin"
          :label="$t('common.showPin')"
          :description="$t('common.showPinDesc')"
          :checked="toastPinEnabled"
          :disabled="!toastEnabled"
          @toggle="setToastPinEnabled(!toastPinEnabled)"
        />
      </div>
    </div>

    <div class="toast-panel__group">
      <SectionHeader :icon="MessageSquare" :title="$t('common.typesSection')" />
      <div class="toast-panel__types">
        <FieldCard
          v-for="{ type, icon, label, description } in TYPE_OPTIONS"
          :key="type"
          :icon="icon"
          :label="label"
          :description="description"
          :checked="toastTypeFilters[type]"
          :disabled="!toastEnabled"
          @toggle="setToastTypeFilter(type, !toastTypeFilters[type])"
        />
      </div>
    </div>
    <div class="toast-panel__group">
      <SectionHeader
        :icon="BellOff"
        :title="$t('common.mutedMessagesSection')"
      />
      <div v-if="toastMutedMessages.length" class="toast-panel__muted-list">
        <div
          v-for="muted in toastMutedMessages"
          :key="muted.key"
          class="toast-panel__muted-row"
        >
          <span class="toast-panel__muted-sample">{{ muted.sample }}</span>
          <IconButton
            size="sm"
            :title="$t('common.showToastAgain')"
            @click="unmuteToastMessage(muted.key)"
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

.toast-panel__actions {
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

/* Checkbox + number box mirroring the FieldCard control styles — the
   built-in FieldCard checkbox always renders last, but auto hide needs
   the checkbox before its seconds input. */
.toast-panel__checkbox {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.25rem;
  height: 1.25rem;
  border: 2px solid var(--color-fg-muted);
  background: none;
  cursor: pointer;
  transition:
    border-color 0.2s ease,
    background-color 0.2s ease;
}

.toast-panel__checkbox:hover:not(:disabled) {
  border-color: var(--color-fg-secondary);
}

.toast-panel__checkbox--checked {
  border-color: var(--color-accent-primary);
  background-color: var(--color-accent-primary);
}

.toast-panel__checkbox:disabled {
  opacity: 0.4;
  cursor: default;
}

.toast-panel__check-icon {
  width: 0.85rem;
  height: 0.85rem;
  color: var(--color-fg-inverse);
}

.toast-panel__number {
  flex-shrink: 0;
  width: 4.5rem;
  padding: 0 var(--spacing-1);
  border: 1px solid var(--color-divider);
  background-color: var(--color-bg-primary);
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

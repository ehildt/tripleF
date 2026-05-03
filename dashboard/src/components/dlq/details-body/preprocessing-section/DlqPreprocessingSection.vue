<script setup lang="ts">
import {
  ArrowLeftRight,
  Check,
  Maximize2,
  SlidersHorizontal,
  Zap,
} from '@lucide/vue';

import {
  DEFAULT_PREPROCESSING_SETTINGS,
  type PreprocessingSettings,
  type PreprocessingSize,
} from '../../../../stores/preprocessing';
import PprocMasterToggle from '../../../pproc/shared/ui/master-toggle/PprocMasterToggle.vue';
import MaxHeightField from '../../../pproc/shared/ui/max-height-field/MaxHeightField.vue';
import MaxWidthField from '../../../pproc/shared/ui/max-width-field/MaxWidthField.vue';
import PprocSection from '../../../pproc/shared/ui/section/PprocSection.vue';
import PprocToggleButton from '../../../pproc/shared/ui/toggle-button/PprocToggleButton.vue';

const props = defineProps<{
  settings: PreprocessingSettings;
  disabled?: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:settings', value: PreprocessingSettings): void;
}>();

function update<K extends keyof PreprocessingSettings>(
  key: K,
  value: PreprocessingSettings[K],
) {
  emit('update:settings', { ...props.settings, [key]: value });
}

function setMaxWidth(value: PreprocessingSize) {
  update('resize', { ...props.settings.resize, maxWidth: value });
}

function setMaxHeight(value: number | null) {
  update('resize', { ...props.settings.resize, maxHeight: value });
}

function setWithoutEnlargement(value: boolean) {
  update('resize', { ...props.settings.resize, withoutEnlargement: value });
}

function resetAll() {
  emit('update:settings', { ...DEFAULT_PREPROCESSING_SETTINGS });
}
</script>

<template>
  <div class="dlq-preprocessing-section">
    <PprocMasterToggle
      :enabled="settings.enabled"
      @toggle="!disabled && update('enabled', !settings.enabled)"
    >
      <template #icon>
        <Zap class="w-5 h-5" />
      </template>
      <template #title>Enable Preprocessing</template>
      <template #description
        >Create multiple image variants for enhanced AI analysis</template
      >
    </PprocMasterToggle>

    <PprocSection :icon="SlidersHorizontal" title="Advanced Parameters">
      <template #action>
        <button
          class="dlq-preprocessing-section__reset"
          title="Reset all"
          :disabled="disabled || !settings.enabled"
          @click="resetAll()"
        >
          <ArrowLeftRight class="dlq-preprocessing-section__reset-icon" />
        </button>
      </template>
      <div class="dlq-preprocessing-section__grid">
        <div class="dlq-preprocessing-section__cell">
          <MaxWidthField
            :model-value="settings.resize.maxWidth"
            :disabled="disabled || !settings.enabled"
            @update:model-value="setMaxWidth($event as PreprocessingSize)"
          />
        </div>
        <div class="dlq-preprocessing-section__cell">
          <MaxHeightField
            :model-value="settings.resize.maxHeight"
            :disabled="disabled || !settings.enabled"
            @update:model-value="setMaxHeight"
          />
        </div>
        <PprocToggleButton
          :selected="settings.resize.withoutEnlargement"
          :disabled="disabled || !settings.enabled"
          @click="
            !disabled &&
            settings.enabled &&
            setWithoutEnlargement(!settings.resize.withoutEnlargement)
          "
        >
          <template #icon>
            <div
              class="dlq-preprocessing-section__icon"
              :class="{
                'dlq-preprocessing-section__icon--enabled':
                  settings.enabled && !disabled,
              }"
            >
              <Maximize2 class="dlq-preprocessing-section__icon-svg" />
            </div>
          </template>
          <template #content>
            <span
              class="dlq-preprocessing-section__toggle-title"
              :class="{
                'dlq-preprocessing-section__toggle-title--enabled':
                  settings.enabled && !disabled,
              }"
              >Prevent Upscaling</span
            >
            <span class="dlq-preprocessing-section__toggle-subtitle"
              >Skip smaller images</span
            >
          </template>
          <template #checkbox>
            <div
              class="dlq-preprocessing-section__checkbox"
              :class="{
                'dlq-preprocessing-section__checkbox--checked':
                  settings.resize.withoutEnlargement &&
                  settings.enabled &&
                  !disabled,
                'dlq-preprocessing-section__checkbox--enabled':
                  settings.enabled && !disabled,
              }"
            >
              <Check
                v-if="
                  settings.resize.withoutEnlargement &&
                  settings.enabled &&
                  !disabled
                "
                class="dlq-preprocessing-section__checkbox-icon"
                stroke-width="3"
              />
            </div>
          </template>
        </PprocToggleButton>
      </div>
    </PprocSection>
  </div>
</template>

<style scoped>
.dlq-preprocessing-section {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-4);
}

.dlq-preprocessing-section__reset {
  padding: var(--spacing-1);
  color: var(--color-fg-muted);
  cursor: pointer;
  transition: color 0.2s ease;
}

.dlq-preprocessing-section__reset:hover:not(:disabled) {
  color: var(--color-fg-primary);
}

.dlq-preprocessing-section__reset:disabled {
  cursor: not-allowed;
}

.dlq-preprocessing-section__reset-icon {
  width: 0.875rem;
  height: 0.875rem;
}

.dlq-preprocessing-section__grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--spacing-2);
}

.dlq-preprocessing-section__cell {
  padding: var(--spacing-3);
  border: 1px solid var(--color-divider);
  background-color: var(--color-bg-primary);
}

.dlq-preprocessing-section__icon {
  width: 2.25rem;
  height: 2.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: color-mix(in srgb, var(--color-fg-muted) 5%, transparent);
  color: color-mix(in srgb, var(--color-fg-muted) 40%, transparent);
}

.dlq-preprocessing-section__icon--enabled {
  background-color: color-mix(in srgb, var(--color-fg-muted) 10%, transparent);
  color: var(--color-fg-muted);
}

.dlq-preprocessing-section__icon-svg {
  width: 1rem;
  height: 1rem;
}

.dlq-preprocessing-section__toggle-title {
  display: block;
  font-family: var(--font-mono);
  font-weight: 700;
  font-size: 0.75rem;
  color: var(--color-fg-muted);
}

.dlq-preprocessing-section__toggle-title--enabled {
  color: var(--color-fg-secondary);
}

.dlq-preprocessing-section__toggle-subtitle {
  display: block;
  font-family: var(--font-mono);
  font-size: 0.625rem;
  color: var(--color-fg-muted);
}

.dlq-preprocessing-section__checkbox {
  width: 1rem;
  height: 1rem;
  border: 2px solid;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  border-color: color-mix(in srgb, var(--color-fg-muted) 40%, transparent);
}

.dlq-preprocessing-section__checkbox--enabled {
  border-color: var(--color-fg-muted);
}

.dlq-preprocessing-section__checkbox--checked {
  background-color: var(--color-tab-preprocessing);
  border-color: var(--color-tab-preprocessing);
}

.dlq-preprocessing-section__checkbox-icon {
  width: 0.75rem;
  height: 0.75rem;
  color: var(--color-fg-inverse);
}
</style>

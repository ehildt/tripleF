<script setup lang="ts">
import { Check, Image, ScanLine, Sparkles, Zap } from '@lucide/vue';

import {
  type PreprocessingSettings,
  type PreprocessingVariantsOptions,
  VARIANT_DESCRIPTIONS,
} from '../../../../stores/preprocessing';
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

const variantConfig: Record<
  keyof PreprocessingVariantsOptions,
  { icon: typeof Image; label: string; description: string }
> = {
  original: {
    icon: Image,
    label: 'Original',
    description: VARIANT_DESCRIPTIONS.original,
  },
  grayscale: {
    icon: ScanLine,
    label: 'Grayscale',
    description: VARIANT_DESCRIPTIONS.grayscale,
  },
  denoised: {
    icon: Zap,
    label: 'Denoise',
    description: VARIANT_DESCRIPTIONS.denoised,
  },
  sharpened: {
    icon: Sparkles,
    label: 'Sharpen',
    description: VARIANT_DESCRIPTIONS.sharpened,
  },
  clahe: {
    icon: Sparkles,
    label: 'CLAHE',
    description: VARIANT_DESCRIPTIONS.clahe,
  },
};

function toggleVariant(key: keyof PreprocessingVariantsOptions) {
  if (!props.settings.enabled) return;
  update('variants', {
    ...props.settings.variants,
    [key]: !props.settings.variants[key],
  });
}
</script>

<template>
  <div class="dlq-preprocessing-variants">
    <PprocToggleButton
      v-for="(config, key) in variantConfig"
      :key="key"
      :selected="settings.variants[key]"
      :disabled="disabled || !settings.enabled"
      @click="toggleVariant(key)"
    >
      <template #icon>
        <div
          class="dlq-preprocessing-variants__icon"
          :class="{
            'dlq-preprocessing-variants__icon--selected':
              settings.enabled && !disabled && settings.variants[key],
            'dlq-preprocessing-variants__icon--enabled':
              settings.enabled && !disabled,
          }"
        >
          <component
            :is="config.icon"
            class="dlq-preprocessing-variants__icon-svg"
          />
        </div>
      </template>
      <template #content>
        <span
          class="dlq-preprocessing-variants__title"
          :class="{
            'dlq-preprocessing-variants__title--active':
              settings.enabled && !disabled && settings.variants[key],
            'dlq-preprocessing-variants__title--enabled':
              settings.enabled && !disabled,
          }"
        >
          {{ config.label }}
        </span>
        <span
          class="dlq-preprocessing-variants__description"
          :class="{
            'dlq-preprocessing-variants__description--enabled':
              settings.enabled && !disabled,
          }"
        >
          {{ config.description }}
        </span>
      </template>
      <template #checkbox>
        <div
          class="dlq-preprocessing-variants__checkbox"
          :class="{
            'dlq-preprocessing-variants__checkbox--checked':
              settings.variants[key] && settings.enabled && !disabled,
            'dlq-preprocessing-variants__checkbox--enabled':
              settings.enabled && !disabled,
          }"
        >
          <Check
            v-if="settings.variants[key] && settings.enabled && !disabled"
            class="dlq-preprocessing-variants__checkbox-icon"
            stroke-width="3"
          />
        </div>
      </template>
    </PprocToggleButton>
  </div>
</template>

<style scoped>
.dlq-preprocessing-variants {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--spacing-2);
}

.dlq-preprocessing-variants__icon {
  width: 2.25rem;
  height: 2.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: color-mix(in srgb, var(--color-fg-muted) 5%, transparent);
  color: color-mix(in srgb, var(--color-fg-muted) 40%, transparent);
  transition: all 0.2s ease;
}

.dlq-preprocessing-variants__icon--enabled {
  background-color: color-mix(in srgb, var(--color-fg-muted) 10%, transparent);
  color: var(--color-fg-muted);
}

.dlq-preprocessing-variants__icon--selected {
  background-color: color-mix(
    in srgb,
    var(--color-tab-preprocessing) 20%,
    transparent
  );
  color: var(--color-tab-preprocessing);
}

.dlq-preprocessing-variants__icon-svg {
  width: 1rem;
  height: 1rem;
}

.dlq-preprocessing-variants__title {
  display: block;
  font-family: var(--font-mono);
  font-weight: 700;
  font-size: 0.75rem;
  text-transform: capitalize;
  color: var(--color-fg-muted);
}

.dlq-preprocessing-variants__title--enabled {
  color: var(--color-fg-secondary);
}

.dlq-preprocessing-variants__title--active {
  color: var(--color-fg-primary);
}

.dlq-preprocessing-variants__description {
  display: block;
  font-family: var(--font-mono);
  font-size: 0.625rem;
  line-height: 1.25;
  color: color-mix(in srgb, var(--color-fg-muted) 60%, transparent);
}

.dlq-preprocessing-variants__description--enabled {
  color: var(--color-fg-muted);
}

.dlq-preprocessing-variants__checkbox {
  width: 1.25rem;
  height: 1.25rem;
  border: 2px solid;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  border-color: color-mix(in srgb, var(--color-fg-muted) 40%, transparent);
}

.dlq-preprocessing-variants__checkbox--enabled {
  border-color: var(--color-fg-muted);
}

.dlq-preprocessing-variants__checkbox--checked {
  background-color: var(--color-tab-preprocessing);
  border-color: var(--color-tab-preprocessing);
}

.dlq-preprocessing-variants__checkbox-icon {
  width: 0.875rem;
  height: 0.875rem;
  color: var(--color-fg-inverse);
}
</style>

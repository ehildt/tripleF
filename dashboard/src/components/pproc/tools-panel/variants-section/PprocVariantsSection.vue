<script setup lang="ts">
import { Check, Image, Images, ScanLine, Sparkles, Zap } from '@lucide/vue';

import {
  usePreprocessingStore,
  VARIANT_DESCRIPTIONS,
} from '@/stores/preprocessing';

import PprocSection from '../../shared/ui/section/PprocSection.vue';
import PprocToggleButton from '../../shared/ui/toggle-button/PprocToggleButton.vue';

const store = usePreprocessingStore();

const variantConfig: Record<
  string,
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

function toggleVariant(key: keyof typeof store.variants) {
  if (!store.enabled) return;
  store.setVariant(key, !store.variants[key]);
}

function iconWrapperClass(key: keyof typeof store.variants) {
  const selected = store.variants[key];
  const base = 'pproc-variants-section__icon-wrap';
  if (!store.enabled)
    return `${base} pproc-variants-section__icon-wrap--disabled`;
  if (selected) return `${base} pproc-variants-section__icon-wrap--selected`;
  return `${base} pproc-variants-section__icon-wrap--idle`;
}

function labelClass(key: keyof typeof store.variants) {
  const selected = store.variants[key];
  const base = 'pproc-variants-section__label';
  if (!store.enabled) return `${base} pproc-variants-section__label--disabled`;
  if (selected) return `${base} pproc-variants-section__label--selected`;
  return `${base} pproc-variants-section__label--idle`;
}

function descriptionClass() {
  return store.enabled
    ? 'pproc-variants-section__description'
    : 'pproc-variants-section__description pproc-variants-section__description--disabled';
}

function checkboxClass(key: keyof typeof store.variants) {
  const selected = store.variants[key];
  const base = 'pproc-variants-section__checkbox';
  if (selected && store.enabled)
    return `${base} pproc-variants-section__checkbox--selected`;
  if (!store.enabled)
    return `${base} pproc-variants-section__checkbox--disabled`;
  return `${base}`;
}
</script>

<template>
  <PprocSection :icon="Images" :title="$t('common.imageVariants')">
    <div class="pproc-variants-section__grid">
      <PprocToggleButton
        v-for="(config, key) in variantConfig"
        :key="key"
        :selected="store.variants[key as keyof typeof store.variants]"
        :disabled="!store.enabled"
        :highlighted="store.isVariantHighlighted(key)"
        @click="toggleVariant(key as keyof typeof store.variants)"
        @mouseenter="
          store.setHoveredVariant(key as keyof typeof store.variants)
        "
        @mouseleave="store.setHoveredVariant(null)"
      >
        <template #icon>
          <div :class="iconWrapperClass(key as keyof typeof store.variants)">
            <component :is="config.icon" class="pproc-variants-section__icon" />
          </div>
        </template>
        <template #content>
          <span :class="labelClass(key as keyof typeof store.variants)">
            {{ config.label }}
          </span>
          <span :class="descriptionClass()">
            {{ config.description }}
          </span>
        </template>
        <template #checkbox>
          <div :class="checkboxClass(key as keyof typeof store.variants)">
            <Check
              v-if="
                store.variants[key as keyof typeof store.variants] &&
                store.enabled
              "
              class="pproc-variants-section__check-icon"
              stroke-width="3"
            />
          </div>
        </template>
      </PprocToggleButton>
    </div>
  </PprocSection>
</template>

<style scoped>
.pproc-variants-section__grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: var(--spacing-1);
}

.pproc-variants-section__icon-wrap {
  width: 2.25rem;
  height: 2.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition:
    color 0.2s ease,
    background-color 0.2s ease;
}

.pproc-variants-section__icon-wrap--selected {
  background-color: color-mix(
    in srgb,
    var(--color-tab-preprocessing) 20%,
    transparent
  );
  color: var(--color-tab-preprocessing);
}

.pproc-variants-section__icon-wrap--idle {
  background-color: color-mix(in srgb, var(--color-fg-muted) 10%, transparent);
  color: var(--color-fg-muted);
}

.pproc-variants-section__icon-wrap--idle:hover {
  color: var(--color-fg-secondary);
  background-color: color-mix(in srgb, var(--color-fg-muted) 20%, transparent);
}

.pproc-variants-section__icon-wrap--disabled {
  background-color: color-mix(in srgb, var(--color-fg-muted) 5%, transparent);
  color: color-mix(in srgb, var(--color-fg-muted) 40%, transparent);
}

.pproc-variants-section__icon {
  width: 1rem;
  height: 1rem;
}

.pproc-variants-section__label {
  display: block;
  font-family: var(--font-mono);
  font-weight: 700;
  font-size: 0.75rem;
  text-transform: capitalize;
  line-height: 1.25;
}

.pproc-variants-section__label--selected {
  color: var(--color-fg-primary);
}

.pproc-variants-section__label--idle {
  color: var(--color-fg-secondary);
}

.pproc-variants-section__label--disabled {
  color: var(--color-fg-muted);
}

.pproc-variants-section__description {
  display: block;
  font-size: 0.625rem;
  font-family: var(--font-mono);
  line-height: 1.25;
  color: var(--color-fg-muted);
}

.pproc-variants-section__description--disabled {
  color: color-mix(in srgb, var(--color-fg-muted) 60%, transparent);
}

.pproc-variants-section__checkbox {
  width: 1.25rem;
  height: 1.25rem;
  border-width: 2px;
  border-style: solid;
  border-color: var(--color-fg-muted);
  display: flex;
  align-items: center;
  justify-content: center;
  transition:
    background-color 0.2s ease,
    border-color 0.2s ease;
}

.pproc-variants-section__checkbox--selected {
  background-color: var(--color-tab-preprocessing);
  border-color: var(--color-tab-preprocessing);
}

.pproc-variants-section__checkbox--disabled {
  border-color: color-mix(in srgb, var(--color-fg-muted) 40%, transparent);
}

.pproc-variants-section__check-icon {
  width: 0.875rem;
  height: 0.875rem;
  color: var(--color-fg-inverse);
}
</style>

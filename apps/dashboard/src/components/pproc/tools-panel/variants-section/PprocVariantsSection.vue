<script setup lang="ts">
import { Image, Images, ScanLine, Sparkles, Zap } from '@lucide/vue';

import NumberFieldCard from '@/components/shared/ui/number-field-card/NumberFieldCard.vue';
import SectionHeader from '@/components/shared/ui/section-header/SectionHeader.vue';
import {
  usePreprocessingStore,
  VARIANT_DESCRIPTIONS,
} from '@/stores/preprocessing';

type VariantKey = keyof typeof store.variants;

type VariantConfig = Record<
  string,
  { icon: typeof Image; label: string; description: string }
>;

const store = usePreprocessingStore();

const variantConfig: VariantConfig = {
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

function toggleVariant(key: VariantKey) {
  if (!store.enabled) return;
  store.setVariant(key, !store.variants[key]);
}
</script>

<template>
  <div class="pproc-variants-section">
    <SectionHeader :icon="Images" :title="$t('common.imageVariants')" />
    <div class="pproc-variants-section__grid">
      <NumberFieldCard
        v-for="(config, key) in variantConfig"
        :key="key"
        :icon="config.icon"
        :label="config.label"
        :description="config.description"
        :checked="store.variants[key as VariantKey]"
        :disabled="!store.enabled"
        :highlighted="store.isVariantHighlighted(key)"
        tone="preprocessing"
        @toggle="toggleVariant(key as VariantKey)"
        @mouseenter="store.setHoveredVariant(key as VariantKey)"
        @mouseleave="store.setHoveredVariant(null)"
      />
    </div>
  </div>
</template>

<style scoped>
.pproc-variants-section {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-3);
}

.pproc-variants-section__grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: var(--spacing-1);
}
</style>

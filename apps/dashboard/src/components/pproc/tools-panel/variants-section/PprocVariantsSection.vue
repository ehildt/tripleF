<script setup lang="ts">
import { Image, Images, ScanLine, Sparkles, Zap } from '@lucide/vue';

import FieldCard from '@/components/shared/ui/field-card/FieldCard.vue';
import {
  usePreprocessingStore,
  VARIANT_DESCRIPTIONS,
} from '@/stores/preprocessing';

import SectionHeader from '../../../shared/ui/section-header/SectionHeader.vue';

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
</script>

<template>
  <div class="pproc-variants-section">
    <SectionHeader :icon="Images" :title="$t('common.imageVariants')" />
    <div class="pproc-variants-section__grid">
      <FieldCard
        v-for="(config, key) in variantConfig"
        :key="key"
        :icon="config.icon"
        :label="config.label"
        :description="config.description"
        :checked="store.variants[key as keyof typeof store.variants]"
        :disabled="!store.enabled"
        :highlighted="store.isVariantHighlighted(key)"
        tone="preprocessing"
        @toggle="toggleVariant(key as keyof typeof store.variants)"
        @mouseenter="
          store.setHoveredVariant(key as keyof typeof store.variants)
        "
        @mouseleave="store.setHoveredVariant(null)"
      />
    </div>
  </div>
</template>

<style scoped>
.pproc-variants-section {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-1);
}

.pproc-variants-section__grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: var(--spacing-1);
}
</style>

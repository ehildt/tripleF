<script setup lang="ts">
import {
  ArrowDownToLine,
  Maximize2,
  MoveHorizontal,
  MoveVertical,
} from '@lucide/vue';

import NumberFieldCard from '@/components/shared/ui/number-field-card/NumberFieldCard.vue';
import SectionHeader from '@/components/shared/ui/section-header/SectionHeader.vue';
import SelectFieldCard from '@/components/shared/ui/select-field-card/SelectFieldCard.vue';
import {
  PREPROCESSING_SIZES,
  usePreprocessingStore,
} from '@/stores/preprocessing';
import type { PreprocessingSize } from '@/types/preprocessing.model';

const store = usePreprocessingStore();

/* Both dropdowns derive from the store's PREPROCESSING_SIZES — the single
   source for supported sizes; height adds AUTO (no cap) on top. */
const WIDTH_OPTIONS = PREPROCESSING_SIZES.map(String);
const HEIGHT_OPTIONS = ['AUTO', ...PREPROCESSING_SIZES.map(String)];

/** The width select emits only listed sizes — parse and set. */
function updateMaxWidth(value: string) {
  store.setMaxWidth(parseInt(value, 10) as PreprocessingSize);
}

/** The height select emits AUTO (no cap) or a listed size. */
function updateMaxHeight(value: string) {
  store.setMaxHeight(value === 'AUTO' ? null : parseInt(value, 10));
}
</script>

<template>
  <div class="pproc-resize-section">
    <SectionHeader
      :icon="ArrowDownToLine"
      :title="$t('common.resizeSettings')"
    />
    <div class="pproc-resize-section__grid">
      <SelectFieldCard
        :icon="MoveHorizontal"
        :label="$t('common.maxWidth')"
        description="in pixels"
        :model-value="String(store.resize.maxWidth)"
        :options="WIDTH_OPTIONS"
        :disabled="!store.enabled"
        @update:model-value="updateMaxWidth"
      />

      <SelectFieldCard
        :icon="MoveVertical"
        :label="$t('common.maxHeight')"
        description="in pixels"
        :model-value="store.resize.maxHeight?.toString() ?? 'AUTO'"
        :options="HEIGHT_OPTIONS"
        placeholder="AUTO"
        :disabled="!store.enabled"
        @update:model-value="updateMaxHeight"
      />

      <NumberFieldCard
        :icon="Maximize2"
        :label="$t('common.preventUpscaling')"
        description="skip smaller images"
        :checked="store.resize.withoutEnlargement"
        :disabled="!store.enabled"
        tone="preprocessing"
        @toggle="store.setWithoutEnlargement(!store.resize.withoutEnlargement)"
      />
    </div>
  </div>
</template>

<style scoped>
.pproc-resize-section {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-3);
}

.pproc-resize-section__grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--spacing-1);
}
</style>

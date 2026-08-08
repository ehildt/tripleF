<script setup lang="ts">
/**
 * The SysCtl "Layouts" tab: which art-direction layouts the response model
 * may compose news/article/evaluation answers from.
 */
import { Columns2, Layers, LayoutGrid, Quote, Rows } from '@lucide/vue';

import FieldCard from '@/components/shared/ui/field-card/FieldCard.vue';
import FieldGrid from '@/components/shared/ui/field-grid/FieldGrid.vue';

import SysCtlSection from '../shared/ui/sysctl-section/SysCtlSection.vue';
import SysCtlSectionHeader from '../shared/ui/sysctl-section-header/SysCtlSectionHeader.vue';
import { useLayoutsSection } from './composables/use-layouts-section.composable';

const { isLayoutEnabled, toggleLayout } = useLayoutsSection();
</script>

<template>
  <SysCtlSection>
    <div class="layouts-section">
      <SysCtlSectionHeader
        :icon="Layers"
        :title="$t('common.layoutsSection')"
      />
      <p class="layouts-section__hint">{{ $t('common.layoutsHint') }}</p>

      <FieldGrid :items-per-row="2">
        <FieldCard
          :icon="Rows"
          :label="$t('common.layoutClassic')"
          :description="$t('common.layoutClassicDesc')"
          :checked="isLayoutEnabled('classic')"
          @toggle="toggleLayout('classic')"
        />
        <FieldCard
          :icon="Quote"
          :label="$t('common.layoutEditorial')"
          :description="$t('common.layoutEditorialDesc')"
          :checked="isLayoutEnabled('editorial')"
          @toggle="toggleLayout('editorial')"
        />
        <FieldCard
          :icon="Columns2"
          :label="$t('common.layoutSplit')"
          :description="$t('common.layoutSplitDesc')"
          :checked="isLayoutEnabled('split')"
          @toggle="toggleLayout('split')"
        />
        <FieldCard
          :icon="LayoutGrid"
          :label="$t('common.layoutMosaic')"
          :description="$t('common.layoutMosaicDesc')"
          :checked="isLayoutEnabled('mosaic')"
          @toggle="toggleLayout('mosaic')"
        />
      </FieldGrid>
    </div>
  </SysCtlSection>
</template>

<style scoped>
.layouts-section {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-3);
}

.layouts-section__hint {
  margin: 0;
  font-size: 0.85em;
  color: var(--color-fg-secondary);
}
</style>

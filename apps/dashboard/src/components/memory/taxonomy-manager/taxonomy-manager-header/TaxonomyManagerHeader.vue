<script setup lang="ts">
/**
 * The taxonomy manager's header card: the panel identity (icon, label,
 * description) plus its actions — the memory-lane toggle (partition /
 * encyclopedia) the taxonomy is scoped to, and a manual refresh. The lane
 * is a named v-model: the manager's composable backs it by the route's
 * ?lane= query.
 */
import { Brain, FolderTree, Network, RefreshCw } from '@lucide/vue';
import { computed } from 'vue';

import IconButton from '@/components/shared/ui/icon-button/IconButton.vue';
import SegmentedToggle from '@/components/shared/ui/segmented-toggle/SegmentedToggle.vue';
import { i18n } from '@/i18n/i18n';

import type { TaxonomyLane } from '../composables/use-taxonomy-manager.types';
import type { TaxonomyManagerHeaderProps } from './TaxonomyManagerHeader.types';

defineProps<TaxonomyManagerHeaderProps>();

/** The taxonomy lane (query-backed via the manager's composable). */
const lane = defineModel<TaxonomyLane>('lane', { required: true });

const emit = defineEmits<{
  /** The refresh action was clicked. */
  refresh: [];
}>();

/** The lane segments of the memory-lane toggle. */
const LANE_OPTIONS = computed(() => [
  {
    value: 'partition',
    icon: Brain,
    tooltip: i18n.global.t('common.settingsMemoryPartition'),
  },
  {
    value: 'encyclopedia',
    icon: Network,
    tooltip: i18n.global.t('common.settingsMemoryEncyclopedia'),
  },
]);
</script>

<template>
  <div class="taxonomy-manager-header">
    <div class="taxonomy-manager-header__icon">
      <FolderTree class="taxonomy-manager-header__icon-glyph" />
    </div>
    <div class="taxonomy-manager-header__content">
      <span class="taxonomy-manager-header__label">{{
        $t('common.memoryTaxonomyManager')
      }}</span>
      <span class="taxonomy-manager-header__description">{{
        $t('common.memoryTaxonomyManagerDesc')
      }}</span>
    </div>
    <div class="taxonomy-manager-header__actions">
      <SegmentedToggle
        v-model="lane"
        :options="LANE_OPTIONS"
        :aria-label="$t('common.memoryTaxonomyLane')"
      />
      <IconButton
        :title="$t('common.memoryTaxonomyRefresh')"
        size="sm"
        :disabled="isLoading"
        @click="emit('refresh')"
      >
        <RefreshCw :size="16" />
      </IconButton>
    </div>
  </div>
</template>

<style scoped>
.taxonomy-manager-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
  padding: var(--spacing-3) var(--spacing-4);
  background-color: var(--color-bg-secondary);
  border: 1px solid var(--color-divider);
}

.taxonomy-manager-header__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  flex-shrink: 0;
  color: var(--color-fg-secondary);
  border: 1px solid var(--color-divider);
}

.taxonomy-manager-header__icon-glyph {
  width: 1rem;
  height: 1rem;
}

.taxonomy-manager-header__content {
  display: flex;
  flex-direction: column;
  min-width: 0;
  flex: 1;
}

.taxonomy-manager-header__label {
  font-family: var(--font-mono);
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--color-fg-primary);
}

.taxonomy-manager-header__description {
  font-size: 0.75rem;
  color: var(--color-fg-muted);
}

.taxonomy-manager-header__actions {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
}
</style>

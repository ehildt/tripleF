<script setup lang="ts">
/**
 * Dynamic source config: preferred domains get a rank boost and prompt
 * guidance; blocked domains are dropped from the tool context entirely.
 * One entry per line — a hostname (subdomains match) or a /regex/ pattern
 * against the hostname. Changes apply to new requests on save (change).
 */
import { Ban, Images, ThumbsUp } from '@lucide/vue';

import FieldCard from '@/components/shared/ui/field-card/FieldCard.vue';

import {
  MAX_IMAGE_TASK_REFERENCE_COUNT,
  useSourcesPanel,
} from './composables/use-sources-panel.composable';
import SourceListCard from './source-list-card/SourceListCard.vue';
import type {
  SourcesPanelEmits,
  SourcesPanelProps,
} from './SourcesPanel.types';

const props = defineProps<SourcesPanelProps>();
const emit = defineEmits<SourcesPanelEmits>();

const {
  referenceCount,
  referenceCountEnabled,
  saveReferenceCount,
  toggleReferenceCount,
  handleListChange,
} = useSourcesPanel(props, emit);
</script>

<template>
  <div class="sources-panel">
    <div class="sources-panel__lists">
      <!-- One line, gap-1: label block on top, text input below it -->
      <SourceListCard
        :list="sources.preferred ?? []"
        :icon="ThumbsUp"
        :label="$t('common.preferredSources')"
        :description="$t('common.sourcesPreferredHint')"
        :reset-title="$t('common.resetPreferredSources')"
        placeholder="bbc.com&#10;arstechnica.com"
        @change="handleListChange('preferred', $event)"
        @reset="emit('reset', 'preferred')"
      />

      <SourceListCard
        :list="sources.blocked ?? []"
        :icon="Ban"
        :label="$t('common.blockedSources')"
        :description="$t('common.sourcesBlockedHint')"
        :reset-title="$t('common.resetBlockedSources')"
        placeholder="*.pinterest.com&#10;/^lh\d+\.googleusercontent\.com$/"
        @change="handleListChange('blocked', $event)"
        @reset="emit('reset', 'blocked')"
      />
    </div>

    <!-- Serper-style field row: icon tile + label + description + number +
         checkbox. Checkbox off ⇔ pool size 0 (no reference images verified). -->
    <FieldCard
      :icon="Images"
      :label="$t('common.imageTaskReferences')"
      :description="$t('common.imageTaskReferencesHint')"
      :checked="referenceCountEnabled"
      :number-value="referenceCount"
      :number-min="1"
      :number-max="MAX_IMAGE_TASK_REFERENCE_COUNT"
      :number-disabled="!referenceCountEnabled"
      @toggle="toggleReferenceCount"
      @update:number-value="saveReferenceCount"
    />
  </div>
</template>

<style scoped>
.sources-panel {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-3);
  padding: var(--spacing-1);
}

.sources-panel__lists {
  display: flex;
  gap: var(--spacing-3);
}

/* Stack the two cards on narrow Settings widths */
@media (max-width: 720px) {
  .sources-panel__lists {
    flex-direction: column;
  }
}
</style>

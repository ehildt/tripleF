<script setup lang="ts">
import { computed } from 'vue';

import type { KeyFinding } from '@/types/harness-response-data.model';

import { useHarnessSectionCollapsed } from '../../shared/composables/use-harness-section-collapsed.composable';
import { pickCycleColor } from '../../shared/helpers/pick-cycle-color.helper';
import { splitSpecLabel } from '../../shared/helpers/split-spec-label.helper';
import SectionTitle from '../../shared/ui/section-title/SectionTitle.vue';
import StatTile from '../../shared/ui/stat-tile/StatTile.vue';

const props = defineProps<{
  items?: KeyFinding[];
  /** Heading above the list; omit for embedded use (e.g. stockmarket grid). */
  title?: string;
}>();

const validItems = computed(() =>
  (props.items ?? []).filter(
    (item): item is KeyFinding =>
      typeof item === 'object' &&
      item !== null &&
      typeof (item as KeyFinding).text === 'string' &&
      (item as KeyFinding).text.trim().length > 0,
  ),
);

/** Findings as label/value rows, mirroring the fundamentals cards. */
const rows = computed(() =>
  validItems.value.map((finding) => splitSpecLabel(finding.text)),
);

/** Hidden while the prompt bar collapses the key-findings section type. */
const isCollapsed = useHarnessSectionCollapsed('keyFindings');
</script>

<template>
  <section v-if="rows.length && !isCollapsed" class="key-findings">
    <SectionTitle v-if="title" :title="title" />
    <ul>
      <StatTile
        v-for="(row, index) in rows"
        :key="index"
        :label="row.label"
        :value="row.value"
        :tint="pickCycleColor(index)"
      />
    </ul>
  </section>
</template>

<style scoped>
.key-findings ul {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-1);
  list-style: none;
  padding: 0;
  margin: 0;
}
</style>

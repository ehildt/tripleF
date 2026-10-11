<script setup lang="ts">
import SectionTitle from '@/components/chat/shared/ui/section-title/SectionTitle.vue';

import { pickCycleColor } from '../../../../shared/helpers/pick-cycle-color.helper';
import { useEvaluationListSection } from './composables/use-evaluation-list-section.composable';
import type { EvaluationListSectionProps } from './EvaluationListSection.types';

const props = defineProps<EvaluationListSectionProps>();

const { validItems, icon } = useEvaluationListSection(props);
</script>

<template>
  <section
    v-if="validItems.length"
    class="evaluation-list-section"
    :class="variant && `evaluation-list-section--${variant}`"
  >
    <SectionTitle :title="title" />
    <ul>
      <li
        v-for="(item, index) in validItems"
        :key="index"
        :style="{ '--item-color': pickCycleColor(index) }"
      >
        <span class="evaluation-list-section__icon" aria-hidden="true">{{
          icon
        }}</span>
        <span class="evaluation-list-section__text">{{ item.text }}</span>
      </li>
    </ul>
  </section>
</template>

<style scoped>
.evaluation-list-section ul {
  list-style: none;
  padding: var(--spacing-3);
  margin: 0.5em 0 0;
  background-color: var(--color-bg-secondary);
}

.evaluation-list-section li {
  display: flex;
  align-items: flex-start;
  gap: 0.5em;
  margin-bottom: 0.35em;
  color: var(--color-fg-secondary);
}

.evaluation-list-section__icon {
  flex-shrink: 0;
  font-weight: 700;
  width: 1.25em;
  text-align: center;
}

.evaluation-list-section__text {
  line-height: 1.5;
}

.evaluation-list-section--strength .evaluation-list-section__icon {
  color: var(--color-status-success);
}

.evaluation-list-section--weakness .evaluation-list-section__icon {
  color: var(--color-status-error);
}

.evaluation-list-section--recommendation .evaluation-list-section__icon {
  /* Recommendations are neutral arrows — the colour cycles so the list
     reads as a row of distinct cards, like sources/key findings. */
  color: var(--item-color, var(--color-accent-primary));
}
</style>

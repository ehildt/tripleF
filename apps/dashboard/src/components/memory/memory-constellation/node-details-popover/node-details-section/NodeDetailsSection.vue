<script setup lang="ts">
import type { NodeDetailsSectionProps } from './NodeDetailsSection.types';

defineProps<NodeDetailsSectionProps>();
</script>

<template>
  <section
    class="node-details-section"
    :class="`node-details-section--${tone}`"
  >
    <span class="node-details-section__tag">{{ label }}</span>
    <!-- Rows are inert strings, order-static per selection and possibly
         duplicated — keyed by index by design (no id to key on). -->
    <p
      v-for="(item, index) in items"
      :key="index"
      class="node-details-section__item"
    >
      {{ item }}
    </p>
  </section>
</template>

<style scoped>
.node-details-section {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-1);
  padding: var(--spacing-2);
}

.node-details-section--warning {
  background-color: color-mix(
    in srgb,
    var(--color-status-warning) 12%,
    transparent
  );
  border: 1px solid
    color-mix(in srgb, var(--color-status-warning) 45%, transparent);
}

.node-details-section--neutral {
  background-color: color-mix(
    in srgb,
    var(--color-bg-secondary) 45%,
    transparent
  );
  border: 1px solid var(--color-divider);
}

.node-details-section__tag {
  font-family: var(--font-mono);
  font-size: 0.625rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.node-details-section--warning .node-details-section__tag {
  color: var(--color-status-warning);
}

.node-details-section--neutral .node-details-section__tag {
  color: var(--color-fg-muted);
}

.node-details-section__item {
  margin: 0;
  font-family: var(--font-mono);
  font-size: 0.75rem;
  line-height: 1.4;
  color: var(--color-fg-primary);
  overflow-wrap: anywhere;
}
</style>

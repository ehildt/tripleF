<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  percent: string | number | null;
}>();

const statusClass = computed(() => {
  const value = props.percent == null ? null : Number(props.percent);
  if (value == null) return '';
  if (value > 80) return 'context-usage-indicator__value--error';
  if (value > 50) return 'context-usage-indicator__value--warning';
  return 'context-usage-indicator__value--info';
});
</script>

<template>
  <span v-if="percent != null" class="context-usage-indicator">
    <span class="context-usage-indicator__value" :class="statusClass">
      {{ `${percent}%` }}
    </span>
  </span>
</template>

<style scoped>
.context-usage-indicator {
  font-size: 0.75rem;
  line-height: 1;
  font-family: var(--font-mono);
}

.context-usage-indicator__value--error {
  color: var(--color-status-error);
}

.context-usage-indicator__value--warning {
  color: var(--color-status-warning);
}

.context-usage-indicator__value--info {
  color: var(--color-tab-debug);
}
</style>

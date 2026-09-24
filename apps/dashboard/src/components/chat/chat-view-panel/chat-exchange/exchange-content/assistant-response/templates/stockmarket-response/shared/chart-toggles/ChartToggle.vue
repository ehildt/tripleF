<script setup lang="ts">
import type { LucideIcon } from '@lucide/vue';

defineProps<{
  /** Whether the toggle is in its active (pressed) state. */
  active?: boolean;
  /** Disables the toggle (e.g. heatmap variants while volume is histogram). */
  disabled?: boolean;
  /** Tooltip and accessible name for the toggle. */
  label: string;
  /** Icon rendered inside the toggle. */
  icon: LucideIcon;
}>();

const emit = defineEmits<{ click: [] }>();
</script>

<template>
  <button
    type="button"
    class="chart-toggle"
    :class="{ 'chart-toggle--active': active }"
    :title="label"
    :aria-label="label"
    :aria-pressed="active"
    :disabled="disabled"
    @click="emit('click')"
  >
    <component :is="icon" class="chart-toggle__icon" />
  </button>
</template>

<style scoped>
.chart-toggle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.3rem;
  color: var(--color-fg-muted);
  background-color: var(--color-bg-elevated);
  border: 1px solid var(--color-divider);
  cursor: pointer;
}

.chart-toggle__icon {
  width: 0.85rem;
  height: 0.85rem;
}

/* Active state recolors the icon only — the button border stays the divider
   color so the controls read as a flat segmented row. The active hue is set
   per group by the parent via --chart-toggle-active-color. */
.chart-toggle--active {
  color: var(--chart-toggle-active-color, var(--color-accent-primary));
}

.chart-toggle:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>

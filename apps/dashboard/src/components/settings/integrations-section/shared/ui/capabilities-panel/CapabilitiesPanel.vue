<script setup lang="ts">
import Tooltip from '@/components/shared/ui/tooltip/Tooltip.vue';

import type {
  CapabilityRow,
  CapabilityStatus,
} from './CapabilitiesPanel.types';

/**
 * Read-only provider account/usage metadata, rendered in the same visual
 * language as FieldCard (icon tile + mono label + value). Used in the
 * settings integrations drawer metadata column. `statuses` renders an optional
 * available/not-in-plan list (e.g. EODHD endpoints). Rows and statuses
 * render independently, so the panel can be split across the provider's
 * two metadata columns (rows | statuses).
 */
withDefaults(
  defineProps<{
    rows?: CapabilityRow[];
    statuses?: CapabilityStatus[];
  }>(),
  {
    rows: () => [],
    statuses: undefined,
  },
);
</script>

<template>
  <div class="capabilities-panel">
    <div v-for="row in rows" :key="row.label" class="capabilities-panel__row">
      <div v-if="row.icon" class="capabilities-panel__icon">
        <component :is="row.icon" class="capabilities-panel__icon-glyph" />
      </div>
      <Tooltip :text="row.label" max-width="16rem">
        <span class="capabilities-panel__label">{{ row.label }}</span>
      </Tooltip>
      <span
        class="capabilities-panel__value"
        :class="{
          'capabilities-panel__value--warning': row.tone === 'warning',
        }"
      >
        {{ row.value }}
      </span>
    </div>

    <template v-if="statuses?.length">
      <div
        v-for="status in statuses"
        :key="status.label"
        class="capabilities-panel__row"
      >
        <div v-if="status.icon" class="capabilities-panel__icon">
          <component :is="status.icon" class="capabilities-panel__icon-glyph" />
        </div>
        <Tooltip :text="status.label" max-width="16rem">
          <span class="capabilities-panel__label">{{ status.label }}</span>
        </Tooltip>
        <span
          class="capabilities-panel__dot"
          :class="
            status.available
              ? 'capabilities-panel__dot--on'
              : 'capabilities-panel__dot--off'
          "
        />
      </div>
    </template>
  </div>
</template>

<style scoped>
.capabilities-panel {
  display: flex;
  flex-direction: column;
  border-radius: 0;
  gap: var(--spacing-1);
}

.capabilities-panel__row {
  background-color: var(--color-bg-tertiary);
  display: flex;
  align-items: center;
  gap: var(--spacing-4);
  padding: var(--spacing-2) var(--spacing-3);
}

.capabilities-panel__icon {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.25rem;
  height: 2.25rem;
  background-color: color-mix(in srgb, var(--color-fg-muted) 10%, transparent);
  color: var(--color-fg-muted);
}

.capabilities-panel__icon-glyph {
  width: 1rem;
  height: 1rem;
}

.capabilities-panel__label {
  flex: 1;
  min-width: 0;
  font-family: var(--font-mono);
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--color-fg-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.capabilities-panel__value {
  flex-shrink: 0;
  font-family: var(--font-mono);
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--color-fg-primary);
}

.capabilities-panel__value--warning {
  color: var(--color-status-warning);
}

.capabilities-panel__dot {
  flex-shrink: 0;
  width: 0.7rem;
  height: 0.7rem;
  border-radius: 50%;
}

.capabilities-panel__dot--on {
  background-color: var(--color-status-success);
}

.capabilities-panel__dot--off {
  background-color: var(--color-status-error);
}
</style>

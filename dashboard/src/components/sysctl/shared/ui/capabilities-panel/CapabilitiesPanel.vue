<script setup lang="ts">
import type {
  CapabilityRow,
  CapabilityStatus,
} from './CapabilitiesPanel.types';

/**
 * Read-only provider account/usage metadata, rendered in the same visual
 * language as FieldCard (icon tile + mono label + value). Used in the
 * sysctl search-engines metadata column. `statuses` renders an optional
 * available/not-in-plan list (e.g. EODHD endpoints).
 */
withDefaults(
  defineProps<{
    rows: CapabilityRow[];
    statuses?: CapabilityStatus[];
  }>(),
  {
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

    <div v-if="statuses?.length" class="capabilities-panel__statuses">
      <div
        v-for="status in statuses"
        :key="status.label"
        class="capabilities-panel__status"
      >
        <Tooltip :text="status.label" max-width="16rem">
          <span class="capabilities-panel__status-label">
            {{ status.label }}
          </span>
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
    </div>
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
  gap: var(--spacing-2);
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

.capabilities-panel__statuses {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-1);
  padding: var(--spacing-2) var(--spacing-3);
  padding-left: var(--spacing-4);
  background-color: var(--color-bg-tertiary);
}

.capabilities-panel__status {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-2);
  font-size: 0.75rem;
}

.capabilities-panel__dot {
  width: 0.55rem;
  height: 0.55rem;
  border-radius: 50%;
  flex-shrink: 0;
}

.capabilities-panel__dot--on {
  background-color: var(--color-status-success);
}

.capabilities-panel__dot--off {
  background-color: var(--color-status-error);
}

.capabilities-panel__status-label {
  flex: 1;
  min-width: 0;
  font-family: var(--font-mono);
  color: var(--color-fg-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>

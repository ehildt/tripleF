<script setup lang="ts">
/**
 * One card in the integrations grid. The whole tile body is a single
 * button that opens the configuration drawer; the quick enable/disable
 * switch sits on top of it in the header corner so both stay reachable
 * without nesting interactive elements. The power icon doubles as the
 * status indicator: green when enabled, yellow when configured but off,
 * red when the API key is missing.
 */
import { computed } from 'vue';

import PowerToggle from '@/components/shared/ui/power-toggle/PowerToggle.vue';

import type { IntegrationTileProps } from './IntegrationTile.types';

const props = defineProps<IntegrationTileProps>();

const emit = defineEmits<{
  /** Tile body clicked — open the configuration drawer. */
  open: [];
  /** Quick-toggle clicked — enable/disable (gated by the section). */
  toggle: [];
}>();

/** The toggle status tone; null for non-toggleable tiles (no state color). */
const stateTone = computed(() => {
  if (props.enabled === null) return null;
  if (props.enabled) return 'ok';
  return props.configured ? 'warn' : 'error';
});
</script>

<template>
  <div
    class="integration-tile"
    :class="stateTone ? `integration-tile--${stateTone}` : null"
  >
    <button
      type="button"
      class="integration-tile__surface"
      :aria-label="openLabel"
      @click="emit('open')"
    >
      <span class="integration-tile__head">
        <span
          class="integration-tile__icon"
          :class="{ 'integration-tile__icon--enabled': enabled }"
        >
          <component :is="icon" class="integration-tile__icon-glyph" />
        </span>
        <span class="integration-tile__name">{{ name }}</span>
      </span>

      <span class="integration-tile__description">{{ description }}</span>
    </button>

    <div v-if="enabled !== null" class="integration-tile__toggle">
      <PowerToggle
        :enabled="enabled"
        :title="toggleTitle"
        @toggle="emit('toggle')"
      />
    </div>
  </div>
</template>

<style scoped>
.integration-tile {
  position: relative;
}

.integration-tile__surface {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);
  width: 100%;
  height: 100%;
  padding: var(--spacing-3);
  /* Keep the header row clear of the overlaid toggle. */
  padding-inline-end: calc(var(--spacing-3) + 1.75rem);
  border: 1px solid var(--color-divider);
  border-radius: calc(var(--spacing-1) * 1.5);
  background-color: var(--color-bg-secondary);
  color: var(--color-fg-primary);
  text-align: start;
  cursor: pointer;
  transition:
    border-color 0.2s ease,
    background-color 0.2s ease;
}

.integration-tile__surface:hover,
.integration-tile__surface:focus-visible {
  border-color: var(--color-accent-primary);
}

.integration-tile__surface:focus {
  outline: none;
}

.integration-tile__surface:focus-visible {
  outline: 1px solid var(--color-accent-primary);
  outline-offset: -1px;
}

.integration-tile__head {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
}

.integration-tile__icon {
  display: grid;
  place-items: center;
  width: 1.75rem;
  height: 1.75rem;
  flex-shrink: 0;
  border-radius: var(--spacing-1);
  background-color: var(--color-bg-tertiary);
  color: var(--color-fg-muted);
  transition: color 0.2s ease;
}

.integration-tile__icon--enabled {
  color: var(--color-accent-primary);
}

.integration-tile__icon-glyph {
  width: 1rem;
  height: 1rem;
}

.integration-tile__name {
  font-size: 0.85rem;
  font-weight: 600;
}

.integration-tile__description {
  font-size: 0.8rem;
  line-height: 1.4;
  color: var(--color-fg-muted);
}

.integration-tile__toggle {
  position: absolute;
  /* Vertically centered on the head row (spacing-3 padding + half of the
     1.75rem head minus half of the 1.5rem toggle). */
  top: calc(var(--spacing-3) + 0.125rem);
  inset-inline-end: var(--spacing-3);
  z-index: 1;
}

/* Three-state toggle coloring: green when enabled, yellow when configured
   but off, red when the API key is missing. The hover variants keep the
   state color instead of falling back to the muted default. */
.integration-tile--ok .integration-tile__toggle :deep(.power-toggle),
.integration-tile--ok
  .integration-tile__toggle
  :deep(.power-toggle:hover:not(:disabled)) {
  color: var(--color-status-success);
  filter: drop-shadow(
    0 0 3px color-mix(in srgb, var(--color-status-success) 60%, transparent)
  );
}

.integration-tile--warn .integration-tile__toggle :deep(.power-toggle),
.integration-tile--warn
  .integration-tile__toggle
  :deep(.power-toggle:hover:not(:disabled)) {
  color: var(--color-status-warning);
}

.integration-tile--error .integration-tile__toggle :deep(.power-toggle),
.integration-tile--error
  .integration-tile__toggle
  :deep(.power-toggle:hover:not(:disabled)) {
  color: var(--color-status-error);
}
</style>

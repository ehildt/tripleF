<script setup lang="ts">
import { Power } from '@lucide/vue';

import Tooltip from '../tooltip/Tooltip.vue';

/**
 * Header power toggle: a single lucide Power icon button, colored when
 * enabled and greyed out when disabled. The `tone` prop switches the accent
 * between the app accent and the preprocessing accent.
 */
withDefaults(
  defineProps<{
    enabled: boolean;
    disabled?: boolean;
    title?: string;
    tone?: 'accent' | 'preprocessing';
  }>(),
  { title: 'Toggle enabled', tone: 'accent' },
);

const emit = defineEmits<{
  toggle: [];
}>();
</script>

<template>
  <Tooltip :text="title" :disabled="disabled">
    <button
      type="button"
      class="power-toggle"
      :class="{
        'power-toggle--enabled': enabled,
        'power-toggle--preprocessing': tone === 'preprocessing',
      }"
      :disabled="disabled"
      :aria-pressed="enabled"
      :aria-label="title"
      @click="emit('toggle')"
    >
      <Power class="power-toggle__icon" />
    </button>
  </Tooltip>
</template>

<style scoped>
.power-toggle {
  --power-accent: var(--color-accent-primary);

  display: grid;
  place-items: center;
  width: 1.5rem;
  height: 1.5rem;
  border: none;
  background: none;
  color: color-mix(in srgb, var(--color-fg-muted) 40%, transparent);
  cursor: pointer;
  transition:
    color 0.2s ease,
    filter 0.2s ease;
}

.power-toggle--preprocessing {
  --power-accent: var(--color-tab-preprocessing);
}

.power-toggle:hover:not(:disabled) {
  color: var(--color-fg-muted);
}

/* Specificity beats the plain :hover rule above — an enabled toggle keeps
   its accent color (and glow) while hovered. */
.power-toggle.power-toggle--enabled,
.power-toggle.power-toggle--enabled:hover:not(:disabled) {
  color: var(--power-accent);
  filter: drop-shadow(
    0 0 3px color-mix(in srgb, var(--power-accent) 60%, transparent)
  );
}

.power-toggle:disabled {
  opacity: 0.4;
  cursor: default;
}

.power-toggle__icon {
  width: 1rem;
  height: 1rem;
}
</style>

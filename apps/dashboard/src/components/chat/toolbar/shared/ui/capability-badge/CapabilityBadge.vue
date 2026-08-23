<script setup lang="ts">
import { computed } from 'vue';

import Tooltip from '../../../../../shared/ui/tooltip/Tooltip.vue';
import { CAPABILITY_META } from './capability-meta';

const props = defineProps<{
  capability: string;
}>();

/**
 * Known capabilities render as the same muted icon the model selector
 * dropdown uses, with the capability label as tooltip — the two surfaces
 * read identically. Unknown capability strings fall back to the text badge.
 */
const meta = computed(() => CAPABILITY_META[props.capability] ?? null);
</script>

<template>
  <Tooltip v-if="meta" :text="$t(`capabilities.${capability}`)">
    <span
      class="capability-badge capability-badge--icon"
      role="img"
      :aria-label="$t(`capabilities.${capability}`)"
    >
      <component
        :is="meta.icon"
        class="capability-badge__icon"
        aria-hidden="true"
      />
    </span>
  </Tooltip>
  <Tooltip v-else :text="capability">
    <span class="capability-badge">{{ capability }}</span>
  </Tooltip>
</template>

<style scoped>
.capability-badge {
  font-size: 0.625rem;
  padding: var(--spacing-0-5) var(--spacing-1);
  background-color: color-mix(
    in srgb,
    var(--color-accent-primary) 10%,
    transparent
  );
  color: var(--color-accent-primary);
  font-family: var(--font-mono);
  line-height: 1.25;
}

/* Icon variant: same muted look as the model selector dropdown icons. */
.capability-badge--icon {
  display: inline-flex;
  align-items: center;
  padding: 0;
  background-color: transparent;
  color: var(--color-fg-muted);
  transition: color 0.2s ease;
}

.capability-badge--icon:hover {
  color: var(--color-accent-primary);
}

.capability-badge__icon {
  width: 0.75rem;
  height: 0.75rem;
}
</style>

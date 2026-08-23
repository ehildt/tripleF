<script lang="ts" setup>
import { computed } from 'vue';

const props = defineProps<{
  variant: 'type' | 'direction' | 'status';
  value: string;
}>();

/**
 * Color mapping (previously getTagColorClasses): type/direction use the
 * accent tone for the "active" form and the rest tone for the passive one;
 * status uses rest for success and debug for error.
 */
const toneClass = computed(() => {
  switch (props.variant) {
    case 'type':
      return props.value === 'socket' ? 'tag--rest' : 'tag--accent';
    case 'direction':
      return props.value === 'response' ? 'tag--rest' : 'tag--accent';
    case 'status':
      return props.value === 'success' ? 'tag--rest' : 'tag--debug';
    default:
      return 'tag--debug';
  }
});
</script>

<template>
  <span class="tag" :class="toneClass">{{ value }}</span>
</template>

<style scoped>
.tag {
  padding: var(--spacing-0-5) var(--spacing-1-5);
  font-family: var(--font-mono);
  font-size: 0.625rem;
  text-transform: uppercase;
  border: 1px solid transparent;
}

.tag--accent {
  color: var(--color-tab-accent);
  border-color: color-mix(in srgb, var(--color-tab-accent) 50%, transparent);
  background-color: color-mix(
    in srgb,
    var(--color-tab-accent) 10%,
    transparent
  );
}

.tag--rest {
  color: var(--color-tab-rest);
  border-color: color-mix(in srgb, var(--color-tab-rest) 50%, transparent);
  background-color: color-mix(in srgb, var(--color-tab-rest) 10%, transparent);
}

.tag--debug {
  color: var(--color-tab-debug);
  border-color: color-mix(in srgb, var(--color-tab-debug) 50%, transparent);
  background-color: color-mix(in srgb, var(--color-tab-debug) 10%, transparent);
}
</style>

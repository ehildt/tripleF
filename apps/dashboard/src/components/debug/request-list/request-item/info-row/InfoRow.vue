<script lang="ts" setup>
import { CircleGauge } from '@lucide/vue';
import { computed } from 'vue';

const props = defineProps<{
  method: string;
  type: 'http' | 'socket';
  event?: string;
  roomId?: string;
  model?: string;
  requestId?: string;
  endpoint?: string;
}>();

/** HTTP method color: GET/DELETE rest, POST/PATCH accent, everything else debug. */
const methodClass = computed(() => {
  switch (props.method.toUpperCase()) {
    case 'GET':
    case 'DELETE':
      return 'info-row__method--rest';
    case 'POST':
    case 'PATCH':
      return 'info-row__method--accent';
    default:
      return 'info-row__method--debug';
  }
});
</script>

<template>
  <span
    v-if="type === 'http'"
    class="info-row__method info-row__method--boxed"
    :class="methodClass"
  >
    {{ method }}
  </span>
  <span v-else class="info-row__method" :class="methodClass">
    {{ method }}
  </span>

  <span
    v-if="type === 'socket' && requestId"
    class="info-row__id info-row__id--accent"
  >
    <CircleGauge class="info-row__id-icon" />{{ requestId }}
  </span>
  <span v-else-if="type === 'http' && requestId" class="info-row__id--accent">
    {{ requestId }}
  </span>
  <span v-else class="info-row__endpoint">{{ endpoint }}</span>

  <span v-if="model" class="info-row__model">{{ model }}</span>
</template>

<style scoped>
.info-row__method {
  font-family: var(--font-mono);
  font-size: 0.75rem;
  font-weight: 700;
}

.info-row__method--boxed {
  padding: var(--spacing-0-5) var(--spacing-2);
  border: 1px solid currentColor;
}

.info-row__method--rest {
  color: var(--color-tab-rest);
  border-color: color-mix(in srgb, var(--color-tab-rest) 50%, transparent);
}

.info-row__method--accent {
  color: var(--color-tab-accent);
  border-color: color-mix(in srgb, var(--color-tab-accent) 50%, transparent);
}

.info-row__method--debug {
  color: var(--color-tab-debug);
  border-color: color-mix(in srgb, var(--color-tab-debug) 50%, transparent);
}

.info-row__id,
.info-row__id--accent,
.info-row__endpoint,
.info-row__model {
  font-family: var(--font-mono);
  font-size: 0.75rem;
  overflow-wrap: anywhere;
}

.info-row__id--accent {
  color: var(--color-tab-accent);
}

.info-row__id {
  display: inline-flex;
  align-items: center;
}

.info-row__id-icon {
  width: 0.75rem;
  height: 0.75rem;
}

.info-row__endpoint {
  color: var(--color-fg-secondary);
}

.info-row__model {
  color: var(--color-tab-rest);
}
</style>

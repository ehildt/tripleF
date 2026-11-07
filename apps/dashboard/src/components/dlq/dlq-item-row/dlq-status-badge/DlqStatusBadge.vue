<script setup lang="ts">
import { getDlqStatusColor } from '../../helpers/get-dlq-status-color.helper';
import type { DlqStatusBadgeProps } from './DlqStatusBadge.types';

defineProps<DlqStatusBadgeProps>();
</script>

<template>
  <span class="dlq-status-badge" :class="getDlqStatusColor(status)">
    {{ status }}
  </span>
</template>

<style scoped>
.dlq-status-badge {
  font-family: var(--font-mono);
  font-size: 0.625rem;
  font-weight: 700;
  text-transform: uppercase;
  padding: var(--spacing-0-5) var(--spacing-1-5);
  border: 1px solid;
}

.dlq-status-badge--failed {
  color: var(--color-tab-debug);
  border-color: color-mix(in srgb, var(--color-tab-debug) 40%, transparent);
}

.dlq-status-badge--active {
  color: var(--color-status-success);
  border-color: color-mix(
    in srgb,
    var(--color-status-success) 40%,
    transparent
  );
}

.dlq-status-badge--cleared {
  color: color-mix(in srgb, var(--color-tab-debug) 60%, transparent);
  border-color: color-mix(in srgb, var(--color-tab-debug) 20%, transparent);
}

.dlq-status-badge--removed {
  color: color-mix(in srgb, var(--color-status-error) 60%, transparent);
  border-color: color-mix(in srgb, var(--color-status-error) 30%, transparent);
}

.dlq-status-badge--unknown {
  color: var(--color-fg-muted);
  border-color: var(--color-divider);
}
</style>

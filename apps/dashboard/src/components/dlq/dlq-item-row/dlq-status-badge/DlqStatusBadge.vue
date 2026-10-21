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
</style>

<script setup lang="ts">
import type { DlqStatus } from '../../../../types/dlq-status.model';
import { getDlqStatusColor } from '../../helpers/get-dlq-status-color.helper';

defineProps<{
  status: DlqStatus;
}>();
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

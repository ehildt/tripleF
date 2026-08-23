<script lang="ts" setup>
import { computed } from 'vue';

import type { DebugResult } from '../../../../types/debug.model';
import InfoRow from './info-row/InfoRow.vue';
import Tag from './tag/Tag.vue';

const props = defineProps<{
  result: DebugResult;
  isRead?: boolean;
  isActive?: boolean;
}>();

const statusTint = computed(() =>
  props.result.status === 'success'
    ? 'request-item--success'
    : 'request-item--error',
);
</script>

<template>
  <div
    class="request-item"
    :class="[statusTint, { 'request-item--read': isRead && !isActive }]"
  >
    <div class="request-item__line">
      <Tag variant="type" :value="result.type" />
      <Tag
        v-if="result.direction"
        variant="direction"
        :value="result.direction"
      />
      <Tag variant="status" :value="result.status" />
      <InfoRow
        :method="result.method"
        :type="result.type"
        :event="result.event"
        :room-id="result.roomId"
        :model="result.model"
        :request-id="result.requestId"
        :endpoint="result.endpoint"
      />
    </div>
  </div>
</template>

<style scoped>
.request-item {
  padding: var(--spacing-3) var(--spacing-4);
}

.request-item--success {
  background-color: color-mix(
    in srgb,
    var(--color-status-success) 5%,
    transparent
  );
}

.request-item--error {
  background-color: color-mix(
    in srgb,
    var(--color-status-error) 5%,
    transparent
  );
}

.request-item--read {
  opacity: 0.3;
}

.request-item__line {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  min-width: 0;
}
</style>

<script lang="ts" setup>
import { getStatusColors } from '@/utils/colors/status/get-status-colors.helper';

import type { DebugResult } from '../../../../types/debug.model';
import InfoRow from './info-row/InfoRow.vue';
import Tag from './tag/Tag.vue';

defineProps<{
  result: DebugResult;
  isRead?: boolean;
  isActive?: boolean;
}>();
</script>

<template>
  <div
    class="px-4 py-3"
    :class="[
      getStatusColors(result.status).bg,
      { 'opacity-30': isRead && !isActive },
    ]"
  >
    <div class="flex-1 min-w-0">
      <div class="flex items-center gap-2">
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
  </div>
</template>

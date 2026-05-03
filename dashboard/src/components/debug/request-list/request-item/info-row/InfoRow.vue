<script lang="ts" setup>
import { CircleGauge } from '@lucide/vue';

import { getMethodTabBorderColor } from '@/utils/colors/method/get-method-tab-border-color.helper';
import { getMethodTabColor } from '@/utils/colors/method/get-method-tab-color.helper';

defineProps<{
  method: string;
  type: 'http' | 'socket';
  event?: string;
  roomId?: string;
  model?: string;
  requestId?: string;
  endpoint?: string;
}>();
</script>

<template>
  <!-- Method badge -->
  <span
    v-if="type === 'http'"
    class="text-xs font-mono font-bold px-2 py-0.5 border"
    :class="[getMethodTabColor(method), getMethodTabBorderColor(method)]"
  >
    {{ method }}
  </span>
  <span v-else class="text-xs font-mono" :class="getMethodTabColor(method)">
    {{ method }}
  </span>

  <!-- For Socket: Show requestId with hash icon -->
  <span
    v-if="type === 'socket' && requestId"
    class="text-xs font-mono text-tab-accent truncate inline-flex items-center"
  >
    <CircleGauge class="w-3 h-3" />{{ requestId }}
  </span>

  <!-- For HTTP: Show requestId if available, else endpoint -->
  <span
    v-else-if="type === 'http' && requestId"
    class="text-xs font-mono text-tab-accent truncate"
  >
    {{ requestId }}
  </span>
  <span v-else class="text-xs font-mono text-fg-secondary truncate">
    {{ endpoint }}
  </span>

  <!-- Show model if available -->
  <span v-if="model" class="text-xs font-mono text-tab-rest">
    {{ model }}
  </span>
</template>

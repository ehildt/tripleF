<script lang="ts" setup>
import type { DebugResult } from '../../../types/debug.model';
import RequestItem from './request-item/RequestItem.vue';

defineProps<{
  results: readonly DebugResult[];
  selectedResultId?: string;
  isRead: (id: string) => boolean;
}>();

defineEmits<{
  (e: 'select', result: DebugResult): void;
}>();
</script>

<template>
  <div
    class="max-h-[calc(100vh-27.3rem)] overflow-y-auto divide-y divide-divider pr-1.5"
  >
    <div
      v-for="result in results"
      :key="result.id"
      :class="[
        'cursor-pointer hover:bg-tertiary/50 divide-y divide-divider',
        { 'bg-tertiary': selectedResultId === result.id },
      ]"
      @click="$emit('select', result)"
    >
      <RequestItem
        :result="result"
        :is-read="isRead(result.id)"
        :is-active="selectedResultId === result.id"
      />
    </div>
  </div>
</template>

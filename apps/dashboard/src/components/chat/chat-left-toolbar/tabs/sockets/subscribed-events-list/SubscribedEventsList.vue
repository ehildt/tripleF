<script setup lang="ts">
import SubscribedEventItem from './subscribed-event-item/SubscribedEventItem.vue';
import type { SubscribedEventsListProps } from './SubscribedEventsList.types';

defineProps<SubscribedEventsListProps>();

defineEmits<{
  'toggle-active': [index: number];
  'toggle-stream': [index: number];
  'remove-subscription': [index: number];
}>();
</script>

<template>
  <div v-if="subscriptions.length" class="subscribed-events-list">
    <SubscribedEventItem
      v-for="(sub, i) in subscriptions"
      :key="i"
      :subscription="sub"
      :conversation-names="
        conversationNamesByEvent[`${sub.event}::${sub.roomId}`] ?? []
      "
      @toggle-active="$emit('toggle-active', i)"
      @toggle-stream="$emit('toggle-stream', i)"
      @remove="$emit('remove-subscription', i)"
    />
  </div>
</template>

<style scoped>
.subscribed-events-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-0-5);
  width: 100%;
  min-width: 0;
  max-height: calc(10 * 3.5rem);
  overflow-y: auto;
}
</style>

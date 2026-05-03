<script setup lang="ts">
import ExpandableList from '../shared/ExpandableList.vue';
import type { SubscriptionEntry } from './subscribed-event-item/SubscribedEventItem.vue';
import SubscribedEventItem from './subscribed-event-item/SubscribedEventItem.vue';

defineProps<{
  subscriptions: readonly SubscriptionEntry[];
  isExpanded: boolean;
  conversationNamesByEvent: Record<string, string[]>;
}>();

defineEmits<{
  'toggle-expanded': [];
  'toggle-active': [index: number];
  'toggle-stream': [index: number];
  'remove-subscription': [index: number];
}>();
</script>

<template>
  <ExpandableList
    v-if="subscriptions.length"
    :is-expanded="isExpanded"
    :has-items="true"
    @toggle-expanded="$emit('toggle-expanded')"
  >
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
  </ExpandableList>
</template>

<style scoped>
.subscribed-events-list {
  max-height: calc(4 * 3.5rem);
}
</style>

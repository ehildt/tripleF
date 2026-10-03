<script setup lang="ts">
import SubscribedEventsList from './subscribed-events-list/SubscribedEventsList.vue';
import type { SocketsProps } from './Sockets.types';

defineProps<SocketsProps>();

const emit = defineEmits<{
  toggleActive: [index: number];
  toggleStream: [index: number];
  removeSubscription: [index: number];
}>();
</script>

<template>
  <SubscribedEventsList
    :subscriptions="subscriptions"
    :conversation-names-by-event="conversationNamesByEvent"
    @toggle-active="emit('toggleActive', $event)"
    @toggle-stream="emit('toggleStream', $event)"
    @remove-subscription="emit('removeSubscription', $event)"
  />
</template>

<script setup lang="ts">
import { useLeftToolbarStore } from '@/stores/left-toolbar';

import SubscribedEventsList from './subscribed-events-list/SubscribedEventsList.vue';

const toolbarStore = useLeftToolbarStore();
</script>

<template>
  <SubscribedEventsList
    v-if="toolbarStore.subscriptions.length"
    :subscriptions="toolbarStore.subscriptions"
    :conversation-names-by-event="toolbarStore.conversationNamesByEvent"
    @toggle-active="toolbarStore.toggleSubscriptionActive"
    @toggle-stream="toolbarStore.toggleSubscriptionStream"
    @remove-subscription="toolbarStore.removeSubscription"
  />
</template>

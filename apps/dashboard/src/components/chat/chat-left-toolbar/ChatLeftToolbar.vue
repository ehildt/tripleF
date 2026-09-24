<script setup lang="ts">
import { watch } from 'vue';

import { useLeftToolbarStore } from '@/stores/left-toolbar';

import Models from './models/Models.vue';
import Tabs from './tabs/Tabs.vue';
import type { ChatLeftToolbarProps } from './ChatLeftToolbar.types';

const props = defineProps<ChatLeftToolbarProps>();

const toolbarStore = useLeftToolbarStore();

watch(
  () => props.chatActive,
  (active) => {
    if (!active) toolbarStore.closeAllMenus();
  },
);
</script>

<template>
  <div class="chat-left-toolbar">
    <Models />
    <Tabs />
  </div>
</template>

<style scoped>
.chat-left-toolbar {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: var(--spacing-2);
}
</style>

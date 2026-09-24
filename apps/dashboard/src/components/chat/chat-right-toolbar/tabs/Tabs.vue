<script setup lang="ts">
import { FileImage, History, ListVideo } from '@lucide/vue';

import type { RightToolbarView } from '@/components/chat/chat-right-toolbar/right-toolbar-view.type';
import Tab from '@/components/chat/shared/ui/tab/Tab.vue';

import type { TabsProps } from './Tabs.types';

defineProps<TabsProps>();

const emit = defineEmits<{
  selectView: [view: RightToolbarView];
}>();

function onSelect(view: RightToolbarView) {
  emit('selectView', view);
}
</script>

<template>
  <div class="tabs">
    <Tab
      v-if="hasAttachments"
      :is-active="activeView === 'files'"
      :label="$t('common.attachments')"
      @select="onSelect('files')"
    >
      <FileImage />
    </Tab>
    <Tab
      v-if="hasPlaylist"
      :is-active="activeView === 'playlist'"
      :label="$t('common.playlist')"
      @select="onSelect('playlist')"
    >
      <ListVideo />
    </Tab>
    <Tab
      v-if="hasHistory"
      :is-active="activeView === 'history'"
      :label="$t('common.history')"
      @select="onSelect('history')"
    >
      <History />
    </Tab>
  </div>
</template>

<style scoped>
.tabs {
  display: flex;
  gap: var(--spacing-1);
  width: 100%;
  flex-shrink: 0;
}
</style>

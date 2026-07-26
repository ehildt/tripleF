<script setup lang="ts">
import type { SocketProvider } from '@/types/socket-provider.model';

import type { ActiveTab } from '../../../stores/app';
import Chat from '../../chat/Chat.vue';
import Dlq from '../../dlq/Dlq.vue';
import DebugSection from './debug-section/DebugSection.vue';
import SysCtlSection from './sysctl-section/SysCtlSection.vue';

defineProps<{
  activeTab: ActiveTab;
  socketProvider: SocketProvider;
  models: string[];
  debugResults: any[];
  selectedDebugResult: any | null;
}>();

const emit = defineEmits<{
  refreshModels: [];
  clearDebugResults: [];
  selectDebugResult: [result: any];
  selectDebugMarkRead: [id: string];
}>();
</script>

<template>
  <main class="app-main-content">
    <div class="app-main-content__grid">
      <Dlq v-if="activeTab === 'dlq'" :models="models" />
      <DebugSection
        v-else-if="activeTab === 'debug'"
        :debug-results="debugResults"
        :selected-debug-result="selectedDebugResult"
        @clear-debug-results="emit('clearDebugResults')"
        @select-debug-result="emit('selectDebugResult', $event)"
        @select-debug-mark-read="emit('selectDebugMarkRead', $event)"
      />
      <SysCtlSection v-else-if="activeTab === 'sysctl'" />
      <Chat v-else :socket-provider="socketProvider" />
    </div>
  </main>
</template>

<style scoped>
.app-main-content {
  max-width: 125rem;
  margin-left: auto;
  margin-right: auto;
  padding-top: 3rem;
}

@media (min-width: 640px) {
  .app-main-content {
    padding-left: 1.5rem;
    padding-right: 1.5rem;
  }
}

@media (min-width: 1024px) {
  .app-main-content {
    padding-left: 2rem;
    padding-right: 2rem;
  }
}

.app-main-content__grid {
  display: grid;
  grid-template-columns: repeat(1, minmax(0, 1fr));
  gap: var(--spacing-4);
}

@media (min-width: 1024px) {
  .app-main-content__grid {
    grid-template-columns: repeat(12, minmax(0, 1fr));
  }
}
</style>

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue';

import AppFooter from './components/app/AppFooter.vue';
import AppHeader from './components/app/AppHeader.vue';
import AppMainContent from './components/app/AppMainContent.vue';
import AppThemeSwitcher from './components/app/AppThemeSwitcher.vue';
import { useAppStore } from './stores/app';
import { useDebugStore } from './stores/debug';
import { useDlqStore } from './stores/dlq';
import { useMcpMessagesStore, useRestMessagesStore } from './stores/messages';
import { useModelsStore } from './stores/models';
import { useSocketStore } from './stores/socket';
import { createSocketProvider } from './stores/socket.helper';
import { useThemeStore } from './stores/theme';

const restMessagesStore = useRestMessagesStore();
const mcpMessagesStore = useMcpMessagesStore();
const debugStore = useDebugStore();
const modelsStore = useModelsStore();
const appStore = useAppStore();
const themeStore = useThemeStore();
const socketStore = useSocketStore();
const dlqStore = useDlqStore();

const DLQ_POLL_INTERVAL = 30_000;
let dlqPollTimer: ReturnType<typeof setInterval> | null = null;

socketStore.setCallbacks(
  debugStore.addSocketDebugEntry,
  restMessagesStore.addMessage,
  mcpMessagesStore.addMessage,
);

const restSocketProvider = createSocketProvider(
  socketStore,
  debugStore,
  restMessagesStore,
);
const mcpSocketProvider = createSocketProvider(
  socketStore,
  debugStore,
  mcpMessagesStore,
);

themeStore.initTheme();
modelsStore.fetchModels();

onMounted(() => {
  dlqStore.fetchDlqCount();
  dlqPollTimer = setInterval(() => dlqStore.fetchDlqCount(), DLQ_POLL_INTERVAL);
});

onUnmounted(() => {
  if (dlqPollTimer) clearInterval(dlqPollTimer);
});
</script>

<template>
  <div class="min-h-screen bg-primary text-fg-primary font-sans pb-12 bg-grid">
    <AppHeader
      :active-tab="appStore.activeTab"
      :blink-logo="appStore.blinkLogo"
      :debug-count="debugStore.debugLogCount"
      :rest-count="restMessagesStore.completedCount"
      :mcp-count="mcpMessagesStore.completedCount"
      :dlq-count="dlqStore.total"
      @tab-change="appStore.activeTab = $event"
    />

    <AppThemeSwitcher
      :current-theme="themeStore.currentTheme"
      :theme-colors="themeStore.themeColors"
      :dark-themes="themeStore.darkThemes"
      :dark-themes2="themeStore.darkThemes2"
      @change="themeStore.currentTheme = $event"
    />

    <AppMainContent
      :active-tab="appStore.activeTab"
      :rest-socket-provider="restSocketProvider"
      :mcp-socket-provider="mcpSocketProvider"
      :models="modelsStore.models"
      :models-loading="modelsStore.modelsLoading"
      :connection-state="socketStore.connectionState"
      :rest-messages="restMessagesStore.messages"
      :mcp-messages="mcpMessagesStore.messages"
      :debug-results="debugStore.debugResults"
      :selected-debug-result="debugStore.selectedDebugResult"
      @refresh-models="modelsStore.fetchModels(true)"
      @model-selected="appStore.handleModelSelected"
      @clear-rest-messages="restMessagesStore.clearMessages"
      @clear-mcp-messages="mcpMessagesStore.clearMessages"
      @clear-rest-index="
        (index: number) => restMessagesStore.messages.splice(index, 1)
      "
      @clear-mcp-index="
        (index: number) => mcpMessagesStore.messages.splice(index, 1)
      "
      @abort="(requestId: string) => appStore.abortJob(requestId)"
      @copy="appStore.handleCopyToClipboard"
      @clear-debug-results="debugStore.clearDebugResults"
      @select-debug-result="
        (result: any) => (debugStore.selectedDebugResult = result)
      "
    />

    <AppFooter
      :connection-state="socketStore.connectionState"
      :socket-id="socketStore.socketId"
    />
  </div>
</template>

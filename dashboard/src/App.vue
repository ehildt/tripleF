<script setup lang="ts">
import { onBeforeMount, onMounted, onUnmounted } from 'vue';

import AppFooter from './components/app/app-footer/AppFooter.vue';
import AppHeader from './components/app/app-header/AppHeader.vue';
import AppMainContent from './components/app/app-main-content/AppMainContent.vue';
import PopoutPreview from './components/widgets/popout-preview/PopoutPreview.vue';
import ToastContainer from './components/widgets/toast/toast-container/ToastContainer.vue';
import { useAppStore } from './stores/app';
import { useDebugStore } from './stores/debug';
import { useDlqStore } from './stores/dlq';
import { createSocketProvider } from './stores/helpers/create-socket-provider.helper';
import { useApiMessagesStore } from './stores/messages';
import { useModelsStore } from './stores/models';
import { usePreprocessingStore } from './stores/preprocessing';
import { useSocketStore } from './stores/socket';
import { useThemeStore } from './stores/theme';

const apiMessagesStore = useApiMessagesStore();
const debugStore = useDebugStore();
const modelsStore = useModelsStore();
const appStore = useAppStore();
const themeStore = useThemeStore();
const socketStore = useSocketStore();
const dlqStore = useDlqStore();
const preprocessingStore = usePreprocessingStore();

// Push the persisted preprocessing settings to the server on boot: the
// server applies preprocessing from its own effective config, so it needs
// the client's overrides before the next query runs.
preprocessingStore.pushSettingsToServer();

const DLQ_POLL_INTERVAL = 30_000;
let dlqPollTimer: ReturnType<typeof setInterval> | null = null;

socketStore.setCallbacks(
  debugStore.addSocketDebugEntry,
  apiMessagesStore.addMessage,
);

const socketProvider = createSocketProvider(
  socketStore,
  debugStore,
  apiMessagesStore,
);

onBeforeMount(() => {
  themeStore.initTheme();
  modelsStore.fetchModels();
});

onMounted(() => {
  dlqStore.fetchDlqCount();
  dlqPollTimer = setInterval(() => dlqStore.fetchDlqCount(), DLQ_POLL_INTERVAL);
  socketStore.ensureSocketConnection();
});

onUnmounted(() => {
  if (dlqPollTimer) clearInterval(dlqPollTimer);
});
</script>

<template>
  <div
    id="app-root"
    class="min-h-screen text-fg-primary font-sans bg-grid root-accent-gradient"
  >
    <AppHeader
      :active-tab="appStore.activeTab"
      :debug-count="debugStore.debugLogCount"
      :show-chat-star="appStore.showChatStar"
      :dlq-count="dlqStore.unreadDlqCount"
      @tab-change="appStore.activeTab = $event"
    />

    <AppMainContent
      :active-tab="appStore.activeTab"
      :socket-provider="socketProvider"
      :models="modelsStore.modelNames"
      :debug-results="debugStore.debugResults"
      :selected-debug-result="debugStore.selectedDebugResult"
      @refresh-models="modelsStore.fetchModels(true)"
      @clear-debug-results="debugStore.clearDebugResults"
      @select-debug-result="
        (result: any) => (debugStore.selectedDebugResult = result)
      "
      @select-debug-mark-read="debugStore.markDebugAsRead"
    />

    <ToastContainer />
    <PopoutPreview />
    <AppFooter :socket-id="socketStore.socketId" />
  </div>
</template>

<style>
#app-root {
  transition:
    background-color 0.7s cubic-bezier(0.4, 0, 0.2, 1),
    color 0.7s cubic-bezier(0.4, 0, 0.2, 1),
    border-color 0.7s cubic-bezier(0.4, 0, 0.2, 1),
    box-shadow 0.7s cubic-bezier(0.4, 0, 0.2, 1);
}
</style>

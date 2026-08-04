<script setup lang="ts">
import { onBeforeMount, onMounted, onUnmounted, provide, watch } from 'vue';
import { useRoute } from 'vue-router';

import AppFooter from './components/app/app-footer/AppFooter.vue';
import TabMenu from './components/app/tab-menu/TabMenu.vue';
import { hidePopoutPreview } from './components/chat/exchange-list/chat-exchange/exchange-content/assistant-response/composables/popout-settings.state';
import FloatingPlayer from './components/widgets/floating-player/FloatingPlayer.vue';
import FloatingPlaylist from './components/widgets/floating-playlist/FloatingPlaylist.vue';
import PopoutPreview from './components/widgets/popout-preview/PopoutPreview.vue';
import ToastContainer from './components/widgets/toast/toast-container/ToastContainer.vue';
import { appViewContextKey } from './composables/use-app-view-context';
import type { ActiveTab } from './stores/app';
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

// The SysCtl popout preview is transient: switching tabs dismisses it.
// Watch a getter — Pinia unwraps `appStore.activeTab` to its value, so it
// cannot be used directly as a watch source.
watch(
  () => appStore.activeTab,
  () => hidePopoutPreview(),
);

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

provide(appViewContextKey, {
  socketProvider,
  viewModels: modelsStore.modelNames,
  debugResults: debugStore.debugResults,
  selectedDebugResult: debugStore.selectedDebugResult,
  clearDebugResults: debugStore.clearDebugResults,
  selectDebugResult: (result) => {
    debugStore.selectedDebugResult = result;
  },
  selectDebugMarkRead: debugStore.markDebugAsRead,
});

// The route is the source of truth for the active tab; mirror it into the
// store so non-component logic (e.g. chat-star notifications) can read it.
const route = useRoute();
watch(
  () => route.name,
  (name) => {
    if (name) appStore.setActiveTab(name as ActiveTab);
  },
  { immediate: true },
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
    <TabMenu
      :active-tab="appStore.activeTab"
      :debug-count="debugStore.debugLogCount"
      :show-chat-star="appStore.showChatStar"
      :dlq-count="dlqStore.unreadDlqCount"
    />

    <main class="app-main-content">
      <div class="app-main-content__grid">
        <router-view />
      </div>
    </main>

    <ToastContainer />
    <PopoutPreview />
    <FloatingPlayer />
    <FloatingPlaylist />
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

<style scoped>
.app-main-content {
  max-width: 125rem;
  margin-left: auto;
  margin-right: auto;
  padding-top: 2%;
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

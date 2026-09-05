<script setup lang="ts">
import {
  computed,
  onBeforeMount,
  onMounted,
  onUnmounted,
  provide,
  watch,
} from 'vue';
import { useRoute } from 'vue-router';

import AppFooter from './components/app/app-footer/AppFooter.vue';
import TabMenu from './components/app/tab-menu/TabMenu.vue';
import { hidePopoutPreview } from './components/chat/exchange-list/chat-exchange/exchange-content/assistant-response/composables/popout-settings.state';
import FloatingPlayer from './components/widgets/floating-player/FloatingPlayer.vue';
import { hidePlaylistPreview } from './components/widgets/floating-playlist/composables/playlist-settings.state';
import FloatingPlaylist from './components/widgets/floating-playlist/FloatingPlaylist.vue';
import PlaylistPreview from './components/widgets/playlist-preview/PlaylistPreview.vue';
import PopoutPreview from './components/widgets/popout-preview/PopoutPreview.vue';
import ToastContainer from './components/widgets/toast/toast-container/ToastContainer.vue';
import { appViewContextKey } from './composables/use-app-view-context';
import { useAppStore } from './stores/app';
import { useDebugStore } from './stores/debug';
import { useDlqStore } from './stores/dlq';
import { createSocketProvider } from './stores/helpers/socket/create-socket-provider.helper';
import { useApiMessagesStore } from './stores/messages';
import { useModelsStore } from './stores/models';
import { usePreprocessingStore } from './stores/preprocessing';
import { useSocketStore } from './stores/socket';
import { useThemeStore } from './stores/theme';
import type { ActiveTab } from './types/app.model';

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
// the client's overrides before the next query runs. Deferred to idle — it
// is a write, not something first paint depends on.
scheduleIdle(() => preprocessingStore.pushSettingsToServer());

// The memory partition id is server-persisted (Postgres) so it survives
// localStorage clears — adopt it at boot, deferred to idle like the
// preprocessing push.
scheduleIdle(() => appStore.syncMemoryPartitionFromServer());

// Same contract for the cognition space id (the AI's memory space).
scheduleIdle(() => appStore.syncMemoryCognitionFromServer());

// The Settings popout preview is transient: switching tabs dismisses it.
// Watch a getter — Pinia unwraps `appStore.activeTab` to its value, so it
// cannot be used directly as a watch source.
watch(
  () => appStore.activeTab,
  () => {
    hidePopoutPreview();
    hidePlaylistPreview();
  },
);

const DLQ_POLL_INTERVAL = 30_000;
let dlqPollTimer: ReturnType<typeof setInterval> | null = null;

/**
 * Run a callback when the browser is idle, falling back to a macrotask when
 * requestIdleCallback is unavailable (jsdom, older engines). Used to push
 * non-critical boot work (DLQ badge, preprocessing push) off the first-paint
 * path so it doesn't compete with the conversation restore and route chunks
 * for the connection budget on HTTP/1.1.
 */
function scheduleIdle(callback: () => void) {
  if (typeof window.requestIdleCallback === 'function') {
    window.requestIdleCallback(callback, { timeout: 2000 });
  } else {
    window.setTimeout(callback, 0);
  }
}

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
  // Store-derived data is provided as computed refs (not unwrapped values)
  // so route views react to store changes — e.g. selecting a debug request
  // must update the details panel, and models must appear in the DLQ selector
  // once they finish loading.
  viewModels: computed(() => modelsStore.modelNames),
  debugResults: computed(() => debugStore.debugResults),
  selectedDebugResult: computed(() => debugStore.selectedDebugResult),
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
  // The DLQ badge is not on the first-paint path: defer the initial fetch so
  // it doesn't queue behind the conversation restore and route chunks. The
  // 30s poll keeps it fresh from here on.
  scheduleIdle(() => dlqStore.fetchDlqCount());
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
    <PlaylistPreview />
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
  padding-bottom: 2%;
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

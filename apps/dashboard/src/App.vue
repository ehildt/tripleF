<script setup lang="ts">
import { onBeforeMount, onMounted, onUnmounted, provide, watch } from 'vue';
import { useRoute } from 'vue-router';

import AppFooter from './components/app/app-footer/AppFooter.vue';
import TabMenu from './components/app/tab-menu/TabMenu.vue';
import FloatingPlayer from './components/widgets/floating-player/FloatingPlayer.vue';
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
import { usePlaylistStore } from './stores/playlist';
import { usePlaylistSettingsStore } from './stores/playlist-settings';
import { usePopoutSettingsStore } from './stores/popout-settings';
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
const popoutSettingsStore = usePopoutSettingsStore();
const playlistSettingsStore = usePlaylistSettingsStore();
const playlistStore = usePlaylistStore();

// Playlists are session-global (keyed by sessionId, not conversation). Load
// them once at boot so every surface — the chat right toolbar tab and the
// floating playlist — reads the same hydrated state without refetching on
// each mount.
void playlistStore.loadPlaylists();

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
    popoutSettingsStore.hidePopoutPreview();
    playlistSettingsStore.hidePlaylistPreview();
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

// The socket provider is the one app-level service singleton provided via
// provide/inject; route views consume store state through stores directly.
provide(appViewContextKey, { socketProvider });

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
        <!-- The chat is the primary tab: keep its mounted tree alive across
             switches (scroll position, subscriptions, computed state) so a
             return visit never pays the remount + full-list re-render
             burst. Other tabs mount/unmount as before. -->
        <router-view v-slot="{ Component }">
          <KeepAlive :include="['Chat']">
            <component :is="Component" :key="route.fullPath" />
          </KeepAlive>
        </router-view>
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

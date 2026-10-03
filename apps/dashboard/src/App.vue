<script setup lang="ts">
import { computed, onBeforeMount, onMounted, watch } from 'vue';
import { useRoute } from 'vue-router';

import AppFooter from './components/app/app-footer/AppFooter.vue';
import TabMenu from './components/app/tab-menu/TabMenu.vue';
import FloatingPlayer from './components/widgets/floating-player/FloatingPlayer.vue';
import FloatingPlaylist from './components/widgets/floating-playlist/FloatingPlaylist.vue';
import PlaylistPreview from './components/widgets/playlist-preview/PlaylistPreview.vue';
import PopoutPreview from './components/widgets/popout-preview/PopoutPreview.vue';
import ToastContainer from './components/widgets/toast/toast-container/ToastContainer.vue';
import { useDlqActivityEvents } from './composables/use-dlq-activity-events';
import { usePlaybackSession } from './composables/use-playback-session';
import { usePlaylistMarquee } from './composables/use-playlist-marquee';
import { useAppStore } from './stores/app';
import { useDebugStore } from './stores/debug';
import { useDlqStore } from './stores/dlq';
import { useApiMessagesStore } from './stores/messages';
import { useModelsStore } from './stores/models';
import { usePlaylistStore } from './stores/playlist';
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
const playlistStore = usePlaylistStore();

// The playback session is an app-level service: created once here, shared by
// import across the tree, and passed as a prop to the floating player.
const playback = usePlaybackSession();

const { playlistMarqueeVisible } = usePlaylistMarquee(playback);

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

// The Settings popout preview is transient: switching tabs dismisses it.
// Watch a getter — Pinia unwraps `appStore.activeTab` to its value, so it
// cannot be used directly as a watch source.
watch(
  () => appStore.activeTab,
  () => {
    popoutSettingsStore.hidePopoutPreview();
    playlistStore.hidePlaylistPreview();
  },
);

/**
 * Run a callback when the browser is idle, falling back to a macrotask when
 * requestIdleCallback is unavailable (jsdom, older engines). Used to push
 * non-critical boot work (the preprocessing push) off the first-paint path so
 * it doesn't compete with the conversation restore and route chunks for the
 * connection budget on HTTP/1.1.
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

// The DLQ badge is an event-driven attention dot: the server broadcasts
// dlq:changed on every DLQ mutation, and the dot only shows while the user is
// not already on the DLQ tab.
useDlqActivityEvents();
const showDlqBadge = computed(
  () => dlqStore.hasDlqActivity && appStore.activeTab !== 'dlq',
);

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
  socketStore.ensureSocketConnection();
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
      :show-dlq-badge="showDlqBadge"
    />

    <main class="app-main-content">
      <div class="app-main-content__grid">
        <!-- The chat is the primary tab: keep its mounted tree alive across
             switches (scroll position, subscriptions, computed state) so a
             return visit never pays the remount + full-list re-render
             burst. Other tabs mount/unmount as before. -->
        <router-view v-slot="{ Component }">
          <KeepAlive :include="['Chat', 'Memory']">
            <component :is="Component" :key="route.fullPath" />
          </KeepAlive>
        </router-view>
      </div>
    </main>

    <ToastContainer />
    <PopoutPreview />
    <PlaylistPreview />
    <FloatingPlayer
      :session="playback"
      :show-title-marquee="!playlistMarqueeVisible"
      :popout-show-bar-always="popoutSettingsStore.popoutShowBarAlways"
    />
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

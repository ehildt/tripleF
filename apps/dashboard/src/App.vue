<script setup lang="ts">
import { onBeforeMount, onMounted } from 'vue';
import { useRoute } from 'vue-router';

import { useSocket } from '@/composables/use-socket/use-socket';

import AppFooter from './components/app/app-footer/AppFooter.vue';
import { useActiveTab } from './components/app/composables/use-active-tab';
import { useAppNavigation } from './components/app/composables/use-app-navigation';
import { useAttachmentLifecycle } from './components/app/composables/use-attachment-lifecycle';
import { useDlqLiveEvents } from './components/app/composables/use-dlq-live-events';
import { useModelCatalog } from './components/app/composables/use-model-catalog';
import { usePlaylistMarquee } from './components/app/composables/use-playlist-marquee';
import TabMenu from './components/app/tab-menu/TabMenu.vue';
import { useConversationCatalog } from './components/chat/composables/use-conversation-catalog';
import { useHarnessEvents } from './components/chat/composables/use-harness-events';
import FloatingPlayer from './components/widgets/floating-player/FloatingPlayer.vue';
import FloatingPlaylist from './components/widgets/floating-playlist/FloatingPlaylist.vue';
import PlaylistPreview from './components/widgets/playlist-preview/PlaylistPreview.vue';
import PopoutPreview from './components/widgets/popout-preview/PopoutPreview.vue';
import ToastContainer from './components/widgets/toast-container/ToastContainer.vue';
import { usePlaybackSession } from './composables/use-playback-session/use-playback-session';
import { useTheme } from './composables/use-theme/use-theme';
import { useNavigationStore } from './stores/app/navigation/navigation.store';
import { useDebugStore } from './stores/debug/debug.store';
import { usePlaylistStore } from './stores/playlist/playlist.store';
import { usePopoutSettingsStore } from './stores/popout-settings/popout-settings.store';
import { usePreprocessingSettingsStore } from './stores/preprocessing-settings/preprocessing-settings.store';

const debugStore = useDebugStore();
const modelCatalog = useModelCatalog();
const navigationStore = useNavigationStore();
const { handleHarnessEvent } = useHarnessEvents();
const conversationCatalog = useConversationCatalog();
const { activeTab } = useActiveTab();
const { showDlqBadge } = useAppNavigation();
const { initTheme } = useTheme();
const socket = useSocket();
const { socketId } = socket;
usePreprocessingSettingsStore();
conversationCatalog.watchActiveConversationBookmark();
void conversationCatalog.bootstrapConversations();
useAttachmentLifecycle();
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

// The preprocessing config is server-persisted per session id: the store
// fetches it on construction and pushes every change immediately from its
// own watch — no boot-time orchestration here.

socket.setCallbacks(debugStore.addDebugResult, handleHarnessEvent);

// The DLQ badge is an event-driven attention dot: the server broadcasts
// dlq:entry-upserted / dlq:entries-removed / dlq:bulk-changed on every DLQ
// mutation, and the dot only shows while the user is not already on the
// DLQ tab.
useDlqLiveEvents();
const route = useRoute();

onBeforeMount(() => {
  initTheme();
  void modelCatalog.fetchModels();
});

onMounted(() => {
  socket.ensureSocketConnection();
});
</script>

<template>
  <div id="app-root" class="bg-grid root-accent-gradient">
    <TabMenu
      :active-tab="activeTab"
      :debug-count="debugStore.debugLogCount"
      :show-chat-star="navigationStore.showChatStar"
      :show-dlq-badge="showDlqBadge"
    />

    <main class="app-main-content">
      <div class="app-main-content__grid">
        <!-- The chat is the primary tab: keep its mounted tree alive across
             switches (scroll position, subscriptions, computed state) so a
             return visit never pays the remount + full-list re-render
             burst. Keyed by route NAME, not path: the memory taxonomy drill
             lives in the path segments themselves (/memory/cluster/.../…),
             so a fullPath/path key would remount the tree per drill step
             and let KeepAlive cache one mounted Memory instance per URL. -->
        <router-view v-slot="{ Component }">
          <KeepAlive :include="['Chat', 'Memory']">
            <component :is="Component" :key="route.name" />
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
    <AppFooter :socket-id="socketId" />
  </div>
</template>

<style>
#app-root {
  min-height: 100vh;
  color: var(--color-fg-primary);
  font-family: var(--font-sans);
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

<script setup lang="ts">
import { FileImage, History as HistoryIcon, ListVideo } from '@lucide/vue';
import { computed } from 'vue';

import Tab from '@/components/chat/shared/ui/tab/Tab.vue';

import { useAttachmentList } from './composables/use-attachment-list';
import { useRightToolbarView } from './composables/use-right-toolbar-view';
import { useFiles } from './files/composables/use-files';
import Files from './files/Files.vue';
import { useHistoryAvailability } from './history/composables/use-history-availability';
import History from './history/History.vue';
import { usePlaylistTab } from './playlist/composables/use-playlist-tab';
import PlaylistPanel from './playlist/PlaylistPanel.vue';

const { attachments, hasAttachments } = useAttachmentList();

const {
  previewUrl,
  previewUrlForHash,
  removeAttachment,
  toggleAttachment,
  removePage,
} = useFiles();

const { hasPlaylist } = usePlaylistTab();
const { hasHistory } = useHistoryAvailability();

const { rightToolbarView: activeView, selectView } = useRightToolbarView();

/** The panel component for the active tab. KeepAlive caches each panel by
 * component type, so switching preserves DOM, scroll, and in-progress drafts. */
const activePanel = computed(() => {
  if (activeView.value === 'files') return Files;
  if (activeView.value === 'playlist') return PlaylistPanel;
  return History;
});

/** Props for the active panel — each panel declares its own surface, so the
 * spread only carries the keys that panel actually consumes. */
const activePanelProps = computed(() => {
  if (activeView.value === 'files') {
    return {
      attachments: attachments.value,
      previewUrl,
      urlForHash: previewUrlForHash,
    };
  }
  // Playlist and History panels are self-contained: each reads its own state
  // (playlist store, app icon-visibility settings) — nothing to forward.
  return {};
});

/** Events for the active panel; only the Files panel emits mutations. */
const activePanelListeners = computed(() => {
  if (activeView.value === 'files') {
    return {
      remove: removeAttachment,
      toggle: toggleAttachment,
      'remove-page': removePage,
    };
  }
  return {};
});
</script>

<template>
  <div class="chat-right-toolbar">
    <div class="chat-right-toolbar__body">
      <div class="chat-right-toolbar__tabs">
        <Tab
          v-if="hasAttachments"
          :is-active="activeView === 'files'"
          :label="$t('common.attachments')"
          @select="selectView('files')"
        >
          <FileImage />
        </Tab>
        <Tab
          v-if="hasPlaylist"
          :is-active="activeView === 'playlist'"
          :label="$t('common.playlist')"
          @select="selectView('playlist')"
        >
          <ListVideo />
        </Tab>
        <Tab
          v-if="hasHistory"
          :is-active="activeView === 'history'"
          :label="$t('common.history')"
          @select="selectView('history')"
        >
          <HistoryIcon />
        </Tab>
      </div>

      <!-- Each panel is cached so switching tabs preserves its DOM instead of
           remounting it: History would otherwise rebuild its whole message
           list, the playlist would drop the in-progress playlist-name draft,
           and every panel would lose its scroll position. -->
      <KeepAlive>
        <component
          :is="activePanel"
          v-bind="activePanelProps"
          v-on="activePanelListeners"
        />
      </KeepAlive>
    </div>
  </div>
</template>

<style scoped>
.chat-right-toolbar {
  display: flex;
  flex-direction: column;
  max-height: calc(100vh - 6rem);
  gap: var(--spacing-0-5);
}

.chat-right-toolbar__body {
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;
  min-height: 0;
  gap: var(--spacing-0-5);
  width: 100%;
}

.chat-right-toolbar__tabs {
  display: flex;
  gap: var(--spacing-1);
  width: 100%;
  flex-shrink: 0;
}
</style>

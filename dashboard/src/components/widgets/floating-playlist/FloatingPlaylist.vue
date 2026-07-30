<script setup lang="ts">
/**
 * App-level floating playlist, mounted in App.vue (visible on every tab, so
 * it survives tab switches). Active while the playlist mode is 'floating'
 * (SysCtl → Widgets → Playlist); the chat right panel hides its playlist
 * tab then.
 *
 * Open, the window's toolbar row holds the transport icons on the left and
 * the saved-playlists menu icon plus the X close icon on the very right —
 * clicking the X collapses the window. The now-playing title animates
 * inside the selected playlist item's row; while the popout itself is
 * hidden (background mode or dismissed), it additionally scrolls in the
 * toolbar so a hidden video still announces what plays. The menu opens
 * with the playlist name input as its first field, a divider, and the
 * saved playlists — picking one autoloads it (there is no load button and
 * no checkmarks). Naming the queue saves it, typing renames it, emptying
 * the field deletes it (the queue is just unnamed again), and queue edits
 * sync into the selected playlist automatically.
 *
 * Collapsed, the assembly is a compact toggle handle sized like the
 * collapsed tab-menu handle; open/collapse sweeps the window in and out of
 * it. The window is not draggable: it sits at its configured anchor with
 * the tab menu's distance to the screen edges (1vw / 2vh), beside the tab
 * menu when anchored to the menu's top side. Styling mirrors the tab menu:
 * frosted glass, tame floating shadow, no border.
 */
import { ListVideo, X } from '@lucide/vue';
import { computed, useTemplateRef } from 'vue';

import PanelEmptyState from '@/components/shared/ui/panel-empty-state/PanelEmptyState.vue';
import { useConversationStore } from '@/stores/conversation';

import { playlistQueueKey } from '../../chat/exchange-list/chat-exchange/exchange-content/assistant-response/composables/video-playback.state';
import { usePlaylistTransport } from '../../chat/right-panel/composables/use-playlist-transport';
import { useVideoPlaylist } from '../../chat/right-panel/composables/use-video-playlist';
import PlaylistItem from '../../chat/right-panel/playlist-item/PlaylistItem.vue';
import PlaylistTransportBar from '../../chat/right-panel/playlist-transport-bar/PlaylistTransportBar.vue';
import {
  playlistAnchor,
  playlistMode,
} from './composables/playlist-settings.state';
import { useFloatingPlaylistGeometry } from './composables/use-floating-playlist-geometry';
import { useFloatingPlaylistVisibility } from './composables/use-floating-playlist-visibility';
import { usePlaylistLibrary } from './composables/use-playlist-library';
import PlaylistMenu from './playlist-menu/PlaylistMenu.vue';

const conversationStore = useConversationStore();

/**
 * Queue the floating playlist shows: the global floating queue (it is
 * deliberately conversation-independent — it survives conversation and tab
 * switches). In panel mode the widget is hidden, so the key only matters
 * for the hidden-state wiring then.
 */
const conversationId = computed(() =>
  playlistQueueKey(conversationStore.activeConversationId ?? ''),
);

const { playlistVideos, hasPlaylist } = useVideoPlaylist(conversationId);

const {
  activePlaybackPlaying,
  activePlaybackVideoUrl,
  activePlaybackTitle,
  playlistAutoplayEnabled,
  popoutHidden,
  hasActivePlayback,
  canTogglePlayback,
  playbackToggleTitle,
  toggleActivePlayback,
  stopActivePlayback,
  togglePlaylistAutoplay,
  toggleHideOnPlaylist,
  onPlayItem,
  onRemoveItem,
} = usePlaylistTransport(playlistVideos, conversationId);

const { playlistNameInput, savedPlaylistNames, selectPlaylist } =
  usePlaylistLibrary(conversationId, playlistVideos);

const { playlistStyle } = useFloatingPlaylistGeometry();

const playlistRef = useTemplateRef<HTMLElement>('playlistRef');
const { isOpen, togglePlaylist, closeOnAutoclose } =
  useFloatingPlaylistVisibility(playlistRef);

/**
 * Bottom anchors stand the handle below the window, so the window sweeps
 * open upward and folds back down into it instead (see the closed clip).
 */
const anchorVertical = computed(() => playlistAnchor.value.split('-')[0]);
const isBottomAnchored = computed(() => anchorVertical.value === 'bottom');

/**
 * Horizontal side the collapsed compact handle hugs inside the assembly
 * column: the anchor's horizontal component.
 */
const anchorHorizontal = computed(() => playlistAnchor.value.split('-')[1]);

/**
 * Label of the active playlist shown left of the saved-playlists icon: its
 * name once saved under one — nothing while the queue is unnamed (an
 * unnamed queue is just the queue, not a "temporary" list).
 */
const activePlaylistLabel = computed(() => playlistNameInput.value.trim());

/** Launching a video counts as a pick for autoclose. */
function onPlayAndAutoclose(item: (typeof playlistVideos.value)[number]) {
  onPlayItem(item);
  closeOnAutoclose();
}
</script>

<template>
  <div
    v-if="playlistMode === 'floating'"
    class="floating-playlist-root"
    data-floating-playlist-root
  >
    <div
      ref="playlistRef"
      class="floating-playlist__assembly"
      :class="{
        'floating-playlist__assembly--bottom': isBottomAnchored,
        'floating-playlist__assembly--closed': !isOpen,
        [`floating-playlist__assembly--h-${anchorHorizontal}`]: true,
      }"
      :style="playlistStyle"
      data-floating-playlist-assembly
    >
      <button
        v-if="!isOpen"
        type="button"
        class="floating-playlist__handle shadow-floating"
        title="Open playlist"
        aria-label="Toggle playlist"
        :aria-expanded="isOpen"
        @click="togglePlaylist"
      >
        <ListVideo class="floating-playlist__handle-icon" />
      </button>

      <aside
        class="floating-playlist shadow-floating"
        aria-label="Floating playlist"
      >
        <div class="floating-playlist__top">
          <div class="floating-playlist__toolbar">
            <PlaylistTransportBar
              :playing="activePlaybackPlaying"
              :can-toggle-playback="canTogglePlayback"
              :playback-toggle-title="playbackToggleTitle"
              :has-active-playback="hasActivePlayback"
              :autoplay-enabled="playlistAutoplayEnabled"
              :popout-hidden="popoutHidden"
              :now-playing-title="activePlaybackTitle"
              :show-now-playing="popoutHidden"
              @toggle-playback="toggleActivePlayback"
              @stop-playback="stopActivePlayback"
              @toggle-autoplay="togglePlaylistAutoplay"
              @toggle-popout-visibility="toggleHideOnPlaylist"
            />
            <span
              v-if="activePlaylistLabel"
              class="floating-playlist__active-name"
              :title="`Active playlist: ${activePlaylistLabel}`"
              >{{ activePlaylistLabel }}</span
            >
            <PlaylistMenu
              :playlist-name="playlistNameInput"
              :playlists="savedPlaylistNames"
              @update:playlist-name="playlistNameInput = $event"
              @select="selectPlaylist"
            />
            <button
              type="button"
              class="floating-playlist__toggle"
              title="Collapse playlist"
              aria-label="Collapse playlist"
              :aria-expanded="isOpen"
              @pointerdown.stop
              @click.stop="togglePlaylist"
            >
              <X class="floating-playlist__toggle-icon" />
            </button>
          </div>
        </div>

        <div class="floating-playlist__body">
          <div v-if="hasPlaylist" class="floating-playlist__items">
            <PlaylistItem
              v-for="(item, index) in playlistVideos"
              :key="`${item.videoUrl}-${index}`"
              :item="item"
              :is-active="activePlaybackVideoUrl === item.videoUrl"
              @play="onPlayAndAutoclose(item)"
              @remove="onRemoveItem(item.videoUrl)"
            />
          </div>
          <PanelEmptyState
            v-else
            message="No videos in the playlist"
            submessage="Add videos from a video card, or pick a saved playlist"
          />
        </div>
      </aside>
    </div>
  </div>
</template>

<style scoped>
/* Above the tab menu (1200): the menu's collapsed drawer keeps an
   invisible layout box under its handle, but the playlist sits beside the
   menu horizontally — no overlap. The higher layer is harmless. */
.floating-playlist-root {
  position: fixed;
  inset: 0;
  z-index: 1250;
  pointer-events: none;
}

/* The assembly re-enables interaction inside the inert full-viewport root
   (clicks pass through everywhere else). When collapsed the assembly
   yields pointer events — but only after the window finishes fading out,
   via a visibility transition delay. The handle stays visible by
   overriding visibility on itself. */
.floating-playlist__assembly {
  position: fixed;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  width: 18rem;
  max-width: calc(100vw - 2rem);
  pointer-events: auto;
  visibility: visible;
  transition: visibility 0s;
}

.floating-playlist__assembly--closed {
  visibility: hidden;
  transition: visibility 0s linear 0.24s;
}

/* Bottom anchors: the handle stands below the window, so the window sweeps
   open upward and folds back down into it (see the closed clip below). */
.floating-playlist__assembly--bottom {
  flex-direction: column-reverse;
}

/* Collapsed toggle handle — absolutely positioned so it never affects the
   window's flex position. The assembly (position: fixed) is the containing
   block. */
.floating-playlist__handle {
  position: absolute;
  top: 0;
  width: 3.25rem;
  height: 1.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: none;
  color: var(--color-fg-muted);
  background-color: color-mix(
    in srgb,
    var(--color-bg-secondary) 50%,
    transparent
  );
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  cursor: pointer;
  user-select: none;
  transition: color 0.2s ease;
  z-index: 1;
  visibility: visible;
}

.floating-playlist__handle:hover {
  color: var(--color-accent-primary);
}

.floating-playlist__handle:focus {
  outline: none;
}

.floating-playlist__handle:focus-visible {
  outline: 1px solid var(--color-accent-primary);
  outline-offset: -2px;
}

.floating-playlist__handle-icon {
  width: 0.9rem;
  height: 0.9rem;
}

/* Handle horizontal alignment. */
.floating-playlist__assembly--h-left .floating-playlist__handle {
  left: 0;
}

.floating-playlist__assembly--h-center .floating-playlist__handle {
  left: 50%;
  transform: translateX(-50%);
}

.floating-playlist__assembly--h-right .floating-playlist__handle {
  right: 0;
}

/* Bottom-anchored: handle sits below the window. */
.floating-playlist__assembly--bottom .floating-playlist__handle {
  top: auto;
  bottom: 0;
}

/* ---------- window ---------- */

/* Borderless frosted glass, like the tab menu drawer: no frame, just the
   tame floating shadow (shadow-floating class) for depth. The generous
   negative clip-path lets the playlist-menu dropdown extend beyond the
   window bounds. Open/close is a simple fade — the collapsed assembly
   already yields pointer events so the invisible window never blocks
   clicks. */
.floating-playlist {
  display: flex;
  flex-direction: column;
  max-height: calc(100vh - 8rem);
  background-color: color-mix(
    in srgb,
    var(--color-bg-secondary) 50%,
    transparent
  );
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  clip-path: inset(-16rem);
  opacity: 1;
  transition: opacity 0.24s ease;
}

.floating-playlist__assembly--closed .floating-playlist {
  opacity: 0;
  visibility: hidden;
  transition:
    opacity 0.24s ease,
    visibility 0s linear 0.24s;
}

/* Active playlist name, sitting directly left of the saved-playlists
   icon: single-line, ellipsized, same tone as the toolbar's icon buttons. */
.floating-playlist__active-name {
  flex-shrink: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 0.7rem;
  font-family: var(--font-mono);
  color: var(--color-fg-muted);
}

/* ---------- top rows ---------- */

/* Same glassy tone as the floating popout header, a bit thicker — and no
   border, like the rest of the playlist. */
.floating-playlist__top {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-1);
  padding: var(--spacing-1) var(--spacing-1-5);
  background: color-mix(in srgb, var(--color-bg-elevated) 35%, transparent);
  user-select: none;
}

.floating-playlist__toolbar {
  display: flex;
  align-items: center;
  gap: var(--spacing-1);
}

/* The transport bar fills the row; the menu and toggle icons sit at the
   very right. */
.floating-playlist__toolbar > :first-child {
  flex: 1;
  min-width: 0;
}

/* Collapse toggle, styled like the transport row's icon buttons. */
.floating-playlist__toggle {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-1) var(--spacing-2);
  border: none;
  background-color: transparent;
  font-size: 0.7rem;
  font-family: var(--font-mono);
  color: var(--color-fg-muted);
  cursor: pointer;
  transition:
    color 0.2s ease,
    background-color 0.2s ease;
}

.floating-playlist__toggle:hover {
  color: var(--color-accent-primary);
}

.floating-playlist__toggle-icon {
  width: 0.75rem;
  height: 0.75rem;
}

/* ---------- body ---------- */

.floating-playlist__body {
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
}

.floating-playlist__items {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-1);
}
</style>

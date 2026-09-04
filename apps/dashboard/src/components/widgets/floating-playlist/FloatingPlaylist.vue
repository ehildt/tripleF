<script setup lang="ts">
/**
 * App-level floating playlist, mounted in App.vue (visible on every tab, so
 * it survives tab switches). Active while the playlist mode is 'floating'
 * (Settings → Widgets → Playlist); the chat right panel hides its playlist
 * tab then.
 *
 * The window reuses the shared PlaylistPanel for its content (transport
 * bar, active playlist name, saved-playlists menu, and the queued list) —
 * the same player the chat right panel shows when docked. Open, the
 * toolbar row holds the transport icons on the left and the saved-playlists
 * menu icon plus the X close icon on the very right — clicking the X
 * collapses the window. The now-playing title animates inside the selected
 * playlist item's row. Picking a saved playlist autoloads it; naming the
 * queue saves it and queue edits sync into the active playlist.
 *
 * This file only owns the floating chrome: the geometry/anchoring, the
 * collapse handle, open/collapse visibility, and the window styling. All
 * player behaviour lives in PlaylistPanel.
 */
import { ListVideo, X } from '@lucide/vue';
import { computed, useTemplateRef } from 'vue';

import Tooltip from '@/components/shared/ui/tooltip/Tooltip.vue';
import { useConversationStore } from '@/stores/conversation';

import PlaylistPanel from '../../chat/right-panel/playlist-panel/PlaylistPanel.vue';
import {
  playlistAnchor,
  playlistMode,
} from './composables/playlist-settings.state';
import { useFloatingPlaylistGeometry } from './composables/use-floating-playlist-geometry';
import { useFloatingPlaylistVisibility } from './composables/use-floating-playlist-visibility';

/**
 * Conversation the floating playlist shows: the active conversation, so the
 * floating window mirrors the docked panel's playlists. In panel mode the
 * widget is hidden; in floating mode it shows the active conversation's
 * playlists.
 */
const conversationStore = useConversationStore();
const conversationId = computed(
  () => conversationStore.activeConversationId ?? '',
);

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
      <Tooltip :text="$t('common.openPlaylist')">
        <button
          v-if="!isOpen"
          type="button"
          class="floating-playlist__handle shadow-floating"
          :aria-label="$t('common.togglePlaylist')"
          :aria-expanded="isOpen"
          @click="togglePlaylist"
        >
          <ListVideo class="floating-playlist__handle-icon" />
        </button>
      </Tooltip>

      <aside
        class="floating-playlist shadow-floating"
        :aria-label="$t('common.floatingPlaylist')"
      >
        <PlaylistPanel
          :conversation-id="conversationId"
          @play="closeOnAutoclose"
        >
          <template #toolbar-actions>
            <Tooltip :text="$t('common.collapsePlaylist')">
              <button
                type="button"
                class="floating-playlist__toggle"
                :aria-label="$t('common.collapsePlaylist')"
                :aria-expanded="isOpen"
                @pointerdown.stop
                @click.stop="togglePlaylist"
              >
                <X class="floating-playlist__toggle-icon" />
              </button>
            </Tooltip>
          </template>
        </PlaylistPanel>
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
   clicks. The PlaylistPanel inside fills the column and scrolls its own
   list. */
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

/* ---------- collapse toggle ---------- */

/* The X sits in the toolbar row (rendered by PlaylistPanel) at the very
   right, styled like the transport row's icon buttons. */
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
</style>

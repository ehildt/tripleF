import { onClickOutside, onKeyStroke } from '@vueuse/core';
import type { Ref } from 'vue';

import {
  floatingPlaylistOpen,
  playlistAutoClose,
} from './playlist-settings.state';

/**
 * Open/collapse behavior of the floating playlist — mirrors the tab menu:
 * the window starts collapsed (a compact handle stays at the anchor) and
 * stays open until the user collapses it via the toggle handle or the X
 * icon (the window sweeps in or out of the handle) or presses Escape. With autoclose on (SysCtl → Widgets → Playlist), the
 * window also collapses after a video was launched or a click landed
 * outside the window. The open state is shared module state (see
 * playlist-settings.state) so the now-playing marquee can follow it.
 */
export function useFloatingPlaylistVisibility(
  playlistRef: Ref<HTMLElement | null>,
) {
  const isOpen = floatingPlaylistOpen;

  function togglePlaylist() {
    isOpen.value = !isOpen.value;
  }

  function closePlaylist() {
    isOpen.value = false;
  }

  /** Collapse after an action inside the window — only when autoclose is on. */
  function closeOnAutoclose() {
    if (playlistAutoClose.value) closePlaylist();
  }

  onClickOutside(playlistRef, () => {
    if (playlistAutoClose.value) closePlaylist();
  });

  onKeyStroke('Escape', () => {
    if (isOpen.value) closePlaylist();
  });

  return { isOpen, togglePlaylist, closePlaylist, closeOnAutoclose };
}

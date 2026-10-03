import { defineStore } from 'pinia';
import { ref, shallowRef } from 'vue';

import type {
  AnchorCandidate,
  PlaybackDockMode,
} from './playback-anchor.types';

/**
 * Anchor registry for the universal playback container.
 *
 * Every mounted video figure (video list cards, gallery items, hero media)
 * registers its media box here, keyed by video URL. The app-level floating
 * player reads the registry to overlay itself exactly on top of the visible
 * figure — via CSS positioning alone, never by re-parenting the iframe — so
 * the same launched video can appear inline in the chat, as the floating
 * popup, or across conversations and tab switches, all without ever
 * reloading the player.
 *
 * This store holds only the registry and the dock-mode flag. The "which video
 * is launched" facts and the docked-overlay derivations live in the playback
 * session composable (use-playback-session), which reads this registry.
 */
export const usePlaybackAnchorStore = defineStore('playbackAnchor', () => {
  const anchorCandidates = shallowRef(new Map<string, AnchorCandidate[]>());

  /**
   * Register a figure's media box as a playback anchor for its video URL.
   * The candidate starts optimistically in-view: a poster click that launches
   * the video implies the figure was visible, and the IntersectionObserver
   * corrects the flag on its first callback — the optimistic start prevents a
   * launch-time flicker into floating mode while the observer fires.
   */
  function registerAnchorCandidate(
    videoUrl: string,
    el: HTMLElement,
    scrollRoot: HTMLElement | null,
    dockCondition?: () => boolean,
  ): AnchorCandidate {
    const candidate: AnchorCandidate = {
      el,
      scrollRoot,
      inView: true,
      dockCondition,
    };
    const next = new Map(anchorCandidates.value);
    const list = [...(next.get(videoUrl) ?? []), candidate];
    next.set(videoUrl, list);
    anchorCandidates.value = next;
    return candidate;
  }

  /** Update a candidate's visibility flag (IntersectionObserver callback). */
  function setAnchorCandidateInView(
    videoUrl: string,
    candidate: AnchorCandidate,
    inView: boolean,
  ) {
    if (candidate.inView === inView) return;
    candidate.inView = inView;
    // Replace the entry so computed consumers re-evaluate.
    const next = new Map(anchorCandidates.value);
    next.set(videoUrl, [...(next.get(videoUrl) ?? [])]);
    anchorCandidates.value = next;
  }

  /** Unregister a figure's anchor (unmount, conversation/tab switch). */
  function unregisterAnchorCandidate(
    videoUrl: string,
    candidate: AnchorCandidate,
  ) {
    const current = anchorCandidates.value.get(videoUrl);
    if (!current) return;
    const next = new Map(anchorCandidates.value);
    const remaining = current.filter((entry) => entry !== candidate);
    if (remaining.length === 0) next.delete(videoUrl);
    else next.set(videoUrl, remaining);
    anchorCandidates.value = next;
  }

  /**
   * Dock mode of the launched player:
   * - `auto` — follows the anchor (inline when a figure is in view, floating
   *   otherwise).
   * - `float-latched` — stays floating even when the anchor returns, until the
   *   user docks (honors popout autodock=off; mirrors the old float latch).
   * - `dock-dismissed` — the user docked while no figure was visible: the
   *   window hides (audio keeps playing) until playback is re-engaged.
   */
  const playbackDockMode = ref<PlaybackDockMode>('auto');

  /**
   * Force the player window to show even when the hide-on-playlist background
   * setting or a dismissal would suppress it. Set on a conversation switch
   * while a video is playing, so the player stays visible across switches;
   * cleared on the next launch/stop or a user dismissal.
   */
  const forceShowPlayer = ref(false);

  /** Fresh play intent: poster click or playlist launch — follow the anchor. */
  function engagePlayback() {
    playbackDockMode.value = 'auto';
  }

  /** A fresh launch returns to auto-following and lifts the force-show. */
  function resetDockForLaunch() {
    playbackDockMode.value = 'auto';
    forceShowPlayer.value = false;
  }

  /**
   * Dock intent ("Dock back" button, popup close): snap inline when a
   * figure is visible; otherwise hide the window and keep the audio
   * running until playback is re-engaged. The session composable passes the
   * visibility result — only it can see the launched video's anchors.
   */
  function dockPlayback(hasVisibleAnchor: boolean) {
    playbackDockMode.value = hasVisibleAnchor ? 'auto' : 'dock-dismissed';
    forceShowPlayer.value = false;
  }

  /**
   * Force-hide the window while playback keeps running — the transport
   * bar's popup-visibility toggle hiding a standalone (figure-launched)
   * video, which the playlist background setting deliberately does not
   * cover.
   */
  function dismissPlaybackWindow() {
    playbackDockMode.value = 'dock-dismissed';
    forceShowPlayer.value = false;
  }

  /** Latch into floating mode (popout autodock=off and the anchor was lost). */
  function latchFloating() {
    if (playbackDockMode.value === 'auto')
      playbackDockMode.value = 'float-latched';
  }

  return {
    anchorCandidates,
    registerAnchorCandidate,
    setAnchorCandidateInView,
    unregisterAnchorCandidate,
    playbackDockMode,
    forceShowPlayer,
    engagePlayback,
    resetDockForLaunch,
    dockPlayback,
    dismissPlaybackWindow,
    latchFloating,
  };
});

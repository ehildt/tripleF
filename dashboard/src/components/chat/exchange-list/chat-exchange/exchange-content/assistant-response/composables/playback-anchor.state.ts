import { computed, ref, shallowRef, watch } from 'vue';

import { popoutEnabled, popoutHideOnPlaylist } from './popout-settings.state';
import { launchedFromPlaylist, launchedVideo } from './video-playback.state';

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
 */

export interface AnchorCandidate {
  el: HTMLElement;
  /** Scroll container the figure lives in (null = viewport scroller). */
  scrollRoot: HTMLElement | null;
  inView: boolean;
}

const anchorCandidates = shallowRef(new Map<string, AnchorCandidate[]>());

/**
 * Register a figure's media box as a playback anchor for its video URL.
 * The candidate starts optimistically in-view: a poster click that launches
 * the video implies the figure was visible, and the IntersectionObserver
 * corrects the flag on its first callback — the optimistic start prevents a
 * launch-time flicker into floating mode while the observer fires.
 */
export function registerAnchorCandidate(
  videoUrl: string,
  el: HTMLElement,
  scrollRoot: HTMLElement | null,
): AnchorCandidate {
  const candidate: AnchorCandidate = { el, scrollRoot, inView: true };
  const next = new Map(anchorCandidates.value);
  const list = [...(next.get(videoUrl) ?? []), candidate];
  next.set(videoUrl, list);
  anchorCandidates.value = next;
  return candidate;
}

/** Update a candidate's visibility flag (IntersectionObserver callback). */
export function setAnchorCandidateInView(
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
export function unregisterAnchorCandidate(
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

/** All registered anchors for the currently launched video, if any. */
export const launchedAnchorCandidates = computed<AnchorCandidate[]>(() =>
  launchedVideo.value
    ? (anchorCandidates.value.get(launchedVideo.value.videoUrl) ?? [])
    : [],
);

/** The in-view anchor for the currently launched video, if any. */
export const visibleAnchorCandidate = computed<AnchorCandidate | null>(
  () => launchedAnchorCandidates.value.find((entry) => entry.inView) ?? null,
);

/**
 * Dock mode of the launched player:
 * - `auto` — follows the anchor (inline when a figure is in view, floating
 *   otherwise).
 * - `float-latched` — stays floating even when the anchor returns, until the
 *   user docks (honors popout autodock=off; mirrors the old float latch).
 * - `dock-dismissed` — the user docked while no figure was visible: the
 *   window hides (audio keeps playing) until playback is re-engaged.
 */
export type PlaybackDockMode = 'auto' | 'float-latched' | 'dock-dismissed';

export const playbackDockMode = ref<PlaybackDockMode>('auto');

/**
 * Force the player window to show even when the hide-on-playlist background
 * setting or a dismissal would suppress it. Set on a conversation switch
 * while a video is playing, so the player stays visible across switches;
 * cleared on the next launch/stop or a user dismissal.
 */
export const forceShowPlayer = ref(false);

// A fresh launch (or a full stop) always returns to auto-following. Sync
// flush: launch semantics depend on the mode being reset by the time
// launchVideo returns (callers read dock state synchronously after).
watch(
  launchedVideo,
  () => {
    playbackDockMode.value = 'auto';
    forceShowPlayer.value = false;
  },
  { flush: 'sync' },
);

/**
 * The anchor the launched player should currently overlay, if any. With
 * popouts enabled only an in-view figure qualifies (scrolling out flips to
 * the floating window); with popouts disabled the player keeps tracking its
 * figure even off-screen — the overlay simply leaves the viewport and keeps
 * playing, matching the pre-popup inline behavior. The playlist background
 * setting (hide the window while playlist videos play) suppresses docking
 * entirely: figures then keep their "playing in the floating player"
 * placeholder instead of an empty docked box.
 */
export const dockedAnchorCandidate = computed<AnchorCandidate | null>(() => {
  if (playbackDockMode.value !== 'auto') return null;
  if (!launchedVideo.value) return null;
  if (popoutHideOnPlaylist.value && launchedFromPlaylist.value) return null;
  if (popoutEnabled.value) return visibleAnchorCandidate.value;
  return launchedAnchorCandidates.value[0] ?? null;
});

/** Element the launched player currently overlays (null when floating). */
export const dockedAnchorElement = computed<HTMLElement | null>(
  () => dockedAnchorCandidate.value?.el ?? null,
);

/**
 * Scroll container of the currently docked anchor (null when floating or
 * the anchor scrolls with the document). The floating player clips its
 * docked overlay to this container's bounds so the video never paints over
 * neighboring chrome (chat input, toolbar) while partially scrolled out.
 */
export const dockedAnchorScrollRoot = computed<HTMLElement | null>(
  () => dockedAnchorCandidate.value?.scrollRoot ?? null,
);

/** Fresh play intent: poster click or playlist launch — follow the anchor. */
export function engagePlayback() {
  playbackDockMode.value = 'auto';
}

/**
 * Dock intent ("Dock back" button, popup close): snap inline when a
 * figure is visible; otherwise hide the window and keep the audio
 * running until playback is re-engaged.
 */
export function dockPlayback() {
  playbackDockMode.value = visibleAnchorCandidate.value
    ? 'auto'
    : 'dock-dismissed';
  forceShowPlayer.value = false;
}

/**
 * Force-hide the window while playback keeps running — the transport
 * bar's popup-visibility toggle hiding a standalone (figure-launched)
 * video, which the playlist background setting deliberately does not
 * cover. dockPlayback cannot serve here: it would snap a visible anchor
 * inline instead of hiding.
 */
export function dismissPlaybackWindow() {
  playbackDockMode.value = 'dock-dismissed';
  forceShowPlayer.value = false;
}

/** Latch into floating mode (popout autodock=off and the anchor was lost). */
export function latchFloating() {
  if (playbackDockMode.value === 'auto')
    playbackDockMode.value = 'float-latched';
}

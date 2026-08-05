import { computed, ref } from 'vue';

import { isVideoInActivePlaylist } from '@/components/widgets/floating-playlist/composables/playlist.state';
import type { VideoGalleryItem } from '@/types/harness-response-data.model';

import { releaseFloatingPopupRect } from './popout-settings.state';

/**
 * Shared playback state: the URL of the video the user most recently engaged
 * (clicked play on). This is the single playing video: every engagement
 * launches it into the app-level floating player (see launchVideo), so at
 * most one real player exists on the page at a time. Both the video
 * surfaces and the playlists read it to highlight the current video.
 */
export const activePlaybackVideoUrl = ref<string | null>(null);

/**
 * Title of the currently playing video, shown in the playlist panel's
 * animated "now playing" text. Tracked alongside the active playback so a
 * video that was never added to a playlist (hero media, gallery videos)
 * still announces itself there.
 */
export const nowPlayingTitle = ref('');

export function setActivePlayback(videoUrl: string, title?: string) {
  if (activePlaybackVideoUrl.value !== videoUrl) {
    nowPlayingTitle.value = title ?? '';
  } else if (title !== undefined) {
    // A repeated engage may name the video for the first time — adopt the
    // title without disturbing playback.
    nowPlayingTitle.value = title;
  }
  activePlaybackVideoUrl.value = videoUrl;
}

export function clearActivePlayback() {
  activePlaybackVideoUrl.value = null;
  nowPlayingTitle.value = '';
}

/**
 * Transport state for the single mounted player. usePausablePlayer registers
 * play/pause controls when a provider supports programmatic control
 * (YouTube, direct video, Vimeo) and reports play-state changes here, so
 * the playlist bar can drive the current video no matter how far the user
 * scrolled away from it.
 */
export const activePlaybackPlaying = ref(false);

const activePlaybackHasControls = ref(false);
let activePlayerControls: { play(): void; pause(): void } | null = null;

export function setActivePlaybackPlaying(playing: boolean) {
  activePlaybackPlaying.value = playing;
}

export function registerActivePlayerControls(controls: {
  play(): void;
  pause(): void;
}) {
  activePlayerControls = controls;
  activePlaybackHasControls.value = true;
}

/** Only the owner instance may clear its registration — teardown ordering
 *  between the old and new player must not wipe the new registration. */
export function unregisterActivePlayerControls(controls: {
  play(): void;
  pause(): void;
}) {
  if (activePlayerControls !== controls) return;
  activePlayerControls = null;
  activePlaybackHasControls.value = false;
}

/** Whether the currently mounted player supports programmatic play/pause. */
export const activePlaybackControlSupported = computed(
  () => activePlaybackHasControls.value,
);

/** Toggle play/pause on the mounted player. No-op without controls. */
export function toggleActivePlayback() {
  if (!activePlayerControls) return;
  if (activePlaybackPlaying.value) activePlayerControls.pause();
  else activePlayerControls.play();
}

/**
 * Stop playback entirely: closes the launched popup and clears the
 * highlight everywhere (the highlight is driven by activePlaybackVideoUrl).
 */
export function stopActivePlayback() {
  if (launchedVideo.value) closeLaunchedVideo();
  clearActivePlayback();
  setActivePlaybackPlaying(false);
}

/**
 * The currently launched video, rendered by the standalone floating player
 * host mounted at app level. Every play action anywhere in the app (video
 * list cards, gallery items, hero media, playlist rows) routes through
 * launchVideo, so this is the only mounted player — it survives tab and
 * conversation switches, and overlays the source figure via CSS alone when
 * the figure is in view (see playback-anchor.state).
 */
export const launchedVideo = ref<VideoGalleryItem | null>(null);

/**
 * Whether the launched video came from a playlist (a queue was captured at
 * launch). Gates the hide-on-playlist popout setting so figure-launched
 * videos always show their window, and drives playlist autoplay.
 */
export const launchedFromPlaylist = ref(false);

/**
 * The playlist the launched video came from (ordered, as shown in the
 * panel), captured at launch so autoplay can advance through it. Empty
 * when the video was not launched from a playlist.
 */
const launchedPlaylistQueue = ref<VideoGalleryItem[]>([]);
const launchedPlaylistConversationId = ref('');

export function launchVideo(
  item: VideoGalleryItem,
  playlist?: { videos: VideoGalleryItem[]; conversationId: string },
) {
  launchedVideo.value = item;
  launchedFromPlaylist.value = Boolean(playlist);
  launchedPlaylistQueue.value = playlist?.videos ?? [];
  launchedPlaylistConversationId.value = playlist?.conversationId ?? '';
  setActivePlayback(item.videoUrl, item.title);
}

export function closeLaunchedVideo() {
  launchedVideo.value = null;
  launchedFromPlaylist.value = false;
  launchedPlaylistQueue.value = [];
  launchedPlaylistConversationId.value = '';
  clearActivePlayback();
  releaseFloatingPopupRect();
}

/**
 * Whether the launched player advances to the next playlist video when the
 * current one ends. Persisted so the preference survives reloads.
 */
const PLAYLIST_AUTOPLAY_STORAGE_KEY = 'vision-playlist-autoplay';

function loadPlaylistAutoplayEnabled(): boolean {
  try {
    return localStorage.getItem(PLAYLIST_AUTOPLAY_STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

export const playlistAutoplayEnabled = ref(loadPlaylistAutoplayEnabled());

export function togglePlaylistAutoplay() {
  playlistAutoplayEnabled.value = !playlistAutoplayEnabled.value;
  try {
    localStorage.setItem(
      PLAYLIST_AUTOPLAY_STORAGE_KEY,
      String(playlistAutoplayEnabled.value),
    );
  } catch {
    /* storage unavailable — the toggle stays in-memory only */
  }
}

/**
 * Advance the launched player to the next video in the playlist queue
 * captured at launch, skipping videos removed from the playlist since.
 * Returns false when the current video is the last playable one (or no
 * queue was captured).
 */
export function playNextPlaylistVideo(): boolean {
  const queue = launchedPlaylistQueue.value;
  const current = launchedVideo.value;
  if (!current || queue.length === 0) return false;

  const currentIndex = queue.findIndex(
    (item) => item.videoUrl === current.videoUrl,
  );

  const next = queue
    .slice(currentIndex + 1)
    .find((item) => isVideoInActivePlaylist(item.videoUrl));

  if (!next) return false;

  launchedVideo.value = next;
  setActivePlayback(next.videoUrl, next.title);
  return true;
}

/** Opacity of the floating popup, cycled between 100%, 75%, and 50%. */
export const floatingPopupOpacity = ref(1);
